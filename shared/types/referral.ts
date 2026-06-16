export type PublicEmployeeShare = {
  id: string
  employeeId: string
  shareUrl: string
  createdAt: string
  updatedAt: string
}

export type PublicEmployeeDownload = {
  id: string
  employeeShareId: string
  recieverEmpId: string
  os: string
  createdAt: string
  updatedAt: string
}
