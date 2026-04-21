/*
  # Create core ClawSafe tables

  1. New Tables
    - `waitlist`
      - `id` (uuid, primary key)
      - `email` (text, unique, not null)
      - `created_at` (timestamptz)
    - `scans`
      - `id` (uuid, primary key)
      - `skill_name` (text, not null)
      - `source_url` (text, nullable)
      - `score` (integer, 0-100)
      - `safe` (boolean)
      - `flags` (jsonb)
      - `recommendation` (text)
      - `virustotal_result` (jsonb)
      - `claude_analysis` (text, nullable)
      - `requester_ip` (text)
      - `created_at` (timestamptz)
    - `usage_tracking`
      - `ip_address` (text, primary key)
      - `scan_count` (integer)
      - `last_reset` (text, ISO date string YYYY-MM-DD)
    - `payments`
      - `id` (uuid, primary key)
      - `signature` (text, unique, not null)
      - `ip_address` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - `waitlist`: authenticated and anon users can insert their own email; no reads
    - `scans`: anyone can read scans (public scan history); service role inserts
    - `usage_tracking`: no direct client access (service role only)
    - `payments`: no direct client access (service role only)
*/

-- waitlist
CREATE TABLE IF NOT EXISTS waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join waitlist"
  ON waitlist FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- scans
CREATE TABLE IF NOT EXISTS scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_name text NOT NULL,
  source_url text,
  score integer NOT NULL DEFAULT 0,
  safe boolean NOT NULL DEFAULT false,
  flags jsonb NOT NULL DEFAULT '[]',
  recommendation text NOT NULL DEFAULT 'Unsafe',
  virustotal_result jsonb,
  claude_analysis text,
  requester_ip text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read scans"
  ON scans FOR SELECT
  TO anon, authenticated
  USING (true);

-- usage_tracking (service role only — no client policies needed)
CREATE TABLE IF NOT EXISTS usage_tracking (
  ip_address text PRIMARY KEY,
  scan_count integer NOT NULL DEFAULT 0,
  last_reset text NOT NULL DEFAULT ''
);

ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- payments (service role only — no client policies needed)
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signature text UNIQUE NOT NULL,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
