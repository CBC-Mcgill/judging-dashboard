import type { Team, Score } from '@/types';
import { computeTeamAvg } from '@/lib/scoring';

interface StatsStripProps {
  teams: Team[];
  scores: Score[];
}

export default function StatsStrip({ teams, scores }: StatsStripProps) {
  const judged = teams.filter((t) => scores.some((s) => s.team_id === t.id)).length;
  const avgs = teams
    .map((t) => computeTeamAvg(scores.filter((s) => s.team_id === t.id)))
    .filter((a) => a.count > 0);
  const overallAvg = avgs.length > 0
    ? (avgs.reduce((s, a) => s + a.total, 0) / avgs.length).toFixed(1)
    : '--';

  const stats = [
    { label: 'Teams', value: teams.length.toString() },
    { label: 'Judged', value: judged.toString() },
    { label: 'Score Entries', value: scores.length.toString() },
    { label: 'Avg Score', value: overallAvg, accent: true },
  ];

  return (
    <div className="grid grid-cols-4 gap-3 mb-6">
      {stats.map((s) => (
        <div key={s.label} className="bg-bg-card border border-border rounded-[10px] px-5 py-4 shadow-sm">
          <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">
            {s.label}
          </div>
          <div className={`font-mono text-[26px] font-semibold ${s.accent ? 'text-terracotta' : 'text-text'}`}>
            {s.value}
          </div>
        </div>
      ))}
    </div>
  );
}
