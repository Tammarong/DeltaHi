import {
  countActiveEmployeeDownloads,
  findActiveEmployeeDownloadsForExport,
  findActiveEmployeeSharesByIds,
  findFirstActiveEmployeeDownloads,
  findRecentActiveEmployeeDownloads,
  groupActiveEmployeeDownloadsByReceiver,
  groupActiveEmployeeDownloadsByShare
} from '../repositories/referralRepository'
import { prisma } from '../utils/prisma'
import type { Prisma } from '@prisma/client'

function getDisplayName(employee: { name: string | null, surname: string | null, empid: string }) {
  const name = [employee.name, employee.surname].filter(Boolean).join(' ').trim()

  return name || employee.empid
}

export type AdminDashboardOptions = {
  page?: number
  pageSize?: number
  search?: string
  os?: 'ios' | 'android' | 'unknown'
  verificationStatus?: 'verified' | 'unverified'
  dateFrom?: string
  dateTo?: string
}

function normalizePositiveInteger(value: number | undefined, fallback: number) {
  if (!value || !Number.isFinite(value)) {
    return fallback
  }

  return Math.max(1, Math.floor(value))
}

function getMockReferrerScore(refers: number, rank: number) {
  // Placeholder until the real referrer score API is connected.
  return (refers * 100) + Math.max(0, 39 - rank)
}

function getMockAllUsersFromApp() {
  // Placeholder until the real app user total API is connected.
  return 12840
}

function getDisplayVerificationStatus(status: string) {
  return status === 'verified' ? 'Verified' : 'Unverified'
}

function escapeCsvValue(value: string | number) {
  const stringValue = String(value)

  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replaceAll('"', '""')}"`
  }

  return stringValue
}

function toCsvRow(values: Array<string | number>) {
  return values.map(escapeCsvValue).join(',')
}

function parseBangkokDateStart(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return undefined
  }

  const date = new Date(`${value}T00:00:00+07:00`)

  return Number.isNaN(date.getTime()) ? undefined : date
}

function parseBangkokDateEnd(value: string | undefined) {
  const start = parseBangkokDateStart(value)

  if (!start) {
    return undefined
  }

  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 1)

  return end
}

function containsSearch(value: string): Prisma.StringFilter {
  return {
    contains: value,
    mode: 'insensitive'
  }
}

function addAndFilter(
  where: Prisma.EmployeeDownloadWhereInput,
  filter: Prisma.EmployeeDownloadWhereInput
) {
  where.AND = [...(Array.isArray(where.AND) ? where.AND : []), filter]
}

function getVerificationStatusWhere(
  verificationStatus: AdminDashboardOptions['verificationStatus']
): Prisma.EmployeeDownloadWhereInput | undefined {
  if (!verificationStatus) {
    return undefined
  }

  return {
    verificationStatus
  }
}

function buildDownloadWhere(options: AdminDashboardOptions): Prisma.EmployeeDownloadWhereInput {
  const where: Prisma.EmployeeDownloadWhereInput = {
    deletedAt: null
  }
  const search = options.search?.trim()
  const dateFrom = parseBangkokDateStart(options.dateFrom)
  const dateTo = parseBangkokDateEnd(options.dateTo)
  const verificationStatusWhere = getVerificationStatusWhere(options.verificationStatus)

  if (options.os) {
    where.os = options.os
  }

  if (dateFrom || dateTo) {
    where.createdAt = {
      ...(dateFrom ? { gte: dateFrom } : {}),
      ...(dateTo ? { lt: dateTo } : {})
    }
  }

  if (verificationStatusWhere) {
    addAndFilter(where, verificationStatusWhere)
  }

  if (search) {
    addAndFilter(where, {
      OR: [
        { recieverEmpId: containsSearch(search) },
        { os: containsSearch(search) },
        { receiverEmployee: { is: { empid: containsSearch(search) } } },
        { receiverEmployee: { is: { name: containsSearch(search) } } },
        { receiverEmployee: { is: { surname: containsSearch(search) } } },
        { share: { is: { employeeId: containsSearch(search) } } },
        { share: { is: { employee: { is: { empid: containsSearch(search) } } } } },
        { share: { is: { employee: { is: { name: containsSearch(search) } } } } },
        { share: { is: { employee: { is: { surname: containsSearch(search) } } } } }
      ]
    })
  }

  return where
}

export async function getAdminDashboard(options: AdminDashboardOptions = {}) {
  const requestedPage = normalizePositiveInteger(options.page, 1)
  const pageSize = Math.min(normalizePositiveInteger(options.pageSize, 10), 50)
  const downloadWhere = buildDownloadWhere(options)
  const campaignStatsWhere = buildDownloadWhere({
    ...options,
    verificationStatus: undefined
  })
  const verifiedCampaignStatsWhere = buildDownloadWhere({
    ...options,
    verificationStatus: 'verified'
  })
  const leaderboardWhere: Prisma.EmployeeDownloadWhereInput = {
    deletedAt: null
  }
  const [
    totalDownloads,
    verifiedReceivers,
    campaignReceivers,
    downloadsByShare,
    leaderboardDownloadsByShare
  ] = await Promise.all([
    countActiveEmployeeDownloads(prisma, downloadWhere),
    groupActiveEmployeeDownloadsByReceiver(prisma, verifiedCampaignStatsWhere),
    groupActiveEmployeeDownloadsByReceiver(prisma, campaignStatsWhere),
    groupActiveEmployeeDownloadsByShare(prisma, downloadWhere),
    groupActiveEmployeeDownloadsByShare(prisma, leaderboardWhere)
  ])
  const leaderboardTotalDownloads = leaderboardDownloadsByShare.reduce(
    (sum, group) => sum + group._count._all,
    0
  )
  const pageCount = Math.max(1, Math.ceil(totalDownloads / pageSize))
  const page = Math.min(requestedPage, pageCount)
  const skip = (page - 1) * pageSize
  const [recentDownloads, firstDownloads] = await Promise.all([
    findRecentActiveEmployeeDownloads(prisma, downloadWhere, pageSize, skip),
    findFirstActiveEmployeeDownloads(prisma, downloadWhere)
  ])
  const seenReceiverEmployeeIds = new Set<string>()
  const first38Winners = firstDownloads
    .filter((download) => {
      if (seenReceiverEmployeeIds.has(download.recieverEmpId)) {
        return false
      }

      seenReceiverEmployeeIds.add(download.recieverEmpId)
      return true
    })
    .slice(0, 38)
    .map((download, index) => ({
      rank: index + 1,
      name: getDisplayName(download.receiverEmployee),
      employeeId: download.recieverEmpId,
      referrerName: getDisplayName(download.share.employee),
      referrerEmpId: download.share.employeeId,
      os: download.os,
      downloadedAt: download.createdAt.toISOString()
    }))

  const topShareIds = leaderboardDownloadsByShare.slice(0, 38).map((group) => group.employeeShareId)
  const topShares = await findActiveEmployeeSharesByIds(prisma, topShareIds)
  const topShareById = new Map(topShares.map((share) => [share.id, share]))
  const topPioneers = leaderboardDownloadsByShare
    .slice(0, 38)
    .map((group, index) => {
      const share = topShareById.get(group.employeeShareId)

      return {
        rank: index + 1,
        name: share ? getDisplayName(share.employee) : group.employeeShareId,
        employeeId: share?.employeeId ?? '',
        refers: group._count._all,
        score: share?.pointBalance ?? getMockReferrerScore(group._count._all, index + 1),
        qualified: index === 0
      }
    })

  return {
    stats: {
      totalDownloads,
      allUsersFromApp: getMockAllUsersFromApp(),
      newUsers: verifiedReceivers.length,
      campaignUsers: campaignReceivers.length,
      first38Users: topPioneers.length,
      pioneerSlots: 38,
      avgRefers: leaderboardDownloadsByShare.length
        ? Number((leaderboardTotalDownloads / leaderboardDownloadsByShare.length).toFixed(1))
        : 0
    },
    recentDownloads: recentDownloads.map((download, index) => ({
      id: download.id,
      no: skip + index + 1,
      receiverName: getDisplayName(download.receiverEmployee),
      receiverEmpId: download.recieverEmpId,
      referrerName: getDisplayName(download.share.employee),
      referrerEmpId: download.share.employeeId,
      os: download.os,
      downloadedAt: download.createdAt.toISOString(),
      status: getDisplayVerificationStatus(download.verificationStatus)
    })),
    pagination: {
      page,
      pageSize,
      total: totalDownloads,
      pageCount
    },
    first38Winners,
    topPioneers
  }
}

export async function getAdminDownloadsCsv(options: AdminDashboardOptions = {}) {
  const downloadWhere = buildDownloadWhere(options)
  const downloads = await findActiveEmployeeDownloadsForExport(prisma, downloadWhere)
  const headers = [
    'No.',
    'User Name',
    'Employee ID',
    'Referrer Name',
    'Referrer ID',
    'OS',
    'Downloaded At',
    'Status'
  ]
  const rows = downloads.map((download, index) => toCsvRow([
    index + 1,
    getDisplayName(download.receiverEmployee),
    download.recieverEmpId,
    getDisplayName(download.share.employee),
    download.share.employeeId,
    download.os,
    download.createdAt.toISOString(),
    getDisplayVerificationStatus(download.verificationStatus)
  ]))

  return `\uFEFF${[toCsvRow(headers), ...rows].join('\n')}\n`
}
