import { createEmployeeShareSchema } from '../../shared/schemas/referral'
import { createOrUpdateEmployeeShare } from '../services/referralService'
import { assertRateLimit } from '../utils/rateLimit'

export default defineEventHandler(async (event) => {
  assertRateLimit(event, {
    keyPrefix: 'employee-shares',
    limit: 20,
    windowMs: 60_000
  })

  const parsedBody = createEmployeeShareSchema.safeParse(await readBody(event))

  if (!parsedBody.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsedBody.error.issues[0]?.message || 'Check employee share details.'
    })
  }

  const config = useRuntimeConfig(event)
  const share = await createOrUpdateEmployeeShare(parsedBody.data, config.siteUrl)

  return { share }
})
