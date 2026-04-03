'use client';

import { useState } from 'react';
import type { Criterion, JudgeScoreStats, TeamWithAvg, TeamWithZScore } from '@/types';
import { getCriteriaMaxes, computeTotal } from '@/lib/scoring';

interface RankingsPanelProps {
  rankedTeams: TeamWithAvg[];
  normalizedRankedTeams: TeamWithZScore[];
  judgeStats: JudgeScoreStats[];
  tracks: string[];
  criteria: Criterion[];
  canViewZScores: boolean;
}

type RankingMode = 'raw' | 'zscore';

function formatSigned(value: number | null): string {
  if (value === null || Number.isNaN(value)) return '--';
  const safeValue = Math.abs(value) < 0.005 ? 0 : value;
  const fixed = safeValue.toFixed(2);
  return safeValue > 0 ? `+${fixed}` : fixed;
}

export default function RankingsPanel({
  rankedTeams,
  normalizedRankedTeams,
  judgeStats,
  tracks,
  criteria,
  canViewZScores,
}: RankingsPanelProps) {
  const [currentTrack, setCurrentTrack] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [mode, setMode] = useState<RankingMode>('raw');

  const filteredRaw = currentTrack === 'all'
    ? rankedTeams
    : rankedTeams.filter((team) => team.track === currentTrack);
  const filteredNormalized = currentTrack === 'all'
    ? normalizedRankedTeams
    : normalizedRankedTeams.filter((team) => team.track === currentTrack);

  const rawMainCols = `48px 1fr ${criteria.map(() => '80px').join(' ')} 100px`;
  const rawDetailCols = `120px ${criteria.map(() => '1fr').join(' ')} 80px`;
  const normalizedMainCols = '48px 1fr 120px 120px';
  const normalizedDetailCols = '1fr 120px 120px';

  const maxes = getCriteriaMaxes(criteria);

  function handleModeChange(nextMode: RankingMode) {
    setMode(nextMode);
    setExpandedId(null);
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-1.5 flex-wrap">
          {[{ key: 'all', label: 'All' }, ...tracks.map((track) => ({ key: track, label: track }))].map((track) => (
            <button
              key={track.key}
              onClick={() => setCurrentTrack(track.key)}
              className={`text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all ${
                currentTrack === track.key
                  ? 'bg-text text-white border-text'
                  : 'border-border bg-bg-card text-text-muted hover:border-border-active hover:text-text-secondary'
              }`}
            >
              {track.label}
            </button>
          ))}
        </div>

        {canViewZScores && (
          <div className="inline-flex rounded-full border border-border bg-bg-card p-1">
            <button
              onClick={() => handleModeChange('raw')}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                mode === 'raw'
                  ? 'bg-text text-white'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              Raw
            </button>
            <button
              onClick={() => handleModeChange('zscore')}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                mode === 'zscore'
                  ? 'bg-text text-white'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              Z-Score
            </button>
          </div>
        )}
      </div>

      {canViewZScores && mode === 'zscore' && (
        <div className="mb-4 rounded-[14px] border border-border bg-bg-card px-4 py-3 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Normalized Rankings</div>
          <p className="mt-1 text-xs text-text-muted">
            Teams are ranked by the average z-score of all submitted totals. Each judge is normalized against their own scoring mean and standard deviation.
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Judges with zero variation across their submitted scores produce z-scores of 0.00.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {mode === 'raw' && filteredRaw.map((team, index) => {
          const rank = index + 1;
          const hasScores = team.avg.count > 0;
          const isExpanded = expandedId === team.id;
          const borderLeft = rank === 1 ? 'border-l-3 border-l-sand' : rank === 2 ? 'border-l-3 border-l-silver' : rank === 3 ? 'border-l-3 border-l-bronze' : '';

          return (
            <div
              key={team.id}
              className={`bg-bg-card border border-border rounded-[14px] shadow-sm overflow-hidden cursor-pointer transition-all hover:shadow-md hover:border-border-active ${borderLeft} ${isExpanded ? 'shadow-lg' : ''}`}
              onClick={() => setExpandedId(isExpanded ? null : team.id)}
            >
              <div className="hidden md:grid items-center px-5 py-3.5 gap-3" style={{ gridTemplateColumns: rawMainCols }}>
                <div className={`font-serif text-[22px] text-center ${rank === 1 ? 'text-sand' : rank === 2 ? 'text-silver' : rank === 3 ? 'text-bronze' : 'text-text-muted'}`}>
                  {rank}
                </div>
                <div>
                  <div className="font-bold text-[15px]">{team.name}</div>
                  <div className="text-[11px] text-text-muted mt-0.5">
                    {team.track} &middot; {team.avg.count} judge{team.avg.count !== 1 ? 's' : ''}
                  </div>
                  {team.activeSubchallenges.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {team.activeSubchallenges.map((subchallenge) => (
                        <span key={subchallenge} className="inline-flex items-center text-[9px] font-semibold bg-terracotta-bg text-terracotta px-1.5 py-0.5 rounded-full">
                          {subchallenge}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {criteria.map((criterion) => (
                  <div key={criterion.name} className="text-center">
                    <div className="font-mono text-sm font-semibold">
                      {hasScores ? (team.avg.categories[criterion.name] ?? 0).toFixed(1) : '--'}
                    </div>
                    <div className="text-[9px] text-text-muted uppercase tracking-wide truncate">
                      {criterion.name}
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

              <div className="flex md:hidden items-center px-4 py-3 gap-3">
                <div className={`font-serif text-lg w-8 text-center shrink-0 ${rank === 1 ? 'text-sand' : rank === 2 ? 'text-silver' : rank === 3 ? 'text-bronze' : 'text-text-muted'}`}>
                  {rank}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate">{team.name}</div>
                  <div className="text-[11px] text-text-muted">{team.track}</div>
                  {team.activeSubchallenges.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {team.activeSubchallenges.map((subchallenge) => (
                        <span key={subchallenge} className="inline-flex items-center text-[8px] font-semibold bg-terracotta-bg text-terracotta px-1.5 py-0.5 rounded-full">
                          {subchallenge}
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

              {isExpanded && (
                <div className="px-3 md:px-5 pb-4 border-t border-border">
                  {team.scores.map((score) => {
                    const scoreTotal = computeTotal(score.category_scores || {}, criteria);
                    return (
                      <div key={score.id} className="bg-bg rounded-lg mt-2">
                        <div className="hidden md:grid gap-2.5 px-3 py-2.5 items-center" style={{ gridTemplateColumns: rawDetailCols }}>
                          <div className="font-semibold text-xs">{score.judge_name}</div>
                          {criteria.map((criterion) => (
                            <div key={criterion.name} className="font-mono text-xs text-center">
                              <span className="block text-[9px] text-text-muted">{criterion.name}</span>
                              {score.category_scores?.[criterion.name] ?? '--'}/{maxes.get(criterion.name) || 0}
                            </div>
                          ))}
                          <div className="font-mono text-sm font-bold text-terracotta text-right">
                            {scoreTotal.toFixed(1)}/100
                          </div>
                        </div>

                        <div className="md:hidden px-3 py-2.5">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="font-semibold text-sm">{score.judge_name}</span>
                            <span className="font-mono text-sm font-bold text-terracotta">{scoreTotal.toFixed(1)}/100</span>
                          </div>
                          <div className="grid grid-cols-2 gap-1">
                            {criteria.map((criterion) => (
                              <div key={criterion.name} className="flex justify-between text-xs px-2 py-1 bg-bg-warm rounded">
                                <span className="text-text-muted">{criterion.name}</span>
                                <span className="font-mono">{score.category_scores?.[criterion.name] ?? '--'}/{maxes.get(criterion.name) || 0}</span>
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

        {mode === 'zscore' && filteredNormalized.map((team, index) => {
          const rank = index + 1;
          const hasScores = team.normalized.count > 0;
          const isExpanded = expandedId === team.id;
          const borderLeft = rank === 1 ? 'border-l-3 border-l-sand' : rank === 2 ? 'border-l-3 border-l-silver' : rank === 3 ? 'border-l-3 border-l-bronze' : '';

          return (
            <div
              key={team.id}
              className={`bg-bg-card border border-border rounded-[14px] shadow-sm overflow-hidden cursor-pointer transition-all hover:shadow-md hover:border-border-active ${borderLeft} ${isExpanded ? 'shadow-lg' : ''}`}
              onClick={() => setExpandedId(isExpanded ? null : team.id)}
            >
              <div className="hidden md:grid items-center px-5 py-3.5 gap-3" style={{ gridTemplateColumns: normalizedMainCols }}>
                <div className={`font-serif text-[22px] text-center ${rank === 1 ? 'text-sand' : rank === 2 ? 'text-silver' : rank === 3 ? 'text-bronze' : 'text-text-muted'}`}>
                  {rank}
                </div>
                <div>
                  <div className="font-bold text-[15px]">{team.name}</div>
                  <div className="text-[11px] text-text-muted mt-0.5">
                    {team.track} &middot; {team.normalized.count} score entr{team.normalized.count === 1 ? 'y' : 'ies'}
                  </div>
                  {team.activeSubchallenges.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {team.activeSubchallenges.map((subchallenge) => (
                        <span key={subchallenge} className="inline-flex items-center text-[9px] font-semibold bg-terracotta-bg text-terracotta px-1.5 py-0.5 rounded-full">
                          {subchallenge}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-mono text-lg font-semibold">
                    {hasScores && team.raw.average !== null ? team.raw.average.toFixed(1) : '--'}
                  </div>
                  <div className="text-[10px] text-text-muted">Raw Avg</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[22px] font-bold text-terracotta">
                    {hasScores ? formatSigned(team.normalized.average) : '--'}
                  </div>
                  <div className="text-[10px] text-text-muted">Avg Z-Score</div>
                </div>
              </div>

              <div className="md:hidden px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className={`font-serif text-lg w-8 text-center shrink-0 ${rank === 1 ? 'text-sand' : rank === 2 ? 'text-silver' : rank === 3 ? 'text-bronze' : 'text-text-muted'}`}>
                    {rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate">{team.name}</div>
                    <div className="text-[11px] text-text-muted">{team.track}</div>
                  </div>
                </div>
                {team.activeSubchallenges.length > 0 && (
                  <div className="mt-2 flex gap-1 flex-wrap">
                    {team.activeSubchallenges.map((subchallenge) => (
                      <span key={subchallenge} className="inline-flex items-center text-[8px] font-semibold bg-terracotta-bg text-terracotta px-1.5 py-0.5 rounded-full">
                        {subchallenge}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-bg-warm px-3 py-2">
                    <div className="text-[10px] uppercase tracking-wider text-text-muted">Raw Avg</div>
                    <div className="font-mono text-base font-semibold">{hasScores && team.raw.average !== null ? team.raw.average.toFixed(1) : '--'}</div>
                  </div>
                  <div className="rounded-lg bg-terracotta-bg px-3 py-2">
                    <div className="text-[10px] uppercase tracking-wider text-terracotta/80">Avg Z</div>
                    <div className="font-mono text-base font-semibold text-terracotta">{hasScores ? formatSigned(team.normalized.average) : '--'}</div>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="px-3 md:px-5 pb-4 border-t border-border">
                  {team.scores.length === 0 ? (
                    <p className="py-4 text-center text-sm text-text-muted">No scores yet</p>
                  ) : (
                    team.scores.map((score) => (
                      <div key={score.id} className="bg-bg rounded-lg mt-2">
                        <div className="hidden md:grid gap-2.5 px-3 py-2.5 items-center" style={{ gridTemplateColumns: normalizedDetailCols }}>
                          <div>
                            <div className="font-semibold text-xs">{score.judge_name}</div>
                            <div className="text-[10px] text-text-muted">Normalized against this judge&apos;s submitted totals</div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono text-sm font-semibold">{score.rawTotal.toFixed(1)}</div>
                            <div className="text-[10px] text-text-muted">Raw Total</div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono text-sm font-bold text-terracotta">{formatSigned(score.zScore)}</div>
                            <div className="text-[10px] text-text-muted">Z-Score</div>
                          </div>
                        </div>

                        <div className="md:hidden px-3 py-2.5">
                          <div className="font-semibold text-sm">{score.judge_name}</div>
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            <div className="rounded bg-bg-warm px-2.5 py-2">
                              <div className="text-[10px] uppercase tracking-wider text-text-muted">Raw</div>
                              <div className="font-mono text-sm font-semibold">{score.rawTotal.toFixed(1)}</div>
                            </div>
                            <div className="rounded bg-terracotta-bg px-2.5 py-2">
                              <div className="text-[10px] uppercase tracking-wider text-terracotta/80">Z</div>
                              <div className="font-mono text-sm font-semibold text-terracotta">{formatSigned(score.zScore)}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}

        {mode === 'raw' && filteredRaw.length === 0 && (
          <div className="text-center py-12 text-text-muted text-sm">No teams in this track</div>
        )}

        {mode === 'zscore' && filteredNormalized.length === 0 && (
          <div className="text-center py-12 text-text-muted text-sm">No teams in this track</div>
        )}
      </div>

      {canViewZScores && mode === 'zscore' && (
        <div className="mt-6 bg-bg-card border border-border rounded-[14px] shadow-sm overflow-hidden">
          <div className="px-[22px] py-[18px] border-b border-border">
            <h2 className="font-serif text-[17px]">Per-Judge Statistics</h2>
            <p className="text-xs text-text-muted mt-0.5">Mean and standard deviation are computed from each judge&apos;s submitted raw totals.</p>
          </div>

          <div className="p-[22px]">
            {judgeStats.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-5">No score statistics available yet</p>
            ) : (
              <>
                <div className="hidden md:block">
                  <div className="grid grid-cols-[1.4fr_80px_90px_100px_80px_80px] gap-3 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                    <div>Judge</div>
                    <div className="text-right">Scores</div>
                    <div className="text-right">Mean</div>
                    <div className="text-right">Std Dev</div>
                    <div className="text-right">Min</div>
                    <div className="text-right">Max</div>
                  </div>
                  {judgeStats.map((stat) => (
                    <div key={stat.judgeKey} className="grid grid-cols-[1.4fr_80px_90px_100px_80px_80px] gap-3 px-3 py-3 border-t border-border text-sm items-center">
                      <div className="font-medium">{stat.judgeName}</div>
                      <div className="text-right font-mono">{stat.scoreCount}</div>
                      <div className="text-right font-mono">{stat.mean.toFixed(1)}</div>
                      <div className="text-right font-mono">{stat.standardDeviation.toFixed(2)}</div>
                      <div className="text-right font-mono">{stat.min.toFixed(1)}</div>
                      <div className="text-right font-mono">{stat.max.toFixed(1)}</div>
                    </div>
                  ))}
                </div>

                <div className="md:hidden space-y-2">
                  {judgeStats.map((stat) => (
                    <div key={stat.judgeKey} className="rounded-[12px] border border-border bg-bg px-4 py-3">
                      <div className="font-medium">{stat.judgeName}</div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div className="rounded bg-bg-warm px-3 py-2">
                          <div className="text-[10px] uppercase tracking-wider text-text-muted">Scores</div>
                          <div className="font-mono text-sm">{stat.scoreCount}</div>
                        </div>
                        <div className="rounded bg-bg-warm px-3 py-2">
                          <div className="text-[10px] uppercase tracking-wider text-text-muted">Mean</div>
                          <div className="font-mono text-sm">{stat.mean.toFixed(1)}</div>
                        </div>
                        <div className="rounded bg-bg-warm px-3 py-2">
                          <div className="text-[10px] uppercase tracking-wider text-text-muted">Std Dev</div>
                          <div className="font-mono text-sm">{stat.standardDeviation.toFixed(2)}</div>
                        </div>
                        <div className="rounded bg-bg-warm px-3 py-2">
                          <div className="text-[10px] uppercase tracking-wider text-text-muted">Range</div>
                          <div className="font-mono text-sm">{stat.min.toFixed(1)}-{stat.max.toFixed(1)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
