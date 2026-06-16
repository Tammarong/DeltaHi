import { employeeIdSchema } from '../../../shared/schemas/referral'
import { assertRateLimit } from '../../utils/rateLimit'

export default defineEventHandler(async (event) => {
  assertRateLimit(event, {
    keyPrefix: 'employees',
    limit: 120,
    windowMs: 60_000
  })

  const parsedEmployeeId = employeeIdSchema.safeParse(getRouterParam(event, 'employeeId'))

  if (!parsedEmployeeId.success) {
    return { employee: null }
  }

  const employeeId = parsedEmployeeId.data

  return {
    employee: {
      empid: employeeId,
      name: null,
      surname: null,
      displayName: employeeId
    }
  }
})
