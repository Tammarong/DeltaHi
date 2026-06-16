import { createEmployeeDownloadSchema } from '~/shared/schemas/referral'
import { recordEmployeeDownload } from '../services/referralService'
import { assertRateLimit } from '../utils/rateLimit'

export default defineEventHandler(async (event) => {
  assertRateLimit(event, {
    keyPrefix: 'downloads',
    limit: 60,
    windowMs: 60_000
  })

  const body = await readBody(event)
  const parsedBody = createEmployeeDownloadSchema.safeParse(body)

  if (!parsedBody.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsedBody.error.issues[0]?.message || 'Check your referral details.'
    })
  }

  const download = await recordEmployeeDownload(parsedBody.data)

  return { download }
})
