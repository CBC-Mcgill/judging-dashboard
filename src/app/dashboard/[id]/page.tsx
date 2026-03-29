'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { buildRankedTeams, computeTotal, getCriteriaMaxes } from '@/lib/scoring';
import type { Dashboard, DashboardJudge, Team, Score, UserRole } from '@/types';
import Header from '@/components/Header';
import StatsStrip from '@/components/StatsStrip';
import ScoreEntryPanel from '@/components/ScoreEntryPanel';
import RankingsPanel from '@/components/RankingsPanel';
import TeamDetailPanel from '@/components/TeamDetailPanel';
import CollaboratorPanel from '@/components/CollaboratorPanel';
import JudgesPanel from '@/components/JudgesPanel';
import SettingsPanel from '@/components/SettingsPanel';
import JudgeOnboarding from '@/components/JudgeOnboarding';
import JudgeSettings from '@/components/JudgeSettings';
import ConfirmModal from '@/components/ConfirmModal';

export default function DashboardPage() {
  const params = useParams();
  const dashboardId = params.id as string;

  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [judges, setJudges] = useState<DashboardJudge[]>([]);
  const [activeTab, setActiveTab] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);

    const [dashRes, teamsRes, scoresRes, judgesRes] = await Promise.all([
      supabase.from('dashboards').select('*').eq('id', dashboardId).single(),
      supabase.from('teams').select('*').eq('dashboard_id', dashboardId).order('created_at'),
      supabase.from('scores').select('*').eq('dashboard_id', dashboardId).order('created_at'),
      supabase.from('dashboard_judges').select('*').eq('dashboard_id', dashboardId).order('created_at'),
    ]);

    if (dashRes.data) setDashboard(dashRes.data);
    if (teamsRes.data) setTeams(teamsRes.data);
    if (scoresRes.data) setScores(scoresRes.data);
    if (judgesRes.data) setJudges(judgesRes.data);

    // Determine role
    if (user && dashRes.data) {
      if (dashRes.data.owner_id === user.id) {
        setUserRole('owner');
        if (!activeTab) setActiveTab('entry');
      } else {
        // Check if collaborator
        const { data: collab } = await supabase
          .from('dashboard_collaborators')
          .select('id')
          .eq('dashboard_id', dashboardId)
          .eq('user_id', user.id)
          .maybeSingle();
        if (collab) {
          setUserRole('collaborator');
          if (!activeTab) setActiveTab('entry');
        } else {
          // Must be a judge
          setUserRole('judge');
          if (!activeTab) setActiveTab('onboarding');
        }
      }
    }

    setLoading(false);
  }, [dashboardId, activeTab]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`dashboard-${dashboardId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams', filter: `dashboard_id=eq.${dashboardId}` }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scores', filter: `dashboard_id=eq.${dashboardId}` }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dashboard_judges', filter: `dashboard_id=eq.${dashboardId}` }, () => loadData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [dashboardId, loadData]);

  const isStaff = userRole === 'owner' || userRole === 'collaborator';
  const currentJudge = judges.find((j) => j.user_id === currentUserId) || null;

  async function handleAddTeam(name: string, track: string) {
    const supabase = createClient();
    const { error } = await supabase.from('teams').insert({ dashboard_id: dashboardId, name, track });
    if (error) { alert(error.message); return; }
    loadData();
  }

  async function handleSubmitScore(score: {
    teamId: string;
    judgeName: string;
    categoryScores: Record<string, number>;
    selectedAwards: string[];
  }) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const scoreData = {
      category_scores: score.categoryScores,
      selected_awards: score.selectedAwards,
      scored_by: user?.id,
    };

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
    const criteria = dashboard.criteria || [];
    const rankedTeams = buildRankedTeams(teams, scores, criteria);
    const awardNames = dashboard.awards || [];
    const maxes = getCriteriaMaxes(criteria);
    const rows = [
      ['Team', 'Track', 'Judge', ...criteria.map((c) => `${c.name} (/${maxes.get(c.name) || 0})`), 'Total (/100)', ...awardNames],
    ];
    for (const team of rankedTeams) {
      if (team.scores.length === 0) {
        rows.push([team.name, team.track, '', ...criteria.map(() => ''), '', ...awardNames.map(() => '')]);
      } else {
        for (const s of team.scores) {
          const total = computeTotal(s.category_scores || {}, criteria);
          rows.push([
            team.name, team.track, s.judge_name,
            ...criteria.map((c) => String(s.category_scores?.[c.name] ?? '')),
            total.toFixed(1),
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

  const criteria = dashboard.criteria || [];
  const rankedTeams = buildRankedTeams(teams, scores, criteria);
  const isOwner = currentUserId === dashboard.owner_id;

  return (
    <div className="min-h-screen">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        dashboardName={dashboard.name}
        onExport={isStaff ? handleExport : undefined}
        userRole={userRole}
      />
      <div className={`max-w-[1200px] mx-auto py-5 px-4 md:py-7 md:px-8 ${userRole === 'judge' ? 'pb-20 md:pb-7' : ''}`}>
        {isStaff && <StatsStrip teams={teams} scores={scores} criteria={criteria} />}

        {activeTab === 'entry' && (
          <ScoreEntryPanel
            teams={teams}
            scores={scores}
            tracks={dashboard.tracks}
            criteria={criteria}
            availableAwards={dashboard.awards}
            judges={judges}
            userRole={userRole}
            currentJudge={currentJudge}
            onAddTeam={handleAddTeam}
            onSubmitScore={handleSubmitScore}
          />
        )}

        {activeTab === 'rankings' && isStaff && (
          <RankingsPanel rankedTeams={rankedTeams} tracks={dashboard.tracks} criteria={criteria} />
        )}

        {activeTab === 'detail' && isStaff && (
          <TeamDetailPanel rankedTeams={rankedTeams} tracks={dashboard.tracks} criteria={criteria} onDeleteScore={handleDeleteScore} onDeleteTeam={handleDeleteTeam} onChangeTrack={handleChangeTrack} />
        )}

        {activeTab === 'collaborate' && isStaff && (
          <CollaboratorPanel dashboardId={dashboardId} isOwner={isOwner} />
        )}

        {activeTab === 'judges' && isStaff && (
          <JudgesPanel dashboardId={dashboardId} isStaff={isStaff} />
        )}

        {activeTab === 'settings' && isStaff && (
          <SettingsPanel dashboard={dashboard} isOwner={isOwner} onUpdate={loadData} />
        )}

        {activeTab === 'onboarding' && userRole === 'judge' && (
          <JudgeOnboarding dashboard={dashboard} judgeName={currentJudge?.name || 'Judge'} />
        )}

        {activeTab === 'judge-settings' && userRole === 'judge' && currentJudge && (
          <JudgeSettings judge={currentJudge} />
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
