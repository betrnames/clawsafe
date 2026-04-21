/*
  # Fix waitlist RLS policy

  Replace the always-true INSERT policy on waitlist with one that validates
  the email is a non-empty, properly formatted address. This prevents
  unrestricted writes while still allowing legitimate signups without auth.
*/

DROP POLICY IF EXISTS "Anyone can join waitlist" ON waitlist;

CREATE POLICY "Insert valid email only"
  ON waitlist FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    email IS NOT NULL
    AND length(trim(email)) > 3
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  );
