ALTER TABLE "employee_download"
  DROP CONSTRAINT IF EXISTS "employee_download_reciever_emp_id_fkey";

ALTER TABLE "employee_share"
  DROP CONSTRAINT IF EXISTS "employee_share_user_id_fkey",
  DROP CONSTRAINT IF EXISTS "employee_share_employee_id_fkey",
  DROP CONSTRAINT IF EXISTS "employee_share_user_id_key",
  DROP CONSTRAINT IF EXISTS "employee_share_point_balance_non_negative",
  DROP COLUMN IF EXISTS "user_id",
  DROP COLUMN IF EXISTS "employee_name",
  DROP COLUMN IF EXISTS "point_balance";

CREATE INDEX IF NOT EXISTS "employee_share_employee_id_idx"
  ON "employee_share"("employee_id");

DROP TABLE IF EXISTS "service_user"."users";
DROP TABLE IF EXISTS "dbo"."v_HR_EXP_EmpBasicInfo";
