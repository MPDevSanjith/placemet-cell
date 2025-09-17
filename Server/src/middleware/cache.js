import crypto from 'crypto'

const memoryCache = new Map()

export function cacheSeconds(seconds = 10) {
  return (req, res, next) => {
    if (req.method !== 'GET') return next()
    const keyRaw = `${req.originalUrl}|auth:${req.headers.authorization || ''}`
    const key = crypto.createHash('md5').update(keyRaw).digest('hex')
    const entry = memoryCache.get(key)
    const now = Date.now()
    if (entry && entry.expiry > now) {
      res.set('X-Cache', 'HIT')
      return res.status(200).json(entry.payload)
    }

    const json = res.json.bind(res)
    res.json = (body) => {
      try {
        memoryCache.set(key, { expiry: now + seconds * 1000, payload: body })
        res.set('X-Cache', 'MISS')
      } catch {}
      return json(body)
    }
    next()
  }
}


