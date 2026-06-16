import { employeeIdSchema } from '../../../shared/schemas/referral'
import { assertRateLimit } from '../../utils/rateLimit'

type CheckUserRequestBody = {
  employee_id?: unknown
  employeeId?: unknown
}

function firstQueryValue(value: unknown) {
  if (Array.isArray(value)) {
    return value[0]
  }

  return value
}

export default defineEventHandler(async (event) => {
  assertRateLimit(event, {
    keyPrefix: 'check-user',
    limit: 30,
    windowMs: 60_000
  })

  const query = getQuery(event)
  const body =
    event.method === 'GET'
      ? {}
      : await readBody<CheckUserRequestBody>(event).catch(() => ({}))
  const rawEmployeeId =
    firstQueryValue(query.employee_id ?? query.employeeId) ??
    body.employee_id ??
    body.employeeId
  const parsedEmployeeId = employeeIdSchema.safeParse(rawEmployeeId)

  if (!parsedEmployeeId.success) {
    throw createError({
      statusCode: 400,
      statusMessage:
        parsedEmployeeId.error.issues[0]?.message || 'Employee ID is required.'
    })
  }

  const employeeId = parsedEmployeeId.data

  return {
    status: 200,
    message: 'Success',
    data: {
      created_at: null,
      updated_at: null,
      deleted_at: null,
      last_active: null,
      employee_id: employeeId,
      location_id: null,
      site_id: null,
      email: null,
      username: employeeId,
      avatar: null,
      avatar_frames: [],
      location: null,
      site: null,
      teams: [],
      type_account: 'user'
    }
  }
})
