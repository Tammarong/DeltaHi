import { shareIdSchema } from '../../../shared/schemas/referral'
import { getEmployeeShare } from '../../services/referralService'
import { assertRateLimit } from '../../utils/rateLimit'

export default defineEventHandler(async (event) => {
  assertRateLimit(event, {
    keyPrefix: 'shares',
    limit: 120,
    windowMs: 60_000
  })

  const parsedShareId = shareIdSchema.safeParse(getRouterParam(event, 'shareId'))

  if (!parsedShareId.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsedShareId.error.issues[0]?.message || 'Referral link is invalid.'
    })
  }

  const config = useRuntimeConfig(event)
  const share = await getEmployeeShare(parsedShareId.data, config.siteUrl)

  return { share }
})
