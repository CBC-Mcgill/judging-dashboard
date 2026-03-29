-- ============================================
-- CBC Hackathon Judging Dashboard — Core Schema
-- Tables, indexes, RLS policies, realtime
-- ============================================

-- Dashboards (one per hackathon)
create table dashboards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  owner_id uuid not null references auth.users(id) on delete cascade,
  tracks text[] not null default '{"Track 1","Track 2","Track 3","Track 4"}',
  awards text[] not null default '{"Subchallenge 1","Subchallenge 2","Subchallenge 3"}',
  criteria jsonb not null default '[{"name":"Criteria 1","weight":25},{"name":"Criteria 2","weight":25},{"name":"Criteria 3","weight":25},{"name":"Criteria 4","weight":25}]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Collaborators (invited editors/viewers)
create table dashboard_collaborators (
  id uuid primary key default gen_random_uuid(),
  dashboard_id uuid not null references dashboards(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'editor',
  invited_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique(dashboard_id, user_id)
);

-- Teams
create table teams (
  id uuid primary key default gen_random_uuid(),
  dashboard_id uuid not null references dashboards(id) on delete cascade,
  name text not null,
  track text not null,
  created_at timestamptz not null default now()
);

-- Scores (one per judge per team)
create table scores (
  id uuid primary key default gen_random_uuid(),
  dashboard_id uuid not null references dashboards(id) on delete cascade,
  team_id uuid not null references teams(id) on delete cascade,
  judge_name text not null,
  scored_by uuid references auth.users(id),
  category_scores jsonb not null default '{}'::jsonb,
  selected_awards text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_teams_dashboard on teams(dashboard_id);
create index idx_scores_dashboard on scores(dashboard_id);
create index idx_scores_team on scores(team_id);
create index idx_collabs_dashboard on dashboard_collaborators(dashboard_id);
create index idx_collabs_user on dashboard_collaborators(user_id);

-- Judges
create table dashboard_judges (
  id uuid primary key default gen_random_uuid(),
  dashboard_id uuid not null references dashboards(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  email text not null,
  name text not null,
  invited_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique(dashboard_id, email)
);

create index idx_judges_dashboard on dashboard_judges(dashboard_id);
create index idx_judges_user on dashboard_judges(user_id);
create index idx_judges_email on dashboard_judges(lower(email));

-- ============================================
-- Row Level Security
-- ============================================

alter table dashboards enable row level security;
alter table dashboard_collaborators enable row level security;
alter table teams enable row level security;
alter table dashboard_judges enable row level security;
alter table scores enable row level security;

-- Helper: check if user is owner or collaborator of a dashboard
create or replace function is_dashboard_member(d_id uuid, u_id uuid)
returns boolean as $$
  select exists(
    select 1 from dashboards where id = d_id and owner_id = u_id
    union
    select 1 from dashboard_collaborators where dashboard_id = d_id and user_id = u_id
  );
$$ language sql security definer;

-- Dashboards (members + judges can view)
create policy "Users can view own dashboards"
  on dashboards for select
  using (
    is_dashboard_member(id, auth.uid())
    or exists(select 1 from dashboard_judges dj where dj.dashboard_id = dashboards.id and dj.user_id = auth.uid())
  );

create policy "Users can create dashboards"
  on dashboards for insert
  with check (owner_id = auth.uid());

create policy "Owners can update dashboards"
  on dashboards for update
  using (owner_id = auth.uid());

create policy "Owners can delete dashboards"
  on dashboards for delete
  using (owner_id = auth.uid());

-- Collaborators
create policy "Members can view collaborators"
  on dashboard_collaborators for select
  using (is_dashboard_member(dashboard_id, auth.uid()));

create policy "Owners can manage collaborators"
  on dashboard_collaborators for insert
  with check (exists(
    select 1 from dashboards where id = dashboard_id and owner_id = auth.uid()
  ));

create policy "Owners or self can remove collaborators"
  on dashboard_collaborators for delete
  using (
    user_id = auth.uid()
    or exists(select 1 from dashboards where id = dashboard_id and owner_id = auth.uid())
  );

-- Teams
create policy "Members can view teams"
  on teams for select
  using (is_dashboard_member(dashboard_id, auth.uid()));

create policy "Members can create teams"
  on teams for insert
  with check (is_dashboard_member(dashboard_id, auth.uid()));

create policy "Members can update teams"
  on teams for update
  using (is_dashboard_member(dashboard_id, auth.uid()));

create policy "Members can delete teams"
  on teams for delete
  using (is_dashboard_member(dashboard_id, auth.uid()));

-- Scores
create policy "Members can view scores"
  on scores for select
  using (is_dashboard_member(dashboard_id, auth.uid()));

create policy "Members can create scores"
  on scores for insert
  with check (is_dashboard_member(dashboard_id, auth.uid()));

create policy "Members can update scores"
  on scores for update
  using (is_dashboard_member(dashboard_id, auth.uid()));

create policy "Members can delete scores"
  on scores for delete
  using (is_dashboard_member(dashboard_id, auth.uid()));

-- Judges RLS
create policy "Members and judges can view judges"
  on dashboard_judges for select
  using (
    is_dashboard_member(dashboard_id, auth.uid())
    or user_id = auth.uid()
    or lower(email) = lower(auth.jwt()->>'email')
  );

create policy "Staff can create judges"
  on dashboard_judges for insert
  with check (is_dashboard_member(dashboard_id, auth.uid()));

create policy "Staff or self can update judges"
  on dashboard_judges for update
  using (
    is_dashboard_member(dashboard_id, auth.uid())
    or user_id = auth.uid()
  );

create policy "Staff or self can delete judges"
  on dashboard_judges for delete
  using (
    is_dashboard_member(dashboard_id, auth.uid())
    or user_id = auth.uid()
  );

-- Judge access to teams and scores
create policy "Judges can view teams"
  on teams for select
  using (exists(select 1 from dashboard_judges where dashboard_id = teams.dashboard_id and user_id = auth.uid()));

create policy "Judges can create scores"
  on scores for insert
  with check (exists(select 1 from dashboard_judges where dashboard_id = scores.dashboard_id and user_id = auth.uid()));

create policy "Judges can view scores"
  on scores for select
  using (exists(select 1 from dashboard_judges where dashboard_id = scores.dashboard_id and user_id = auth.uid()));

create policy "Judges can update scores"
  on scores for update
  using (exists(select 1 from dashboard_judges where dashboard_id = scores.dashboard_id and user_id = auth.uid()));

-- ============================================
-- Enable Realtime
-- ============================================

alter publication supabase_realtime add table teams;
alter publication supabase_realtime add table scores;
alter publication supabase_realtime add table dashboard_judges;
