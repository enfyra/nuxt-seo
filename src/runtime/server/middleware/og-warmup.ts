import { defineEventHandler, getHeaders, getRequestURL } from 'h3'
import { useRuntimeConfig } from '#imports'
import type { OgImageConfig } from '../../../types'
import { getOgImage } from '../utils/og-runtime'

export default defineEventHandler(async (event) => {
  const headers = getHeaders(event)
  const userAgent = headers['user-agent'] || ''

  const isFacebookCrawler = userAgent.includes('facebookexternalhit')
    || userAgent.includes('Facebot')
    || userAgent.includes('facebookcatalog')

  if (!isFacebookCrawler) {
    return
  }

  const config = useRuntimeConfig()
  const seoConfig = config.public?.seo || {}
  const ogImageConfig: OgImageConfig = seoConfig.ogImage || {}

  if (!ogImageConfig.enabled) {
    return
  }

  const url = getRequestURL(event)
  const path = url.pathname

  const ogRoute = ogImageConfig.route || '/_enfyra/nuxt-seo/og'
  if (path === ogRoute || path.startsWith('/_') || path.startsWith('/api/') || /\.[a-z0-9]+$/i.test(path)) {
    return
  }

  const host = headers.host || headers['x-forwarded-host'] || ''
  const protocol = headers['x-forwarded-proto'] || (host.includes('localhost') ? 'http' : 'https')
  const origin = String(seoConfig.siteUrl || `${protocol}://${host}`)
  void getOgImage({ origin, path, facebook: true, config: ogImageConfig }).catch(() => undefined)
})
