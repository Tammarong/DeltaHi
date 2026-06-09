WITH ranked_downloads AS (
  SELECT
    "id",
    row_number() OVER (
      PARTITION BY "reciever_emp_id"
      ORDER BY "created_at" ASC, "id" ASC
    ) AS "duplicate_rank"
  FROM "employee_download"
  WHERE "deleted_at" IS NULL
)
UPDATE "employee_download" AS download
SET
  "deleted_at" = now(),
  "updated_at" = now()
FROM ranked_downloads
WHERE
  download."id" = ranked_downloads."id"
  AND ranked_downloads."duplicate_rank" > 1;

CREATE UNIQUE INDEX "employee_download_active_reciever_emp_id_key"
  ON "employee_download"("reciever_emp_id")
  WHERE "deleted_at" IS NULL;
