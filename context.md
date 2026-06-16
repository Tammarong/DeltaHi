# DeltaHi Friends Get Friends Project Context

## Project Summary

This repository is a Nuxt 3 referral web app for the DeltaHi "Friends Get Friends" campaign.

The app lets an existing employee/referrer create a referral QR/link, lets a new user/receiver open that link and download the DeltaHi app, and records eligible referral download activity for an admin dashboard.

The key business boundary is that this app does not own people, app-user registration, points, or reward ledgers. It owns only the referral workflow records:

- `employee_share`
- `employee_download`

The app no longer stores local people/reference tables. Employee IDs are recorded
directly on referral workflow rows.

## Tech Stack

- Nuxt 3
- Vue 3 single file components
- TypeScript with strict type checking
- Tailwind CSS
- Nuxt i18n with English and Thai locales
- Prisma 5
- PostgreSQL
- Node test runner
- `qrcode` for QR code rendering
- `zod` for shared input validation

## Important Commands

```bash
npm install
npm run db:setup
npm run dev
npm test
npm run typecheck
npm run build
```

Useful database commands:

```bash
npm run db:up
npm run db:seed
npm run db:studio
npm run db:reset
```

If Nuxt generated aliases break during local development, use:

```bash
npm run dev:clean
```

## Environment Variables

The expected local environment is documented in `.env.example`:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/friends_get_friends"
NUXT_PUBLIC_SITE_URL="https://deltahi.vercel.io"
NUXT_PUBLIC_DOWNLOAD_URL="https://thap.deltaww.com/deltahi/download"
```

`NUXT_PUBLIC_SITE_URL` is used to build public referral URLs.

`NUXT_PUBLIC_DOWNLOAD_URL` is used when the receiver clicks Download App.

## User Routes

Main referrer flow:

- `/` redirects to `/friend-get-friend/user_Id`
- `/friend-get-friend/user_Id` lets the referrer enter an employee ID
- `/friend-get-friend/qr-code?employeeShareId=[employee_share.id]` renders the QR code

Receiver flow:

- `/friend-get-friend/shareapp/[shareId]` is the QR target
- The receiver enters an employee ID
- The page opens a download dialog
- Download App opens the configured download URL in a new tab/window
- The app attempts to record an `employee_download`

Admin flow:

- `/friend-get-friend/admin` shows dashboard stats, download records, filters, CSV export, and Top 38 pioneers

Legacy/simple download page:

- `/friend-get-friend/download` still exists and can record a download from query params, but the current share page flow uses an in-page download dialog instead of navigating there.

## Main Workflow

1. Referrer opens `/friend-get-friend/user_Id`.
2. Referrer enters an employee ID.
3. Page calls `GET /api/friend-get-friend/check-user?employee_id=[employee_id]`.
4. Local check-user API validates, trims, and normalizes the employee ID.
5. Page calls `POST /api/employee-shares`.
6. Server creates or reuses one `employee_share` row for that employee ID.
7. Page routes to `/friend-get-friend/qr-code?employeeShareId=[employee_share.id]`.
8. QR page calls `GET /api/shares/[shareId]`.
9. QR page renders `share.shareUrl`.
10. Receiver opens `/friend-get-friend/shareapp/[shareId]`.
11. Receiver enters their employee ID freely.
12. Receiver clicks Download App.
13. Download URL opens.
14. Server records `employee_download` when the receiver employee ID passes guards.
15. Admin dashboard reads real `employee_download` rows.

## API Endpoints

### `GET /api/friend-get-friend/check-user`

Used by the first referrer page.

Accepted input:

- Query `employee_id`
- Query `employeeId` fallback
- Body `employee_id` or `employeeId` for non-GET requests

Behavior:

- Validates employee ID using `employeeIdSchema`
- Returns a user-shaped response with the normalized `employee_id`
- Does not call the main app or write database rows

### `POST /api/employee-shares`

Creates or reuses the referrer's share row.

Body:

- `employeeId`

Behavior:

- Validates input with `createEmployeeShareSchema`
- Creates or reuses `employee_share` by employee ID
- Reactivates soft-deleted shares by setting `deleted_at` to null
- Returns public share data including `shareUrl`

### `GET /api/shares/[shareId]`

Loads an active share by UUID.

Behavior:

- Rejects invalid UUID with 400
- Rejects missing/soft-deleted share with 404
- Returns share data and public share URL

### `POST /api/downloads`

Attempts to record a receiver download.

Body:

- `employeeShareId`
- `recieverEmpId`
- `os`: `ios`, `android`, or `unknown`

Important: the database/API field is spelled `recieverEmpId`, matching the current schema.

Behavior:

- Rejects invalid referral link
- Rejects self-referral where referrer employee ID equals receiver employee ID
- Rejects receiver employee IDs already submitted under another referral
- Reuses the existing download if the same receiver already submitted for the same referral
- Records the receiver employee ID directly without HR/reference lookup
- Updates OS from `unknown` to a known OS if possible
- Creates only `employee_download`
- Never creates `employee_share` for the receiver

### `GET /api/admin/dashboard`

Reads dashboard data from active `employee_download` records.

Supported filters:

- `page`
- `pageSize`
- `search`
- `os`
- `dateFrom`
- `dateTo`

Bangkok date filters are parsed as `YYYY-MM-DD` using UTC+07 boundaries.

### `GET /api/admin/downloads.csv`

Exports filtered download records as CSV.

### `GET /api/employees/[employeeId]`

Normalizes an employee ID and returns an ID-only placeholder object. The app no
longer looks up or stores local HR/reference employee records.

## Public API Rate Limits

Public referral endpoints use a lightweight per-process, per-client-IP rate limit:

- `GET /api/friend-get-friend/check-user`: 30 requests per minute
- `POST /api/employee-shares`: 20 requests per minute
- `POST /api/downloads`: 60 requests per minute
- `GET /api/shares/[shareId]`: 120 requests per minute
- `GET /api/employees/[employeeId]`: 120 requests per minute

Responses include `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and
`X-RateLimit-Reset`. Blocked requests return 429 and `Retry-After`.

This is suitable as a basic app-side guard. If the app is deployed across
multiple server instances, add a shared store or edge/WAF rate limit for stronger
production enforcement.

## Database Models

### `EmployeeShare`

Mapped to `public.employee_share`.

Important fields:

- `id`
- `employeeId`
- `createdAt`
- `updatedAt`
- `deletedAt`

Rules:

- One share row is reused per employee ID when available
- Created only by `POST /api/employee-shares`
- Used as the referral identifier in QR/link URLs

### `EmployeeDownload`

Mapped to `public.employee_download`.

Important fields:

- `id`
- `employeeShareId`
- `recieverEmpId`
- `os`
- `createdAt`
- `updatedAt`
- `deletedAt`

Rules:

- Has uniqueness around active receiver referral submissions
- Represents referral activity, not a user account

## Record-Only Rule

The current workflow records referral download activity only.

- Clicking Download App can create an `employee_download` row.
- The dashboard counts saved `employee_download` records directly.
- There is no main app registration callback in this app.
- There is no app-registration-driven `Verified`/`Unverified` dashboard workflow.
- Unknown, self-referral, duplicate, and invalid-link recording failures should not stop the user from opening the download URL when the share page already opened it.

## No People Data / New Workflow Rule

For the workflow where this app has no direct people data and only records referral workflow activity:

- Let the receiver enter an employee ID.
- Do not create people/reference records or `employee_share` rows from the receiver download flow.
- Try to record `employee_download`.
- Treat 400, 404, and 409 from download recording as non-blocking for the user download.
- Keep admin data based on saved `employee_download` rows only.

This rule is important because the campaign should not manufacture receiver app-user accounts or receiver share rows from a download click.

## Admin Dashboard Notes

The admin dashboard shows:

- Total Downloads: saved download records
- Recorded Receivers: unique receiver employee IDs from saved records
- Active Referrers: shares with saved records
- Top 38
- Recent download records
- OS
- Downloaded At
- Top 38 pioneers
- CSV export

Some dashboard values are placeholders until real external app APIs are connected:

- Fallback pioneer score

## Testing

Manual QA cases are in `Test_Case.md`.

Automated structural/contract tests are in:

- `tests/referral-schema.test.mjs`
- `tests/referral-registration-verification.test.mjs`

Run:

```bash
npm test
```

The tests mostly assert that expected architecture, routes, schemas, guards, and dashboard behavior remain present.

## Important Business Guards

Keep these guards when changing referral logic:

- Referrer QR creation should create or reuse only `employee_share`.
- Invalid share ID cannot be used.
- Soft-deleted shares/downloads are excluded.
- Referrer cannot submit their own employee ID.
- Unknown receiver employee ID can still be recorded as an `employee_download`.
- Receiver employee ID cannot be submitted under a different referral once active.
- Download flow must not create receiver `employee_share`.
- OS should be recorded as `ios`, `android`, or `unknown`.
- Existing `unknown` OS can be upgraded to a known OS.
- Public referral APIs should stay rate-limited.

## Important Files

- `README.md`: setup and high-level workflow
- `Test_Case.md`: manual QA test cases
- `nuxt.config.ts`: Nuxt, i18n, runtime config
- `prisma/schema.prisma`: database models and external schemas
- `prisma/example-data.sql`: local cleanup script with no sample inserts
- `shared/schemas/referral.ts`: zod validation schemas
- `shared/types/referral.ts`: public TypeScript types
- `server/services/referralService.ts`: core referral business logic
- `server/services/adminDashboardService.ts`: dashboard aggregation and CSV logic
- `server/repositories/referralRepository.ts`: Prisma data access
- `server/utils/referral.ts`: public data formatting and share URL generation
- `pages/friend-get-friend/user_Id.vue`: referrer employee ID entry
- `pages/friend-get-friend/qr-code.vue`: QR rendering page
- `pages/friend-get-friend/shareapp/[shareId].vue`: receiver referral/download flow
- `pages/friend-get-friend/admin.vue`: admin dashboard
- `docs/friend-get-friend/check-user-api.md`: check-user workflow details

## Coding Conventions In This Repo

- Use TypeScript.
- Use existing services/repositories for server logic.
- Validate API inputs with shared zod schemas.
- Keep database field names aligned with existing Prisma mappings, including `reciever`.
- Preserve soft-delete filtering with `deletedAt: null`.
- Prefer small, focused tests that assert the intended contract.
- Keep UI text localizable where existing pages already use i18n.
- Do not add ownership of `point_ledger`, app user registration, or HR/person records to this app.
