import type { Criterion, Score, Team, TeamWithAvg } from '@/types';

export const DEFAULT_TRACKS = [
  'Track 1',
  'Track 2',
  'Track 3',
  'Track 4',
];

export const DEFAULT_AWARDS = [
  'Subchallenge 1',
  'Subchallenge 2',
  'Subchallenge 3',
];

export const DEFAULT_CRITERIA: Criterion[] = [
  { name: 'Criteria 1', weight: 25 },
  { name: 'Criteria 2', weight: 25 },
  { name: 'Criteria 3', weight: 25 },
  { name: 'Criteria 4', weight: 25 },
];

export function normalizeCriteria(criteria: Criterion[]): (Criterion & { normalizedWeight: number })[] {
  const totalWeight = criteria.reduce((s, c) => s + c.weight, 0);
  if (totalWeight === 0) return criteria.map((c) => ({ ...c, normalizedWeight: 0 }));
  return criteria.map((c) => ({
    ...c,
    normalizedWeight: (c.weight / totalWeight) * 100,
  }));
}

/**
 * Returns integer max scores per criterion that sum to exactly 100.
 * Uses largest remainder method to avoid rounding errors.
 */
export function getCriteriaMaxes(criteria: Criterion[]): Map<string, number> {
  const normalized = normalizeCriteria(criteria);
  const floors = normalized.map((c) => Math.floor(c.normalizedWeight));
  let remainder = 100 - floors.reduce((s, f) => s + f, 0);
  const fractionals = normalized.map((c, i) => ({ i, frac: c.normalizedWeight - floors[i] }));
  fractionals.sort((a, b) => b.frac - a.frac);
  for (let j = 0; j < remainder; j++) {
    floors[fractionals[j].i]++;
  }
  const maxes = new Map<string, number>();
  normalized.forEach((c, i) => maxes.set(c.name, floors[i]));
  return maxes;
}

/**
 * Total is simply the sum of all raw scores (since maxes sum to 100).
 */
export function computeTotal(categoryScores: Record<string, number>, criteria: Criterion[]): number {
  const maxes = getCriteriaMaxes(criteria);
  let total = 0;
  for (const c of criteria) {
    const score = categoryScores[c.name] ?? 0;
    const max = maxes.get(c.name) || 0;
    total += Math.min(score, max); // cap at max
  }
  return total;
}

export function computeTeamAvg(scores: Score[], criteria: Criterion[]) {
  if (scores.length === 0) {
    return { categories: {} as Record<string, number>, total: 0, count: 0 };
  }
  const count = scores.length;
  const categories: Record<string, number> = {};

  for (const c of criteria) {
    const sum = scores.reduce((s, sc) => s + (sc.category_scores?.[c.name] ?? 0), 0);
    categories[c.name] = sum / count;
  }

  const total = computeTotal(categories, criteria);

  return { categories, total, count };
}

export function computeTeamActiveAwards(scores: Score[]): string[] {
  const allAwards = new Set<string>();
  scores.forEach((s) => {
    s.selected_awards?.forEach((a) => allAwards.add(a));
  });
  return Array.from(allAwards);
}

export function buildRankedTeams(teams: Team[], scores: Score[], criteria: Criterion[]): TeamWithAvg[] {
  return teams
    .map((team) => {
      const teamScores = scores.filter((s) => s.team_id === team.id);
      return {
        ...team,
        avg: computeTeamAvg(teamScores, criteria),
        activeAwards: computeTeamActiveAwards(teamScores),
        scores: teamScores,
      };
    })
    .sort((a, b) => b.avg.total - a.avg.total);
}
