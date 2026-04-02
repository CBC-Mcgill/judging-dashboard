'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { DashboardJudge } from '@/types';
import { Link2, Copy, Check, RefreshCw } from 'lucide-react';

interface JudgesPanelProps {
  dashboardId: string;
  isStaff: boolean;
  inviteToken: string | null;
  onTokenChange: () => void;
}

export default function JudgesPanel({ dashboardId, isStaff, inviteToken, onTokenChange }: JudgesPanelProps) {
  const [judges, setJudges] = useState<DashboardJudge[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [generatingToken, setGeneratingToken] = useState(false);

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('dashboard_judges')
      .select('*')
      .eq('dashboard_id', dashboardId)
      .order('created_at');
    setJudges(data || []);
    setLoading(false);
  }, [dashboardId]);

  useEffect(() => { loadData(); }, [loadData]);

  const pending = judges.filter((j) => !j.user_id);
  const active = judges.filter((j) => j.user_id);

  async function generateInviteToken() {
    setGeneratingToken(true);
    const supabase = createClient();
    const token = crypto.randomUUID();
    const { error } = await supabase
      .from('dashboards')
      .update({ invite_token: token })
      .eq('id', dashboardId);
    setGeneratingToken(false);
    if (error) { setError(error.message); return; }
    onTokenChange();
  }

  function copyInviteLink() {
    if (!inviteToken) return;
    const url = `${window.location.origin}/join/${inviteToken}`;
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  async function handleInvite() {
    setError('');
    setSuccess('');
    const email = inviteEmail.trim().toLowerCase();

    if (!email) { setError('Enter an email'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Invalid email'); return; }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email?.toLowerCase() === email) { setError("You can't invite yourself as a judge"); return; }
    if (judges.some((j) => j.email.toLowerCase() === email)) { setError('This email is already invited'); return; }

    if (!user?.id) return;

    // Check if email belongs to a collaborator
    const { data: collaborators } = await supabase.rpc('get_collaborator_emails', { d_id: dashboardId });
    if (collaborators?.some((c: { email: string }) => c.email.toLowerCase() === email)) {
      setError('This person is already a collaborator on this dashboard.');
      return;
    }

    // Check if email belongs to the dashboard owner
    const { data: ownerCheck } = await supabase.rpc('get_dashboard_owner_email', { d_id: dashboardId });
    if (ownerCheck && ownerCheck.toLowerCase() === email) {
      setError('This person is the owner of this dashboard.');
      return;
    }
    const { error: insertError } = await supabase.from('dashboard_judges').insert({
      dashboard_id: dashboardId,
      email,
      name: email.split('@')[0],
      invited_by: user.id,
    });

    if (insertError) { setError(insertError.message); return; }
    setInviteEmail('');
    setSuccess('Invite sent');
    loadData();
    setTimeout(() => setSuccess(''), 3000);
  }

  async function removeJudge(judgeId: string) {
    const supabase = createClient();
    await supabase.from('dashboard_judges').delete().eq('id', judgeId);
    loadData();
  }

  if (loading) {
    return <div className="text-center py-12 text-text-muted text-sm">Loading judges...</div>;
  }

  return (
    <div className="max-w-2xl">
      {/* Invite link (staff only) */}
      {isStaff && (
        <div className="bg-bg-card border border-border rounded-[14px] shadow-sm overflow-hidden mb-5">
          <div className="px-[22px] py-[18px] border-b border-border">
            <h2 className="font-serif text-[17px]">Invite Link</h2>
            <p className="text-xs text-text-muted mt-0.5">Share this link with judges to let them join directly</p>
          </div>
          <div className="p-[22px]">
            {inviteToken ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 px-3.5 py-2.5 border border-border rounded-lg bg-bg-warm overflow-hidden">
                  <Link2 size={14} className="text-text-muted shrink-0" />
                  <span className="text-sm text-text-muted truncate">{window.location.origin}/join/{inviteToken}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={copyInviteLink}
                    className="flex-1 md:flex-none flex items-center justify-center gap-1.5 w-auto md:w-[100px] bg-terracotta text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-terracotta/90 transition-colors"
                  >
                    {linkCopied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
                  </button>
                  <button
                    onClick={generateInviteToken}
                    disabled={generatingToken}
                    className="flex items-center justify-center w-[42px] border border-border py-2.5 rounded-lg text-text-muted hover:bg-bg-warm transition-colors disabled:opacity-50"
                    title="Generate a new link (invalidates the old one)"
                  >
                    <RefreshCw size={12} />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={generateInviteToken}
                disabled={generatingToken}
                className="flex items-center gap-2 bg-terracotta text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-terracotta/90 transition-colors disabled:opacity-50"
              >
                <Link2 size={14} />
                {generatingToken ? 'Generating...' : 'Generate Invite Link'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Invite by email (staff only) */}
      {isStaff && (
        <div className="bg-bg-card border border-border rounded-[14px] shadow-sm overflow-hidden mb-5">
          <div className="px-[22px] py-[18px] border-b border-border">
            <h2 className="font-serif text-[17px]">Invite by Email</h2>
            <p className="text-xs text-text-muted mt-0.5">Their display name will be pulled from their account profile</p>
          </div>
          <div className="p-[22px]">
            <div className="flex flex-col md:flex-row gap-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="judge@email.com"
                className="flex-1 px-3.5 py-2.5 border border-border rounded-lg bg-bg-input text-sm focus:outline-none focus:border-terracotta transition-all"
                onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
              />
              <button
                onClick={handleInvite}
                className="bg-terracotta text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-terracotta/90 transition-colors w-full md:w-auto"
              >
                Invite
              </button>
            </div>
            {error && <div className="mt-3 bg-bg-red border border-red/20 text-red text-sm px-4 py-2 rounded-lg">{error}</div>}
            {success && <div className="mt-3 bg-sage-bg border border-sage/20 text-sage text-sm px-4 py-2 rounded-lg">{success}</div>}
          </div>
        </div>
      )}

      {/* Pending judges */}
      {pending.length > 0 && (
        <div className="bg-bg-card border border-border rounded-[14px] shadow-sm overflow-hidden mb-5">
          <div className="px-[22px] py-[18px] border-b border-border">
            <h2 className="font-serif text-[17px]">Pending Judges</h2>
            <p className="text-xs text-text-muted mt-0.5">Waiting for these people to sign up and accept</p>
          </div>
          <div className="p-[22px]">
            {pending.map((judge) => (
              <div key={judge.id} className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-bg-warm rounded-full flex items-center justify-center text-xs font-semibold text-text-muted">
                    {judge.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{judge.email}</div>
                    <div className="text-[11px] text-text-muted">Pending</div>
                  </div>
                </div>
                {isStaff && (
                  <button onClick={() => removeJudge(judge.id)} className="text-xs text-red hover:underline">Revoke</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active judges */}
      <div className="bg-bg-card border border-border rounded-[14px] shadow-sm overflow-hidden">
        <div className="px-[22px] py-[18px] border-b border-border">
          <h2 className="font-serif text-[17px]">Active Judges</h2>
          <p className="text-xs text-text-muted mt-0.5">Judges who can enter scores</p>
        </div>
        <div className="p-[22px]">
          {active.length === 0 ? (
            <p className="text-text-muted text-sm text-center py-5">No active judges yet</p>
          ) : (
            active.map((judge) => (
              <div key={judge.id} className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-terracotta-bg rounded-full flex items-center justify-center text-xs font-semibold text-terracotta">
                    {judge.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{judge.name}</div>
                    <div className="text-[11px] text-text-muted">{judge.email}</div>
                  </div>
                </div>
                {isStaff && (
                  <button onClick={() => removeJudge(judge.id)} className="text-xs text-red hover:underline">Remove</button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
