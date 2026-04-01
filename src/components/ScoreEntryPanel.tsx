'use client';

import { useState, useEffect } from 'react';
import type { Criterion, DashboardJudge, Team, Score, UserRole } from '@/types';
import { getCriteriaMaxes, computeTotal } from '@/lib/scoring';
import Select from './Select';

interface ScoreEntryPanelProps {
  teams: Team[];
  scores: Score[];
  tracks: string[];
  criteria: Criterion[];
  availableSubchallenges: string[];
  judges: DashboardJudge[];
  userRole: UserRole;
  currentJudge?: DashboardJudge | null;
  onAddTeam: (name: string, track: string) => void;
  onSubmitScore: (score: {
    teamId: string;
    judgeName: string;
    categoryScores: Record<string, number>;
    selectedSubchallenges: string[];
  }) => void;
}

export default function ScoreEntryPanel({ teams, scores, tracks, criteria, availableSubchallenges, judges, userRole, currentJudge, onAddTeam, onSubmitScore }: ScoreEntryPanelProps) {
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamTrack, setNewTeamTrack] = useState(tracks[0] || '');
  const [teamId, setTeamId] = useState(teams[0]?.id || '');
  const [selectedJudgeId, setSelectedJudgeId] = useState('');
  const [categoryInputs, setCategoryInputs] = useState<Record<string, string>>({});
  const [selectedSubchallenges, setSelectedSubchallenges] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const [teamError, setTeamError] = useState('');

  const isJudge = userRole === 'judge';
  const isStaff = userRole === 'owner' || userRole === 'collaborator';
  const activeJudges = judges.filter((j) => j.user_id);

  // Auto-select judge for judge users
  useEffect(() => {
    if (isJudge && currentJudge) {
      setSelectedJudgeId(currentJudge.id);
    } else if (activeJudges.length > 0 && !selectedJudgeId) {
      setSelectedJudgeId(activeJudges[0].id);
    }
  }, [isJudge, currentJudge, activeJudges, selectedJudgeId]);

  useEffect(() => {
    if (teams.length > 0 && !teams.find((t) => t.id === teamId)) {
      setTeamId(teams[0].id);
      setError('');
    }
  }, [teams, teamId]);

  const maxes = getCriteriaMaxes(criteria);
  const parsedScores: Record<string, number> = {};
  for (const c of criteria) {
    const v = parseInt(categoryInputs[c.name] || '');
    if (!isNaN(v)) parsedScores[c.name] = v;
  }
  const total = computeTotal(parsedScores, criteria);

  // Filter scores for recent entries
  const selectedJudge = activeJudges.find((j) => j.id === selectedJudgeId);
  const recentScores = isJudge && currentJudge
    ? [...scores].filter((s) => s.judge_name === currentJudge.name).reverse().slice(0, 15)
    : [...scores].reverse().slice(0, 15);

  function handleAddTeam() {
    if (!newTeamName.trim()) { setTeamError('Enter a team name'); return; }
    setTeamError('');
    onAddTeam(newTeamName.trim(), newTeamTrack);
    setNewTeamName('');
  }

  function handleSubmit() {
    setError('');
    if (!teamId) { setError('Select a team'); return; }

    const judge = activeJudges.find((j) => j.id === selectedJudgeId);
    if (!judge) { setError('Select a judge'); return; }

    const catScores: Record<string, number> = {};
    for (const c of criteria) {
      const max = maxes.get(c.name) || 0;
      const v = parseInt(categoryInputs[c.name] || '');
      if (isNaN(v)) { setError(`Fill in score for ${c.name}`); return; }
      if (v < 0 || v > max) { setError(`${c.name} must be 0-${max}`); return; }
      catScores[c.name] = v;
    }

    onSubmitScore({ teamId, judgeName: judge.name, categoryScores: catScores, selectedSubchallenges: Array.from(selectedSubchallenges) });
    setCategoryInputs({});
    setSelectedSubchallenges(new Set());
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_340px] gap-5">
      <div className="space-y-5">
        {/* Create new team (staff only) */}
        {isStaff && (
          <div className="bg-bg-card border border-border rounded-[14px] shadow-sm overflow-hidden">
            <div className="px-[22px] py-[18px] border-b border-border">
              <h2 className="font-serif text-[17px]">Create New Team</h2>
              <p className="text-xs text-text-muted mt-0.5">Select team track</p>
            </div>
            <div className="p-[22px]">
              <div className="flex flex-col md:flex-row gap-2">
                <input
                  value={newTeamName}
                  onChange={(e) => { setNewTeamName(e.target.value); setTeamError(''); }}
                  placeholder="Team name..."
                  className="flex-1 px-3.5 py-2.5 border border-border rounded-lg bg-bg-input text-sm focus:outline-none focus:border-terracotta transition-all"
                />
                <Select
                  value={newTeamTrack}
                  onChange={(e) => setNewTeamTrack(e.target.value)}
                  className="w-full md:max-w-[180px] px-3 py-2.5 border border-border rounded-lg bg-bg-input text-sm focus:outline-none focus:border-terracotta"
                >
                  {tracks.map((t) => <option key={t} value={t}>{t}</option>)}
                </Select>
                <button onClick={handleAddTeam} className="border border-border px-3.5 py-2.5 md:py-1.5 rounded-lg text-xs font-semibold hover:bg-bg-warm transition-colors w-full md:w-auto">
                  Add Team
                </button>
              </div>
              {teamError && (
                <div className="mt-2 bg-bg-red border border-red/20 text-red text-sm px-4 py-2 rounded-lg">
                  {teamError}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Entry form */}
        <div className="bg-bg-card border border-border rounded-[14px] shadow-sm overflow-hidden">
          <div className="px-[22px] py-[18px] border-b border-border">
            <h2 className="font-serif text-[17px]">Enter Judge Scores</h2>
            <p className="text-xs text-text-muted mt-0.5">Score each category up to its max</p>
          </div>
          <div className="p-[22px]">
            {/* Team + Judge */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-[18px]">
              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1.5">Team</label>
                <Select
                  value={teamId}
                  onChange={(e) => { setTeamId(e.target.value); setError(''); }}
                  className="w-full px-3.5 py-2.5 border border-border rounded-lg bg-bg-input text-sm focus:outline-none focus:border-terracotta"
                >
                  {teams.length === 0 && <option value="">No teams yet</option>}
                  {teams.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.track})</option>)}
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1.5">Judge</label>
                {isJudge && currentJudge ? (
                  <div className="px-3.5 py-2.5 border border-border rounded-lg bg-bg-warm text-sm font-medium">
                    {currentJudge.name}
                  </div>
                ) : (
                  <Select
                    value={selectedJudgeId}
                    onChange={(e) => { setSelectedJudgeId(e.target.value); setError(''); }}
                    className="w-full px-3.5 py-2.5 border border-border rounded-lg bg-bg-input text-sm focus:outline-none focus:border-terracotta"
                  >
                    {activeJudges.length === 0 && <option value="">No judges registered</option>}
                    {activeJudges.map((j) => <option key={j.id} value={j.id}>{j.name}</option>)}
                  </Select>
                )}
              </div>
            </div>

            {/* Score cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-5">
              {criteria.map((c, i) => {
                const max = maxes.get(c.name) || 0;
                return (
                <div key={c.name} className={`bg-bg-input border border-border rounded-[10px] p-4 focus-within:border-terracotta transition-colors ${criteria.length % 2 === 1 && i === criteria.length - 1 ? 'md:col-span-2' : ''}`}>
                  <div className="text-[13px] font-semibold mb-1">{c.name}</div>
                  <div className="text-[11px] text-text-muted font-mono">max {max} pts</div>
                  <input
                    type="number"
                    min={0}
                    max={max}
                    value={categoryInputs[c.name] || ''}
                    onChange={(e) => { setCategoryInputs((prev) => ({ ...prev, [c.name]: e.target.value })); setError(''); }}
                    placeholder="0"
                    className="font-mono text-[28px] font-semibold text-terracotta bg-transparent border-none outline-none w-full mt-1.5"
                  />
                </div>
                );
              })}
            </div>

            <div className="h-px bg-border my-5" />

            {/* Subchallenges */}
            {availableSubchallenges.length > 0 && (
              <>
                <div className="text-xs font-semibold text-text-secondary mb-2">Subchallenges</div>
                <div className="flex gap-2 flex-wrap">
                  {availableSubchallenges.map((sc) => (
                    <button
                      key={sc}
                      onClick={() => setSelectedSubchallenges((prev) => {
                        const next = new Set(prev);
                        if (next.has(sc)) next.delete(sc);
                        else next.add(sc);
                        return next;
                      })}
                      className={`flex-1 min-w-[100px] py-2.5 border rounded-lg text-center text-[11px] font-semibold transition-all flex flex-col items-center gap-1 ${
                        selectedSubchallenges.has(sc)
                          ? 'border-terracotta bg-terracotta-bg text-terracotta'
                          : 'border-border bg-bg-input text-text-muted hover:border-border-active'
                      }`}
                    >
                      {sc}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Total */}
            <div className="text-center bg-terracotta-bg rounded-[10px] p-6 mt-5">
              <div className="text-xs font-semibold text-terracotta uppercase tracking-wider mb-1">Total Score</div>
              <div className="font-mono text-[42px] font-semibold text-terracotta">
                {Math.round(total)}<span className="text-xs md:text-sm text-text-muted"> / 100</span>
              </div>
            </div>

            {error && (
              <div className="mt-4 bg-bg-red border border-red/20 text-red text-sm px-4 py-2 rounded-lg">
                {error}
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleSubmit}
                className="bg-terracotta text-white px-[22px] py-2.5 rounded-lg text-[13px] font-semibold hover:bg-terracotta/90 transition-colors w-full md:w-auto"
              >
                Save Score
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent entries sidebar */}
      <div className="bg-bg-card border border-border rounded-[14px] shadow-sm overflow-hidden">
        <div className="px-[22px] py-[18px] border-b border-border">
          <h2 className="font-serif text-[17px]">{isJudge ? 'Your Entries' : 'Recent Entries'}</h2>
        </div>
        <div className="p-[22px] max-h-[400px] md:max-h-[calc(100vh-240px)] overflow-y-auto">
          {recentScores.length === 0 ? (
            <p className="text-text-muted text-sm text-center py-5">No entries yet</p>
          ) : (
            recentScores.map((s) => {
              const team = teams.find((t) => t.id === s.team_id);
              const scoreTotal = computeTotal(s.category_scores || {}, criteria);
              return (
                <div key={s.id} className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
                  <div>
                    <div className="font-semibold text-[13px]">{team?.name || '?'}</div>
                    <div className="text-[11px] text-text-muted">{s.judge_name}</div>
                  </div>
                  <div className="font-mono font-semibold text-[15px] text-terracotta">{Math.round(scoreTotal)}</div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
