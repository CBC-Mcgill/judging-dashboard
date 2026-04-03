'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function JoinPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function join() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.replace(`/auth/login?join=${token}`);
        return;
      }

      // Look up dashboard by invite token
      const { data: dashboard } = await supabase
        .from('dashboards')
        .select('id, name, owner_id')
        .eq('invite_token', token)
        .single();

      if (!dashboard) {
        setStatus('error');
        setErrorMsg('This invite link is invalid or has expired.');
        return;
      }

      // If owner, just redirect
      if (dashboard.owner_id === user.id) {
        router.replace(`/dashboard/${dashboard.id}`);
        return;
      }

      // Check if already a judge
      const { data: existingJudge } = await supabase
        .from('dashboard_judges')
        .select('id')
        .eq('dashboard_id', dashboard.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingJudge) {
        router.replace(`/dashboard/${dashboard.id}`);
        return;
      }

      // Check if there's a pending invite for this email
      const { data: pendingInvite } = await supabase
        .from('dashboard_judges')
        .select('id')
        .eq('dashboard_id', dashboard.id)
        .eq('email', user.email)
        .is('user_id', null)
        .maybeSingle();

      if (pendingInvite) {
        // Claim the pending invite
        await supabase
          .from('dashboard_judges')
          .update({
            user_id: user.id,
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Judge',
          })
          .eq('id', pendingInvite.id);
      } else {
        // Create new judge entry
        const { error } = await supabase.from('dashboard_judges').insert({
          dashboard_id: dashboard.id,
          user_id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Judge',
          invited_by: user.id,
        });
        if (error) {
          setStatus('error');
          setErrorMsg('Failed to join dashboard. Please try again.');
          return;
        }
      }

      router.replace(`/dashboard/${dashboard.id}`);
    }

    join();
  }, [token, router]);

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-sm px-6 text-center">
          <img src="/icon.svg" alt="Logo" className="w-12 h-12 mx-auto mb-4" />
          <h1 className="font-serif text-2xl mb-3">Unable to Join</h1>
          <p className="text-sm text-text-muted mb-6">{errorMsg}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-terracotta text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-terracotta/90 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <img src="/icon.svg" alt="Logo" className="w-12 h-12 mx-auto mb-4" />
        <p className="text-sm text-text-muted">Joining dashboard...</p>
      </div>
    </div>
  );
}
