-- Allow authenticated users to insert their own profile row
-- (needed for upsert fallback when the auto-create trigger didn't fire)

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
