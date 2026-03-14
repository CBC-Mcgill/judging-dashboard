'use client';

import { useState } from 'react';
import type { TeamWithAvg } from '@/types';
import { Award } from 'lucide-react';

interface RankingsPanelProps {
  rankedTeams: TeamWithAvg[];
  tracks: string[];
}


export default function RankingsPanel({ rankedTeams, tracks }: RankingsPanelProps) {
  const [currentTrack, setCurrentTrack] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = currentTrack === 'all'
    ? rankedTeams
    : rankedTeams.filter((t) => t.track === currentTrack);

  return (
    <div>
      {/* Track tabs */}
      <div className="flex gap-1.5 mb-4">
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
              <div className="grid grid-cols-[48px_1fr_90px_90px_90px_100px_100px] items-center px-5 py-3.5 gap-3">
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
                        <span key={award} className="inline-flex items-center gap-0.5 text-[9px] font-semibold bg-terracotta-bg text-terracotta px-1.5 py-0.5 rounded-full">
                          <Award size={8} />
                          {award}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {['impact', 'technical', 'ethics', 'presentation'].map((cat) => (
                  <div key={cat} className="text-center">
                    <div className="font-mono text-sm font-semibold">
                      {hasScores ? team.avg[cat as keyof typeof team.avg].toFixed(1) : '--'}
                    </div>
                    <div className="text-[9px] text-text-muted uppercase tracking-wide">
                      {{ impact: 'Impact', technical: 'Technical', ethics: 'Ethics', presentation: 'Presentation' }[cat]}
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

              {/* Expanded judge detail */}
              {isExpanded && (
                <div className="px-5 pb-4 border-t border-border">
                  {team.scores.map((s) => {
                    const scoreTotal = s.impact + s.technical + s.ethics + s.presentation;
                    return (
                      <div key={s.id} className="grid grid-cols-[120px_1fr_1fr_1fr_1fr_80px] gap-2.5 px-3 py-2.5 bg-bg rounded-lg mt-2 items-center">
                        <div className="font-semibold text-xs">{s.judge_name}</div>
                        <div className="font-mono text-xs text-center">
                          <span className="block text-[9px] text-text-muted">Impact</span>
                          {s.impact}/25
                        </div>
                        <div className="font-mono text-xs text-center">
                          <span className="block text-[9px] text-text-muted">Technical</span>
                          {s.technical}/30
                        </div>
                        <div className="font-mono text-xs text-center">
                          <span className="block text-[9px] text-text-muted">Ethics</span>
                          {s.ethics}/25
                        </div>
                        <div className="font-mono text-xs text-center">
                          <span className="block text-[9px] text-text-muted">Presentation</span>
                          {s.presentation}/20
                        </div>
                        <div className="font-mono text-sm font-bold text-terracotta text-right">
                          {scoreTotal}/100
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
