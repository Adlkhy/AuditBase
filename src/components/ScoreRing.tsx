import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { AuditResult } from '../types';

interface Props { result: AuditResult }

export default function ScoreRing({ result }: Props) {
  const [animScore, setAnimScore] = useState(0);
  const [showGrade, setShowGrade] = useState(false);

  // Count only found tables
  const found     = result.tables.filter(t => t.status !== 'not_found');
  const vuln      = result.vulnerableCount;
  const secure    = result.secureCount;
  const unknown   = found.length - vuln - secure;

  const chartData = [
    { name: 'Secure',     value: secure  || 0,   color: '#10B981' },
    { name: 'Vulnerable', value: vuln    || 0,   color: '#F43F5E' },
    { name: 'Unknown',    value: unknown || 0,   color: '#2A2A35' },
  ].filter(d => d.value > 0);

  // Animate score counter
  useEffect(() => {
    let frame: number;
    const target  = result.score;
    const dur     = 1200;
    const start   = performance.now();
    const tick    = (now: number) => {
      const pct = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - pct, 3); // ease-out-cubic
      setAnimScore(Math.round(eased * target));
      if (pct < 1) frame = requestAnimationFrame(tick);
      else { setAnimScore(target); setShowGrade(true); }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [result.score]);

  const gradeColor = result.grade.startsWith('A')
    ? '#10B981'
    : result.grade === 'B'
    ? '#6366F1'
    : result.grade === 'C'
    ? '#F59E0B'
    : '#F43F5E';

  return (
    <div className="flex min-h-75 flex-col items-center rounded-3xl border border-border/70 bg-card/85 p-6 shadow-sm">
      <p className="mb-4 self-start text-sm font-medium text-secondary-foreground">Security Score</p>

      <div className="relative w-48 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={68}
              outerRadius={88}
              startAngle={90}
              endAngle={-270}
              paddingAngle={chartData.length > 1 ? 3 : 0}
              dataKey="value"
              strokeWidth={0}
              isAnimationActive
              animationBegin={0}
              animationDuration={900}
            >
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: 'rgba(255,255,255,0.95)',
                border: '1px solid rgba(23,23,23,0.12)',
                borderRadius: 12,
                fontSize: 12,
                fontFamily: 'monospace',
                color: '#171717',
              }}
              formatter={(v) => [`${v} tables`]}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span
            className="text-5xl font-semibold tracking-tight transition-all duration-300"
            style={{ color: gradeColor, opacity: showGrade ? 1 : 0 }}
          >
            {result.grade}
          </span>
          <span className="font-mono text-lg text-foreground mt-0.5">
            {animScore}
            <span className="text-muted-foreground text-sm">/100</span>
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex w-full flex-col gap-2">
        {[
          { label: 'Secure',     val: secure,  color: '#10B981' },
          { label: 'Vulnerable', val: vuln,    color: '#F43F5E' },
          { label: 'Unknown',    val: unknown, color: '#2A2A35', border: '#3A3A48' },
        ].map(item => (
          <div key={item.label} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ background: item.color, border: item.border ? `1px solid ${item.border}` : undefined }}
              />
              <span className="text-secondary-foreground">{item.label}</span>
            </div>
            <span className="font-mono text-primary">{item.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
