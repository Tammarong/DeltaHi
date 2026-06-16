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

export function findEmployeeShareByEmployeeId(db: PrismaTransaction, employeeId: string) {
  return db.employeeShare.findFirst({
    where: {
      employeeId
    },
    orderBy: {
      createdAt: 'asc'
    }
  })
}

export function createEmployeeShare(
  db: PrismaTransaction,
  data: {
    employeeId: string
  }
) {
  return db.employeeShare.create({
    data: {
      employeeId: data.employeeId
    }
  })
}

export function reactivateEmployeeShare(
  db: PrismaTransaction,
  id: string,
  data: {
    employeeId: string
  }
) {
  return db.employeeShare.update({
    where: {
      id
    },
    data: {
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
    os: string
  }
) {
  return db.employeeDownload.create({
    data
  })
}

export function updateEmployeeDownloadOs(
  db: PrismaTransaction,
  id: string,
  os: string
) {
  return db.employeeDownload.update({
    where: {
      id
    },
    data: {
      os
    }
  })
}

export function findActiveEmployeeDownloadByReceiver(
  db: PrismaTransaction,
  recieverEmpId: string
) {
  return db.employeeDownload.findFirst({
    where: {
      recieverEmpId,
      ...activeRecord
    }
  })
}

export function countActiveEmployeeDownloads(
  db: PrismaTransaction,
  where: Prisma.EmployeeDownloadWhereInput = activeRecord
) {
  return db.employeeDownload.count({
    where
  })
}

export function findRecentActiveEmployeeDownloads(
  db: PrismaTransaction,
  where: Prisma.EmployeeDownloadWhereInput = activeRecord,
  take = 10,
  skip = 0
) {
  return db.employeeDownload.findMany({
    where,
    orderBy: {
      createdAt: 'desc'
    },
    take,
    skip,
    include: {
      share: true
    }
  })
}

export function findActiveEmployeeDownloadsForExport(
  db: PrismaTransaction,
  where: Prisma.EmployeeDownloadWhereInput = activeRecord,
  take = 5000
) {
  return db.employeeDownload.findMany({
    where,
    orderBy: {
      createdAt: 'desc'
    },
    take,
    include: {
      share: true
    }
  })
}

export function findFirstActiveEmployeeDownloads(
  db: PrismaTransaction,
  where: Prisma.EmployeeDownloadWhereInput = activeRecord,
  take = 5000
) {
  return db.employeeDownload.findMany({
    where,
    orderBy: {
      createdAt: 'asc'
    },
    take,
    include: {
      share: true
    }
  })
}

export function groupActiveEmployeeDownloadsByReceiver(
  db: PrismaTransaction,
  where: Prisma.EmployeeDownloadWhereInput = activeRecord
) {
  return db.employeeDownload.groupBy({
    by: ['recieverEmpId'],
    where
  })
}

export function groupActiveEmployeeDownloadsByShare(
  db: PrismaTransaction,
  where: Prisma.EmployeeDownloadWhereInput = activeRecord
) {
  return db.employeeDownload.groupBy({
    by: ['employeeShareId'],
    where,
    _count: {
      _all: true
    },
    orderBy: {
      _count: {
        employeeShareId: 'desc'
      }
    }
  })
}

export function findActiveEmployeeSharesByIds(db: PrismaTransaction, ids: string[]) {
  return db.employeeShare.findMany({
    where: {
      id: {
        in: ids
      },
      ...activeRecord
    }
  })
}
