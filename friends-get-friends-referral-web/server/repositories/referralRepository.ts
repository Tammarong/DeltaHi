import type { Prisma, PrismaClient } from '@prisma/client'

type PrismaTransaction = Prisma.TransactionClient | PrismaClient

const activeRecord = {
  deletedAt: null
} as const

export function findActiveEmployeeShareById(db: PrismaTransaction, id: string) {
  return db.employeeShare.findFirst({
    where: {
      id,
      ...activeRecord
    }
  })
}

export function findActiveEmployeeShareByUserId(db: PrismaTransaction, userId: string) {
  return db.employeeShare.findFirst({
    where: {
      userId,
      ...activeRecord
    }
  })
}

export function findServiceUserById(db: PrismaTransaction, id: string) {
  return db.serviceUser.findUnique({
    where: { id }
  })
}

export function findHrEmployeeByEmpId(db: PrismaTransaction, empid: string) {
  return db.hrEmployeeBasicInfo.findUnique({
    where: { empid }
  })
}

export function upsertEmployeeShare(
  db: PrismaTransaction,
  data: {
    userId: string
    employeeId: string
  }
) {
  return db.employeeShare.upsert({
    where: {
      userId: data.userId
    },
    create: {
      userId: data.userId,
      employeeId: data.employeeId
    },
    update: {
      employeeId: data.employeeId,
      deletedAt: null
    }
  })
}

export function createEmployeeDownload(
  db: PrismaTransaction,
  data: {
    employeeShareId: string
    recieverEmpId: string
  }
) {
  return db.employeeDownload.create({
    data
  })
}

export function findActiveEmployeeDownloadByShareAndReceiver(
  db: PrismaTransaction,
  data: {
    employeeShareId: string
    recieverEmpId: string
  }
) {
  return db.employeeDownload.findFirst({
    where: {
      employeeShareId: data.employeeShareId,
      recieverEmpId: data.recieverEmpId,
      ...activeRecord
    }
  })
}
