import { timingSafeEqual } from 'node:crypto'

export const config = {
  api: {
    bodyParser: false
  }
}

export default async function handler(req, res) {
  const secret = process.env.DEMO_ACCESS_KEY
  const supplied = req.headers['x-api-key']

  if (!secret || !process.env.BACKEND_API_KEY || !process.env.BACKEND_URL) {
    return res.status(503).json({ detail: 'Server not configured' })
  }

  const a = Buffer.from(String(supplied || ''))
  const b = Buffer.from(secret)

  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return res.status(401).json({ detail: 'Unauthorized' })
  }

  const path = (req.url || '').split('?')[0]

  const allowed =
    path === '/api/v1/analyze' ||
    /^\/api\/v1\/jobs\/[a-f0-9]{32}(\/report|\/evidence\/(original|annotated)_[0-2]\.jpg)?$/.test(path)

  if (!allowed) {
    return res.status(404).json({ detail: 'Not found' })
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ detail: 'Method not allowed' })
  }

  const upstream = new URL(
    req.url,
    process.env.BACKEND_URL.replace(/\/+$/, '') + '/'
  )

  if (upstream.protocol !== 'https:') {
    return res.status(503).json({ detail: 'HTTPS required' })
  }

  try {
    const headers = {
      'x-api-key': process.env.BACKEND_API_KEY
    }

    if (req.headers['content-type']) {
      headers['content-type'] = req.headers['content-type']
    }

    const response = await fetch(upstream, {
      method: req.method,
      headers,
      body: req.method === 'POST' ? req : undefined,
      duplex: 'half',
      redirect: 'manual',
      signal: AbortSignal.timeout(120000)
    })

    res.status(response.status)
    res.setHeader(
      'Content-Type',
      response.headers.get('content-type') || 'application/json'
    )
    res.setHeader('Cache-Control', 'no-store')
    res.end(Buffer.from(await response.arrayBuffer()))
  } catch {
    res.status(502).json({ detail: 'Backend unavailable' })
  }
}
