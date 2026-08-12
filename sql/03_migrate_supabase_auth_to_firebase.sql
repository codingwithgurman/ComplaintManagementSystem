-- =========================================================
-- Existing CampusDesk database migration: Supabase Auth -> Firebase Auth
-- Run ONCE in Supabase SQL Editor if 01_schema.sql was installed previously.
-- Safe to re-run after a completed migration.
-- =========================================================

begin;

-- Policies depend on the UUID columns, so remove them before changing types.
drop policy if exists "profiles: view own or admin" on profiles;
drop policy if exists "profiles: insert own" on profiles;
drop policy if exists "profiles: update own" on profiles;
drop policy if exists "departments: read by any signed-in user" on departments;
drop policy if exists "departments: admin manages" on departments;
drop policy if exists "complaints: student views own or admin views all" on complaints;
drop policy if exists "complaints: student inserts own" on complaints;
drop policy if exists "complaints: admin updates any" on complaints;
drop policy if exists "complaints: admin deletes any" on complaints;
drop policy if exists "notifications: user views own" on notifications;
drop policy if exists "notifications: user updates own (mark read)" on notifications;
drop policy if exists "notifications: any signed-in user can insert" on notifications;
drop policy if exists "complaint images: authenticated upload" on storage.objects;

drop function if exists public.is_admin();
drop function if exists public.request_user_id();

alter table complaints drop constraint if exists complaints_student_id_fkey;
alter table notifications drop constraint if exists notifications_user_id_fkey;
alter table profiles drop constraint if exists profiles_id_fkey;

-- Firebase UIDs are arbitrary strings, while Supabase Auth IDs were UUIDs.
alter table profiles alter column id type text using id::text;
alter table complaints alter column student_id type text using student_id::text;
alter table notifications alter column user_id type text using user_id::text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'complaints_student_id_fkey'
  ) then
    alter table complaints
      add constraint complaints_student_id_fkey
      foreign key (student_id) references profiles(id)
      on update cascade on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'notifications_user_id_fkey'
  ) then
    alter table notifications
      add constraint notifications_user_id_fkey
      foreign key (user_id) references profiles(id)
      on update cascade on delete cascade;
  end if;
end;
$$;

-- Firebase puts its UID in the JWT `sub` claim. auth.uid() cannot be used
-- because Supabase's helper casts `sub` to UUID.
create or replace function public.request_user_id()
returns text
language sql
stable
as $$
  select nullif(auth.jwt()->>'sub', '');
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles
    where id = public.request_user_id() and role = 'admin'
  );
$$;

create policy "profiles: view own or admin"
  on profiles for select to authenticated
  using (public.request_user_id() = id or public.is_admin());

create policy "profiles: insert own"
  on profiles for insert to authenticated
  with check (public.request_user_id() = id and role = 'student');

create policy "profiles: update own"
  on profiles for update to authenticated
  using (public.request_user_id() = id)
  with check (
    public.request_user_id() = id
    and (role = 'student' or public.is_admin())
  );

create policy "departments: read by any signed-in user"
  on departments for select to authenticated
  using (true);

create policy "departments: admin manages"
  on departments for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "complaints: student views own or admin views all"
  on complaints for select to authenticated
  using (student_id = public.request_user_id() or public.is_admin());

create policy "complaints: student inserts own"
  on complaints for insert to authenticated
  with check (student_id = public.request_user_id());

create policy "complaints: admin updates any"
  on complaints for update to authenticated
  using (public.is_admin());

create policy "complaints: admin deletes any"
  on complaints for delete to authenticated
  using (public.is_admin());

create policy "notifications: user views own"
  on notifications for select to authenticated
  using (user_id = public.request_user_id());

create policy "notifications: user updates own (mark read)"
  on notifications for update to authenticated
  using (user_id = public.request_user_id());

create policy "notifications: any signed-in user can insert"
  on notifications for insert to authenticated
  with check (user_id = public.request_user_id() or public.is_admin());

drop policy if exists "complaint images: authenticated upload" on storage.objects;
create policy "complaint images: authenticated upload"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'complaint-images'
    and (storage.foldername(name))[1] = public.request_user_id()
  );

commit;

-- Existing accounts need a Firebase UID. After creating the same user in
-- Firebase Authentication, relink the profile (complaints/notifications
-- follow automatically because the foreign keys use ON UPDATE CASCADE):
--
-- update profiles
-- set id = 'FIREBASE_UID_FROM_FIREBASE_CONSOLE'
-- where email = 'student@college.edu';
