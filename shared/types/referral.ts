export type PublicEmployeeShare = {
  id: string
  userId: string
  employeeId: string
  employeeName: string
  pointBalance: number | null
  shareUrl: string
  createdAt: string
  updatedAt: string
}

export type PublicEmployeeDownload = {
  id: string
  employeeShareId: string
  recieverEmpId: string
  os: string
  verificationStatus: 'unverified' | 'verified'
  verifiedAt: string | null
  createdAt: string
  updatedAt: string
}
