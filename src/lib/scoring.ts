import type { Criterion, JudgeScoreStats, Score, ScoreWithZScore, Team, TeamWithAvg, TeamWithZScore } from '@/types';

export const DEFAULT_TRACKS = [
  'Track 1',
  'Track 2',
  'Track 3',
  'Track 4',
];

export const DEFAULT_SUBCHALLENGES = [
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
  const remainder = 100 - floors.reduce((s, f) => s + f, 0);
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

export function computeTeamActiveSubchallenges(scores: Score[]): string[] {
  const allSubchallenges = new Set<string>();
  scores.forEach((s) => {
    s.selected_awards?.forEach((a) => allSubchallenges.add(a));
  });
  return Array.from(allSubchallenges);
}

export function buildRankedTeams(teams: Team[], scores: Score[], criteria: Criterion[]): TeamWithAvg[] {
  return teams
    .map((team) => {
      const teamScores = scores.filter((s) => s.team_id === team.id);
      return {
        ...team,
        avg: computeTeamAvg(teamScores, criteria),
        activeSubchallenges: computeTeamActiveSubchallenges(teamScores),
        scores: teamScores,
      };
    })
    .sort((a, b) => b.avg.total - a.avg.total);
}

function getJudgeKey(score: Score): string {
  return score.scored_by || `judge:${score.judge_name.trim().toLowerCase()}`;
}

function computeMean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function computeStandardDeviation(values: number[], mean: number): number {
  if (values.length === 0) return 0;
  const variance = values.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / values.length;
  return Math.sqrt(variance);
}

export function computeJudgeScoreStats(scores: Score[], criteria: Criterion[]): JudgeScoreStats[] {
  const scoresByJudge = new Map<string, { judgeName: string; totals: number[] }>();

  for (const score of scores) {
    const judgeKey = getJudgeKey(score);
    const rawTotal = computeTotal(score.category_scores || {}, criteria);
    const existing = scoresByJudge.get(judgeKey);

    if (existing) {
      existing.totals.push(rawTotal);
      continue;
    }

    scoresByJudge.set(judgeKey, {
      judgeName: score.judge_name,
      totals: [rawTotal],
    });
  }

  return Array.from(scoresByJudge.entries())
    .map(([judgeKey, { judgeName, totals }]) => {
      const mean = computeMean(totals);
      const standardDeviation = computeStandardDeviation(totals, mean);

      return {
        judgeKey,
        judgeName,
        scoreCount: totals.length,
        mean,
        standardDeviation,
        min: Math.min(...totals),
        max: Math.max(...totals),
      };
    })
    .sort((a, b) => a.judgeName.localeCompare(b.judgeName));
}

export function buildZScoreRankedTeams(
  teams: Team[],
  scores: Score[],
  criteria: Criterion[],
): { rankedTeams: TeamWithZScore[]; judgeStats: JudgeScoreStats[] } {
  const judgeStats = computeJudgeScoreStats(scores, criteria);
  const judgeStatsByKey = new Map(judgeStats.map((stat) => [stat.judgeKey, stat]));

  const normalizedScores: ScoreWithZScore[] = scores.map((score) => {
    const judgeKey = getJudgeKey(score);
    const rawTotal = computeTotal(score.category_scores || {}, criteria);
    const stat = judgeStatsByKey.get(judgeKey);
    const zScore = !stat || stat.standardDeviation === 0
      ? 0
      : (rawTotal - stat.mean) / stat.standardDeviation;

    return {
      ...score,
      judgeKey,
      rawTotal,
      zScore,
    };
  });

  const rankedTeams = teams
    .map((team) => {
      const teamScores = normalizedScores.filter((score) => score.team_id === team.id);
      const scoreCount = teamScores.length;
      const rawAverage = scoreCount > 0
        ? teamScores.reduce((sum, score) => sum + score.rawTotal, 0) / scoreCount
        : null;
      const normalizedAverage = scoreCount > 0
        ? teamScores.reduce((sum, score) => sum + score.zScore, 0) / scoreCount
        : null;

      return {
        ...team,
        normalized: {
          average: normalizedAverage,
          count: scoreCount,
        },
        raw: {
          average: rawAverage,
          count: scoreCount,
        },
        activeSubchallenges: computeTeamActiveSubchallenges(teamScores),
        scores: teamScores,
      };
    })
    .sort((a, b) => {
      const aAverage = a.normalized.average ?? Number.NEGATIVE_INFINITY;
      const bAverage = b.normalized.average ?? Number.NEGATIVE_INFINITY;

      if (bAverage !== aAverage) {
        return bAverage - aAverage;
      }

      const aRaw = a.raw.average ?? Number.NEGATIVE_INFINITY;
      const bRaw = b.raw.average ?? Number.NEGATIVE_INFINITY;
      if (bRaw !== aRaw) {
        return bRaw - aRaw;
      }

      return a.name.localeCompare(b.name);
    });

  return { rankedTeams, judgeStats };
}
