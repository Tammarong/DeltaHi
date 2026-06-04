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

export const createEmployeeShareSchema = z.object({
  userId: userIdSchema,
  employeeId: employeeIdSchema
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
