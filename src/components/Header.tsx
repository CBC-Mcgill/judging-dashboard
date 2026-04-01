'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { UserRole } from '@/types';
import { Menu, X, BookOpen, PenLine, Settings } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  dashboardName?: string;
  onExport?: () => void;
  userRole?: UserRole;
}

const STAFF_TABS = [
  { key: 'entry', label: 'Score Entry' },
  { key: 'rankings', label: 'Rankings' },
  { key: 'detail', label: 'Team Detail' },
  { key: 'collaborate', label: 'Collaborators' },
  { key: 'judges', label: 'Judges' },
  { key: 'settings', label: 'Settings' },
];

const JUDGE_TABS = [
  { key: 'onboarding', label: 'How to Judge', icon: BookOpen },
  { key: 'entry', label: 'Score Entry', icon: PenLine },
  { key: 'judge-settings', label: 'Settings', icon: Settings },
];

export default function Header({ activeTab, onTabChange, dashboardName, onExport, userRole }: HeaderProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const tabs = userRole === 'judge' ? JUDGE_TABS : STAFF_TABS;
  const isJudge = userRole === 'judge';

  // Lock body scroll when sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  }

  function handleTabChange(key: string) {
    onTabChange(key);
    setSidebarOpen(false);
  }

  return (
    <>
      <header className="bg-bg-card border-b border-border px-4 md:px-8 sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between h-14 md:h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img src="/icon.svg" alt="Logo" className="w-8 h-8 md:w-9 md:h-9" />
            <span className="font-serif text-base md:text-lg truncate max-w-[140px] md:max-w-none">{dashboardName || 'Hackathon Judging'}</span>
          </div>

          {/* Desktop tabs */}
          <div className="hidden md:flex gap-0.5 bg-bg-warm p-[3px] rounded-[10px]">
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

          {/* Desktop action buttons */}
          <div className="hidden md:flex gap-2">
            {onExport && (
              <button
                onClick={onExport}
                className="border border-border px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-bg-warm transition-colors"
              >
                Export CSV
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

          {/* Mobile hamburger (staff only) */}
          {!isJudge && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 text-text-secondary"
            >
              <Menu size={22} />
            </button>
          )}

          {/* Mobile sign out (judge only — other nav is bottom bar) */}
          {isJudge && (
            <button
              onClick={() => router.push('/dashboard')}
              className="md:hidden border border-border px-3 py-1.5 rounded-lg text-xs font-semibold"
            >
              Back
            </button>
          )}
        </div>
      </header>

      {/* Staff mobile sidebar overlay */}
      <div className={`fixed inset-0 z-[60] md:hidden transition-opacity duration-300 ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        <div className={`absolute top-0 left-0 bottom-0 w-[280px] bg-bg-card border-r border-border shadow-lg flex flex-col transition-transform duration-300 ease-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            {/* Sidebar header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <span className="font-serif text-base truncate">{dashboardName}</span>
              <button onClick={() => setSidebarOpen(false)} className="text-text-muted">
                <X size={20} />
              </button>
            </div>

            {/* Sidebar tabs */}
            <nav className="flex-1 py-2">
              {STAFF_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`w-full text-left px-5 py-3 text-sm font-semibold transition-colors ${
                    activeTab === tab.key
                      ? 'bg-bg-warm text-terracotta'
                      : 'text-text-secondary hover:bg-bg-warm'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* Sidebar footer */}
            <div className="border-t border-border p-4 space-y-2">
              {onExport && (
                <button
                  onClick={() => { onExport(); setSidebarOpen(false); }}
                  className="w-full border border-border py-2 rounded-lg text-xs font-semibold hover:bg-bg-warm transition-colors"
                >
                  Export CSV
                </button>
              )}
              <button
                onClick={() => { router.push('/dashboard'); setSidebarOpen(false); }}
                className="w-full border border-border py-2 rounded-lg text-xs font-semibold hover:bg-bg-warm transition-colors"
              >
                My Dashboards
              </button>
              <button
                onClick={handleSignOut}
                className="w-full border border-border py-2 rounded-lg text-xs font-semibold text-text-secondary hover:bg-bg-red transition-colors"
              >
                Sign Out
              </button>
            </div>
        </div>
      </div>

      {/* Judge mobile bottom tab bar */}
      {isJudge && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-bg-card border-t border-border md:hidden safe-bottom">
          <div className="flex justify-around items-center h-14">
            {JUDGE_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => onTabChange(tab.key)}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1.5 transition-colors ${
                    activeTab === tab.key ? 'text-terracotta' : 'text-text-muted'
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-[10px] font-semibold">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </>
  );
}
