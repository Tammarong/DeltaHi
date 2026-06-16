DROP INDEX IF EXISTS "employee_download_verification_status_idx";

ALTER TABLE "employee_download"
  DROP CONSTRAINT IF EXISTS "employee_download_verification_status_check",
  DROP COLUMN IF EXISTS "verification_status",
  DROP COLUMN IF EXISTS "verified_at";
