ALTER TABLE "employee_share"
  ADD COLUMN "employee_name" varchar;

UPDATE "employee_share" AS share
SET
  "employee_name" = NULLIF(trim(concat_ws(' ', employee."name", employee."surname")), '')
FROM "dbo"."v_HR_EXP_EmpBasicInfo" AS employee
WHERE
  share."employee_id" = employee."empid"
  AND share."employee_name" IS NULL;
