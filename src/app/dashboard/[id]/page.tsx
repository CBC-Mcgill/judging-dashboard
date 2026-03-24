'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { buildRankedTeams } from '@/lib/scoring';
import type { Dashboard, Team, Score } from '@/types';
import Header from '@/components/Header';
import StatsStrip from '@/components/StatsStrip';
import ScoreEntryPanel from '@/components/ScoreEntryPanel';
import RankingsPanel from '@/components/RankingsPanel';
import TeamDetailPanel from '@/components/TeamDetailPanel';
import CollaboratorPanel from '@/components/CollaboratorPanel';
import SettingsPanel from '@/components/SettingsPanel';
import ConfirmModal from '@/components/ConfirmModal';

export default function DashboardPage() {
  const params = useParams();
  const dashboardId = params.id as string;

  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [activeTab, setActiveTab] = useState('entry');
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);

    const [dashRes, teamsRes, scoresRes] = await Promise.all([
      supabase.from('dashboards').select('*').eq('id', dashboardId).single(),
      supabase.from('teams').select('*').eq('dashboard_id', dashboardId).order('created_at'),
      supabase.from('scores').select('*').eq('dashboard_id', dashboardId).order('created_at'),
    ]);

    if (dashRes.data) setDashboard(dashRes.data);
    if (teamsRes.data) setTeams(teamsRes.data);
    if (scoresRes.data) setScores(scoresRes.data);
    setLoading(false);
  }, [dashboardId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time subscriptions
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`dashboard-${dashboardId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams', filter: `dashboard_id=eq.${dashboardId}` },
        () => loadData()
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scores', filter: `dashboard_id=eq.${dashboardId}` },
        () => loadData()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [dashboardId, loadData]);

  async function handleAddTeam(name: string, track: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from('teams')
      .insert({ dashboard_id: dashboardId, name, track });
    if (error) { alert(error.message); return; }
    loadData();
  }

  async function handleSubmitScore(score: {
    teamId: string;
    judgeName: string;
    impact: number;
    technical: number;
    ethics: number;
    presentation: number;
    selectedAwards: string[];
  }) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const scoreData = {
      impact: score.impact,
      technical: score.technical,
      ethics: score.ethics,
      presentation: score.presentation,
      selected_awards: score.selectedAwards,
      scored_by: user?.id,
    };

    // Check if this judge already scored this team — overwrite if so
    const { data: existing } = await supabase
      .from('scores')
      .select('id')
      .eq('team_id', score.teamId)
      .eq('judge_name', score.judgeName)
      .eq('dashboard_id', dashboardId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase.from('scores').update(scoreData).eq('id', existing.id);
      if (error) { alert(error.message); return; }
    } else {
      const { error } = await supabase.from('scores').insert({
        dashboard_id: dashboardId,
        team_id: score.teamId,
        judge_name: score.judgeName,
        ...scoreData,
      });
      if (error) { alert(error.message); return; }
    }
    loadData();
  }

  async function handleChangeTrack(teamId: string, newTrack: string) {
    const supabase = createClient();
    const { error } = await supabase.from('teams').update({ track: newTrack }).eq('id', teamId);
    if (error) { alert(error.message); return; }
    loadData();
  }

  function handleDeleteTeam(teamId: string) {
    const team = teams.find((t) => t.id === teamId);
    setConfirmAction({
      title: 'Delete Team',
      message: `Delete "${team?.name}"? All scores for this team will be deleted.`,
      onConfirm: async () => {
        const supabase = createClient();
        const { error } = await supabase.from('teams').delete().eq('id', teamId);
        setConfirmAction(null);
        if (error) { alert(error.message); return; }
        loadData();
      },
    });
  }

  function handleDeleteScore(scoreId: string) {
    const score = scores.find((s) => s.id === scoreId);
    setConfirmAction({
      title: 'Delete Score',
      message: `Delete the score from ${score?.judge_name || 'this judge'}? This cannot be undone.`,
      onConfirm: async () => {
        const supabase = createClient();
        const { error } = await supabase.from('scores').delete().eq('id', scoreId);
        setConfirmAction(null);
        if (error) { alert(error.message); return; }
        loadData();
      },
    });
  }

  function handleExport() {
    if (!dashboard) return;
    const rankedTeams = buildRankedTeams(teams, scores);
    const awardNames = dashboard.awards || [];
    const rows = [
      ['Team', 'Track', 'Judge', 'Impact (/25)', 'Technical (/30)', 'Ethics (/25)', 'Presentation (/20)', 'Total (/100)', ...awardNames],
    ];
    for (const team of rankedTeams) {
      if (team.scores.length === 0) {
        rows.push([team.name, team.track, '', '', '', '', '', '', ...awardNames.map(() => '')]);
      } else {
        for (const s of team.scores) {
          const total = s.impact + s.technical + s.ethics + s.presentation;
          rows.push([
            team.name, team.track, s.judge_name,
            String(s.impact), String(s.technical), String(s.ethics), String(s.presentation), String(total),
            ...awardNames.map((a) => s.selected_awards?.includes(a) ? 'Yes' : ''),
          ]);
        }
      }
    }
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${dashboard?.name || 'scores'}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-text-muted text-sm">Loading dashboard...</div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-text-muted text-sm">Dashboard not found</div>
      </div>
    );
  }

  const rankedTeams = buildRankedTeams(teams, scores);
  const isOwner = currentUserId === dashboard.owner_id;

  return (
    <div className="min-h-screen">
      <Header activeTab={activeTab} onTabChange={setActiveTab} dashboardName={dashboard.name} onExport={handleExport} />
      <div className="max-w-[1200px] mx-auto py-7 px-8">
        <StatsStrip teams={teams} scores={scores} />

        {activeTab === 'entry' && (
          <ScoreEntryPanel
            teams={teams}
            scores={scores}
            tracks={dashboard.tracks}
            availableAwards={dashboard.awards}
            onAddTeam={handleAddTeam}
            onSubmitScore={handleSubmitScore}
          />
        )}

        {activeTab === 'rankings' && (
          <RankingsPanel rankedTeams={rankedTeams} tracks={dashboard.tracks} />
        )}

        {activeTab === 'detail' && (
          <TeamDetailPanel rankedTeams={rankedTeams} tracks={dashboard.tracks} onDeleteScore={handleDeleteScore} onDeleteTeam={handleDeleteTeam} onChangeTrack={handleChangeTrack} />
        )}

        {activeTab === 'collaborate' && (
          <CollaboratorPanel dashboardId={dashboardId} isOwner={isOwner} />
        )}

        {activeTab === 'settings' && (
          <SettingsPanel dashboard={dashboard} isOwner={isOwner} onUpdate={loadData} />
        )}
      </div>
      <ConfirmModal
        open={!!confirmAction}
        title={confirmAction?.title || ''}
        message={confirmAction?.message || ''}
        onConfirm={confirmAction?.onConfirm || (() => {})}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
