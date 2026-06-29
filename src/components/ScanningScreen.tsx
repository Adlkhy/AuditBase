import { useEffect, useRef } from 'react';
import { RiShieldCheckLine, RiLoader4Line } from 'react-icons/ri';
import type { ScanLog } from '../types';
import { COMMON_TABLES } from '../lib/tableWordlist';

interface Props {
  logs:      ScanLog[];
  completed: number;
}

function statusIcon(log: ScanLog): React.ReactNode {
  if (log.status === 'queued')  return <span className="text-muted">·</span>;
  if (log.status === 'probing') return <RiLoader4Line className="w-3 h-3 text-indigo animate-spin shrink-0" />;
  if (!log.result) return <span className="text-muted">-</span>;

  switch (log.result.status) {
    case 'vulnerable': return <span className="text-red font-mono text-xs">✗</span>;
    case 'secure':     return <span className="text-green font-mono text-xs">✓</span>;
    case 'not_found':  return <span className="text-muted font-mono text-xs">-</span>;
    default:           return <span className="text-amber font-mono text-xs">?</span>;
  }
}

function statusLabel(log: ScanLog): React.ReactNode {
  if (log.status === 'queued')  return <span className="text-muted">queued</span>;
  if (log.status === 'probing') return <span className="text-indigo animate-pulse-slow">scanning...</span>;
  if (!log.result) return null;

  switch (log.result.status) {
    case 'vulnerable':
      return (
        <span className="text-red">
          EXPOSED
          {log.result.readExposed  && ' · READ'}
          {log.result.writeExposed && ' · WRITE'}
        </span>
      );
    case 'secure':     return <span className="text-green">protected</span>;
    case 'not_found':  return <span className="text-muted">not found</span>;
    default:           return <span className="text-amber">unknown</span>;
  }
}

export default function ScanningScreen({ logs, completed }: Props) {
  const total    = COMMON_TABLES.length;
  const pct      = Math.round((completed / total) * 100);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs.length]);

  return (
    <div className="page-shell flex items-center px-4 py-6 sm:px-6 lg:px-8">
      <div className="page-frame w-full max-w-3xl animate-fade-in">
        <div className="mb-6 flex items-center gap-2">
          <RiShieldCheckLine className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground">
            AuditBase
          </span>
          <span className="ml-auto rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs text-secondary-foreground">
            Live scan
          </span>
        </div>

        <div className="surface overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border/70 bg-background/65 px-4 py-3 sm:px-5">
            <div className="h-3 w-3 rounded-full bg-red opacity-70" />
            <div className="h-3 w-3 rounded-full bg-amber opacity-70" />
            <div className="h-3 w-3 rounded-full bg-green opacity-70" />
            <span className="ml-3 text-xs font-mono text-secondary-foreground">audit — PostgREST probe</span>
          </div>

          <div className="h-80 overflow-y-auto p-4 font-mono text-xs leading-6 sm:p-5">
            <p className="mb-2 text-secondary-foreground">
              $ <span className="text-indigo">auditbase</span> probe --concurrency 6
            </p>
            <p className="mb-4 text-foreground/80">
              &rsaquo; Probing {total} common table endpoints...
            </p>

            {logs.map(log => (
              <div
                key={log.table}
                className={`flex items-center gap-3 py-1 transition-opacity duration-200 ${
                  log.status === 'queued' ? 'opacity-35' : 'opacity-100'
                }`}
              >
                <span className="flex w-4 shrink-0 items-center justify-center">
                  {statusIcon(log)}
                </span>
                <span className={`w-36 truncate ${
                  log.result?.status === 'not_found' ? 'text-secondary-foreground' : 'text-foreground'
                }`}>
                  {log.table}
                </span>
                <span className="flex-1">
                  {statusLabel(log)}
                </span>
                {log.result && log.result.status !== 'not_found' && (
                  <span className="text-secondary-foreground">
                    {log.result.httpStatus > 0 ? `${log.result.httpStatus}` : 'timeout'}
                    {log.result.duration > 0 && ` · ${log.result.duration}ms`}
                  </span>
                )}
              </div>
            ))}

            {completed < total && (
              <div className="mt-1 flex items-center gap-2">
                <span className="text-secondary-foreground">›</span>
                <span className="inline-block h-3.5 w-2 animate-blink bg-indigo" />
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-border/70 px-4 pb-4 pt-0 sm:px-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-mono text-secondary-foreground">
                {completed} / {total} tables probed
              </span>
              <span className="text-xs font-mono text-indigo">{pct}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-border/80">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo to-green transition-all duration-500 ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-sm text-secondary-foreground">
          {completed < total
            ? 'Testing each table for unauthorized read, write, and delete access…'
            : 'Finalizing results and calculating security score…'}
        </p>
      </div>
    </div>
  );
}
