import { z } from 'zod'

export const shareIdSchema = z
  .string()
  .trim()
  .uuid('Referral link is invalid.')

export const employeeIdSchema = z
  .string()
  .trim()
  .min(1, 'Enter your Employee ID.')
  .max(40, 'Employee ID is too long.')
  .transform((value) => value.toUpperCase())

export const userIdSchema = z
  .string()
  .trim()
  .uuid('User ID is invalid.')

export const pointBalanceSchema = z.preprocess((value) => {
  if (value === undefined || value === null || value === '') {
    return null
  }

  if (typeof value === 'string') {
    return Number(value)
  }

  return value
}, z.number().int('Point balance must be a whole number.').min(0, 'Point balance cannot be negative.').nullable())

export const employeeNameSchema = z.preprocess((value) => {
  if (value === undefined || value === null) {
    return null
  }

  if (typeof value === 'string') {
    return value.trim() || null
  }

  return value
}, z.string().max(255, 'Employee name is too long.').nullable()).optional()

export const createEmployeeShareSchema = z.object({
  userId: userIdSchema,
  employeeId: employeeIdSchema,
  employeeName: employeeNameSchema,
  pointBalance: pointBalanceSchema
})

export const downloadOsSchema = z.enum(['ios', 'android', 'unknown'])

export const createEmployeeDownloadSchema = z.object({
  employeeShareId: shareIdSchema,
  recieverEmpId: employeeIdSchema,
  os: downloadOsSchema.default('unknown')
})

export const downloadIdSchema = z.string().trim().uuid('Download record is invalid.')

export const tutorialSchema = z.object({
  os: z.enum(['ios', 'android'])
})

export type TutorialOs = z.infer<typeof tutorialSchema>['os']
export type DownloadOs = z.infer<typeof downloadOsSchema>
export type CreateEmployeeShareInput = z.infer<typeof createEmployeeShareSchema>
export type CreateEmployeeDownloadInput = z.infer<typeof createEmployeeDownloadSchema>
