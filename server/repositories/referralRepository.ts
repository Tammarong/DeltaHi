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
    },
    include: {
      employee: true
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

export function upsertServiceUserReference(
  db: PrismaTransaction,
  data: {
    id: string
    employeeId: string
  }
) {
  return db.serviceUser.upsert({
    where: {
      id: data.id
    },
    create: {
      id: data.id,
      employeeId: data.employeeId
    },
    update: {
      employeeId: data.employeeId
    }
  })
}

export function upsertHrEmployeeReference(
  db: PrismaTransaction,
  data: {
    empid: string
    employeeName?: string | null
  }
) {
  const employeeName = data.employeeName?.trim() || null

  return db.hrEmployeeBasicInfo.upsert({
    where: {
      empid: data.empid
    },
    create: {
      empid: data.empid,
      name: employeeName,
      surname: null
    },
    update: employeeName
      ? {
          name: employeeName
        }
      : {}
  })
}

export function upsertEmployeeShare(
  db: PrismaTransaction,
  data: {
    userId: string
    employeeId: string
    employeeName: string
    pointBalance: number | null
  }
) {
  return db.employeeShare.upsert({
    where: {
      userId: data.userId
    },
    create: {
      userId: data.userId,
      employeeId: data.employeeId,
      employeeName: data.employeeName,
      pointBalance: data.pointBalance
    },
    update: {
      employeeId: data.employeeId,
      employeeName: data.employeeName,
      pointBalance: data.pointBalance,
      deletedAt: null
    },
    include: {
      employee: true
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

export function verifyActiveEmployeeDownloadByReceiver(
  db: PrismaTransaction,
  recieverEmpId: string
) {
  return db.employeeDownload.updateMany({
    where: {
      recieverEmpId,
      ...activeRecord
    },
    data: {
      verificationStatus: 'verified',
      verifiedAt: new Date()
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
      receiverEmployee: true,
      share: {
        include: {
          employee: true
        }
      }
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
      receiverEmployee: true,
      share: {
        include: {
          employee: true
        }
      }
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
      receiverEmployee: true,
      share: {
        include: {
          employee: true
        }
      }
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
    },
    include: {
      employee: true
    }
  })
}
