import crypto from 'crypto'

const memoryCache = new Map()

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of memoryCache.entries()) {
    if (entry.expiry <= now) {
      memoryCache.delete(key)
    }
  }
}, 5 * 60 * 1000)

export function cacheSeconds(seconds = 10) {
  return (req, res, next) => {
    if (req.method !== 'GET') return next()
    const keyRaw = `${req.originalUrl}|auth:${req.headers.authorization || ''}`
    const key = crypto.createHash('md5').update(keyRaw).digest('hex')
    const entry = memoryCache.get(key)
    const now = Date.now()
    if (entry && entry.expiry > now) {
      res.set('X-Cache', 'HIT')
      res.set('Cache-Control', `public, max-age=${Math.ceil((entry.expiry - now) / 1000)}`)
      return res.status(200).json(entry.payload)
    }

    const json = res.json.bind(res)
    res.json = (body) => {
      try {
        memoryCache.set(key, { expiry: now + seconds * 1000, payload: body })
        res.set('X-Cache', 'MISS')
        res.set('Cache-Control', `public, max-age=${seconds}`)
      } catch {}
      return json(body)
    }
    next()
  }
}

// Longer cache for static data
export function cacheMinutes(minutes = 5) {
  return cacheSeconds(minutes * 60)
}

// Very long cache for rarely changing data
export function cacheHours(hours = 1) {
  return cacheSeconds(hours * 60 * 60)
}


