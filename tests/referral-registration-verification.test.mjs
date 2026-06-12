import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function readProjectFile(path) {
  return readFileSync(resolve(rootDir, path), 'utf8')
}

test('QA test case documents the expected registration verification rule', () => {
  const qaTestCases = readProjectFile('Test_Case.md')

  assert.match(qaTestCases, /After the receiver clicks `Download App`, the admin dashboard should show the receiver as `Unverified`\./)
  assert.match(qaTestCases, /After the receiver opens the app and completes registration, the system should update the receiver status to `Verified`\./)
  assert.match(qaTestCases, /The receiver should not be counted as `Verified` only because they clicked download\./)
  assert.match(qaTestCases, /Implementation note: the app needs a registration update from the DeltaHi app or main backend/)
  assert.match(qaTestCases, /status `Unverified`/)
  assert.match(qaTestCases, /status `Verified`/)
})

test('dashboard verification status is stored on download records', () => {
  const adminService = readProjectFile('server/services/adminDashboardService.ts')
  const schema = readProjectFile('prisma/schema.prisma')
  const migration = readProjectFile('prisma/migrations/20260608010000_add_download_verification_status/migration.sql')
  const repository = readProjectFile('server/repositories/referralRepository.ts')
  const referralService = readProjectFile('server/services/referralService.ts')

  assert.match(schema, /verificationStatus\s+String\s+@default\("unverified"\)\s+@map\("verification_status"\)\s+@db\.VarChar\(16\)/)
  assert.match(schema, /verifiedAt\s+DateTime\?\s+@map\("verified_at"\)\s+@db\.Timestamptz\(6\)/)
  assert.match(migration, /ADD COLUMN "verification_status" varchar\(16\) NOT NULL DEFAULT 'unverified'/)
  assert.match(migration, /ADD COLUMN "verified_at" timestamptz/)
  assert.match(migration, /CHECK \("verification_status" IN \('unverified', 'verified'\)\)/)
  assert.match(adminService, /function getDisplayVerificationStatus\(status: string\)/)
  assert.match(adminService, /verificationStatus/)
  assert.match(adminService, /status:\s*getDisplayVerificationStatus\(download\.verificationStatus\)/)
  assert.match(repository, /export function verifyActiveEmployeeDownloadByReceiver/)
  assert.match(repository, /verificationStatus:\s*'verified'/)
  assert.match(repository, /verifiedAt:\s*new Date\(\)/)
  assert.match(referralService, /export async function verifyRegisteredReceiver/)
  assert.match(referralService, /verifyActiveEmployeeDownloadByReceiver\(prisma, normalizedEmployeeId\)/)
  assert.doesNotMatch(adminService, /verifiedReceiverIdSuffixes/)
  assert.doesNotMatch(adminService, /unverifiedReceiverIdSuffixes/)
  assert.doesNotMatch(adminService, /getMockVerificationStatus/)
})

test('share page only validates employee identity before download, not app registration', () => {
  const sharePage = readProjectFile('pages/friend-invite-friend/shareapp/[shareId].vue')
  const employeeApi = readProjectFile('server/api/employees/[employeeId].get.ts')

  assert.match(sharePage, /\/api\/employees\/\$\{encodeURIComponent\(employeeIdToLookup\)\}/)
  assert.match(sharePage, /receiverLookupStatus\.value = employee \? ["']found["'] : ["']not-found["']/)
  assert.match(sharePage, /downloadReceiverEmployee\.value = employee/)
  assert.match(employeeApi, /findHrEmployeeByEmpId\(prisma, parsedEmployeeId\.data\)/)
  assert.doesNotMatch(sharePage, /register/i)
})
