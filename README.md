# Friends Get Friends Referral Web

Lightweight DeltaHi referral web flow.

## Flow

Main flow:

1. Referrer opens `/friend-get-friend/user_Id`.
2. Referrer enters their employee ID.
3. The page checks the employee ID with `/api/friend-get-friend/check-user`.
4. The page creates or reuses the employee share, then sends the referrer to `/friend-get-friend/qr-code?employeeShareId=[employee_share.id]`.
5. The QR page renders a QR for `/friend-get-friend/shareapp/[employee_share.id]`.
6. New user opens `/friend-get-friend/shareapp/[employee_share.id]`.
7. New user enters employee ID.
8. New user lands on `/download`.
9. If the employee ID exists in HR data, the download page shows the employee name.
10. System saves an `employee_download` record when a verified employee clicks Download App.
11. If the employee ID is not found, the new user can still download the app, but no `employee_download` row is saved.

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
https://deltahi.vercel.io/friend-get-friend/shareapp/{{id}}
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

## Setup Without Docker

Prisma does not require Docker. Docker is only used by this project to start the
local PostgreSQL database. To run Prisma without Docker, install and start
PostgreSQL locally, then point `.env` at that database:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/friends_get_friends"
```

Create the database and local reference schemas:

```bash
createdb -U postgres friends_get_friends
psql -U postgres -d friends_get_friends -f prisma/local-reference-schema.sql
```

Then run Prisma directly:

```bash
npx prisma generate
npx prisma db push
npx prisma db execute --schema prisma/schema.prisma --file prisma/example-data.sql
npm run dev
```

Open Prisma Studio without Docker:

```bash
npx prisma studio
```

Do not use `npm run db:setup`, `npm run db:up`, `npm run db:down`, or
`npm run db:reset` for the no-Docker setup because those scripts call
`docker compose`.

If Prisma reports `P1001: Can't reach database server at localhost:5432`,
PostgreSQL is not running or is not listening on port `5432`. On Windows, check
the port with:

```powershell
Test-NetConnection localhost -Port 5432
```

If `TcpTestSucceeded` is `False`, start your local PostgreSQL service or update
`DATABASE_URL` to point to a reachable PostgreSQL server.

`prisma/example-data.sql` resets local sample data. Do not run it against a
shared or production database.

If you already started the local database before `prisma/local-reference-schema.sql`
existed, reset it once:

```bash
npm run db:reset
npm run db:setup
```
