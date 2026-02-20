/*
  # Simplify payments table for pay-per-call model

  ## Summary
  Drops bundle-era columns and replaces them with a simple per-call log.
  Each row now represents a single check payment, not a bundle covering multiple checks.

  ## Changes to `payments` table

  ### Removed columns
  - `scans_allowed` – bundle concept, no longer needed
  - `scans_used` – bundle counter, no longer needed
  - `expires_at` – bundle expiry, no longer needed
  - `payment_hash` – replaced by `signature`
  - `amount_paid` – numeric; replaced by logging the raw header value

  ### Added columns
  - `signature` (text, not null) – the raw X-Payment or X-402-Payment header value

  ### Renamed
  - `payment_token` kept for backwards compat but renamed to `signature` via drop + add
    (safer than rename given existing index)

  ## Security
  - Existing RLS policies (service-role-only) remain in place
  - New index on `signature` for fast duplicate lookups

  ## Notes
  - This is a destructive column drop migration; no production data exists yet
  - All access remains via service role only
*/

-- Drop bundle-era columns (safe; no production data)
ALTER TABLE public.payments
  DROP COLUMN IF EXISTS scans_allowed,
  DROP COLUMN IF EXISTS scans_used,
  DROP COLUMN IF EXISTS expires_at,
  DROP COLUMN IF EXISTS payment_hash,
  DROP COLUMN IF EXISTS amount_paid,
  DROP COLUMN IF EXISTS payment_token;

-- Add signature column (the raw payment header value)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'signature'
  ) THEN
    ALTER TABLE public.payments ADD COLUMN signature text NOT NULL DEFAULT '';
  END IF;
END $$;

-- Index for duplicate-signature lookups
CREATE INDEX IF NOT EXISTS idx_payments_signature ON public.payments(signature);
