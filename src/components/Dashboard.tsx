import { useEffect, useRef, useState } from 'react';
import {
  RiCheckLine, RiDownloadLine, RiFileCopyLine, RiRefreshLine,
  RiShieldLine, RiDatabase2Line, RiTimeLine,
  RiFilterLine,
} from 'react-icons/ri';
import { Button } from './ui/button';
import type { AuditResult } from '../types';
import ScoreRing  from './ScoreRing';
import StatCard   from './StatCard';
import TableCard  from './TableCard';
import { exportPDF } from '../lib/pdfExporter';

interface Props {
  result:    AuditResult;
  onRestart: () => void;
}

type Filter = 'all' | 'vulnerable' | 'secure' | 'unknown';

type RemediationStep = {
  step: string;
  title: string;
  desc: string;
  code: string;
};

const remediationSteps: RemediationStep[] = [
  {
    step: '01',
    title: 'Enable Row Level Security on the exposed table',
    desc: 'Turn on RLS for every table that should not be readable anonymously. If a table is meant to stay public, make that access explicit with policies instead of leaving the table open.',
    code: 'ALTER TABLE public.your_table ENABLE ROW LEVEL SECURITY;',
  },
  {
    step: '02',
    title: 'Add only the policies your app needs',
    desc: 'With RLS enabled, access is denied until a policy allows it. Prefer the narrowest rule possible, such as authenticated-only access or a row-owner check.',
    code: `CREATE POLICY "Users can read own rows" ON public.your_table
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);`,
  },
  {
    step: '03',
    title: 'Verify anon requests are blocked',
    desc: 'Test the table with the anon key or simulate the anon role in the Policy Editor / SQL editor. Unauthorized requests should fail, not return rows.',
    code: `curl "https://your-project.supabase.co/rest/v1/your_table?select=*" \
  -H "apikey: <anon-key>" \
  -H "Authorization: Bearer <anon-key>"`,
  },
];

export default function Dashboard({ result, onRestart }: Props) {
  const [filter, setFilter]       = useState<Filter>('all');
  const [exporting, setExporting] = useState(false);
  const [copiedStep, setCopiedStep] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const copiedTimerRef = useRef<number | null>(null);

  const found   = result.tables.filter(t => t.status !== 'not_found');
  const visible = filter === 'all'
    ? found
    : found.filter(t => t.status === filter);

  const vulnTables = found.filter(t => t.status === 'vulnerable');

  async function handleExport() {
    if (!reportRef.current) return;
    setExporting(true);
    try {
      await exportPDF(reportRef.current, result);
    } finally {
      setExporting(false);
    }
  }

  async function handleCopy(code: string, step: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedStep(step);
      if (copiedTimerRef.current) {
        window.clearTimeout(copiedTimerRef.current);
      }
      copiedTimerRef.current = window.setTimeout(() => {
        setCopiedStep(null);
      }, 1500);
    } catch {
      setCopiedStep(null);
    }
  }

  useEffect(() => () => {
    if (copiedTimerRef.current) {
      window.clearTimeout(copiedTimerRef.current);
    }
  }, []);

  const duration = result.duration < 1000
    ? `${result.duration}ms`
    : `${(result.duration / 1000).toFixed(1)}s`;

  return (
    <div className="min-h-screen w-full bg-linear-to-br from-background via-background to-muted/35 px-4 py-8 sm:px-6 lg:px-8">
      <div ref={reportRef} className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">

        {/* ── Top bar ─────────────────────────────────────────────────────── */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center">
            <span className="font-semibold text-foreground uppercase">AuditBase</span>
            <span className="text-sm text-secondary-foreground ml-2">/ Audit Report</span>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={onRestart} variant="ghost" className="flex items-center text-foreground gap-1.5 rounded-2xl border border-border/70 bg-background/70 px-4">
              <RiRefreshLine className="w-3.5 h-3.5" />
              New Audit
            </Button>
            <Button
              onClick={handleExport}
              disabled={exporting}
              variant="default"
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 rounded-2xl px-4 py-2 text-sm"
            >
              <RiDownloadLine className="w-4 h-4" />
              {exporting ? 'Generating…' : 'Export PDF'}
            </Button>
          </div>
        </div>

        {/* ── Project meta ─────────────────────────────────────────────────── */}
        <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-3xl border border-border/70 bg-background/80 px-5 py-4 shadow-sm">
          <div>
            <span className="text-xs uppercase tracking-wide text-secondary-foreground block mb-0.5">Project</span>
            <span className="font-mono text-sm text-muted-foreground">
              {result.projectRef}.supabase.co
            </span>
          </div>
          <div>
            <span className="text-xs uppercase tracking-wide text-secondary-foreground block mb-0.5">Audited</span>
            <span className="font-mono text-sm text-muted-foreground">
              {new Date(result.timestamp).toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-xs uppercase tracking-wide text-secondary-foreground block mb-0.5">Duration</span>
            <span className="font-mono text-sm text-muted-foreground">{duration}</span>
          </div>
          <div>
            <span className="text-xs uppercase tracking-wide text-secondary-foreground block mb-0.5">Tables Probed</span>
            <span className="font-mono text-sm text-muted-foreground">{result.totalProbed}</span>
          </div>
        </div>

        {/* ── Critical alert banner ─────────────────────────────────────────── */}
        {vulnTables.length > 0 && (
          <div className="mb-6 flex items-start rounded-3xl border border-destructive bg-destructive/10 px-5 py-4 shadow-sm">
            <div>
              <p className="text-sm font-semibold text-destructive mb-0.5">
                {vulnTables.length} Critical {vulnTables.length === 1 ? 'Issue' : 'Issues'} Found
              </p>
              <p className="text-xs text-foreground">
                Tables{' '}
                <span className="font-mono text-foreground/70">
                  {vulnTables.map(t => t.name).join(', ')}
                </span>
                {' '}are accessible without authentication. Enable RLS immediately.
              </p>
            </div>
          </div>
        )}

        {/* ── Score + Stats grid ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4 mb-6">
          <div className="md:col-span-1">
            <ScoreRing result={result} />
          </div>
          <div className="md:col-span-3 grid grid-cols-1 gap-4 sm:grid-cols-3 content-start">
            <StatCard
              label="Tables Found"
              value={found.length}
              sub={`of ${result.totalProbed} probed`}
              color="indigo"
              icon={<RiDatabase2Line className="w-4 h-4" />}
            />
            <StatCard
              label="Vulnerabilities"
              value={result.vulnerableCount}
              sub={result.vulnerableCount === 0 ? 'All clear!' : 'Require immediate action'}
              color={result.vulnerableCount === 0 ? 'green' : 'red'}
              icon={<RiShieldLine className="w-4 h-4" />}
            />
            <StatCard
              label="Audit Duration"
              value={duration}
              sub={`${found.length} tables analysed`}
              color="default"
              icon={<RiTimeLine className="w-4 h-4" />}
            />

            {/* Exposure breakdown bar */}
            <div className="sm:col-span-3 rounded-3xl border border-border/70 bg-background/80 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-secondary-foreground">Exposure Breakdown</span>
                <span className="font-mono text-xs text-foreground/70">{found.length} tables</span>
              </div>
              {/* Stacked bar */}
              <div className="h-2 rounded-full overflow-hidden flex bg-border mb-3">
                {result.secureCount > 0 && (
                  <div
                    className="h-full transition-all duration-700"
                    style={{ width: `${(result.secureCount / found.length) * 100}%`, background: '#10B981' }}
                  />
                )}
                {result.vulnerableCount > 0 && (
                  <div
                    className="h-full transition-all duration-700"
                    style={{ width: `${(result.vulnerableCount / found.length) * 100}%`, background: '#F43F5E' }}
                  />
                )}
                {(found.length - result.secureCount - result.vulnerableCount) > 0 && (
                  <div
                    className="h-full transition-all duration-700"
                    style={{ width: `${((found.length - result.secureCount - result.vulnerableCount) / found.length) * 100}%`, background: '#2A2A35' }}
                  />
                )}
              </div>
              <div className="flex gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-secondary-foreground">
                  <span className="w-2 h-2 rounded-sm bg-green inline-block" />
                  {result.secureCount} Secure
                </span>
                <span className="flex items-center gap-1.5 text-secondary-foreground">
                  <span className="w-2 h-2 rounded-sm bg-red inline-block" />
                  {result.vulnerableCount} Vulnerable
                </span>
                <span className="flex items-center gap-1.5 text-secondary-foreground">
                  <span className="w-2 h-2 rounded-sm inline-block" style={{ background: '#2A2A35', border: '1px solid #3A3A48' }} />
                  {found.length - result.secureCount - result.vulnerableCount} Unknown
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Table findings ────────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Table Findings
            </h2>
            {/* Filter tabs */}
            <div className="flex items-center gap-1 rounded-full border border-border bg-background p-2">
              <RiFilterLine className="w-3.5 h-3.5 text-muted-foreground ml-1" />
              {(['all', 'vulnerable', 'secure', 'unknown'] as Filter[]).map(f => (
                <Button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-all capitalize ${
                    filter === f
                      ? 'bg-foreground text-background'
                      : 'text-secondary-foreground hover:text-foreground'
                  }`}
                >
                  {f}
                </Button>
              ))}
            </div>
          </div>

          {visible.length === 0 ? (
            <div className="rounded-3xl border border-border/70 bg-background/80 p-10 text-center shadow-sm">
              <p className="text-sm text-secondary-foreground">No tables match this filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map(t => (
                <TableCard key={t.name} table={t} />
              ))}
            </div>
          )}
        </div>

        {/* ── Remediation tips (only if vulnerabilities found) ─────────────── */}
        {vulnTables.length > 0 && (
          <div className="mt-8 rounded-3xl border border-border/70 bg-background/80 p-6 shadow-sm">
            <h3 className="mb-4 flex items-center font-semibold text-foreground">
              How to Fix
            </h3>
            <div className="flex flex-col gap-4">
              {remediationSteps.map(item => (
                <div key={item.step} className="flex gap-4">
                  <span className="mt-1 shrink-0 font-mono text-xs text-secondary-foreground">{item.step}</span>
                  <div className="flex-1">
                    <p className="mb-1 text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="mb-2 text-xs leading-relaxed text-secondary-foreground">{item.desc}</p>
                    <div className="overflow-hidden rounded-2xl border border-border/70 bg-background shadow-sm">
                      <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-2">
                        <span className="font-mono text-[11px] uppercase tracking-wide text-secondary-foreground">
                          Example
                        </span>
                        <Button
                          type="button"
                          size="xs"
                          variant="ghost"
                          onClick={() => handleCopy(item.code, item.step)}
                          className="rounded-full px-2.5 text-xs text-secondary-foreground hover:text-foreground"
                          aria-label={`Copy example ${item.step}`}
                        >
                          {copiedStep === item.step ? (
                            <RiCheckLine className="h-3.5 w-3.5" />
                          ) : (
                            <RiFileCopyLine className="h-3.5 w-3.5" />
                          )}
                          <span>{copiedStep === item.step ? 'Copied' : 'Copy'}</span>
                        </Button>
                      </div>
                      <pre className="overflow-x-auto whitespace-pre px-4 py-3 font-mono text-xs text-indigo">
                        {item.code}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Footer ────────────────────────────────────────────────────────── */}
        <div className="mt-8 flex items-center justify-between border-t border-border/70 pt-6">
          <span className="text-xs text-secondary-foreground">
            Generated by <span className="text-foreground">AuditBase</span> & made by <a href="https://adilkhanersin.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-foreground hover:underline">
              Adilkhan
            </a> | Keys never stored
          </span>
          <span className="font-mono text-xs text-secondary-foreground">
            {new Date(result.timestamp).toISOString()}
          </span>
        </div>
      </div>
    </div>
  );
}
