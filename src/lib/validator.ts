export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates that the input looks like a valid Supabase project URL.
 * Expected format: https://<project-ref>.supabase.co
 */
export function validateSupabaseUrl(url: string): ValidationResult {
  const trimmed = url.trim();
  if (!trimmed) return { valid: false, error: 'Project URL is required.' };

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, error: 'Not a valid URL. Example: https://abcxyz.supabase.co' };
  }

  if (parsed.protocol !== 'https:') {
    return { valid: false, error: 'URL must use HTTPS.' };
  }

  if (!parsed.hostname.endsWith('.supabase.co')) {
    return { valid: false, error: 'URL must be a Supabase project URL (*.supabase.co).' };
  }

  const ref = parsed.hostname.split('.')[0];
  if (!ref || ref.length < 5) {
    return { valid: false, error: 'Could not extract a valid project reference from the URL.' };
  }

  return { valid: true };
}

/**
 * Validates that the input looks like a Supabase anon JWT (3-part base64url string).
 */
export function validateAnonKey(key: string): ValidationResult {
  const trimmed = key.trim();
  if (!trimmed) return { valid: false, error: 'Anon key is required.' };

  const parts = trimmed.split('.');
  if (parts.length !== 3) {
    return { valid: false, error: 'Anon key must be a valid JWT (3 dot-separated segments).' };
  }

  // Supabase JWTs always start with eyJ (base64url of {"alg":...)
  if (!parts[0].startsWith('eyJ')) {
    return { valid: false, error: 'Does not look like a Supabase JWT. Check your anon key.' };
  }

  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (!payload.role) {
      return { valid: false, error: 'JWT payload is missing the "role" claim.' };
    }
    if (payload.role !== 'anon' && payload.role !== 'service_role') {
      return {
        valid: false,
        error: `JWT role is "${payload.role}". Expected "anon" key for a safe audit.`,
      };
    }
  } catch {
    return { valid: false, error: 'Could not decode JWT payload. Make sure you pasted the full anon key.' };
  }

  return { valid: true };
}

/** Extract the project reference from a valid Supabase URL */
export function extractProjectRef(url: string): string {
  try {
    return new URL(url.trim()).hostname.split('.')[0];
  } catch {
    return url;
  }
}
