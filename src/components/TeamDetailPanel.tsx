'use client';

import { useState } from 'react';
import type { Criterion, TeamWithAvg } from '@/types';
import { getCriteriaMaxes, computeTotal } from '@/lib/scoring';
import RadarChart from './RadarChart';
import Select from './Select';

interface TeamDetailPanelProps {
  rankedTeams: TeamWithAvg[];
  tracks: string[];
  criteria: Criterion[];
  onDeleteScore: (scoreId: string) => void;
  onDeleteTeam: (teamId: string) => void;
  onChangeTrack: (teamId: string, newTrack: string) => void | Promise<void>;
}

export default function TeamDetailPanel({ rankedTeams, tracks, criteria, onDeleteScore, onDeleteTeam, onChangeTrack }: TeamDetailPanelProps) {
  const [selectedId, setSelectedId] = useState(rankedTeams[0]?.id || '');
  const [changingTrack, setChangingTrack] = useState(false);

  async function handleTrackChange(teamId: string, newTrack: string) {
    setChangingTrack(true);
    await onChangeTrack(teamId, newTrack);
    setChangingTrack(false);
  }
  const team = rankedTeams.find((t) => t.id === selectedId);

  if (!team) {
    return <div className="text-center py-12 text-text-muted text-sm">No teams available</div>;
  }

  const hasScores = team.avg.count > 0;
  const maxes = getCriteriaMaxes(criteria);
  const judgeDetailCols = `1fr ${criteria.map(() => '1fr').join(' ')} 1fr auto`;

  return (
    <div>
      <div className="bg-bg-card border border-border rounded-[14px] shadow-sm p-5 mb-5">
        <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-2">Select Team</label>
        <div className="flex flex-col md:flex-row gap-2 items-stretch md:items-center">
          <Select
            wrapperClassName="flex-1"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full px-4 py-3 border border-border rounded-lg bg-bg-input text-base font-semibold focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta-light transition-all"
          >
            {rankedTeams.map((t) => (
              <option key={t.id} value={t.id}>{t.name} ({t.track})</option>
            ))}
          </Select>
          <button
            onClick={() => onDeleteTeam(team.id)}
            className="border border-red/30 text-red text-xs font-semibold px-4 py-3 rounded-lg hover:bg-bg-red transition-colors whitespace-nowrap w-full md:w-auto"
          >
            Delete Team
          </button>
        </div>
      </div>

      <div className="space-y-2 mb-5 px-1">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Change Track</span>
          <Select
            value={team.track}
            disabled={changingTrack}
            onChange={(e) => handleTrackChange(team.id, e.target.value)}
            className="px-3 py-1.5 border border-border rounded-lg bg-bg-input text-sm focus:outline-none focus:border-terracotta transition-all"
          >
            {tracks.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
          {changingTrack && <span className="text-xs text-text-muted">Changing...</span>}
        </div>
        {team.activeSubchallenges.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Subchallenges</span>
            {team.activeSubchallenges.map((sc) => (
              <span key={sc} className="inline-flex items-center text-[10px] font-semibold bg-terracotta-bg text-terracotta px-2 py-1 rounded-full">
                {sc}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Radar chart */}
        <div className="bg-bg-card border border-border rounded-[14px] shadow-sm overflow-hidden">
          <div className="px-[22px] py-[18px] border-b border-border">
            <h2 className="font-serif text-[17px]">Score Radar</h2>
          </div>
          <div className="p-[22px] flex justify-center items-center">
            <RadarChart
              data={criteria.map((c) => ({
                label: c.name,
                value: hasScores ? (team.avg.categories[c.name] ?? 0) : 0,
                max: maxes.get(c.name) || 1,
              }))}
            />
          </div>
        </div>

        {/* Breakdown bars */}
        <div className="bg-bg-card border border-border rounded-[14px] shadow-sm overflow-hidden">
          <div className="px-[22px] py-[18px] border-b border-border">
            <h2 className="font-serif text-[17px]">Category Breakdown</h2>
          </div>
          <div className="p-[22px]">
            {criteria.map((c) => {
              const max = maxes.get(c.name) || 1;
              const val = hasScores ? (team.avg.categories[c.name] ?? 0) : 0;
              const pct = hasScores ? (val / max) * 100 : 0;
              return (
                <div key={c.name} className="mb-4">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-[13px] font-semibold">{c.name}</span>
                    <span className="font-mono text-[13px] font-semibold text-terracotta">
                      {hasScores ? val.toFixed(1) : '--'} / {max}
                    </span>
                  </div>
                  <div className="h-2 bg-bg-warm rounded-full overflow-hidden">
                    <div
                      className="h-full bg-terracotta rounded-full transition-all duration-600"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            <div className="mt-5 pt-4 border-t border-border flex justify-between items-baseline">
              <span className="font-bold text-[15px]">Total Average</span>
              <span className="font-mono text-[28px] font-bold text-terracotta">
                {hasScores ? team.avg.total.toFixed(1) : '--'}
                <span className="text-xs text-text-muted"> /100</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Judge table */}
      <div className="bg-bg-card border border-border rounded-[14px] shadow-sm overflow-hidden mt-5">
        <div className="px-[22px] py-[18px] border-b border-border">
          <h2 className="font-serif text-[17px]">Judge Scores</h2>
        </div>
        <div className="p-[22px]">
          {team.scores.length === 0 ? (
            <p className="text-text-muted text-sm text-center py-5">No scores yet</p>
          ) : (
            team.scores.map((s) => {
              const total = computeTotal(s.category_scores || {}, criteria);
              return (
                <div key={s.id} className="bg-bg rounded-lg mb-2">
                  {/* Desktop grid */}
                  <div className="hidden md:grid gap-2.5 px-3 py-2.5 items-center" style={{ gridTemplateColumns: judgeDetailCols }}>
                    <div className="font-semibold text-xs">{s.judge_name}</div>
                    {criteria.map((c) => (
                      <div key={c.name} className="font-mono text-xs text-center">
                        <span className="block text-[9px] text-text-muted">{c.name}</span>
                        {s.category_scores?.[c.name] ?? '--'}/{maxes.get(c.name) || 0}
                      </div>
                    ))}
                    <div className="font-mono text-sm font-bold text-terracotta text-center">
                      <span className="block text-[9px] text-text-muted">Total</span>
                      {total.toFixed(1)}/100
                    </div>
                    <button
                      onClick={() => onDeleteScore(s.id)}
                      className="border border-red/30 text-red text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-bg-red transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                  {/* Mobile stacked */}
                  <div className="md:hidden px-3 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-sm">{s.judge_name}</div>
                      <div className="font-mono text-lg font-bold text-terracotta">{total.toFixed(1)}<span className="text-xs text-text-muted">/100</span></div>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 mb-2">
                      {criteria.map((c) => (
                        <div key={c.name} className="flex justify-between text-xs px-2 py-1 bg-bg-warm rounded">
                          <span className="text-text-muted">{c.name}</span>
                          <span className="font-mono">{s.category_scores?.[c.name] ?? '--'}/{maxes.get(c.name) || 0}</span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => onDeleteScore(s.id)}
                      className="border border-red/30 text-red text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-bg-red transition-colors w-full"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
