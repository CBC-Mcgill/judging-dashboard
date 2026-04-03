-- ============================================
-- CBC Hackathon — Read-only admin collaborator role
-- ============================================

-- Normalize any legacy collaborator/invite roles before constraining them.
update dashboard_collaborators
set role = 'editor'
where role is null or role not in ('editor', 'admin');

update pending_invites
set role = 'editor'
where role is null or role not in ('editor', 'admin');

alter table dashboard_collaborators
  alter column role set default 'editor';

alter table pending_invites
  alter column role set default 'editor';

alter table dashboard_collaborators
  drop constraint if exists dashboard_collaborators_role_check;

alter table pending_invites
  drop constraint if exists pending_invites_role_check;

alter table dashboard_collaborators
  add constraint dashboard_collaborators_role_check
  check (role in ('editor', 'admin'));

alter table pending_invites
  add constraint pending_invites_role_check
  check (role in ('editor', 'admin'));

-- Editors can manage a dashboard. Admins are read-only observers.
create or replace function can_manage_dashboard(d_id uuid, u_id uuid)
returns boolean as $$
  select
    exists(select 1 from dashboards where id = d_id and owner_id = u_id)
    or exists(
      select 1
      from dashboard_collaborators
      where dashboard_id = d_id
        and user_id = u_id
        and role = 'editor'
    );
$$ language sql security definer;

drop policy if exists "Members can create teams" on teams;
create policy "Editors can create teams"
  on teams for insert
  with check (can_manage_dashboard(dashboard_id, auth.uid()));

drop policy if exists "Members can update teams" on teams;
create policy "Editors can update teams"
  on teams for update
  using (can_manage_dashboard(dashboard_id, auth.uid()))
  with check (can_manage_dashboard(dashboard_id, auth.uid()));

drop policy if exists "Members can delete teams" on teams;
create policy "Editors can delete teams"
  on teams for delete
  using (can_manage_dashboard(dashboard_id, auth.uid()));

drop policy if exists "Members can create scores" on scores;
create policy "Editors can create scores"
  on scores for insert
  with check (can_manage_dashboard(dashboard_id, auth.uid()));

drop policy if exists "Members can update scores" on scores;
create policy "Editors can update scores"
  on scores for update
  using (can_manage_dashboard(dashboard_id, auth.uid()))
  with check (can_manage_dashboard(dashboard_id, auth.uid()));

drop policy if exists "Members can delete scores" on scores;
create policy "Editors can delete scores"
  on scores for delete
  using (can_manage_dashboard(dashboard_id, auth.uid()));

drop policy if exists "Staff can create judges" on dashboard_judges;
create policy "Editors can create judges"
  on dashboard_judges for insert
  with check (
    can_manage_dashboard(dashboard_id, auth.uid())
    or exists(select 1 from dashboards where id = dashboard_id and invite_token is not null)
  );

drop policy if exists "Staff or self can update judges" on dashboard_judges;
create policy "Editors or self can update judges"
  on dashboard_judges for update
  using (
    can_manage_dashboard(dashboard_id, auth.uid())
    or user_id = auth.uid()
  )
  with check (
    can_manage_dashboard(dashboard_id, auth.uid())
    or user_id = auth.uid()
  );

drop policy if exists "Staff or self can delete judges" on dashboard_judges;
create policy "Editors or self can delete judges"
  on dashboard_judges for delete
  using (
    can_manage_dashboard(dashboard_id, auth.uid())
    or user_id = auth.uid()
  );
