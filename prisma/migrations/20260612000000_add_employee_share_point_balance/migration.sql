ALTER TABLE "employee_share"
  ADD COLUMN "point_balance" integer;

ALTER TABLE "employee_share"
  ADD CONSTRAINT "employee_share_point_balance_non_negative"
  CHECK ("point_balance" IS NULL OR "point_balance" >= 0);
