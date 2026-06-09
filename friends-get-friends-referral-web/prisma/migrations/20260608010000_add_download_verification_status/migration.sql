ALTER TABLE "employee_download"
  ADD COLUMN "verification_status" varchar(16) NOT NULL DEFAULT 'unverified',
  ADD COLUMN "verified_at" timestamptz,
  ADD CONSTRAINT "employee_download_verification_status_check"
    CHECK ("verification_status" IN ('unverified', 'verified'));

CREATE INDEX "employee_download_verification_status_idx"
  ON "employee_download"("verification_status");
