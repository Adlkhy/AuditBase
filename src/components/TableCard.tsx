import { RiShieldCheckLine, RiShieldLine, RiQuestionLine, RiDatabase2Line } from 'react-icons/ri';
import type { TableAuditResult } from '../types';

interface Props { table: TableAuditResult }

const statusConfig = {
  vulnerable: {
    icon:        <RiShieldLine  className="w-4 h-4" />,
    iconColor:   '#F43F5E',
    borderColor: 'rgba(244,63,94,0.25)',
    bg:          'rgba(244,63,94,0.05)',
    badgeClass:  'inline-flex items-center rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red',
    badgeLabel:  'VULNERABLE',
  },
  secure: {
    icon:        <RiShieldCheckLine className="w-4 h-4" />,
    iconColor:   '#10B981',
    borderColor: 'rgba(16,185,129,0.2)',
    bg:          'rgba(16,185,129,0.04)',
    badgeClass:  'inline-flex items-center rounded-full border border-green/20 bg-green/10 px-2 py-0.5 text-xs font-medium text-green',
    badgeLabel:  'SECURE',
  },
  unknown: {
    icon:        <RiQuestionLine className="w-4 h-4" />,
    iconColor:   '#F59E0B',
    borderColor: 'rgba(245,158,11,0.2)',
    bg:          'rgba(245,158,11,0.04)',
    badgeClass:  'inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber',
    badgeLabel:  'UNKNOWN',
  },
  not_found: {
    icon:        <RiDatabase2Line className="w-4 h-4" />,
    iconColor:   '#55556A',
    borderColor: '#2A2A35',
    bg:          'transparent',
    badgeClass:  'inline-flex items-center rounded-full border border-border/70 bg-muted px-2 py-0.5 text-xs font-medium text-secondary-foreground',
    badgeLabel:  'NOT FOUND',
  },
};

export default function TableCard({ table }: Props) {
  const cfg = statusConfig[table.status];

  return (
    <div
      className="flex flex-col gap-3 rounded-3xl border p-4 shadow-sm transition-all duration-200"
      style={{ background: cfg.bg, border: `1px solid ${cfg.borderColor}` }}
    >
      {/* Name + badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span style={{ color: cfg.iconColor }} className="shrink-0">
            {cfg.icon}
          </span>
          <span className="truncate font-mono text-sm font-medium text-foreground">
            {table.name}
          </span>
        </div>
        <span className={cfg.badgeClass}>{cfg.badgeLabel}</span>
      </div>

      {/* Details — only show for found tables */}
      {table.status !== 'not_found' && (
        <div className="flex flex-wrap gap-1.5">
          {table.readExposed && (
            <span className="inline-flex items-center rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red">READ</span>
          )}
          {table.writeExposed && (
            <span className="inline-flex items-center rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red">WRITE</span>
          )}
          {table.deleteExposed && (
            <span className="inline-flex items-center rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red">DELETE</span>
          )}
          {!table.readExposed && !table.writeExposed && !table.deleteExposed
            && table.status === 'secure' && (
            <span className="inline-flex items-center rounded-full border border-green/20 bg-green/10 px-2 py-0.5 text-xs font-medium text-green">RLS ACTIVE</span>
          )}
          {table.status === 'unknown' && (
            <span className="inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber">EMPTY / UNDETECTED</span>
          )}
        </div>
      )}

      {/* HTTP status + row count */}
      {table.status !== 'not_found' && (
        <div className="flex items-center gap-3 border-t border-border/70 pt-1">
          <span className="font-mono text-xs text-secondary-foreground">
            HTTP <span className="text-foreground/80">{table.httpStatus || '—'}</span>
          </span>
          {table.readExposed && table.rowCount > 0 && (
            <span className="font-mono text-xs text-muted-foreground">
              <span className="text-red">{table.rowCount}</span> rows exposed
            </span>
          )}
          {table.duration > 0 && (
            <span className="font-mono text-xs text-muted-foreground ml-auto">
              {table.duration}ms
            </span>
          )}
        </div>
      )}
    </div>
  );
}
