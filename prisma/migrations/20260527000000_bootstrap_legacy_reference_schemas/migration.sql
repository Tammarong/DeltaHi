CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE SCHEMA IF NOT EXISTS "service_user";
CREATE SCHEMA IF NOT EXISTS "dbo";

CREATE TABLE IF NOT EXISTS "service_user"."users" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "employee_id" varchar NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz,

  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "dbo"."v_HR_EXP_EmpBasicInfo" (
  "empid" varchar NOT NULL,
  "name" varchar,
  "surname" varchar,

  CONSTRAINT "v_HR_EXP_EmpBasicInfo_pkey" PRIMARY KEY ("empid")
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'employee_share'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'employee_share'
      AND column_name = 'user_id'
  ) THEN
    DROP TABLE IF EXISTS "service_user"."users";
    DROP TABLE IF EXISTS "dbo"."v_HR_EXP_EmpBasicInfo";
  END IF;
END $$;
