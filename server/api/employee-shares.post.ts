import { createEmployeeShareSchema } from '../../shared/schemas/referral'
import { createOrUpdateEmployeeShare } from '../services/referralService'

export default defineEventHandler(async (event) => {
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
