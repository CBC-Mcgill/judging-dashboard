export interface User {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
}

export interface Dashboard {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  tracks: string[];
  awards: string[];
  created_at: string;
  updated_at: string;
}

export interface DashboardCollaborator {
  id: string;
  dashboard_id: string;
  user_id: string;
  role: string;
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
  scored_by: string; // user id of person entering scores
  impact: number;
  technical: number;
  ethics: number;
  presentation: number;
  selected_awards: string[];
  created_at: string;
}

export interface PendingInvite {
  id: string;
  dashboard_id: string;
  email: string;
  role: string;
  invited_by: string;
  created_at: string;
}

export interface CollaboratorWithEmail {
  user_id: string;
  email: string;
  role: string;
}

export interface TeamWithAvg extends Team {
  avg: {
    impact: number;
    technical: number;
    ethics: number;
    presentation: number;
    total: number;
    count: number;
  };
  activeAwards: string[];
  scores: Score[];
}
