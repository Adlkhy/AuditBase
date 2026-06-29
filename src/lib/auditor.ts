import type { TableAuditResult } from '../types';
import { COMMON_TABLES } from './tableWordlist';

const TIMEOUT_MS  = 6000;
const CONCURRENCY = 6; // parallel probes at once

// PostgreSQL error codes that mean "permission denied" (table is protected)
const PERMISSION_DENIED_CODES = new Set(['42501', 'PGRST301', '401', 'insufficient_privilege']);

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
): Promise<Response | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch {
    clearTimeout(timer);
    return null;
  }
}

function buildHeaders(anonKey: string, extra: Record<string, string> = {}): HeadersInit {
  return {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...extra,
  };
}

/** Returns true if the PostgREST error body indicates a permission problem (not a schema error). */
async function isPermissionError(res: Response): Promise<boolean> {
  try {
    const clone = res.clone();
    const body  = await clone.json() as { code?: string; message?: string };
    if (!body.code && !body.message) return false;
    const code = (body.code ?? '').toString();
    const msg  = (body.message ?? '').toLowerCase();
    if (PERMISSION_DENIED_CODES.has(code)) return true;
    if (msg.includes('permission denied') || msg.includes('insufficient_privilege')) return true;
    return false;
  } catch {
    return false;
  }
}

/** Test one table for read / write / delete exposure. */
async function probeTable(
  baseUrl: string,
  anonKey: string,
  tableName: string,
): Promise<TableAuditResult> {
  const tableUrl = `${baseUrl}/rest/v1/${tableName}`;
  const t0 = performance.now();

  // ── READ probe ────────────────────────────────────────────────────────────
  const getRes = await fetchWithTimeout(tableUrl + '?limit=5', {
    method: 'GET',
    headers: buildHeaders(anonKey, { Prefer: 'count=exact' }),
  });

  const duration = () => Math.round(performance.now() - t0);

  if (!getRes) {
    return {
      name: tableName, status: 'unknown',
      readExposed: false, writeExposed: false, deleteExposed: false,
      httpStatus: 0, rowCount: 0, duration: duration(),
    };
  }

  // 404 / table not found
  if (getRes.status === 404) {
    return {
      name: tableName, status: 'not_found',
      readExposed: false, writeExposed: false, deleteExposed: false,
      httpStatus: 404, rowCount: 0, duration: duration(),
    };
  }

  // Parse GET result
  let readExposed = false;
  let rowCount    = 0;
  if (getRes.status === 200) {
    try {
      const data = await getRes.clone().json() as unknown[];
      rowCount    = Array.isArray(data) ? data.length : 0;
      readExposed = rowCount > 0;
    } catch {
      readExposed = true; // got 200 but couldn't parse — still exposed
    }
  }

  const getIsPermDenied = getRes.status === 401 || getRes.status === 403
    || (getRes.status >= 400 && await isPermissionError(getRes));

  // If 401/403 on GET → table exists and is protected
  if (getIsPermDenied) {
    return {
      name: tableName, status: 'secure',
      readExposed: false, writeExposed: false, deleteExposed: false,
      httpStatus: getRes.status, rowCount: 0, duration: duration(),
    };
  }

  // ── WRITE probe ────────────────────────────────────────────────────────────
  // We send an intentionally empty payload. If RLS blocks the write we get
  // 401/403 with error code 42501. If it passes RLS but fails schema (NOT NULL
  // constraint, etc.) we get 400/422 — that means the anon role CAN write.
  let writeExposed  = false;
  let deleteExposed = false;

  const postRes = await fetchWithTimeout(tableUrl, {
    method: 'POST',
    headers: buildHeaders(anonKey, { Prefer: 'return=representation' }),
    body: JSON.stringify({ __audit_probe__: true }),
  });

  if (postRes) {
    if (postRes.status === 201) {
      writeExposed = true;
      // Clean up: try to delete the row we just created
      try {
        const created = await postRes.clone().json() as Array<{ id?: unknown }>;
        if (Array.isArray(created) && created[0]?.id) {
          await fetchWithTimeout(`${tableUrl}?id=eq.${created[0].id}`, {
            method: 'DELETE',
            headers: buildHeaders(anonKey),
          });
        }
      } catch { /* best-effort cleanup */ }
    } else if (postRes.status >= 400 && postRes.status < 500) {
      const permDenied = await isPermissionError(postRes);
      writeExposed = !permDenied; // schema error → anon can write
    }
  }

  // ── DELETE probe (only if we think writes might be open) ──────────────────
  if (writeExposed) {
    const delRes = await fetchWithTimeout(`${tableUrl}?id=eq.-1`, {
      method: 'DELETE',
      headers: buildHeaders(anonKey),
    });
    if (delRes && (delRes.status === 200 || delRes.status === 204)) {
      deleteExposed = true;
    }
  }

  // ── Determine overall status ───────────────────────────────────────────────
  let status: TableAuditResult['status'] = 'unknown';
  if (readExposed || writeExposed || deleteExposed) {
    status = 'vulnerable';
  } else if (getRes.status === 200 || getRes.status === 204) {
    // Responded OK but no data readable and writes blocked → likely RLS with empty result
    status = 'secure';
  }

  return {
    name: tableName,
    status,
    readExposed,
    writeExposed,
    deleteExposed,
    httpStatus: getRes.status,
    rowCount,
    duration: duration(),
  };
}

/** Run all probes with a concurrency cap. Calls onProgress after each table. */
export async function runAudit(
  supabaseUrl: string,
  anonKey:     string,
  onProgress:  (table: string, result: TableAuditResult) => void,
): Promise<TableAuditResult[]> {
  const url     = supabaseUrl.replace(/\/$/, '');
  const tables  = [...COMMON_TABLES];
  const results: TableAuditResult[] = [];

  // Process in concurrent batches
  for (let i = 0; i < tables.length; i += CONCURRENCY) {
    const batch = tables.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map(async (name) => {
        const result = await probeTable(url, anonKey, name);
        onProgress(name, result);
        return result;
      }),
    );
    results.push(...batchResults);
  }

  return results;
}
