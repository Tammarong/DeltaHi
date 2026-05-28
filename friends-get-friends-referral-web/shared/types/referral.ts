export type PublicEmployeeShare = {
  id: string
  userId: string
  employeeId: string
  shareUrl: string
  createdAt: string
  updatedAt: string
}

export type PublicEmployeeDownload = {
  id: string
  employeeShareId: string
  recieverEmpId: string
  createdAt: string
  updatedAt: string
}
