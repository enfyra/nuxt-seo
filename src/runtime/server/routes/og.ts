import { createHash } from 'node:crypto'
import { defineEventHandler, getQuery, getHeaders, setHeader, createError } from 'h3'
import { useRuntimeConfig } from '#imports'
import type { OgImageConfig } from '../../../types'
import { getOgImage } from '../utils/og-runtime'

export default defineEventHandler(async (event) => {
  const seo = useRuntimeConfig().public?.seo || {}
  const config: OgImageConfig = seo.ogImage || {}
  if (!config.enabled) throw createError({ statusCode: 404, message: 'OG Image generation is not enabled' })
  const query = getQuery(event)
  const path = typeof query.path === 'string' && query.path ? query.path : '/'
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\') || path.split('?')[0] === (config.route || '/_enfyra/nuxt-seo/og')) {
    throw createError({ statusCode: 400, message: 'Invalid OG page path' })
  }
  const headers = getHeaders(event)
  const host = headers.host || headers['x-forwarded-host'] || ''
  const protocol = headers['x-forwarded-proto'] === 'http' || host.includes('localhost') ? 'http' : 'https'
  const origin = String(seo.siteUrl || `${protocol}://${host}`)
  const ua = headers['user-agent'] || ''
  const facebook = /facebookexternalhit|Facebot|facebookcatalog/.test(ua)
  try {
    const result = await getOgImage({ origin, path, facebook, config })
    const format = facebook ? 'jpeg' : config.format || 'webp'
    const ttlSeconds = Math.max(0, Math.floor((config.cache?.ttl ?? 86400000) / 1000))
    const age = Math.max(0, Math.floor((Date.now() - result.generatedAt) / 1000))
    const remaining = Math.max(0, ttlSeconds - age)
    setHeader(event, 'Vary', 'User-Agent')
    setHeader(event, 'Content-Type', `image/${format}`)
    setHeader(event, 'Content-Length', result.buffer.length)
    setHeader(event, 'Cache-Control', `public, max-age=${remaining}, s-maxage=${remaining}, stale-while-revalidate=${Math.max(1, ttlSeconds)}`)
    setHeader(event, 'X-Content-Type-Options', 'nosniff')
    setHeader(event, 'ETag', `"${createHash('md5').update(result.buffer).digest('hex')}"`)
    return result.buffer
  }
  catch {
    const fallback = String(seo.defaultImage || '')
    if (fallback) {
      setHeader(event, 'Location', new URL(fallback, origin).href)
      setHeader(event, 'Cache-Control', 'public, max-age=3600')
      throw createError({ statusCode: 302, message: 'Redirecting to default image' })
    }
    throw createError({ statusCode: 503, message: 'OG image is temporarily unavailable' })
  }
})
