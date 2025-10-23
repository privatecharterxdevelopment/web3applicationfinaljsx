-- Clean up existing duplicate/conflicting policies
drop policy if exists "Users can view own profile" on public.users;
drop policy if exists "Users can insert own record" on public.users;
drop policy if exists "Admins can read all users" on public.users;
drop policy if exists "Admins can update all users" on public.users;
drop policy if exists "Admins have full access to users" on public.users;

-- Update existing policies to use optimized syntax (subquery for performance)
drop policy if exists "Users can read own data" on public.users;
drop policy if exists "Users can update own profile" on public.users;
drop policy if exists "Users can insert own profile" on public.users;

-- Create optimized RLS policies for users table
create policy "Users can read own data" 
  on public.users for select 
  to authenticated
  using ((select auth.uid()) = id);

create policy "Users can update own profile" 
  on public.users for update 
  to authenticated
  using ((select auth.uid()) = id);

create policy "Service role can insert users" 
  on public.users for insert 
  to service_role
  with check (true);

create policy "Admins have full access" 
  on public.users for all 
  to authenticated
  using ((select auth.jwt() ->> 'user_role') = 'admin');
