-- =========================================================
-- Existing CampusDesk migration: Firebase Auth -> Supabase Auth
-- Run ONCE only if the Firebase-oriented schema was deployed previously.
-- Back up the database before running this migration.
-- =========================================================

-- BEFORE RUNNING:
-- 1. In Supabase Dashboard > Authentication > Users, create one Supabase Auth
--    user for every existing public.profiles email address.
-- 2. Use the same email addresses. Passwords cannot be copied from Firebase,
--    so assign temporary passwords or send invitations.
-- 3. Confirm this query returns zero rows:
--
-- select p.id, p.email
-- from public.profiles p
-- left join auth.users u on lower(u.email) = lower(p.email)
-- where u.id is null;

begin;

do $$
begin
  if exists (
    select 1
    from public.profiles p
    left join auth.users u on lower(u.email) = lower(p.email)
    where u.id is null
  ) then
    raise exception 'Migration stopped: every profile email must have a matching Supabase Auth user.';
  end if;

  if exists (
    select lower(email)
    from public.profiles
    group by lower(email)
    having count(*) > 1
  ) then
    raise exception 'Migration stopped: duplicate profile email addresses must be resolved first.';
  end if;
end;
$$;

create temporary table firebase_supabase_user_map on commit drop as
select p.id as old_id, u.id as new_id
from public.profiles p
join auth.users u on lower(u.email) = lower(p.email);

-- Remove policies/functions and foreign keys that depend on the text IDs.
drop policy if exists "profiles: view own or admin" on public.profiles;
drop policy if exists "profiles: insert own" on public.profiles;
drop policy if exists "profiles: update own" on public.profiles;
drop policy if exists "departments: read by any signed-in user" on public.departments;
drop policy if exists "departments: admin manages" on public.departments;
drop policy if exists "complaints: student views own or admin views all" on public.complaints;
drop policy if exists "complaints: student inserts own" on public.complaints;
drop policy if exists "complaints: admin updates any" on public.complaints;
drop policy if exists "complaints: admin deletes any" on public.complaints;
drop policy if exists "notifications: user views own" on public.notifications;
drop policy if exists "notifications: user updates own (mark read)" on public.notifications;
drop policy if exists "notifications: any signed-in user can insert" on public.notifications;
drop policy if exists "complaint images: authenticated upload" on storage.objects;

drop function if exists public.is_admin();
drop function if exists public.request_user_id();

alter table public.complaints drop constraint if exists complaints_student_id_fkey;
alter table public.notifications drop constraint if exists notifications_user_id_fkey;
alter table public.profiles drop constraint if exists profiles_id_fkey;

-- Normalize all identity columns to text before relinking. This makes the
-- migration safe whether the current columns contain Firebase text UIDs or
-- are already UUID columns from an earlier Supabase schema.
alter table public.profiles
  alter column id type text using id::text;
alter table public.complaints
  alter column student_id type text using student_id::text;
alter table public.notifications
  alter column user_id type text using user_id::text;

-- Relink application data by email, then convert IDs back to UUID.
update public.complaints c
set student_id = m.new_id::text
from firebase_supabase_user_map m
where c.student_id = m.old_id::text;

update public.notifications n
set user_id = m.new_id::text
from firebase_supabase_user_map m
where n.user_id = m.old_id::text;

update public.profiles p
set id = m.new_id::text
from firebase_supabase_user_map m
where p.id = m.old_id::text;

alter table public.profiles alter column id type uuid using id::uuid;
alter table public.complaints alter column student_id type uuid using student_id::uuid;
alter table public.notifications alter column user_id type uuid using user_id::uuid;

alter table public.profiles
  add constraint profiles_id_fkey
  foreign key (id) references auth.users(id)
  on update cascade on delete cascade;

alter table public.complaints
  add constraint complaints_student_id_fkey
  foreign key (student_id) references public.profiles(id)
  on update cascade on delete cascade;

alter table public.notifications
  add constraint notifications_user_id_fkey
  foreign key (user_id) references public.profiles(id)
  on update cascade on delete cascade;

-- New Supabase Auth registrations automatically receive a profile.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id, role, name, roll, email, phone, department, course, semester
  )
  values (
    new.id,
    'student',
    coalesce(nullif(new.raw_user_meta_data->>'name', ''), split_part(new.email, '@', 1)),
    nullif(upper(new.raw_user_meta_data->>'roll'), ''),
    new.email,
    nullif(new.raw_user_meta_data->>'phone', ''),
    nullif(new.raw_user_meta_data->>'department', ''),
    nullif(new.raw_user_meta_data->>'course', ''),
    nullif(new.raw_user_meta_data->>'semester', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

create policy "profiles: view own or admin"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id or public.is_admin());

create policy "profiles: insert own"
  on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id and role = 'student');

create policy "profiles: update own"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id and (role = 'student' or public.is_admin()));

create policy "departments: read by any signed-in user"
  on public.departments for select to authenticated using (true);

create policy "departments: admin manages"
  on public.departments for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "complaints: student views own or admin views all"
  on public.complaints for select to authenticated
  using (student_id = (select auth.uid()) or public.is_admin());

create policy "complaints: student inserts own"
  on public.complaints for insert to authenticated
  with check (student_id = (select auth.uid()));

create policy "complaints: admin updates any"
  on public.complaints for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "complaints: admin deletes any"
  on public.complaints for delete to authenticated using (public.is_admin());

create policy "notifications: user views own"
  on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));

create policy "notifications: user updates own (mark read)"
  on public.notifications for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "notifications: any signed-in user can insert"
  on public.notifications for insert to authenticated
  with check (user_id = (select auth.uid()) or public.is_admin());

create policy "complaint images: authenticated upload"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'complaint-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

commit;
