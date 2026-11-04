-- ==============================================================================
-- ECOMVAULTT - INTERNAL USER MANAGEMENT & SEEDING SCRIPT
-- ==============================================================================

-- 1. Enable pgcrypto for password hashing
create extension if not exists pgcrypto;

-- 2. Create the Initial Super Admin User in auth.users & public.profiles
-- Email: admin@ecomvaultt.africa
-- Default Password: AdminPassword2026!
do $$
declare
  admin_id uuid := 'a0000000-0000-0000-0000-000000000001';
  encrypted_pw text;
begin
  encrypted_pw := crypt('AdminPassword2026!', gen_salt('bf'));

  -- Insert into auth.users if not exists
  if not exists (select 1 from auth.users where email = 'admin@ecomvaultt.africa') then
    insert into auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token
    ) values (
      admin_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'admin@ecomvaultt.africa',
      encrypted_pw,
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Clarinda O. (Super Admin)","role":"super_admin"}',
      now(),
      now(),
      ''
    );
  end if;

  -- Ensure matching public.profiles row
  insert into public.profiles (id, full_name, role, avatar_code, avatar_color, is_online)
  values (
    admin_id,
    'Clarinda O. (Super Admin)',
    'super_admin',
    'CL',
    'a2',
    true
  )
  on conflict (id) do update set
    role = 'super_admin',
    full_name = 'Clarinda O. (Super Admin)';
end $$;

-- 3. Stored Procedure: create_staff_member
-- Allows logged-in Super Admin to add staff with email, temporary password & role
create or replace function public.create_staff_member(
  staff_email text,
  staff_password text,
  staff_full_name text,
  staff_role text,
  staff_phone text default null
)
returns json
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  new_staff_id uuid := gen_random_uuid();
  hashed_pw text;
begin
  -- Check if user already exists
  if exists (select 1 from auth.users where email = lower(trim(staff_email))) then
    return json_build_object('success', false, 'error', 'A user with this email already exists.');
  end if;

  hashed_pw := crypt(staff_password, gen_salt('bf'));

  -- Insert into auth.users
  insert into auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token
  ) values (
    new_staff_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    lower(trim(staff_email)),
    hashed_pw,
    now(), -- Confirmed immediately so staff can login with temporary password
    '{"provider":"email","providers":["email"]}',
    json_build_object(
      'full_name', staff_full_name,
      'role', staff_role,
      'must_change_password', true
    ),
    now(),
    now(),
    ''
  );

  -- Insert / Update profiles table
  insert into public.profiles (
    id,
    full_name,
    role,
    avatar_code,
    avatar_color,
    phone_number,
    is_online
  ) values (
    new_staff_id,
    staff_full_name,
    staff_role::user_role,
    upper(substring(staff_full_name, 1, 2)),
    'a1',
    staff_phone,
    false
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    role = excluded.role;

  return json_build_object(
    'success', true,
    'user_id', new_staff_id,
    'email', staff_email,
    'temporary_password', staff_password
  );
exception
  when others then
    return json_build_object('success', false, 'error', SQLERRM);
end;
$$;
