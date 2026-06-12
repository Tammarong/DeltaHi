import type { EmployeeDownload, EmployeeShare, HrEmployeeBasicInfo } from '@prisma/client'

type EmployeeShareWithEmployee = EmployeeShare & {
  employee?: HrEmployeeBasicInfo | null
}

export function buildShareUrl(siteUrl: string, employeeShareId: string) {
  return `${siteUrl.replace(/\/$/, '')}/friend-invite-friend/shareapp/${employeeShareId}`
}

export function getEmployeeDisplayName(employee: Pick<HrEmployeeBasicInfo, 'empid' | 'name' | 'surname'> | null | undefined) {
  if (!employee) {
    return ''
  }

  return [employee.name, employee.surname].filter(Boolean).join(' ').trim() || employee.empid
}

export function toPublicEmployeeShare(share: EmployeeShareWithEmployee, siteUrl: string) {
  return {
    id: share.id,
    userId: share.userId,
    employeeId: share.employeeId,
    employeeName: share.employeeName?.trim() || getEmployeeDisplayName(share.employee) || share.employeeId,
    pointBalance: share.pointBalance,
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
    verificationStatus: download.verificationStatus,
    verifiedAt: download.verifiedAt,
    createdAt: download.createdAt,
    updatedAt: download.updatedAt
  }
}
