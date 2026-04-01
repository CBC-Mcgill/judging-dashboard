'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { DEFAULT_TRACKS, DEFAULT_AWARDS, DEFAULT_CRITERIA } from '@/lib/scoring';
import type { Criterion, Dashboard, JudgeInvite, PendingInvite } from '@/types';
import TrackEditor from '@/components/TrackEditor';
import CriteriaEditor from '@/components/CriteriaEditor';
import { ClipboardList, X, Mail, Check } from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';

export default function DashboardListPage() {
  const router = useRouter();
  const [ownedDashboards, setOwnedDashboards] = useState<Dashboard[]>([]);
  const [sharedDashboards, setSharedDashboards] = useState<Dashboard[]>([]);
  const [pendingInvites, setPendingInvites] = useState<(PendingInvite & { dashboard_name?: string })[]>([]);
  const [judgeInvites, setJudgeInvites] = useState<JudgeInvite[]>([]);
  const [judgeDashboards, setJudgeDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newTracks, setNewTracks] = useState<string[]>([...DEFAULT_TRACKS]);
  const [newAwards, setNewAwards] = useState<string[]>([...DEFAULT_AWARDS]);
  const [newCriteria, setNewCriteria] = useState<Criterion[]>([...DEFAULT_CRITERIA]);
  const [createError, setCreateError] = useState('');
  const [leaveConfirm, setLeaveConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadDashboards();
  }, []);

  async function loadDashboards() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth/login'); return; }

    // Get owned dashboards
    const { data: owned } = await supabase
      .from('dashboards')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    // Get collaborated dashboards
    const { data: collabs } = await supabase
      .from('dashboard_collaborators')
      .select('dashboard_id')
      .eq('user_id', user.id);

    let shared: Dashboard[] = [];
    if (collabs && collabs.length > 0) {
      const ids = collabs.map((c) => c.dashboard_id);
      const { data } = await supabase
        .from('dashboards')
        .select('*')
        .in('id', ids)
        .order('created_at', { ascending: false });
      shared = data || [];
    }

    // Get pending collaborator invites
    const { data: inviteData } = await supabase.rpc('get_my_invites');
    const invites = (inviteData as (PendingInvite & { dashboard_name?: string })[]) || [];

    // Get pending judge invites
    const { data: judgeInviteData } = await supabase.rpc('get_my_judge_invites');
    const jInvites = (judgeInviteData as JudgeInvite[]) || [];

    // Get dashboards where user is an active judge
    const { data: judgeRows } = await supabase
      .from('dashboard_judges')
      .select('dashboard_id')
      .eq('user_id', user.id);

    let jDashboards: Dashboard[] = [];
    if (judgeRows && judgeRows.length > 0) {
      const ids = judgeRows.map((j) => j.dashboard_id);
      const { data } = await supabase
        .from('dashboards')
        .select('*')
        .in('id', ids)
        .order('created_at', { ascending: false });
      jDashboards = data || [];
    }

    setOwnedDashboards(owned || []);
    setSharedDashboards(shared);
    setPendingInvites(invites);
    setJudgeInvites(jInvites);
    setJudgeDashboards(jDashboards);
    setLoading(false);
  }

  async function acceptInvite(inviteId: string) {
    const supabase = createClient();
    const { error } = await supabase.rpc('accept_invite', { invite_id: inviteId });
    if (error) { alert(error.message); return; }
    loadDashboards();
  }

  async function declineInvite(inviteId: string) {
    const supabase = createClient();
    const { error } = await supabase.rpc('decline_invite', { invite_id: inviteId });
    if (error) { alert(error.message); return; }
    loadDashboards();
  }

  async function acceptJudgeInvite(judgeId: string) {
    const supabase = createClient();
    const { error } = await supabase.rpc('accept_judge_invite', { judge_id: judgeId });
    if (error) { alert(error.message); return; }
    loadDashboards();
  }

  async function declineJudgeInvite(judgeId: string) {
    const supabase = createClient();
    const { error } = await supabase.rpc('decline_judge_invite', { judge_id: judgeId });
    if (error) { alert(error.message); return; }
    loadDashboards();
  }

  async function leaveDashboard(dashboardId: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from('dashboard_collaborators')
      .delete()
      .eq('dashboard_id', dashboardId)
      .eq('user_id', user.id);
    setLeaveConfirm(null);
    if (error) { alert(error.message); return; }
    loadDashboards();
  }

  async function createDashboard() {
    setCreateError('');
    if (!newName.trim()) { setCreateError('Enter a dashboard name'); return; }
    if (newTracks.length === 0) { setCreateError('Add at least one track'); return; }
    if (newCriteria.length === 0) { setCreateError('Add at least one scoring criterion'); return; }
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('dashboards')
      .insert({
        name: newName.trim(),
        description: newDesc.trim() || null,
        owner_id: user.id,
        tracks: newTracks,
        awards: newAwards,
        criteria: newCriteria,
      });

    if (error) {
      alert('Failed to create dashboard. Please try again.');
      return;
    }

    // Fetch the just-created dashboard to get its ID
    const { data: created } = await supabase
      .from('dashboards')
      .select('id')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (created) {
      router.push(`/dashboard/${created.id}`);
    } else {
      loadDashboards();
      setShowCreate(false);
    }
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-text-muted text-sm">Loading...</div>
      </div>
    );
  }

  const hasNone = ownedDashboards.length === 0 && sharedDashboards.length === 0 && pendingInvites.length === 0 && judgeInvites.length === 0 && judgeDashboards.length === 0;

  return (
    <div className="min-h-screen">
      <header className="bg-bg-card border-b border-border px-4 md:px-8 sticky top-0 z-50">
        <div className="max-w-[900px] mx-auto flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <img src="/icon.svg" alt="Logo" className="w-9 h-9" />
            <span className="font-serif text-lg">My Dashboards</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreate(true)}
              className="bg-terracotta text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-terracotta/90 transition-colors"
            >
              New Dashboard
            </button>
            <button
              onClick={handleSignOut}
              className="border border-border px-3.5 py-1.5 rounded-lg text-xs font-semibold text-text-muted hover:bg-bg-red transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="relative bg-bg-card border border-border rounded-[16px] shadow-lg w-full max-w-[600px] mx-4 max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
              <h2 className="font-serif text-xl">Create New Dashboard</h2>
              <button onClick={() => setShowCreate(false)} className="text-text-muted hover:text-text transition-colors"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1.5">Dashboard Name</label>
                <input
                  value={newName}
                  onChange={(e) => { setNewName(e.target.value); setCreateError(''); }}
                  placeholder="e.g. McGill CBC 2026 Hackathon"
                  className="w-full px-3.5 py-2.5 border border-border rounded-lg bg-bg-input text-sm focus:outline-none focus:border-terracotta transition-all"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1.5">Description (optional)</label>
                <input
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Brief description..."
                  className="w-full px-3.5 py-2.5 border border-border rounded-lg bg-bg-input text-sm focus:outline-none focus:border-terracotta transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1.5">Scoring Criteria</label>
                <p className="text-xs text-text-secondary mb-2">Weights define the max score per category. They normalize to sum 100.</p>
                <CriteriaEditor criteria={newCriteria} onChange={setNewCriteria} compact />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-text-secondary block mb-1.5">Tracks</label>
                  <TrackEditor tracks={newTracks} onChange={setNewTracks} placeholder="Add a track..." addLabel="Add" emptyText="No tracks yet." compact />
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-secondary block mb-1.5">Subchallenges</label>
                  <TrackEditor tracks={newAwards} onChange={setNewAwards} placeholder="Add a subchallenge..." addLabel="Add" emptyText="No subchallenges yet." compact />
                </div>
              </div>
            </div>
            {createError && (
              <div className="mx-6 mb-3 bg-bg-red border border-red/20 text-red text-sm px-4 py-2 rounded-lg">
                {createError}
              </div>
            )}
            <div className="flex gap-2 justify-end px-6 pb-6 pt-2 border-t border-border">
              <button
                onClick={() => setShowCreate(false)}
                className="border border-border px-5 py-2 rounded-lg text-sm font-semibold hover:bg-bg-warm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createDashboard}
                className="bg-terracotta text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-terracotta/90 transition-colors"
              >
                Create Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[900px] mx-auto py-6 px-4 md:py-8 md:px-8">
        {/* Empty state */}
        {hasNone && !showCreate && (
          <div className="text-center py-20">
            <ClipboardList size={40} className="mx-auto mb-4 text-text-muted" />
            <p className="text-text-muted text-sm mb-4">No dashboards yet</p>
            <button
              onClick={() => setShowCreate(true)}
              className="bg-terracotta text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-terracotta/90 transition-colors"
            >
              Create Your First Dashboard
            </button>
          </div>
        )}

        {/* Pending invites */}
        {pendingInvites.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Pending Invites</h2>
            <div className="grid gap-3">
              {pendingInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="bg-bg-card border border-terracotta/30 rounded-[14px] shadow-sm p-5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-terracotta-bg rounded-full flex items-center justify-center">
                        <Mail size={18} className="text-terracotta" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[15px]">{invite.dashboard_name || 'Unknown Dashboard'}</h3>
                        <p className="text-xs text-text-muted">You&apos;ve been invited to collaborate</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => declineInvite(invite.id)}
                        className="border border-border px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-bg-warm transition-colors"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => acceptInvite(invite.id)}
                        className="bg-terracotta text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-terracotta/90 transition-colors inline-flex items-center gap-1"
                      >
                        <Check size={14} />
                        Accept
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Owned dashboards */}
        {ownedDashboards.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">My Dashboards</h2>
            <div className="grid gap-3">
              {ownedDashboards.map((d) => (
                <div
                  key={d.id}
                  onClick={() => router.push(`/dashboard/${d.id}`)}
                  className="bg-bg-card border border-border rounded-[14px] shadow-sm p-5 cursor-pointer hover:shadow-md hover:border-border-active transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-[15px]">{d.name}</h3>
                        <span className="text-[10px] bg-terracotta-bg text-terracotta px-2 py-0.5 rounded-full font-semibold">Owner</span>
                      </div>
                      {d.description && <p className="text-sm text-text-muted mt-0.5">{d.description}</p>}
                      <div className="hidden md:flex gap-1.5 mt-2">
                        {d.tracks?.map((t) => (
                          <span key={t} className="text-[10px] bg-bg-warm text-text-secondary px-2 py-0.5 rounded-full">{t}</span>
                        ))}
                      </div>
                    </div>
                    <span className="text-text-muted text-xs">{new Date(d.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Judge invites */}
        {judgeInvites.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Judge Invites</h2>
            <div className="grid gap-3">
              {judgeInvites.map((invite) => (
                <div key={invite.id} className="bg-bg-card border border-terracotta/30 rounded-[14px] shadow-sm p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-terracotta-bg rounded-full flex items-center justify-center">
                        <Mail size={18} className="text-terracotta" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[15px]">{invite.dashboard_name}</h3>
                        <p className="text-xs text-text-muted">You&apos;ve been invited to judge</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => declineJudgeInvite(invite.id)} className="border border-border px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-bg-warm transition-colors">Decline</button>
                      <button onClick={() => acceptJudgeInvite(invite.id)} className="bg-terracotta text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-terracotta/90 transition-colors inline-flex items-center gap-1"><Check size={14} />Accept</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shared dashboards */}
        {sharedDashboards.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Shared with Me</h2>
            <div className="grid gap-3">
              {sharedDashboards.map((d) => (
                <div
                  key={d.id}
                  className="bg-bg-card border border-border rounded-[14px] shadow-sm p-5 hover:shadow-md hover:border-border-active transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => router.push(`/dashboard/${d.id}`)}
                    >
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-[15px]">{d.name}</h3>
                        <span className="text-[10px] bg-sage-bg text-sage px-2 py-0.5 rounded-full font-semibold">Shared</span>
                      </div>
                      {d.description && <p className="text-sm text-text-muted mt-0.5">{d.description}</p>}
                      <div className="hidden md:flex gap-1.5 mt-2">
                        {d.tracks?.map((t) => (
                          <span key={t} className="text-[10px] bg-bg-warm text-text-secondary px-2 py-0.5 rounded-full">{t}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-text-muted text-xs">{new Date(d.created_at).toLocaleDateString()}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setLeaveConfirm(d.id); }}
                        className="text-xs text-red hover:underline"
                      >
                        Leave
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Judge dashboards */}
        {judgeDashboards.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Judging</h2>
            <div className="grid gap-3">
              {judgeDashboards.map((d) => (
                <div
                  key={d.id}
                  onClick={() => router.push(`/dashboard/${d.id}`)}
                  className="bg-bg-card border border-border rounded-[14px] shadow-sm p-5 cursor-pointer hover:shadow-md hover:border-border-active transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-[15px]">{d.name}</h3>
                        <span className="text-[10px] bg-bg-warm text-text-secondary px-2 py-0.5 rounded-full font-semibold">Judge</span>
                      </div>
                      {d.description && <p className="text-sm text-text-muted mt-0.5">{d.description}</p>}
                    </div>
                    <span className="text-text-muted text-xs">{new Date(d.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <ConfirmModal
        open={!!leaveConfirm}
        title="Leave Dashboard"
        message="Leave this dashboard? You will lose access and need to be re-invited."
        confirmLabel="Leave"
        onConfirm={() => leaveConfirm && leaveDashboard(leaveConfirm)}
        onCancel={() => setLeaveConfirm(null)}
      />
    </div>
  );
}
