import { defineEventHandler } from 'h3'
import { useRuntimeConfig } from '#imports'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  const publicConfig = config.public || {}
  const seoConfig = publicConfig.seo || {}
  const seoEnabled = seoConfig.enabled !== false

  if (!seoEnabled) {
    const robotsTxt = `User-Agent: *
Disallow: /
`
    event.node.res.setHeader('Content-Type', 'text/plain')
    return robotsTxt
  }

  const siteUrl = seoConfig.siteUrl || ''
  const robotsConfig = seoConfig.robots || {}
  const disallowPaths = robotsConfig.disallow || ['/api/', '/admin/', '/_nuxt/']
  const sitemapPath = robotsConfig.sitemapPath || '/sitemap.xml'
  
  const disallowLines = disallowPaths.map((path) => `Disallow: ${path}`).join('\n')
  
  const robotsTxt = `User-Agent: *
Allow: /
${disallowLines}

Sitemap: ${siteUrl}${sitemapPath}

Crawl-delay: 1

User-Agent: AhrefsBot
Disallow: /

User-Agent: SemrushBot
Disallow: /

User-Agent: DotBot
Disallow: /
`
  event.node.res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  event.node.res.setHeader('Cache-Control', 'public, max-age=3600')
  event.node.res.setHeader('X-Robots-Tag', 'noindex')
  return robotsTxt
})

