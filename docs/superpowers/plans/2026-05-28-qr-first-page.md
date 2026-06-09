# QR First Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder first page with a referrer QR creator that uses `EmployeeShare.id` as the share route identifier.

**Architecture:** `pages/index.vue` becomes a compact form that posts `userId` and `employeeId` to `/api/employee-shares`, receives the public `shareUrl`, and renders a QR code for that URL. Existing server-side share creation remains unchanged.

**Tech Stack:** Nuxt 3, Vue script setup, TypeScript, Tailwind CSS, existing `/api/employee-shares`, `qrcode` browser library.

---

### Task 1: Add QR First Page Test

**Files:**
- Modify: `tests/referral-schema.test.mjs`

- [ ] Add a source-level regression test that asserts `pages/index.vue` no longer redirects, posts to `/api/employee-shares`, uses `share.id` and `share.shareUrl`, imports `qrcode`, and renders a QR image.
- [ ] Run `npm test` and confirm the new test fails because `pages/index.vue` still redirects.

### Task 2: Implement QR First Page

**Files:**
- Modify: `pages/index.vue`
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] Install `qrcode` and TypeScript types if needed.
- [ ] Replace the placeholder redirect with a form for `userId` and `employeeId`.
- [ ] Submit the form to `/api/employee-shares`.
- [ ] Generate a QR data URL from the returned `share.shareUrl`.
- [ ] Render the QR image, share link, EmployeeShare id, copy action, and error/loading states.
- [ ] Run `npm test` and confirm the test passes.

### Task 3: Verify

**Files:**
- No further edits expected.

- [ ] Run `npm test`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run build`.
- [ ] If a local server is available, check that `/` returns HTTP 200.

### Task 4: Auto QR From Main App EmployeeShare ID

**Files:**
- Modify: `tests/referral-schema.test.mjs`
- Modify: `pages/index.vue`

- [ ] Add a regression test asserting `/` reads `employeeShareId` from the query string, fetches `/api/shares/:employeeShareId`, and renders a QR from the validated `share.shareUrl`.
- [ ] Run `npm test` and confirm the new test fails because `pages/index.vue` only creates shares from manual `userId` and `employeeId` input.
- [ ] Add `useRoute`, `employeeShareIdFromQuery`, and `loadShareQrById(employeeShareId)` to `pages/index.vue`.
- [ ] On mount, if `employeeShareId` exists, call `loadShareQrById` and render the returned QR without requiring manual input.
- [ ] Keep the manual creation form as a fallback when no `employeeShareId` query is present or the query lookup fails.
- [ ] Run `npm test`, `npm run typecheck`, and `npm run build`.
