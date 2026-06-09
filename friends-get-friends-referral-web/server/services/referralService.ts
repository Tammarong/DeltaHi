import { Prisma } from '@prisma/client'
import { createError } from 'h3'
import type { CreateEmployeeDownloadInput, CreateEmployeeShareInput } from '../../shared/schemas/referral'
import {
  createEmployeeDownload,
  findActiveEmployeeDownloadByReceiver,
  findActiveEmployeeShareById,
  findHrEmployeeByEmpId,
  findServiceUserById,
  updateEmployeeDownloadOs,
  verifyActiveEmployeeDownloadByReceiver,
  upsertEmployeeShare
} from '../repositories/referralRepository'
import { prisma } from '../utils/prisma'
import { getEmployeeDisplayName, toPublicEmployeeDownload, toPublicEmployeeShare } from '../utils/referral'

export async function getEmployeeShare(shareId: string, siteUrl: string) {
  const share = await findActiveEmployeeShareById(prisma, shareId)

  if (!share) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Referral link is invalid or expired.'
    })
  }

  return toPublicEmployeeShare(share, siteUrl)
}

export async function createOrUpdateEmployeeShare(input: CreateEmployeeShareInput, siteUrl: string) {
  const share = await prisma.$transaction(async (tx) => {
    const [user, employee] = await Promise.all([
      findServiceUserById(tx, input.userId),
      findHrEmployeeByEmpId(tx, input.employeeId)
    ])

    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User was not found.'
      })
    }

    if (!employee) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Employee was not found.'
      })
    }

    if (user.employeeId.toUpperCase() !== input.employeeId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Employee ID does not match this user.'
      })
    }

    return upsertEmployeeShare(tx, {
      ...input,
      employeeName: getEmployeeDisplayName(employee) || input.employeeId
    })
  })

  return toPublicEmployeeShare(share, siteUrl)
}

export async function recordEmployeeDownload(input: CreateEmployeeDownloadInput) {
  const download = await prisma.$transaction(async (tx) => {
    const share = await findActiveEmployeeShareById(tx, input.employeeShareId)

    if (!share) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Referral link is invalid or expired.'
      })
    }

    if (share.employeeId.trim().toUpperCase() === input.recieverEmpId.trim().toUpperCase()) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Referrer cannot submit their own employee ID.'
      })
    }

    const receiverEmployee = await findHrEmployeeByEmpId(tx, input.recieverEmpId)

    if (!receiverEmployee) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Receiver employee ID was not found.'
      })
    }

    const existingDownload = await findActiveEmployeeDownloadByReceiver(tx, input.recieverEmpId)

    if (existingDownload) {
      if (existingDownload.employeeShareId !== input.employeeShareId) {
        throw createError({
          statusCode: 409,
          statusMessage: 'This employee ID has already been submitted for another referral.'
        })
      }

      if (existingDownload.os === 'unknown' && input.os !== 'unknown') {
        return await updateEmployeeDownloadOs(tx, existingDownload.id, input.os)
      }

      return existingDownload
    }

    try {
      return await createEmployeeDownload(tx, input)
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw createError({
          statusCode: 409,
          statusMessage: 'This employee ID has already been submitted.'
        })
      }

      throw error
    }
  })

  return toPublicEmployeeDownload(download)
}

export async function verifyRegisteredReceiver(employeeId: string) {
  const normalizedEmployeeId = employeeId.trim().toUpperCase()

  if (!normalizedEmployeeId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Employee ID is required.'
    })
  }

  const result = await verifyActiveEmployeeDownloadByReceiver(prisma, normalizedEmployeeId)

  if (!result.count) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Download record was not found.'
    })
  }

  return {
    employeeId: normalizedEmployeeId,
    verificationStatus: 'verified' as const
  }
}
