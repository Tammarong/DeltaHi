# Friends Get Friends Referral Web

Lightweight DeltaHi referral web flow.

## Flow

Main flow:

1. Referrer opens `/friend-invite-friend/user_Id?employee_id=<EMPLOYEE_ID>`.
2. The page checks the logged-in user and renders a QR for `/friend-invite-friend/shareapp/[employee_share.id]`.
3. New user opens `/friend-invite-friend/shareapp/[employee_share.id]`.
4. New user enters employee ID.
5. New user lands on `/download`.
6. If the employee ID exists in HR data, the download page shows the employee name.
7. System saves an `employee_download` record when a verified employee clicks Download App.
8. If the employee ID is not found, the new user can still download the app, but no `employee_download` row is saved.

Optional help flow:

1. New user clicks View Tutorial.
2. New user chooses iOS or Android.
3. The page shows the matching tutorial.
4. New user can return to Download.

## Database Boundary

This app owns only:

- `employee_share`
- `employee_download`

It does not create or mutate `point_ledger`; rewards are owned by the main database.

`employee_share.id` is the referral identifier used in links:

```text
https://deltahi.vercel.io/friend-invite-friend/shareapp/{{id}}
```

The local schema keeps a foreign key from `employee_share.user_id` to the existing
`service_user.users.id` table. The app does not model or own that external table.

It also references existing HR employee data:

- `dbo.v_HR_EXP_EmpBasicInfo.empid` -> `employee_share.employee_id`
- `dbo.v_HR_EXP_EmpBasicInfo.empid` -> `employee_download.reciever_emp_id`

Example rows for all referenced tables are in `prisma/example-data.sql`.

## Setup

```bash
npm install
cp .env.example .env
npm run db:setup
npm run dev
```

`db:setup` starts local Postgres, pushes the Prisma schema, and loads
`prisma/example-data.sql`.

If Nuxt dev server reports a generated alias error such as `#app-manifest`,
restart it with a clean generated cache:

```bash
npm run dev:clean
```

Open Prisma Studio with:

```bash
npm run db:studio
```

If you already started the local database before `prisma/local-reference-schema.sql`
existed, reset it once:

```bash
npm run db:reset
npm run db:setup
```
