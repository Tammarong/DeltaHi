import { createEmployeeDownloadSchema } from '../../shared/schemas/referral'
import { recordEmployeeDownload } from '../services/referralService'

export default defineEventHandler(async (event) => {
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
