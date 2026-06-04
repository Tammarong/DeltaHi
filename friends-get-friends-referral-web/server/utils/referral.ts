import type { EmployeeDownload, EmployeeShare } from '@prisma/client'

export function buildShareUrl(siteUrl: string, employeeShareId: string) {
  return `${siteUrl.replace(/\/$/, '')}/shareapp/${employeeShareId}`
}

export function toPublicEmployeeShare(share: EmployeeShare, siteUrl: string) {
  return {
    id: share.id,
    userId: share.userId,
    employeeId: share.employeeId,
    shareUrl: buildShareUrl(siteUrl, share.id),
    createdAt: share.createdAt,
    updatedAt: share.updatedAt
  }
}

export function toPublicEmployeeDownload(download: EmployeeDownload) {
  return {
    id: download.id,
    employeeShareId: download.employeeShareId,
    recieverEmpId: download.recieverEmpId,
    os: download.os,
    createdAt: download.createdAt,
    updatedAt: download.updatedAt
  }
}
