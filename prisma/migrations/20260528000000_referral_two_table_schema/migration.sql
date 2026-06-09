CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE "employee_share" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "employee_id" varchar NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz,

  CONSTRAINT "employee_share_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "employee_share_user_id_key" UNIQUE ("user_id"),
  CONSTRAINT "employee_share_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "service_user"."users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "employee_share_employee_id_fkey"
    FOREIGN KEY ("employee_id") REFERENCES "dbo"."v_HR_EXP_EmpBasicInfo"("empid")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "employee_download" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "employee_share_id" uuid NOT NULL,
  "reciever_emp_id" varchar NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz,

  CONSTRAINT "employee_download_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "employee_download_employee_share_id_reciever_emp_id_key"
    UNIQUE ("employee_share_id", "reciever_emp_id"),
  CONSTRAINT "employee_download_employee_share_id_fkey"
    FOREIGN KEY ("employee_share_id") REFERENCES "employee_share"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "employee_download_reciever_emp_id_fkey"
    FOREIGN KEY ("reciever_emp_id") REFERENCES "dbo"."v_HR_EXP_EmpBasicInfo"("empid")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "employee_download_employee_share_id_idx"
  ON "employee_download"("employee_share_id");

CREATE INDEX "employee_download_reciever_emp_id_idx"
  ON "employee_download"("reciever_emp_id");
