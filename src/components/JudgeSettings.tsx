'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { DashboardJudge } from '@/types';
import ConfirmModal from './ConfirmModal';

interface JudgeSettingsProps {
  judge: DashboardJudge;
}

export default function JudgeSettings({ judge }: JudgeSettingsProps) {
  const router = useRouter();
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  async function leaveDashboard() {
    const supabase = createClient();
    await supabase.from('dashboard_judges').delete().eq('id', judge.id);
    setShowLeaveConfirm(false);
    router.push('/dashboard');
  }

  return (
    <div className="max-w-lg">
      <div className="bg-bg-card border border-border rounded-[14px] shadow-sm overflow-hidden mb-5">
        <div className="px-[22px] py-[18px] border-b border-border">
          <h2 className="font-serif text-[17px]">Your Judge Profile</h2>
        </div>
        <div className="p-[22px]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-terracotta-bg rounded-full flex items-center justify-center text-sm font-semibold text-terracotta">
              {judge.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-semibold">{judge.name}</div>
              <div className="text-xs text-text-muted">{judge.email}</div>
            </div>
          </div>
          <p className="text-xs text-text-muted mt-4">Your display name comes from your account profile.</p>
        </div>
      </div>

      <div className="bg-bg-card border border-red/20 rounded-[14px] shadow-sm overflow-hidden">
        <div className="p-[22px] flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Leave Dashboard</div>
            <p className="text-xs text-text-muted mt-0.5">You will lose access and your scores will remain</p>
          </div>
          <button
            onClick={() => setShowLeaveConfirm(true)}
            className="border border-red/30 text-red text-xs font-semibold px-4 py-2 rounded-lg hover:bg-bg-red transition-colors"
          >
            Leave
          </button>
        </div>
      </div>

      <ConfirmModal
        open={showLeaveConfirm}
        title="Leave Dashboard"
        message="Leave this dashboard? You will lose access but your scores will remain."
        confirmLabel="Leave"
        onConfirm={leaveDashboard}
        onCancel={() => setShowLeaveConfirm(false)}
      />
    </div>
  );
}
