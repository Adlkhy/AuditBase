import { useState, useCallback } from 'react';
import type { AppState, AuditResult, ScanLog, TableAuditResult } from './types';
import { runAudit }        from './lib/auditor';
import { calculateScore }  from './lib/scorer';
import { extractProjectRef } from './lib/validator';
import { COMMON_TABLES }   from './lib/tableWordlist';
import InputScreen         from './components/InputScreen';
import ScanningScreen      from './components/ScanningScreen';
import Dashboard           from './components/Dashboard';

export default function App() {
  const [state, setState]   = useState<AppState>('idle');
  const [result, setResult] = useState<AuditResult | null>(null);
  const [logs,   setLogs]   = useState<ScanLog[]>([]);
  const [completed, setCompleted] = useState(0);

  const startAudit = useCallback(async (url: string, anonKey: string) => {
    const t0 = performance.now();

    // Init all logs as queued
    const initLogs: ScanLog[] = COMMON_TABLES.map(name => ({
      table: name, status: 'queued', ts: Date.now(),
    }));
    setLogs(initLogs);
    setCompleted(0);
    setState('scanning');

    const markDone = (name: string, res: TableAuditResult) => {
      setLogs(prev => prev.map(l =>
        l.table === name ? { ...l, status: 'done', result: res, ts: Date.now() } : l,
      ));
      setCompleted(prev => prev + 1);
    };

    // Mark current batch as probing immediately
    setLogs(prev => prev.map(l => ({ ...l, status: 'probing' as const })));

    try {
      const tables   = await runAudit(url, anonKey, markDone);
      const duration = Math.round(performance.now() - t0);

      const found   = tables.filter(t => t.status !== 'not_found');
      const vuln    = found.filter(t => t.status === 'vulnerable').length;
      const secure  = found.filter(t => t.status === 'secure').length;
      const unknown = found.filter(t => t.status === 'unknown').length;

      const { score, grade } = calculateScore(tables);

      const auditResult: AuditResult = {
        projectUrl:      url,
        projectRef:      extractProjectRef(url),
        timestamp:       new Date().toISOString(),
        duration,
        tables,
        score,
        grade,
        vulnerableCount: vuln,
        secureCount:     secure,
        unknownCount:    unknown,
        totalProbed:     tables.length,
      };

      setResult(auditResult);
      setState('complete');
    } catch (err) {
      console.error('Audit failed:', err);
      setState('error');
    }
  }, []);

  const restart = useCallback(() => {
    setState('idle');
    setResult(null);
    setLogs([]);
    setCompleted(0);
  }, []);

  if (state === 'idle')                   return <InputScreen onStart={startAudit} />;
  if (state === 'scanning')               return <ScanningScreen logs={logs} completed={completed} />;
  if (state === 'complete' && result)     return <Dashboard result={result} onRestart={restart} />;

  if (state === 'error') {
    return (
      <div className="page-shell flex items-center justify-center px-4">
        <div className="surface w-full max-w-md p-8 text-center">
          <p className="mb-2 font-semibold text-red">Audit failed</p>
          <p className="mb-4 text-sm text-secondary">
            Could not reach the Supabase instance. Check your URL and anon key, then try again.
          </p>
          <button onClick={restart} className="btn-primary rounded-2xl px-4 py-2">Try Again</button>
        </div>
      </div>
    );
  }

  return null;
}
