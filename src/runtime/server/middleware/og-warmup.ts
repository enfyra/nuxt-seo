import { defineEventHandler, getHeaders, getRequestURL } from 'h3'
import { useRuntimeConfig } from '#imports'

export default defineEventHandler(async (event) => {
  const headers = getHeaders(event)
  const userAgent = headers['user-agent'] || ''
  
  const isFacebookCrawler = userAgent.includes('facebookexternalhit') || 
                            userAgent.includes('Facebot') ||
                            userAgent.includes('facebookcatalog')
  
  if (!isFacebookCrawler) {
    return
  }

  const config = useRuntimeConfig()
  const seoConfig = config.public?.seo || {}
  const ogImageConfig = seoConfig.ogImage || {}
  
  if (!ogImageConfig.enabled) {
    return
  }

  const url = getRequestURL(event)
  const path = url.pathname
  
  const ogRoute = ogImageConfig.route || '/_enfyra/nuxt-seo/og'
  if (path === ogRoute || path.startsWith('/_nuxt/') || path.startsWith('/api/')) {
    return
  }

  const host = headers.host || headers['x-forwarded-host'] || ''
  const protocol = headers['x-forwarded-proto'] || (host.includes('localhost') ? 'http' : 'https')
  const ogImageUrl = `${protocol}://${host}${ogRoute}?path=${encodeURIComponent(path)}`
  
  try {
    void fetch(ogImageUrl, {
      method: 'GET',
      headers: {
        'User-Agent': userAgent,
      },
    }).catch(() => undefined)
  }
  catch {
    return
  }
})
