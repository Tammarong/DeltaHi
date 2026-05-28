import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function readProjectFile(path) {
  return readFileSync(resolve(rootDir, path), 'utf8')
}

test('Prisma schema models external Delta references and local referral relations', () => {
  const schema = readProjectFile('prisma/schema.prisma')

  assert.match(schema, /schemas\s*=\s*\[[\s\S]*"service_user"[\s\S]*"dbo"[\s\S]*\]/)
  assert.match(schema, /model ServiceUser[\s\S]*@@schema\("service_user"\)/)
  assert.match(schema, /model HrEmployeeBasicInfo[\s\S]*@@schema\("dbo"\)/)
  assert.match(schema, /employee\s+HrEmployeeBasicInfo\s+@relation\(fields: \[employeeId\], references: \[empid\]/)
  assert.match(schema, /receiverEmployee\s+HrEmployeeBasicInfo\s+@relation\(fields: \[recieverEmpId\], references: \[empid\]/)
})

test('migration adds required foreign keys without creating external Delta tables', () => {
  const migration = readProjectFile('prisma/migrations/20260528000000_referral_two_table_schema/migration.sql')

  assert.match(migration, /REFERENCES "service_user"\."users"\("id"\)/)
  assert.match(migration, /REFERENCES "dbo"\."v_HR_EXP_EmpBasicInfo"\("empid"\)/)
  assert.doesNotMatch(migration, /CREATE TABLE "service_user"\."users"/)
  assert.doesNotMatch(migration, /CREATE TABLE "dbo"\."v_HR_EXP_EmpBasicInfo"/)
})

test('example data includes rows for all referenced tables', () => {
  const seedPath = resolve(rootDir, 'prisma/example-data.sql')
  assert.equal(existsSync(seedPath), true)

  const seedSql = readFileSync(seedPath, 'utf8')
  assert.match(seedSql, /INSERT INTO "service_user"\."users"/)
  assert.match(seedSql, /INSERT INTO "dbo"\."v_HR_EXP_EmpBasicInfo"/)
  assert.match(seedSql, /INSERT INTO "employee_share"/)
  assert.match(seedSql, /INSERT INTO "employee_download"/)
})

test('download service rejects referrers submitting their own employee ID', () => {
  const service = readProjectFile('server/services/referralService.ts')
  const selfReferralGuard = /share\.employeeId\.trim\(\)\.toUpperCase\(\)\s*===\s*input\.recieverEmpId\.trim\(\)\.toUpperCase\(\)/

  assert.match(service, selfReferralGuard)
  assert.match(service, /Referrer cannot submit their own employee ID\./)
  assert.ok(
    service.indexOf('Referrer cannot submit their own employee ID.') <
      service.indexOf('return await createEmployeeDownload'),
    'self-referral guard must run before creating employee_download'
  )
})

test('shareapp referral route exists at the top-level Nuxt route path', () => {
  const shareappRoutePath = resolve(rootDir, 'pages/shareapp/[shareId].vue')
  const nestedShareappRoutePath = resolve(rootDir, 'pages/share/shareapp/[shareId].vue')

  assert.equal(existsSync(shareappRoutePath), true)
  assert.equal(existsSync(nestedShareappRoutePath), false)
  assert.match(readProjectFile('server/utils/referral.ts'), /\/shareapp\/\$\{employeeShareId\}/)
})

test('first page automatically renders a QR when main app sends employeeShareId', () => {
  const indexPage = readProjectFile('pages/index.vue')

  assert.match(indexPage, /const route = useRoute\(\)/)
  assert.match(indexPage, /import QRCode from 'qrcode'/)
  assert.match(indexPage, /const employeeShareIdFromQuery = computed/)
  assert.match(indexPage, /route\.query\.employeeShareId/)
  assert.match(indexPage, /type GetEmployeeShareResponse =/)
  assert.match(indexPage, /async function loadShareQrById\(employeeShareId: string\)/)
  assert.match(indexPage, /\$fetch<GetEmployeeShareResponse>\(\s*`\/api\/shares\/\$\{encodeURIComponent\(employeeShareId\)\}`/)
  assert.match(indexPage, /await renderShareQr\(share\)/)
  assert.match(indexPage, /onMounted\(\(\) =>/)
  assert.match(indexPage, /void loadShareQrById\(employeeShareIdFromQuery\.value\)/)
  assert.match(indexPage, /Loading referral QR/)
  assert.match(indexPage, /Referral QR is unavailable\./)
  assert.doesNotMatch(indexPage, /Create referral QR/)
  assert.doesNotMatch(indexPage, /User ID/)
  assert.doesNotMatch(indexPage, /Employee ID/)
  assert.doesNotMatch(indexPage, /Create QR/)
  assert.doesNotMatch(indexPage, /api\/employee-shares/)
  assert.doesNotMatch(indexPage, /normalizedUserId/)
  assert.doesNotMatch(indexPage, /normalizedEmployeeId/)
  assert.doesNotMatch(indexPage, /ServiceUser/)

  const packageJson = JSON.parse(readProjectFile('package.json'))
  assert.equal(packageJson.dependencies.qrcode, '^1.5.4')
  assert.equal(packageJson.devDependencies['@types/qrcode'], '^1.5.6')
})

test('share page opens the download popup instead of navigating to the download page', () => {
  const sharePage = readProjectFile('pages/shareapp/[shareId].vue')

  assert.doesNotMatch(sharePage, /path:\s*'\/download'/)
  assert.doesNotMatch(sharePage, /receiverEmployeeFound:/)
  assert.doesNotMatch(sharePage, /receiverName:/)
  assert.match(sharePage, /const showDownloadDialog = ref\(false\)/)
  assert.match(sharePage, /showDownloadDialog\.value = true/)
  assert.match(sharePage, /v-if="showDownloadDialog"/)
  assert.match(sharePage, /\$fetch\('\/api\/downloads'/)
  assert.match(sharePage, /method:\s*'POST'/)
  assert.match(sharePage, /employeeShareId:\s*shareId\.value/)
  assert.match(sharePage, /recieverEmpId:\s*downloadReceiverEmpId\.value/)
  assert.match(sharePage, /@click="downloadApp"/)
})

test('share page validates receiver employee before showing the download popup', () => {
  const employeeApiPath = resolve(rootDir, 'server/api/employees/[employeeId].get.ts')
  const sharePage = readProjectFile('pages/shareapp/[shareId].vue')

  assert.equal(existsSync(employeeApiPath), true)
  assert.match(readProjectFile('server/api/employees/[employeeId].get.ts'), /findHrEmployeeByEmpId/)
  assert.match(sharePage, /\$fetch<EmployeeLookupResponse>\(\s*`\/api\/employees\/\$\{encodeURIComponent\(employeeIdToLookup\)\}`/)
  assert.match(sharePage, /downloadReceiverEmployee\.value = employee/)
  assert.match(sharePage, /downloadReceiverEmpId\.value = normalizedEmployeeId\.value/)
  assert.doesNotMatch(sharePage, /receiverEmployeeFound/)
  assert.doesNotMatch(sharePage, /receiverName/)
  assert.match(sharePage, /placeholder="Example: EMP006"/)
  assert.match(sharePage, /downloadReceiverEmployee/)
  assert.match(sharePage, /Employee ID \{\{ downloadReceiverEmpId \}\} was not found/)
})

test('share page debounces employee lookup while typing employee ID', () => {
  const sharePage = readProjectFile('pages/shareapp/[shareId].vue')

  assert.match(sharePage, /const employeeLookupDelayMs = 400/)
  assert.match(sharePage, /watch\(employeeId/)
  assert.match(sharePage, /clearTimeout\(employeeLookupTimeout\)/)
  assert.match(sharePage, /setTimeout\(\(\) =>/)
  assert.match(sharePage, /lookupEmployeeById\(employeeIdToLookup\)/)
  assert.match(sharePage, /receiverLookupStatus/)
  assert.match(sharePage, /Employee verified:/)
  assert.match(sharePage, /Employee ID \{\{ normalizedEmployeeId \}\} was not found/)
})

test('local PostgreSQL setup exists for Prisma Studio', () => {
  const composePath = resolve(rootDir, 'docker-compose.yml')
  const initPath = resolve(rootDir, 'prisma/local-reference-schema.sql')
  assert.equal(existsSync(composePath), true)
  assert.equal(existsSync(initPath), true)

  const packageJson = JSON.parse(readProjectFile('package.json'))
  assert.equal(packageJson.scripts['db:up'], 'docker compose up -d --wait postgres')
  assert.equal(packageJson.scripts['db:setup'], 'npm run db:up && npm run prisma:push && npm run db:seed')
  assert.equal(packageJson.scripts['db:studio'], 'prisma studio')
  assert.equal(packageJson.scripts['dev:clean'], 'nuxt cleanup && nuxt dev')
})
