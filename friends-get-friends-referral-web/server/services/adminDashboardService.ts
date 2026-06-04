import {
  countActiveEmployeeDownloads,
  findActiveEmployeeSharesByIds,
  findRecentActiveEmployeeDownloads,
  groupActiveEmployeeDownloadsByReceiver,
  groupActiveEmployeeDownloadsByShare
} from '../repositories/referralRepository'
import { prisma } from '../utils/prisma'

function getDisplayName(employee: { name: string | null, surname: string | null, empid: string }) {
  const name = [employee.name, employee.surname].filter(Boolean).join(' ').trim()

  return name || employee.empid
}

type AdminDashboardOptions = {
  page?: number
  pageSize?: number
}

function normalizePositiveInteger(value: number | undefined, fallback: number) {
  if (!value || !Number.isFinite(value)) {
    return fallback
  }

  return Math.max(1, Math.floor(value))
}

export async function getAdminDashboard(options: AdminDashboardOptions = {}) {
  const requestedPage = normalizePositiveInteger(options.page, 1)
  const pageSize = Math.min(normalizePositiveInteger(options.pageSize, 10), 50)
  const [
    totalDownloads,
    receivers,
    downloadsByShare
  ] = await Promise.all([
    countActiveEmployeeDownloads(prisma),
    groupActiveEmployeeDownloadsByReceiver(prisma),
    groupActiveEmployeeDownloadsByShare(prisma)
  ])
  const pageCount = Math.max(1, Math.ceil(totalDownloads / pageSize))
  const page = Math.min(requestedPage, pageCount)
  const skip = (page - 1) * pageSize
  const recentDownloads = await findRecentActiveEmployeeDownloads(prisma, pageSize, skip)

  const topShareIds = downloadsByShare.slice(0, 38).map((group) => group.employeeShareId)
  const topShares = await findActiveEmployeeSharesByIds(prisma, topShareIds)
  const topShareById = new Map(topShares.map((share) => [share.id, share]))
  const topPioneers = downloadsByShare
    .slice(0, 38)
    .map((group, index) => {
      const share = topShareById.get(group.employeeShareId)

      return {
        rank: index + 1,
        name: share ? getDisplayName(share.employee) : group.employeeShareId,
        employeeId: share?.employeeId ?? '',
        refers: group._count._all,
        qualified: index === 0
      }
    })

  return {
    stats: {
      totalDownloads,
      newUsers: receivers.length,
      first38Users: Math.min(totalDownloads, 38),
      pioneerSlots: 38,
      avgRefers: downloadsByShare.length
        ? Number((totalDownloads / downloadsByShare.length).toFixed(1))
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
      status: 'Downloaded'
    })),
    pagination: {
      page,
      pageSize,
      total: totalDownloads,
      pageCount
    },
    topPioneers
  }
}
