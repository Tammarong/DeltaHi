CREATE SCHEMA IF NOT EXISTS "service_user";
CREATE SCHEMA IF NOT EXISTS "dbo";

CREATE TABLE IF NOT EXISTS "service_user"."users" (
  "id" uuid PRIMARY KEY,
  "employee_id" varchar NOT NULL
);

-- Local development stand-in for the existing Delta HR reference.
-- In production this relation is expected to already exist.
CREATE TABLE IF NOT EXISTS "dbo"."v_HR_EXP_EmpBasicInfo" (
  "empid" varchar PRIMARY KEY,
  "name" varchar,
  "surname" varchar
);
