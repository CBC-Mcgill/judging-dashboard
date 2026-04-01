'use client';

import type { Dashboard } from '@/types';
import { getCriteriaMaxes } from '@/lib/scoring';

interface JudgeOnboardingProps {
  dashboard: Dashboard;
  judgeName: string;
}

export default function JudgeOnboarding({ dashboard, judgeName }: JudgeOnboardingProps) {
  const maxes = getCriteriaMaxes(dashboard.criteria);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-bg-card border border-border rounded-[14px] shadow-sm overflow-hidden">
        <div className="px-[22px] py-[18px] border-b border-border">
          <h2 className="font-serif text-xl">Welcome, {judgeName}</h2>
          <p className="text-sm text-text-secondary mt-1">Here&apos;s how to judge for {dashboard.name}</p>
        </div>
        <div className="p-[22px] space-y-6">
          {/* How scoring works */}
          <div>
            <h3 className="font-semibold text-sm mb-2">How Scoring Works</h3>
            <p className="text-sm text-text-secondary">
              For each team, you&apos;ll score them on <strong>{dashboard.criteria.length}</strong> criteria.
              Each criterion has a max score, and all scores sum to a total out of 100.
            </p>
          </div>

          {/* Criteria breakdown */}
          <div>
            <h3 className="font-semibold text-sm mb-2">Scoring Criteria</h3>
            <div className="space-y-1.5">
              {dashboard.criteria.map((c) => (
                <div key={c.name} className="flex items-center justify-between px-3 py-2 bg-bg-warm rounded-lg">
                  <span className="text-sm font-medium">{c.name}</span>
                  <span className="text-xs text-text-muted font-mono">/{maxes.get(c.name) || 0} pts</span>
                </div>
              ))}
            </div>
          </div>

          {/* Subchallenges */}
          {dashboard.awards.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm mb-2">Subchallenges</h3>
              <p className="text-sm text-text-secondary mb-2">
                You can also tag teams for subchallenges. Select any that apply when entering scores.
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {dashboard.awards.map((a) => (
                  <span key={a} className="text-xs bg-terracotta-bg text-terracotta px-2 py-1 rounded-full font-semibold">{a}</span>
                ))}
              </div>
            </div>
          )}

          {/* Steps */}
          <div>
            <h3 className="font-semibold text-sm mb-2">Steps</h3>
            <ol className="text-sm text-text-secondary space-y-1.5 list-decimal list-inside">
              <li>Go to the <strong>Score Entry</strong> tab</li>
              <li>Select the team you&apos;re judging</li>
              <li>Score each criterion up to its max points</li>
              <li>Optionally tag subchallenges</li>
              <li>Click <strong>Save Score</strong></li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
