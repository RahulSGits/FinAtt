-- ===========================================================================
-- Repairs: HTTP 500 "Database error querying schema" on every sign-in.
--
-- Cause: auth.users has several varchar columns that GoTrue (the auth server)
-- reads into a Go `string`, which cannot hold NULL. Supabase's own signup path
-- writes '' into them; a row inserted by hand-written SQL that omits them gets
-- NULL instead, and from then on GoTrue fails to scan the row and returns a
-- 500 for that account -- no matter what password is supplied.
--
-- Safe to run repeatedly. Touches only NULLs, never a real value.
-- Run in: Supabase dashboard -> SQL Editor.
-- ===========================================================================

do $$
declare
  col record;
  fixed bigint;
  total bigint := 0;
begin
  -- Driven off information_schema so this works across GoTrue versions:
  -- a column the deployment does not have is simply skipped.
  for col in
    select column_name
      from information_schema.columns
     where table_schema = 'auth'
       and table_name = 'users'
       and data_type in ('character varying', 'text')
       and column_name in (
         'confirmation_token',
         'recovery_token',
         'email_change',
         'email_change_token_new',
         'email_change_token_current',
         'phone_change',
         'phone_change_token',
         'reauthentication_token'
       )
  loop
    execute format(
      'update auth.users set %I = '''' where %I is null', col.column_name, col.column_name
    );
    get diagnostics fixed = row_count;
    total := total + fixed;
    if fixed > 0 then
      raise notice 'auth.users.%: repaired % row(s)', col.column_name, fixed;
    end if;
  end loop;

  raise notice 'Done. % NULL value(s) replaced with empty strings.', total;
end $$;

-- Every email user also needs an auth.identities row, or the login grant fails.
insert into auth.identities (
  id, user_id, provider_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
)
select
  gen_random_uuid(), u.id, u.id::text,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  'email', now(), now(), now()
from auth.users u
where u.email is not null
  and not exists (
    select 1 from auth.identities i
     where i.user_id = u.id and i.provider = 'email'
  );

-- ---------------------------------------------------------------------------
-- Verify. Every row must read 'ok'.
-- ---------------------------------------------------------------------------
select
  u.email,
  case
    when u.confirmation_token is null
      or u.recovery_token is null
      or u.email_change is null
      or u.email_change_token_new is null then 'STILL BROKEN: null tokens'
    when u.email_confirmed_at is null then 'STILL BROKEN: email not confirmed'
    when not exists (
      select 1 from auth.identities i where i.user_id = u.id and i.provider = 'email'
    ) then 'STILL BROKEN: no email identity'
    else 'ok'
  end as sign_in_status
from auth.users u
order by u.email;
