-- Migration: 20261019_add_leave_exclusion_constraint
-- Adds btree_gist extension and an engine-level exclusion constraint preventing overlapping active leave requests

-- 1. Enable btree_gist extension
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 2. Define immutable date parser helper function for index expressions
CREATE OR REPLACE FUNCTION immutable_to_date(d text)
RETURNS date AS $$
BEGIN
  RETURN to_date(d, 'YYYY-MM-DD');
END;
$$ LANGUAGE plpgsql IMMUTABLE STRICT;

-- 3. Add exclusion constraint on active (pending or approved) leave requests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'exclude_overlapping_active_leave'
  ) THEN
    ALTER TABLE "LeaveRequest"
      ADD CONSTRAINT "exclude_overlapping_active_leave"
      EXCLUDE USING gist (
        "userId" WITH =,
        daterange(immutable_to_date("startDate"), immutable_to_date("endDate"), '[]') WITH &&
      )
      WHERE (status IN ('pending', 'approved'));
  END IF;
END $$;
