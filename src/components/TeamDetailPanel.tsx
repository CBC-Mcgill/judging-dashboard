'use client';

import { useState } from 'react';
import type { TeamWithAvg } from '@/types';
import { CATEGORIES } from '@/lib/scoring';
import RadarChart from './RadarChart';
import Select from './Select';
import { Award } from 'lucide-react';

interface TeamDetailPanelProps {
  rankedTeams: TeamWithAvg[];
  tracks: string[];
  onDeleteScore: (scoreId: string) => void;
  onDeleteTeam: (teamId: string) => void;
  onChangeTrack: (teamId: string, newTrack: string) => void | Promise<void>;
}

export default function TeamDetailPanel({ rankedTeams, tracks, onDeleteScore, onDeleteTeam, onChangeTrack }: TeamDetailPanelProps) {
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

  return (
    <div>
      <div className="bg-bg-card border border-border rounded-[14px] shadow-sm p-5 mb-5">
        <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-2">Select Team</label>
        <div className="flex gap-2 items-center">
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
            className="border border-red/30 text-red text-xs font-semibold px-4 py-3 rounded-lg hover:bg-bg-red transition-colors whitespace-nowrap"
          >
            Delete Team
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-5 px-1 flex-wrap">
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
        {team.activeAwards.length > 0 && (
          <>
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider ml-3">Awards</span>
            {team.activeAwards.map((award) => (
              <span key={award} className="inline-flex items-center gap-1 text-[10px] font-semibold bg-terracotta-bg text-terracotta px-2 py-1 rounded-full">
                <Award size={10} />
                {award}
              </span>
            ))}
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Radar chart */}
        <div className="bg-bg-card border border-border rounded-[14px] shadow-sm overflow-hidden">
          <div className="px-[22px] py-[18px] border-b border-border">
            <h2 className="font-serif text-[17px]">Score Radar</h2>
          </div>
          <div className="p-[22px] flex justify-center items-center">
            <RadarChart
              data={hasScores ? [
                { label: 'Impact', value: team.avg.impact, max: 25 },
                { label: 'Technical', value: team.avg.technical, max: 30 },
                { label: 'Ethics', value: team.avg.ethics, max: 25 },
                { label: 'Presentation', value: team.avg.presentation, max: 20 },
              ] : []}
            />
          </div>
        </div>

        {/* Breakdown bars */}
        <div className="bg-bg-card border border-border rounded-[14px] shadow-sm overflow-hidden">
          <div className="px-[22px] py-[18px] border-b border-border">
            <h2 className="font-serif text-[17px]">Category Breakdown</h2>
          </div>
          <div className="p-[22px]">
            {CATEGORIES.map((cat) => {
              const val = hasScores ? team.avg[cat.key] : 0;
              const pct = hasScores ? (val / cat.max) * 100 : 0;
              return (
                <div key={cat.key} className="mb-4">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-[13px] font-semibold">{cat.label}</span>
                    <span className="font-mono text-[13px] font-semibold text-terracotta">
                      {hasScores ? val.toFixed(1) : '--'} / {cat.max}
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
              const total = s.impact + s.technical + s.ethics + s.presentation;
              return (
                <div key={s.id} className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_auto] gap-2.5 px-3 py-2.5 bg-bg rounded-lg mb-2 items-center">
                  <div className="font-semibold text-xs">{s.judge_name}</div>
                  <div className="font-mono text-xs text-center">
                    <span className="block text-[9px] text-text-muted">Impact</span>{s.impact}/25
                  </div>
                  <div className="font-mono text-xs text-center">
                    <span className="block text-[9px] text-text-muted">Technical</span>{s.technical}/30
                  </div>
                  <div className="font-mono text-xs text-center">
                    <span className="block text-[9px] text-text-muted">Ethics</span>{s.ethics}/25
                  </div>
                  <div className="font-mono text-xs text-center">
                    <span className="block text-[9px] text-text-muted">Presentation</span>{s.presentation}/20
                  </div>
                  <div className="font-mono text-sm font-bold text-terracotta text-center">
                    <span className="block text-[9px] text-text-muted">Total</span>{total}/100
                  </div>
                  <button
                    onClick={() => onDeleteScore(s.id)}
                    className="border border-red/30 text-red text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-bg-red transition-colors"
                  >
                    Delete
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
