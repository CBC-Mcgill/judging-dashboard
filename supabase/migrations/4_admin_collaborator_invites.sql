-- ============================================
-- CBC Hackathon — Admin collaborator invites
-- ============================================

create or replace function is_admin_dashboard_collaborator(d_id uuid, u_id uuid)
returns boolean as $$
  select exists(
    select 1
    from dashboard_collaborators
    where dashboard_id = d_id
      and user_id = u_id
      and role = 'admin'
  );
$$ language sql security definer;

drop policy if exists "Dashboard owners and invitees can view pending invites" on pending_invites;
create policy "Owners, admin collaborators, and invitees can view pending invites"
  on pending_invites for select
  using (
    exists(select 1 from dashboards where id = dashboard_id and owner_id = auth.uid())
    or is_admin_dashboard_collaborator(dashboard_id, auth.uid())
    or lower(email) = lower(auth.jwt()->>'email')
  );

drop policy if exists "Dashboard owners can create invites" on pending_invites;
create policy "Owners and admin collaborators can create invites"
  on pending_invites for insert
  with check (
    invited_by = auth.uid()
    and (
      exists(select 1 from dashboards where id = dashboard_id and owner_id = auth.uid())
      or (
        role = 'admin'
        and is_admin_dashboard_collaborator(dashboard_id, auth.uid())
      )
    )
  );

drop policy if exists "Dashboard owners can revoke invites" on pending_invites;
create policy "Owners and admin inviters can revoke invites"
  on pending_invites for delete
  using (
    exists(select 1 from dashboards where id = dashboard_id and owner_id = auth.uid())
    or (
      invited_by = auth.uid()
      and is_admin_dashboard_collaborator(dashboard_id, auth.uid())
    )
  );
