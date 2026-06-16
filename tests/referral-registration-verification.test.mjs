import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function readProjectFile(path) {
  return readFileSync(resolve(rootDir, path), 'utf8')
}

test('QA test case documents the expected record-only rule', () => {
  const qaTestCases = readProjectFile('Test_Case.md')

  assert.match(qaTestCases, /The share app is a record-only referral workflow/)
  assert.match(qaTestCases, /clicking `Download App` records an `employee_download` row/)
  assert.match(qaTestCases, /does not wait for app registration or a main app callback/)
  assert.doesNotMatch(qaTestCases, /status `Unverified`/)
  assert.doesNotMatch(qaTestCases, /status `Verified`/)
})

test('dashboard is record-only and does not expose registration verification workflow', () => {
  const adminService = readProjectFile('server/services/adminDashboardService.ts')
  const adminPage = readProjectFile('pages/friend-get-friend/admin.vue')
  const adminApi = readProjectFile('server/api/admin/dashboard.get.ts')
  const adminCsvApi = readProjectFile('server/api/admin/downloads.csv.get.ts')
  const schema = readProjectFile('prisma/schema.prisma')
  const migration = readProjectFile('prisma/migrations/20260615000000_remove_download_verification_status/migration.sql')
  const repository = readProjectFile('server/repositories/referralRepository.ts')
  const referralService = readProjectFile('server/services/referralService.ts')
  const publicTypes = readProjectFile('shared/types/referral.ts')
  const utils = readProjectFile('server/utils/referral.ts')

  assert.match(adminService, /recordedReceivers:\s*campaignReceivers\.length/)
  assert.match(adminService, /activeReferrers:\s*downloadsByShare\.length/)
  assert.match(adminPage, /Total Downloads/)
  assert.match(adminPage, /Recorded Receivers/)
  assert.match(adminPage, /Active Referrers/)
  assert.doesNotMatch(adminApi, /verificationStatus/)
  assert.doesNotMatch(adminCsvApi, /verificationStatus/)
  assert.doesNotMatch(adminPage, /verificationStatusFilter/)
  assert.doesNotMatch(adminPage, /All Status/)
  assert.doesNotMatch(adminPage, /Verified/)
  assert.doesNotMatch(adminPage, /Unverified/)
  assert.doesNotMatch(adminService, /getDisplayVerificationStatus/)
  assert.doesNotMatch(adminService, /verificationStatus/)
  assert.doesNotMatch(schema, /verificationStatus/)
  assert.doesNotMatch(schema, /verifiedAt/)
  assert.match(migration, /DROP COLUMN IF EXISTS "verification_status"/)
  assert.match(migration, /DROP COLUMN IF EXISTS "verified_at"/)
  assert.doesNotMatch(repository, /verifyActiveEmployeeDownloadByReceiver/)
  assert.doesNotMatch(repository, /verifiedAt:\s*new Date\(\)/)
  assert.doesNotMatch(referralService, /verifyRegisteredReceiver/)
  assert.doesNotMatch(referralService, /verifyActiveEmployeeDownloadByReceiver/)
  assert.doesNotMatch(publicTypes, /verificationStatus/)
  assert.doesNotMatch(publicTypes, /verifiedAt/)
  assert.doesNotMatch(utils, /verificationStatus:\s*download\.verificationStatus/)
  assert.doesNotMatch(utils, /verifiedAt:\s*download\.verifiedAt/)
})

test('share page accepts free-form employee ID before download, not app registration', () => {
  const sharePage = readProjectFile('pages/friend-get-friend/shareapp/[shareId].vue')

  assert.match(sharePage, /downloadReceiverEmpId\.value = normalizedEmployeeId\.value/)
  assert.match(sharePage, /\$fetch\(["']\/api\/downloads["']/)
  assert.doesNotMatch(sharePage, /\/api\/employees\/\$\{encodeURIComponent/)
  assert.doesNotMatch(sharePage, /receiverLookupStatus/)
  assert.doesNotMatch(sharePage, /downloadReceiverEmployee/)
  assert.doesNotMatch(sharePage, /register/i)
})
