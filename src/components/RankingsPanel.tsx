'use client';

import { useState } from 'react';
import type { Criterion, TeamWithAvg } from '@/types';
import { getCriteriaMaxes, computeTotal } from '@/lib/scoring';

interface RankingsPanelProps {
  rankedTeams: TeamWithAvg[];
  tracks: string[];
  criteria: Criterion[];
}

export default function RankingsPanel({ rankedTeams, tracks, criteria }: RankingsPanelProps) {
  const [currentTrack, setCurrentTrack] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = currentTrack === 'all'
    ? rankedTeams
    : rankedTeams.filter((t) => t.track === currentTrack);

  const mainCols = `48px 1fr ${criteria.map(() => '80px').join(' ')} 100px`;
  const detailCols = `120px ${criteria.map(() => '1fr').join(' ')} 80px`;

  const maxes = getCriteriaMaxes(criteria);

  return (
    <div>
      {/* Track tabs */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {[{ key: 'all', label: 'All' }, ...tracks.map((t) => ({ key: t, label: t }))].map((t) => (
          <button
            key={t.key}
            onClick={() => setCurrentTrack(t.key)}
            className={`text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all ${
              currentTrack === t.key
                ? 'bg-text text-white border-text'
                : 'border-border bg-bg-card text-text-muted hover:border-border-active hover:text-text-secondary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Rankings list */}
      <div className="flex flex-col gap-2">
        {filtered.map((team, i) => {
          const rank = i + 1;
          const hasScores = team.avg.count > 0;
          const isExpanded = expandedId === team.id;
          const borderLeft = rank === 1 ? 'border-l-3 border-l-sand' : rank === 2 ? 'border-l-3 border-l-silver' : rank === 3 ? 'border-l-3 border-l-bronze' : '';

          return (
            <div
              key={team.id}
              className={`bg-bg-card border border-border rounded-[14px] shadow-sm overflow-hidden cursor-pointer transition-all hover:shadow-md hover:border-border-active ${borderLeft} ${isExpanded ? 'shadow-lg' : ''}`}
              onClick={() => setExpandedId(isExpanded ? null : team.id)}
            >
              {/* Desktop row */}
              <div className="hidden md:grid items-center px-5 py-3.5 gap-3" style={{ gridTemplateColumns: mainCols }}>
                <div className={`font-serif text-[22px] text-center ${rank === 1 ? 'text-sand' : rank === 2 ? 'text-silver' : rank === 3 ? 'text-bronze' : 'text-text-muted'}`}>
                  {rank}
                </div>
                <div>
                  <div className="font-bold text-[15px]">{team.name}</div>
                  <div className="text-[11px] text-text-muted mt-0.5">
                    {team.track} &middot; {team.avg.count} judge{team.avg.count !== 1 ? 's' : ''}
                  </div>
                  {team.activeAwards.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {team.activeAwards.map((award) => (
                        <span key={award} className="inline-flex items-center text-[9px] font-semibold bg-terracotta-bg text-terracotta px-1.5 py-0.5 rounded-full">
                          {award}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {criteria.map((c) => (
                  <div key={c.name} className="text-center">
                    <div className="font-mono text-sm font-semibold">
                      {hasScores ? (team.avg.categories[c.name] ?? 0).toFixed(1) : '--'}
                    </div>
                    <div className="text-[9px] text-text-muted uppercase tracking-wide truncate">
                      {c.name}
                    </div>
                  </div>
                ))}
                <div className="text-right">
                  <div className="font-mono text-[22px] font-bold text-terracotta">
                    {hasScores ? team.avg.total.toFixed(1) : '--'}
                  </div>
                  <div className="text-[10px] text-text-muted">/100</div>
                </div>
              </div>

              {/* Mobile row */}
              <div className="flex md:hidden items-center px-4 py-3 gap-3">
                <div className={`font-serif text-lg w-8 text-center shrink-0 ${rank === 1 ? 'text-sand' : rank === 2 ? 'text-silver' : rank === 3 ? 'text-bronze' : 'text-text-muted'}`}>
                  {rank}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate">{team.name}</div>
                  <div className="text-[11px] text-text-muted">{team.track}</div>
                  {team.activeAwards.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {team.activeAwards.map((award) => (
                        <span key={award} className="inline-flex items-center text-[8px] font-semibold bg-terracotta-bg text-terracotta px-1.5 py-0.5 rounded-full">
                          {award}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono text-xl font-bold text-terracotta">
                    {hasScores ? team.avg.total.toFixed(1) : '--'}
                  </div>
                  <div className="text-[10px] text-text-muted">/100</div>
                </div>
              </div>

              {/* Expanded judge detail */}
              {isExpanded && (
                <div className="px-3 md:px-5 pb-4 border-t border-border">
                  {team.scores.map((s) => {
                    const scoreTotal = computeTotal(s.category_scores || {}, criteria);
                    return (
                      <div key={s.id} className="bg-bg rounded-lg mt-2">
                        {/* Desktop detail */}
                        <div className="hidden md:grid gap-2.5 px-3 py-2.5 items-center" style={{ gridTemplateColumns: detailCols }}>
                          <div className="font-semibold text-xs">{s.judge_name}</div>
                          {criteria.map((c) => (
                            <div key={c.name} className="font-mono text-xs text-center">
                              <span className="block text-[9px] text-text-muted">{c.name}</span>
                              {s.category_scores?.[c.name] ?? '--'}/{maxes.get(c.name) || 0}
                            </div>
                          ))}
                          <div className="font-mono text-sm font-bold text-terracotta text-right">
                            {scoreTotal.toFixed(1)}/100
                          </div>
                        </div>
                        {/* Mobile detail */}
                        <div className="md:hidden px-3 py-2.5">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="font-semibold text-sm">{s.judge_name}</span>
                            <span className="font-mono text-sm font-bold text-terracotta">{scoreTotal.toFixed(1)}/100</span>
                          </div>
                          <div className="grid grid-cols-2 gap-1">
                            {criteria.map((c) => (
                              <div key={c.name} className="flex justify-between text-xs px-2 py-1 bg-bg-warm rounded">
                                <span className="text-text-muted">{c.name}</span>
                                <span className="font-mono">{s.category_scores?.[c.name] ?? '--'}/{maxes.get(c.name) || 0}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-text-muted text-sm">No teams in this track</div>
        )}
      </div>
    </div>
  );
}
