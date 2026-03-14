import type { Score, Team, TeamWithAvg } from '@/types';

export const CATEGORIES = [
  { key: 'impact' as const, label: 'Impact Potential', max: 25 },
  { key: 'technical' as const, label: 'Technical Execution', max: 30 },
  { key: 'ethics' as const, label: 'Ethical Alignment', max: 25 },
  { key: 'presentation' as const, label: 'Presentation', max: 20 },
] as const;

export const DEFAULT_TRACKS = [
  'Healthcare',
  'Education',
  'Finance',
  'Sustainability',
  'Open Innovation',
];

export const DEFAULT_AWARDS = [
  'Loving Grace',
  "People's Choice",
  'Finals Nomination',
];

export function computeTeamAvg(scores: Score[]) {
  if (scores.length === 0) {
    return { impact: 0, technical: 0, ethics: 0, presentation: 0, total: 0, count: 0 };
  }
  const count = scores.length;
  const avg = {
    impact: scores.reduce((s, sc) => s + sc.impact, 0) / count,
    technical: scores.reduce((s, sc) => s + sc.technical, 0) / count,
    ethics: scores.reduce((s, sc) => s + sc.ethics, 0) / count,
    presentation: scores.reduce((s, sc) => s + sc.presentation, 0) / count,
    total: 0,
    count,
  };
  avg.total = avg.impact + avg.technical + avg.ethics + avg.presentation;
  return avg;
}

export function computeTeamActiveAwards(scores: Score[]): string[] {
  const allAwards = new Set<string>();
  scores.forEach((s) => {
    s.selected_awards?.forEach((a) => allAwards.add(a));
  });
  return Array.from(allAwards);
}

export function buildRankedTeams(teams: Team[], scores: Score[]): TeamWithAvg[] {
  return teams
    .map((team) => {
      const teamScores = scores.filter((s) => s.team_id === team.id);
      return {
        ...team,
        avg: computeTeamAvg(teamScores),
        activeAwards: computeTeamActiveAwards(teamScores),
        scores: teamScores,
      };
    })
    .sort((a, b) => b.avg.total - a.avg.total);
}

export function validateScore(field: string, value: number): string | null {
  const cat = CATEGORIES.find((c) => c.key === field);
  if (!cat) return 'Unknown category';
  if (value < 0) return `${cat.label} cannot be negative`;
  if (value > cat.max) return `${cat.label} max is ${cat.max}`;
  return null;
}
