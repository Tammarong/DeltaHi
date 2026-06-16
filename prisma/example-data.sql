BEGIN;

-- Local cleanup only. This file intentionally contains no sample INSERT data.
-- Running `npm run db:seed` clears local referral/example rows so the app starts
-- from an empty record-only workflow state.
DELETE FROM "public"."employee_download";
DELETE FROM "public"."employee_share";

COMMIT;
