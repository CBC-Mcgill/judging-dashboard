'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  dashboardName?: string;
  onExport?: () => void;
}

export default function Header({ activeTab, onTabChange, dashboardName, onExport }: HeaderProps) {
  const router = useRouter();
  const tabs = [
    { key: 'entry', label: 'Score Entry' },
    { key: 'rankings', label: 'Rankings' },
    { key: 'detail', label: 'Team Detail' },
    { key: 'collaborate', label: 'Collaborators' },
    { key: 'settings', label: 'Settings' },
  ];

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  }

  return (
    <header className="bg-bg-card border-b border-border px-8 sticky top-0 z-50">
      <div className="max-w-[1200px] mx-auto flex items-center justify-between h-16">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-terracotta rounded-[10px] flex items-center justify-center">
            <span className="text-white font-serif text-lg">C</span>
          </div>
          <span className="font-serif text-lg">{dashboardName || 'Hackathon Judging'}</span>
        </div>

        <div className="flex gap-0.5 bg-bg-warm p-[3px] rounded-[10px]">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`text-[13px] font-semibold px-[18px] py-[7px] rounded-lg transition-all ${
                activeTab === tab.key
                  ? 'bg-border-active text-text'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {onExport && (
            <button
              onClick={onExport}
              className="border border-border px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-bg-warm transition-colors"
            >
              Export Teams CSV
            </button>
          )}
          <button
            onClick={() => router.push('/dashboard')}
            className="border border-border px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-bg-warm transition-colors"
          >
            My Dashboards
          </button>
          <button
            onClick={handleSignOut}
            className="border border-border px-3.5 py-1.5 rounded-lg text-xs font-semibold text-text-secondary hover:bg-bg-red transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}
