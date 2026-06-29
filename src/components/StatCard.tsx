interface Props {
  label:    string;
  value:    number | string;
  sub?:     string;
  color?:   'green' | 'red' | 'amber' | 'indigo' | 'default';
  icon?:    React.ReactNode;
}

const colorMap = {
  green:  { val: '#10B981', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.18)' },
  red:    { val: '#F43F5E', bg: 'rgba(244,63,94,0.08)',   border: 'rgba(244,63,94,0.18)'  },
  amber:  { val: '#F59E0B', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.18)' },
  indigo: { val: '#6366F1', bg: 'rgba(99,102,241,0.08)',  border: 'rgba(99,102,241,0.18)' },
  default:{ val: 'var(--foreground)', bg: 'var(--card-background)', border: 'var(--border)'               },
};

export default function StatCard({ label, value, sub, color = 'default', icon }: Props) {
  const c = colorMap[color];
  return (
    <div
      className="flex flex-col gap-1 rounded-3xl border p-5 shadow-sm"
      style={{ background: c.bg, border: `1px solid ${c.border}` }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium uppercase text-secondary-foreground">{label}</span>
        {icon && <span style={{ color: c.val }}>{icon}</span>}
      </div>
      <span className="text-3xl font-semibold tracking-tight" style={{ color: c.val }}>
        {value}
      </span>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
  );
}
