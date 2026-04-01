'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { PendingInvite, CollaboratorWithEmail } from '@/types';

interface CollaboratorPanelProps {
  dashboardId: string;
  isOwner: boolean;
}

export default function CollaboratorPanel({ dashboardId, isOwner }: CollaboratorPanelProps) {
  const [collaborators, setCollaborators] = useState<CollaboratorWithEmail[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = useCallback(async () => {
    const supabase = createClient();

    // Get active collaborators with emails via RPC
    const { data: collabs } = await supabase.rpc('get_collaborator_emails', { d_id: dashboardId });

    // Get pending invites
    const { data: pending } = await supabase
      .from('pending_invites')
      .select('*')
      .eq('dashboard_id', dashboardId)
      .order('created_at', { ascending: false });

    setCollaborators((collabs as CollaboratorWithEmail[]) || []);
    setPendingInvites((pending as PendingInvite[]) || []);
    setLoading(false);
  }, [dashboardId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleInvite() {
    setError('');
    setSuccess('');
    const email = inviteEmail.trim().toLowerCase();

    if (!email) { setError('Enter an email address'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Invalid email format'); return; }

    // Check if inviting yourself
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email?.toLowerCase() === email) {
      setError("You can't invite yourself");
      return;
    }

    // Check if already a collaborator
    if (collaborators.some((c) => c.email.toLowerCase() === email)) {
      setError('This person is already a collaborator');
      return;
    }
    // Check if already invited
    if (pendingInvites.some((p) => p.email.toLowerCase() === email)) {
      setError('This email has already been invited');
      return;
    }

    if (!user?.id) return;
    const { error: insertError } = await supabase.from('pending_invites').insert({
      dashboard_id: dashboardId,
      email,
      role: 'editor',
      invited_by: user.id,
    });

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setInviteEmail('');
    setSuccess(`Invite sent to ${email}`);
    loadData();
    setTimeout(() => setSuccess(''), 3000);
  }

  async function revokeInvite(inviteId: string) {
    const supabase = createClient();
    await supabase.from('pending_invites').delete().eq('id', inviteId);
    loadData();
  }

  async function removeCollaborator(userId: string) {
    const supabase = createClient();
    await supabase
      .from('dashboard_collaborators')
      .delete()
      .eq('dashboard_id', dashboardId)
      .eq('user_id', userId);
    loadData();
  }

  if (loading) {
    return <div className="text-center py-12 text-text-muted text-sm">Loading collaborators...</div>;
  }

  return (
    <div className="max-w-2xl">
      {/* Invite form (owner only) */}
      {isOwner && (
        <div className="bg-bg-card border border-border rounded-[14px] shadow-sm overflow-hidden mb-5">
          <div className="px-[22px] py-[18px] border-b border-border">
            <h2 className="font-serif text-[17px]">Invite Collaborator</h2>
            <p className="text-xs text-text-muted mt-0.5">
              They&apos;ll need to sign up with this exact email to get access
            </p>
          </div>
          <div className="p-[22px]">
            <div className="flex flex-col md:flex-row gap-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="collaborator@email.com"
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
            {error && (
              <div className="mt-3 bg-bg-red border border-red/20 text-red text-sm px-4 py-2 rounded-lg">
                {error}
              </div>
            )}
            {success && (
              <div className="mt-3 bg-sage-bg border border-sage/20 text-sage text-sm px-4 py-2 rounded-lg">
                {success}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pending invites */}
      {pendingInvites.length > 0 && (
        <div className="bg-bg-card border border-border rounded-[14px] shadow-sm overflow-hidden mb-5">
          <div className="px-[22px] py-[18px] border-b border-border">
            <h2 className="font-serif text-[17px]">Pending Invites</h2>
            <p className="text-xs text-text-muted mt-0.5">Waiting for these people to sign up</p>
          </div>
          <div className="p-[22px]">
            {pendingInvites.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-bg-warm rounded-full flex items-center justify-center text-xs font-semibold text-text-muted">
                    {invite.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{invite.email}</div>
                    <div className="text-[11px] text-text-muted">Pending</div>
                  </div>
                </div>
                {isOwner && (
                  <button
                    onClick={() => revokeInvite(invite.id)}
                    className="text-xs text-red hover:underline"
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active collaborators */}
      <div className="bg-bg-card border border-border rounded-[14px] shadow-sm overflow-hidden">
        <div className="px-[22px] py-[18px] border-b border-border">
          <h2 className="font-serif text-[17px]">Active Collaborators</h2>
          <p className="text-xs text-text-muted mt-0.5">People who can edit this dashboard</p>
        </div>
        <div className="p-[22px]">
          {collaborators.length === 0 ? (
            <p className="text-text-muted text-sm text-center py-5">No collaborators yet</p>
          ) : (
            collaborators.map((collab) => (
              <div key={collab.user_id} className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-terracotta-bg rounded-full flex items-center justify-center text-xs font-semibold text-terracotta">
                    {collab.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{collab.email}</div>
                  </div>
                </div>
                {isOwner && (
                  <button
                    onClick={() => removeCollaborator(collab.user_id)}
                    className="text-xs text-red hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
