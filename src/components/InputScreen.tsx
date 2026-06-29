import { useState } from 'react';
import { RiShieldCheckLine, RiLockLine, RiEyeLine, RiEyeOffLine, RiGithubLine, RiArrowRightLine, RiAlertLine } from 'react-icons/ri';
import { validateSupabaseUrl, validateAnonKey } from '../lib/validator';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface Props {
  onStart: (url: string, anonKey: string) => void;
}

export default function InputScreen({ onStart }: Props) {
  const [url, setUrl]         = useState('');
  const [key, setKey]         = useState('');
  const [showKey, setShowKey] = useState(false);
  const [urlErr, setUrlErr]   = useState('');
  const [keyErr, setKeyErr]   = useState('');

  function handleSubmit() {
    const urlV = validateSupabaseUrl(url);
    const keyV = validateAnonKey(key);
    setUrlErr(urlV.error ?? '');
    setKeyErr(keyV.error ?? '');
    if (urlV.valid && keyV.valid) onStart(url.trim(), key.trim());
  }

  const ready = url.length > 10 && key.length > 20;

  return (
    <div className="page-shell flex items-center px-4 py-6 sm:px-6 lg:px-8">
      <div className="page-frame grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="animate-fade-in">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <span className="font-semibold text-foreground text-sm tracking-[0.18em] uppercase">
                AuditBase
              </span>
            </div>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-secondary-foreground hover:text-foreground transition-colors text-sm"
            >
              <RiGithubLine className="w-4 h-4" />
              <span>Open Source</span>
            </a>
          </div>

          <Badge variant="outline" className="mb-5 rounded-full border-border/70 bg-background/70 px-3 py-1 text-foreground">
            Security Auditor
          </Badge>
          <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-foreground leading-[0.95] sm:text-5xl lg:text-6xl">
            Is your Supabase project exposed?
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-secondary-foreground sm:text-lg">
            Probes your PostgREST endpoints to surface RLS misconfigurations,
            exposed tables, and insecure write access, all from your browser.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              { label: 'RLS Detection', sub: 'Per-table analysis' },
              { label: 'Write Probing', sub: 'INSERT / DELETE check' },
              { label: 'PDF Report', sub: 'Shareable export' },
            ].map(feature => (
              <div key={feature.label} className="surface px-4 py-4">
                <p className="text-sm font-medium text-foreground">{feature.label}</p>
                <p className="mt-1 text-xs text-secondary-foreground">{feature.sub}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 surface px-5 py-4 flex items-start gap-3">
            <RiLockLine className="mt-0.5 h-4 w-4 shrink-0 text-green" />
            <p className="text-sm leading-6 text-secondary-foreground">
              <span className="font-medium text-foreground">Your keys never leave your browser.</span>{' '}
              All network requests go directly from your machine to your Supabase instance.
              We collect no data, run no servers, and store nothing.
            </p>
          </div>
        </div>

        <div className="surface animate-slide-up p-4 sm:p-6 lg:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-secondary-foreground">Start Scan</p>
              <p className="mt-1 text-sm text-foreground">Enter the project URL and anon key</p>
            </div>
            <div className="rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs text-secondary-foreground">
              Browser only
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-secondary-foreground">
                Supabase Project URL
              </label>
              <input
                type="url"
                value={url}
                onChange={e => { setUrl(e.target.value); setUrlErr(''); }}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="https://abcxyzdefg.supabase.co"
                className={`input-field ${urlErr ? 'error' : ''}`}
                spellCheck={false}
                autoComplete="off"
              />
              {urlErr && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-red">
                  <RiAlertLine className="h-3 w-3 shrink-0" />
                  {urlErr}
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-secondary-foreground">
                Anon / Public API Key
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={key}
                  onChange={e => { setKey(e.target.value); setKeyErr(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className={`input-field pr-12 ${keyErr ? 'error' : ''}`}
                  spellCheck={false}
                  autoComplete="off"
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowKey(v => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-3 text-muted transition-colors hover:text-foreground"
                  tabIndex={-1}
                  aria-label={showKey ? 'Hide key' : 'Show key'}
                >
                  {showKey
                    ? <RiEyeOffLine className="h-4 w-4" />
                    : <RiEyeLine className="h-4 w-4" />}
                </Button>
              </div>
              {keyErr && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-red">
                  <RiAlertLine className="h-3 w-3 shrink-0" />
                  {keyErr}
                </p>
              )}
              <p className="mt-2 text-xs leading-5 text-secondary-foreground">
                Use your <span className="font-mono text-indigo">anon</span> public key, never your service role secret.
              </p>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!ready}
              variant="default"
              className="btn-primary w-full justify-center rounded-2xl px-4 py-3 text-base"
            >
              Start Audit
              <RiArrowRightLine className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
