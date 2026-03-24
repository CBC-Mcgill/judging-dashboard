'use client';

import { useState, useEffect } from 'react';
import type { Team, Score } from '@/types';
import { CATEGORIES } from '@/lib/scoring';
import Select from './Select';
import { Award } from 'lucide-react';

interface ScoreEntryPanelProps {
  teams: Team[];
  scores: Score[];
  tracks: string[];
  availableAwards: string[];
  onAddTeam: (name: string, track: string) => void;
  onSubmitScore: (score: {
    teamId: string;
    judgeName: string;
    impact: number;
    technical: number;
    ethics: number;
    presentation: number;
    selectedAwards: string[];
  }) => void;
}

export default function ScoreEntryPanel({ teams, scores, tracks, availableAwards, onAddTeam, onSubmitScore }: ScoreEntryPanelProps) {
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamTrack, setNewTeamTrack] = useState(tracks[0] || '');
  const [teamId, setTeamId] = useState(teams[0]?.id || '');
  const [judgeName, setJudgeName] = useState('');
  const [impact, setImpact] = useState('');
  const [technical, setTechnical] = useState('');
  const [ethics, setEthics] = useState('');
  const [presentation, setPresentation] = useState('');
  const [selectedAwards, setSelectedAwards] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');

  // Auto-select first team when teams list changes
  useEffect(() => {
    if (teams.length > 0 && !teams.find((t) => t.id === teamId)) {
      setTeamId(teams[0].id);
      setError('');
    }
  }, [teams, teamId]);

  const total =
    (parseInt(impact) || 0) +
    (parseInt(technical) || 0) +
    (parseInt(ethics) || 0) +
    (parseInt(presentation) || 0);

  function handleAddTeam() {
    if (!newTeamName.trim()) return;
    onAddTeam(newTeamName.trim(), newTeamTrack);
    setNewTeamName('');
  }

  function handleSubmit() {
    setError('');
    if (!teamId) { setError('Select a team'); return; }
    if (!judgeName.trim()) { setError('Enter judge name'); return; }
    const vals = { impact: parseInt(impact), technical: parseInt(technical), ethics: parseInt(ethics), presentation: parseInt(presentation) };
    if (Object.values(vals).some(isNaN)) { setError('Fill all scores'); return; }
    for (const cat of CATEGORIES) {
      const v = vals[cat.key];
      if (v < 0 || v > cat.max) { setError(`${cat.label} must be 0-${cat.max}`); return; }
    }
    onSubmitScore({ teamId, judgeName: judgeName.trim(), ...vals, selectedAwards: Array.from(selectedAwards) });
    setJudgeName('');
    setImpact(''); setTechnical(''); setEthics(''); setPresentation('');
    setSelectedAwards(new Set());
  }

  const recentScores = [...scores].reverse().slice(0, 15);

  return (
    <div className="grid grid-cols-[1fr_340px] gap-5">
      <div className="space-y-5">
      {/* Create new team */}
      <div className="bg-bg-card border border-border rounded-[14px] shadow-sm overflow-hidden">
        <div className="px-[22px] py-[18px] border-b border-border">
          <h2 className="font-serif text-[17px]">Create New Team</h2>
          <p className="text-xs text-text-muted mt-0.5">Select team track</p>
        </div>
        <div className="p-[22px]">
          <div className="flex gap-2">
            <input
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="Team name..."
              className="flex-1 px-3.5 py-2.5 border border-border rounded-lg bg-bg-input text-sm focus:outline-none focus:border-terracotta transition-all"
            />
            <Select
              value={newTeamTrack}
              onChange={(e) => setNewTeamTrack(e.target.value)}
              className="max-w-[180px] w-full px-3 py-2.5 border border-border rounded-lg bg-bg-input text-sm focus:outline-none focus:border-terracotta"
            >
              {tracks.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
            <button onClick={handleAddTeam} className="border border-border px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-bg-warm transition-colors">
              Add Team
            </button>
          </div>
        </div>
      </div>

      {/* Entry form */}
      <div className="bg-bg-card border border-border rounded-[14px] shadow-sm overflow-hidden">
        <div className="px-[22px] py-[18px] border-b border-border">
          <h2 className="font-serif text-[17px]">Enter Judge Scores</h2>
          <p className="text-xs text-text-muted mt-0.5">Fill in scores from the paper rubric</p>
        </div>
        <div className="p-[22px]">
          {/* Team + Judge */}
          <div className="grid grid-cols-2 gap-3.5 mb-[18px]">
            <div>
              <label className="text-xs font-semibold text-text-secondary block mb-1.5">Team</label>
              <Select
                value={teamId}
                onChange={(e) => { setTeamId(e.target.value); setError(''); }}
                className="w-full px-3.5 py-2.5 border border-border rounded-lg bg-bg-input text-sm focus:outline-none focus:border-terracotta"
              >
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.track})</option>)}
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary block mb-1.5">Judge Name</label>
              <input
                value={judgeName}
                onChange={(e) => { setJudgeName(e.target.value); setError(''); }}
                placeholder="e.g. Thai Tran"
                className="w-full px-3.5 py-2.5 border border-border rounded-lg bg-bg-input text-sm focus:outline-none focus:border-terracotta transition-all"
              />
            </div>
          </div>

          {/* Score cards */}
          <div className="grid grid-cols-2 gap-3 my-5">
            {[
              { key: 'impact', label: 'Impact Potential', max: 25, value: impact, setter: setImpact },
              { key: 'technical', label: 'Technical Execution', max: 30, value: technical, setter: setTechnical },
              { key: 'ethics', label: 'Ethical Alignment', max: 25, value: ethics, setter: setEthics },
              { key: 'presentation', label: 'Presentation', max: 20, value: presentation, setter: setPresentation },
            ].map((cat) => (
              <div key={cat.key} className="bg-bg-input border border-border rounded-[10px] p-4 focus-within:border-terracotta transition-colors">
                <div className="text-[13px] font-semibold mb-1">{cat.label}</div>
                <div className="text-[11px] text-text-muted font-mono">max {cat.max} pts</div>
                <input
                  type="number"
                  min={0}
                  max={cat.max}
                  value={cat.value}
                  onChange={(e) => { cat.setter(e.target.value); setError(''); }}
                  placeholder="0"
                  className="font-mono text-[28px] font-semibold text-terracotta bg-transparent border-none outline-none w-full mt-1.5"
                />
              </div>
            ))}
          </div>

          <div className="h-px bg-border my-5" />

          {/* Awards */}
          {availableAwards.length > 0 && (
            <>
              <div className="text-xs font-semibold text-text-secondary mb-2">Special Awards</div>
              <div className="flex gap-2 flex-wrap">
                {availableAwards.map((award) => (
                  <button
                    key={award}
                    onClick={() => setSelectedAwards((prev) => {
                      const next = new Set(prev);
                      if (next.has(award)) next.delete(award);
                      else next.add(award);
                      return next;
                    })}
                    className={`flex-1 min-w-[100px] py-2.5 border rounded-lg text-center text-[11px] font-semibold transition-all flex flex-col items-center gap-1 ${
                      selectedAwards.has(award)
                        ? 'border-terracotta bg-terracotta-bg text-terracotta'
                        : 'border-border bg-bg-input text-text-muted hover:border-border-active'
                    }`}
                  >
                    <Award size={16} />
                    {award}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Total */}
          <div className="text-center bg-terracotta-bg rounded-[10px] p-6 mt-5">
            <div className="text-xs font-semibold text-terracotta uppercase tracking-wider mb-1">Total Score</div>
            <div className="font-mono text-[42px] font-semibold text-terracotta">
              {total}<span className="text-sm text-text-muted"> / 100</span>
            </div>
          </div>

          {error && (
            <div className="mt-4 bg-bg-red border border-red/20 text-red text-sm px-4 py-2 rounded-lg">
              {error}
            </div>
          )}

          <div className="mt-4 text-right">
            <button
              onClick={handleSubmit}
              className="bg-terracotta text-white px-[22px] py-2.5 rounded-lg text-[13px] font-semibold hover:bg-terracotta/90 transition-colors"
            >
              Save Score
            </button>
          </div>
        </div>
      </div>
      </div>

      {/* recent entries sidebar */}
      <div className="bg-bg-card border border-border rounded-[14px] shadow-sm overflow-hidden">
        <div className="px-[22px] py-[18px] border-b border-border">
          <h2 className="font-serif text-[17px]">Recent Entries</h2>
        </div>
        <div className="p-[22px] max-h-[calc(100vh-240px)] overflow-y-auto">
          {recentScores.length === 0 ? (
            <p className="text-text-muted text-sm text-center py-5">No entries yet</p>
          ) : (
            recentScores.map((s) => {
              const team = teams.find((t) => t.id === s.team_id);
              const scoreTotal = s.impact + s.technical + s.ethics + s.presentation;
              return (
                <div key={s.id} className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
                  <div>
                    <div className="font-semibold text-[13px]">{team?.name || '?'}</div>
                    <div className="text-[11px] text-text-muted">{s.judge_name}</div>
                  </div>
                  <div className="font-mono font-semibold text-[15px] text-terracotta">{scoreTotal}</div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
