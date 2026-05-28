import { shareIdSchema } from '../../../shared/schemas/referral'
import { getEmployeeShare } from '../../services/referralService'

export default defineEventHandler(async (event) => {
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
