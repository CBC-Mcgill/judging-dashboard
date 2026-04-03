export interface Criterion {
  name: string;
  weight: number;
}

export interface Dashboard {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  tracks: string[];
  awards: string[];
  criteria: Criterion[];
  invite_token: string | null;
  created_at: string;
  updated_at: string;
}

export type CollaboratorRole = 'editor' | 'admin';

export interface DashboardCollaborator {
  id: string;
  dashboard_id: string;
  user_id: string;
  role: CollaboratorRole;
  invited_by: string;
  created_at: string;
}

export interface Team {
  id: string;
  dashboard_id: string;
  name: string;
  track: string;
  created_at: string;
}

export interface Score {
  id: string;
  dashboard_id: string;
  team_id: string;
  judge_name: string;
  scored_by: string | null;
  category_scores: Record<string, number>;
  selected_awards: string[];
  created_at: string;
}

export interface PendingInvite {
  id: string;
  dashboard_id: string;
  email: string;
  role: CollaboratorRole;
  invited_by: string;
  created_at: string;
}

export interface CollaboratorWithEmail {
  user_id: string;
  email: string;
  role: CollaboratorRole;
}

export interface DashboardJudge {
  id: string;
  dashboard_id: string;
  user_id: string | null;
  email: string;
  name: string;
  invited_by: string;
  created_at: string;
}

export interface JudgeInvite {
  id: string;
  dashboard_id: string;
  dashboard_name: string;
  email: string;
  name: string;
  created_at: string;
}

export type UserRole = 'owner' | 'collaborator' | 'judge' | null;

export interface TeamWithAvg extends Team {
  avg: {
    categories: Record<string, number>;
    total: number;
    count: number;
  };
  activeSubchallenges: string[];
  scores: Score[];
}

export interface ScoreWithZScore extends Score {
  judgeKey: string;
  rawTotal: number;
  zScore: number;
}

export interface JudgeScoreStats {
  judgeKey: string;
  judgeName: string;
  scoreCount: number;
  mean: number;
  standardDeviation: number;
  min: number;
  max: number;
}

export interface TeamWithZScore extends Team {
  normalized: {
    average: number | null;
    count: number;
  };
  raw: {
    average: number | null;
    count: number;
  };
  activeSubchallenges: string[];
  scores: ScoreWithZScore[];
}
