-- ============================================
-- CBC Hackathon — Invite System
-- Pending invites, accept/decline RPCs, RLS
-- ============================================

-- Pending invites table (stores invites by email before user exists)
create table pending_invites (
  id uuid primary key default gen_random_uuid(),
  dashboard_id uuid not null references dashboards(id) on delete cascade,
  email text not null,
  role text not null default 'editor',
  invited_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique(dashboard_id, email)
);

create index idx_pending_invites_email on pending_invites(lower(email));
create index idx_pending_invites_dashboard on pending_invites(dashboard_id);

-- ============================================
-- RPC: Accept an invite (invitee calls this)
-- ============================================

create or replace function accept_invite(invite_id uuid)
returns void as $$
declare
  inv record;
  my_email text;
begin
  my_email := lower(auth.jwt()->>'email');

  select * into inv from pending_invites where id = invite_id;
  if inv is null then
    raise exception 'Invite not found';
  end if;

  if lower(inv.email) != my_email then
    raise exception 'This invite is not for you';
  end if;

  insert into dashboard_collaborators (dashboard_id, user_id, role, invited_by)
  values (inv.dashboard_id, auth.uid(), inv.role, inv.invited_by)
  on conflict (dashboard_id, user_id) do nothing;

  delete from pending_invites where id = invite_id;
end;
$$ language plpgsql security definer;

-- ============================================
-- RPC: Decline an invite (invitee calls this)
-- ============================================

create or replace function decline_invite(invite_id uuid)
returns void as $$
declare
  inv record;
  my_email text;
begin
  my_email := lower(auth.jwt()->>'email');

  select * into inv from pending_invites where id = invite_id;
  if inv is null then
    raise exception 'Invite not found';
  end if;

  if lower(inv.email) != my_email then
    raise exception 'This invite is not for you';
  end if;

  delete from pending_invites where id = invite_id;
end;
$$ language plpgsql security definer;

-- ============================================
-- RPC: Get pending invites for current user with dashboard names
-- ============================================

create or replace function get_my_invites()
returns table(id uuid, dashboard_id uuid, dashboard_name text, email text, role text, invited_by uuid, created_at timestamptz) as $$
  select p.id, p.dashboard_id, d.name as dashboard_name, p.email, p.role, p.invited_by, p.created_at
  from pending_invites p
  join dashboards d on d.id = p.dashboard_id
  where lower(p.email) = lower(auth.jwt()->>'email');
$$ language sql security definer;

-- ============================================
-- RPC: get collaborator emails (SECURITY DEFINER to read auth.users)
-- ============================================

create or replace function get_collaborator_emails(d_id uuid)
returns table(user_id uuid, email text, role text) as $$
  select dc.user_id, u.email, dc.role
  from dashboard_collaborators dc
  join auth.users u on u.id = dc.user_id
  where dc.dashboard_id = d_id
    and is_dashboard_member(d_id, auth.uid());
$$ language sql security definer;

-- ============================================
-- RPC: get dashboard owner email
-- ============================================

create or replace function get_dashboard_owner_email(d_id uuid)
returns text as $$
  select u.email
  from dashboards d
  join auth.users u on u.id = d.owner_id
  where d.id = d_id
    and is_dashboard_member(d_id, auth.uid());
$$ language sql security definer;

-- ============================================
-- Judge invite RPCs
-- ============================================

create or replace function accept_judge_invite(judge_id uuid)
returns void as $$
declare
  j record;
  my_email text;
begin
  my_email := lower(auth.jwt()->>'email');
  select * into j from dashboard_judges where id = judge_id;
  if j is null then raise exception 'Invite not found'; end if;
  if lower(j.email) != my_email then raise exception 'This invite is not for you'; end if;
  update dashboard_judges set
    user_id = auth.uid(),
    name = coalesce((select raw_user_meta_data->>'full_name' from auth.users where id = auth.uid()), j.name)
  where id = judge_id;
end;
$$ language plpgsql security definer;

create or replace function decline_judge_invite(judge_id uuid)
returns void as $$
declare
  j record;
  my_email text;
begin
  my_email := lower(auth.jwt()->>'email');
  select * into j from dashboard_judges where id = judge_id;
  if j is null then raise exception 'Invite not found'; end if;
  if lower(j.email) != my_email then raise exception 'This invite is not for you'; end if;
  delete from dashboard_judges where id = judge_id;
end;
$$ language plpgsql security definer;

create or replace function get_my_judge_invites()
returns table(id uuid, dashboard_id uuid, dashboard_name text, email text, name text, created_at timestamptz) as $$
  select j.id, j.dashboard_id, d.name as dashboard_name, j.email, j.name, j.created_at
  from dashboard_judges j
  join dashboards d on d.id = j.dashboard_id
  where lower(j.email) = lower(auth.jwt()->>'email')
    and j.user_id is null;
$$ language sql security definer;

-- ============================================
-- RLS for pending_invites
-- ============================================

alter table pending_invites enable row level security;

create policy "Dashboard owners and invitees can view pending invites"
  on pending_invites for select
  using (
    exists(select 1 from dashboards where id = dashboard_id and owner_id = auth.uid())
    or lower(email) = lower(auth.jwt()->>'email')
  );

create policy "Dashboard owners can create invites"
  on pending_invites for insert
  with check (
    exists(select 1 from dashboards where id = dashboard_id and owner_id = auth.uid())
    and invited_by = auth.uid()
  );

create policy "Dashboard owners can revoke invites"
  on pending_invites for delete
  using (
    exists(select 1 from dashboards where id = dashboard_id and owner_id = auth.uid())
  );
