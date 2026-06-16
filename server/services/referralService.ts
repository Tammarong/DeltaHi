import { Prisma } from '@prisma/client'
import { createError } from 'h3'
import type { CreateEmployeeDownloadInput, CreateEmployeeShareInput } from '../../shared/schemas/referral'
import {
  createEmployeeShare,
  createEmployeeDownload,
  findActiveEmployeeDownloadByReceiver,
  findActiveEmployeeShareById,
  findEmployeeShareByEmployeeId,
  reactivateEmployeeShare,
  updateEmployeeDownloadOs,
} from '../repositories/referralRepository'
import { prisma } from '../utils/prisma'
import { toPublicEmployeeDownload, toPublicEmployeeShare } from '../utils/referral'

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
    const existingShare = await findEmployeeShareByEmployeeId(tx, input.employeeId)

    if (existingShare) {
      return reactivateEmployeeShare(tx, existingShare.id, input)
    }

    return createEmployeeShare(tx, input)
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
