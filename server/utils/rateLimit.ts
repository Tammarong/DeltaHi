import { createError, getRequestHeader, setHeader, type H3Event } from 'h3'

type RateLimitOptions = {
  keyPrefix: string
  limit: number
  windowMs: number
}

type RateLimitBucket = {
  count: number
  resetAt: number
}

const globalForRateLimit = globalThis as unknown as {
  __deltahiRateLimitBuckets?: Map<string, RateLimitBucket>
}

const buckets = globalForRateLimit.__deltahiRateLimitBuckets ?? new Map<string, RateLimitBucket>()
globalForRateLimit.__deltahiRateLimitBuckets = buckets

function getClientIp(event: H3Event) {
  const forwardedFor = getRequestHeader(event, 'x-forwarded-for')
  const realIp = getRequestHeader(event, 'x-real-ip')
  const cfConnectingIp = getRequestHeader(event, 'cf-connecting-ip')
  const candidate = forwardedFor?.split(',')[0]?.trim() || realIp || cfConnectingIp

  return candidate || event.node.req.socket.remoteAddress || 'unknown'
}

function cleanupExpiredBuckets(now: number) {
  if (buckets.size < 1000) {
    return
  }

  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key)
    }
  }
}

export function assertRateLimit(event: H3Event, options: RateLimitOptions) {
  const now = Date.now()
  const key = `${options.keyPrefix}:${getClientIp(event)}`
  const existingBucket = buckets.get(key)
  const bucket = existingBucket && existingBucket.resetAt > now
    ? existingBucket
    : {
        count: 0,
        resetAt: now + options.windowMs
      }

  bucket.count += 1
  buckets.set(key, bucket)
  cleanupExpiredBuckets(now)

  const remaining = Math.max(0, options.limit - bucket.count)
  const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))

  setHeader(event, 'X-RateLimit-Limit', String(options.limit))
  setHeader(event, 'X-RateLimit-Remaining', String(remaining))
  setHeader(event, 'X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)))

  if (bucket.count > options.limit) {
    setHeader(event, 'Retry-After', retryAfterSeconds)

    throw createError({
      statusCode: 429,
      statusMessage: 'Too many requests. Please try again later.'
    })
  }
}
