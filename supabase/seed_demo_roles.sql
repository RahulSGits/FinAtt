-- ============================================================================
-- FinAtt — the three demo accounts, with the right role each
--
--   admin@demo.com     -> admin      (full access + Members & access)
--   hr@demo.com        -> hr         (workforce management only)
--   employee@demo.com  -> employee   (their own portal)
--
-- Run AFTER APPLY_STEP_1.sql, otherwise the 'admin' role value does not exist
-- yet and this script cannot assign it.
--
-- Fixes the two things that go wrong with hand-made demo accounts:
--   1. A missing auth.identities row, which makes sign-in fail with
--      500 "Database error querying schema" however correct the password is.
--   2. Roles drifting (e.g. hr@demo.com sitting at 'admin', so the HR login
--      lands in the Admin Console).
--
-- Safe to run repeatedly. Create the three users in Authentication → Users
-- first if they do not exist; this script only fixes up what is already there.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Every email user needs a matching identity or the password grant 500s.
-- ---------------------------------------------------------------------------
insert into auth.identities (
  id, user_id, provider_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
)
select
  gen_random_uuid(), u.id, u.id::text,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  'email', now(), now(), now()
from auth.users u
where u.email in ('admin@demo.com', 'hr@demo.com', 'employee@demo.com')
  and not exists (
    select 1 from auth.identities i
     where i.user_id = u.id and i.provider = 'email'
  );

-- ---------------------------------------------------------------------------
-- 2. Confirm the addresses so they can sign in immediately.
-- ---------------------------------------------------------------------------
update auth.users
   set email_confirmed_at = coalesce(email_confirmed_at, now()),
       updated_at = now()
 where email in ('admin@demo.com', 'hr@demo.com', 'employee@demo.com')
   and email_confirmed_at is null;

-- ---------------------------------------------------------------------------
-- 3. Make sure each has a profile row.
-- ---------------------------------------------------------------------------
insert into public.profiles (id, full_name, email, role, account_status, password_created)
select
  u.id,
  initcap(split_part(u.email, '@', 1)),
  u.email,
  'employee'::public.app_role,
  'active',
  true
from auth.users u
where u.email in ('admin@demo.com', 'hr@demo.com', 'employee@demo.com')
  and not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 4. Set each role explicitly. This is the authoritative assignment — it
--    corrects any drift, such as hr@demo.com having been promoted to admin.
-- ---------------------------------------------------------------------------
update public.profiles p
   set role = v.role::public.app_role,
       full_name = v.name,
       account_status = 'active',
       password_created = true
  from (values
    ('admin@demo.com',    'admin',    'Admin Demo'),
    ('hr@demo.com',       'hr',       'HR Demo'),
    ('employee@demo.com', 'employee', 'Employee Demo')
  ) as v(email, role, name)
 where lower(p.email) = v.email;

-- ---------------------------------------------------------------------------
-- 5. Only the employee belongs on the roster. Admin and HR manage staff; they
--    are not staff, so their employees rows are removed to keep headcount and
--    attendance reports honest.
-- ---------------------------------------------------------------------------
delete from public.employees
 where lower(email) in ('admin@demo.com', 'hr@demo.com');

insert into public.employees (
  user_id, employee_id, full_name, email, joining_date, status, site_id, shift_id
)
select
  p.id,
  'EMP-' || lpad((coalesce(
    (select max(nullif(regexp_replace(employee_id, '\D', '', 'g'), '')::bigint) from public.employees), 0
  ) + 1)::text, 4, '0'),
  p.full_name,
  p.email,
  current_date,
  'active',
  (select id from public.sites  where is_active order by created_at limit 1),
  (select id from public.shifts where is_active order by created_at limit 1)
from public.profiles p
where lower(p.email) = 'employee@demo.com'
  and not exists (select 1 from public.employees e where e.user_id = p.id);

-- Link any employees row that was imported by email before its owner signed up.
update public.employees e
   set user_id = p.id
  from public.profiles p
 where e.user_id is null and lower(e.email) = lower(p.email);

-- ---------------------------------------------------------------------------
-- 6. Report — each account should show the role you expect.
-- ---------------------------------------------------------------------------
select
  p.email,
  p.role::text                                                          as role,
  (u.email_confirmed_at is not null)                                    as confirmed,
  (select count(*) from auth.identities i
    where i.user_id = p.id and i.provider = 'email')                    as identities,
  (select count(*) from public.employees e where e.user_id = p.id)      as employee_rows
from public.profiles p
join auth.users u on u.id = p.id
where p.email in ('admin@demo.com', 'hr@demo.com', 'employee@demo.com')
order by p.email;
