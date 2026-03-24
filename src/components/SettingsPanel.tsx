'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Dashboard } from '@/types';
import TrackEditor from './TrackEditor';
import ConfirmModal from './ConfirmModal';

interface SettingsPanelProps {
  dashboard: Dashboard;
  isOwner: boolean;
  onUpdate: () => void;
}

export default function SettingsPanel({ dashboard, isOwner, onUpdate }: SettingsPanelProps) {
  const router = useRouter();
  const [tracks, setTracks] = useState<string[]>(dashboard.tracks);
  const [awards, setAwards] = useState<string[]>(dashboard.awards);
  const [savingField, setSavingField] = useState<'tracks' | 'awards' | null>(null);
  const [successField, setSuccessField] = useState<'tracks' | 'awards' | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  async function deleteDashboard() {
    const supabase = createClient();
    const { error } = await supabase.from('dashboards').delete().eq('id', dashboard.id);
    setShowDeleteConfirm(false);
    if (error) { alert(error.message); return; }
    router.push('/dashboard');
  }

  async function saveField(field: 'tracks' | 'awards', value: string[]) {
    if (field === 'tracks') setTracks(value);
    else setAwards(value);

    setSavingField(field);
    setSuccessField(null);
    const supabase = createClient();
    const { error } = await supabase
      .from('dashboards')
      .update({ [field]: value, updated_at: new Date().toISOString() })
      .eq('id', dashboard.id);

    setSavingField(null);
    if (error) {
      alert(error.message);
      if (field === 'tracks') setTracks(dashboard.tracks);
      else setAwards(dashboard.awards);
    } else {
      setSuccessField(field);
      onUpdate();
      setTimeout(() => setSuccessField(null), 2000);
    }
  }

  if (!isOwner) {
    return (
      <div>
      <p className="text-sm text-text-muted mb-5">Only the dashboard owner can edit settings.</p>
      <div className="grid grid-cols-2 gap-5">
        <div className="bg-bg-card border border-border rounded-[14px] shadow-sm overflow-hidden">
          <div className="px-[22px] py-[18px] border-b border-border">
            <h2 className="font-serif text-[17px]">Tracks</h2>
          </div>
          <div className="p-[22px]">
            <div className="space-y-1.5">
              {tracks.map((track, i) => (
                <div key={i} className="px-3 py-1.5 bg-bg-warm rounded-lg text-sm">{track}</div>
              ))}
            </div>
          </div>
        </div>
        <div className="bg-bg-card border border-border rounded-[14px] shadow-sm overflow-hidden">
          <div className="px-[22px] py-[18px] border-b border-border">
            <h2 className="font-serif text-[17px]">Awards</h2>
          </div>
          <div className="p-[22px]">
            <div className="space-y-1.5">
              {awards.map((award, i) => (
                <div key={i} className="px-3 py-1.5 bg-bg-warm rounded-lg text-sm">{award}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
      </div>
    );
  }

  function statusFor(field: 'tracks' | 'awards') {
    if (savingField === field) return <span className="text-[10px] text-text-muted">Saving...</span>;
    if (successField === field) return <span className="text-[10px] text-sage font-semibold">Saved</span>;
    return null;
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-5">
        <div className="bg-bg-card border border-border rounded-[14px] shadow-sm overflow-hidden">
          <div className="px-[22px] py-[18px] border-b border-border flex items-center justify-between">
            <div>
              <h2 className="font-serif text-[17px]">Tracks</h2>
              <p className="text-xs text-text-muted mt-0.5">Add, edit, or remove tracks</p>
            </div>
            {statusFor('tracks')}
          </div>
          <div className="p-[22px]">
            <TrackEditor
              tracks={tracks}
              onChange={(v) => saveField('tracks', v)}
              placeholder="Add a track..."
              addLabel="Add"
              emptyText="No tracks added yet."
            />
          </div>
        </div>
        <div className="bg-bg-card border border-border rounded-[14px] shadow-sm overflow-hidden">
          <div className="px-[22px] py-[18px] border-b border-border flex items-center justify-between">
            <div>
              <h2 className="font-serif text-[17px]">Awards</h2>
              <p className="text-xs text-text-muted mt-0.5">Add, edit, or remove awards</p>
            </div>
            {statusFor('awards')}
          </div>
          <div className="p-[22px]">
            <TrackEditor
              tracks={awards}
              onChange={(v) => saveField('awards', v)}
              placeholder="Add an award..."
              addLabel="Add"
              emptyText="No awards added yet."
            />
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="mt-8 bg-bg-card border border-red/20 rounded-[14px] shadow-sm overflow-hidden">
        <div className="px-[22px] py-[18px] border-b border-red/10">
          <h2 className="font-serif text-[17px] text-red">Danger Zone</h2>
        </div>
        <div className="p-[22px] flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Delete Dashboard</div>
            <p className="text-xs text-text-muted mt-0.5">Permanently delete this dashboard and all its data</p>
          </div>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="border border-red/30 text-red text-xs font-semibold px-4 py-2 rounded-lg hover:bg-bg-red transition-colors"
          >
            Delete Dashboard
          </button>
        </div>
      </div>
      <ConfirmModal
        open={showDeleteConfirm}
        title="Delete Dashboard"
        message={`Permanently delete "${dashboard.name}"? All teams, scores, and collaborators will be lost. This cannot be undone.`}
        confirmLabel="Delete Dashboard"
        onConfirm={deleteDashboard}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
