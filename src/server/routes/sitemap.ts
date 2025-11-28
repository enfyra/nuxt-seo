import { defineEventHandler } from 'h3'
import { useRuntimeConfig } from '#imports'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  const publicConfig = config.public || {}
  const seoConfig = publicConfig.seo || {}
  const siteUrl = seoConfig.siteUrl || ''
  const today = new Date().toISOString().split('T')[0]
  const pages = seoConfig.pages || {}
  const routes = Object.keys(pages).map((path) => {
    const pageConfig = pages[path] || {}
    return {
      url: `${siteUrl}${path === '/' ? '' : path}`,
      changefreq: pageConfig.changefreq || 'weekly',
      priority: pageConfig.priority || 0.8,
      lastmod: pageConfig.lastmod || today,
    }
  })

  if (routes.length === 0) {
    routes.push({
      url: siteUrl,
      changefreq: 'daily',
      priority: 1.0,
      lastmod: today,
    })
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${routes
  .map(
    (route) => `  <url>
    <loc>${route.url}</loc>
    <lastmod>${route.lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`

  event.node.res.setHeader('Content-Type', 'application/xml')
  event.node.res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600')
  return sitemap
})

