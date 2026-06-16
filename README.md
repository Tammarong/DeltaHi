# Friends Get Friends Referral Web

Lightweight DeltaHi referral web flow.

## Flow

Main flow:

1. Referrer opens `/friend-get-friend/user_Id`.
2. Referrer enters their employee ID.
3. The page checks and normalizes the employee ID with `/api/friend-get-friend/check-user`.
4. The page creates or reuses the local employee share by employee ID, then sends the referrer to `/friend-get-friend/qr-code?employeeShareId=[employee_share.id]`.
5. The QR page renders a QR for `/friend-get-friend/shareapp/[employee_share.id]`.
6. New user opens `/friend-get-friend/shareapp/[employee_share.id]`.
7. New user enters employee ID.
8. New user opens the in-page download popup.
9. System saves an `employee_download` record when the receiver clicks Download App and passes referral guards.
10. Employee IDs are recorded directly; no local HR/reference lookup is required.

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
It also does not wait for or process app registration callbacks. The campaign
dashboard is based on saved referral download records only.
The app no longer stores or depends on local `service_user.users` or
`dbo.v_HR_EXP_EmpBasicInfo` reference tables.

`employee_share.id` is the referral identifier used in links:

```text
https://deltahi.vercel.io/friend-get-friend/shareapp/{{id}}
```

`prisma/example-data.sql` intentionally clears local example rows and does not
insert mock people/share/download data.

## Public API Rate Limits

The public referral APIs have a basic per-client-IP in-memory rate limit:

- `GET /api/friend-get-friend/check-user`: 30/min
- `POST /api/employee-shares`: 20/min
- `POST /api/downloads`: 60/min
- `GET /api/shares/[shareId]`: 120/min
- `GET /api/employees/[employeeId]`: 120/min

Blocked requests return `429 Too Many Requests` with `Retry-After` and
`X-RateLimit-*` headers.

## Setup

```bash
npm install
cp .env.example .env
npm run db:setup
npm run dev
```

`db:setup` starts local Postgres, pushes the Prisma schema, and runs
`prisma/example-data.sql` to clear any local example rows. It does not insert
sample records.

If Nuxt dev server reports a generated alias error such as `#app-manifest`,
restart it with a clean generated cache:

```bash
npm run dev:clean
```

Open Prisma Studio with:

```bash
npm run db:studio
```

## Production Deploy Order

1. Create the production Postgres database first, such as Neon.
2. Set Vercel environment variables:
   - `DATABASE_URL`
   - `NUXT_PUBLIC_SITE_URL`
   - `NUXT_PUBLIC_DOWNLOAD_URL`
3. Apply migrations with `npx prisma migrate deploy`.
4. Deploy the Nuxt app to Vercel.

Do not run `npx prisma migrate dev --name init` against Neon/production. That
command is for local development and uses a shadow database. For deployed
databases, use `migrate deploy`.

Do not run `npm run db:seed` against production because
`prisma/example-data.sql` clears referral rows.

## Setup Without Docker

Prisma does not require Docker. Docker is only used by this project to start the
local PostgreSQL database. To run Prisma without Docker, install and start
PostgreSQL locally, then point `.env` at that database:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/friends_get_friends"
```

Create the database:

```bash
createdb -U postgres friends_get_friends
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

`prisma/example-data.sql` clears local sample data. Do not run it against a
shared or production database.

If you already started the local database before `prisma/local-reference-schema.sql`
existed, reset it once:

```bash
npm run db:reset
npm run db:setup
```
