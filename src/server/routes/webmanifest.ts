import { defineEventHandler } from 'h3'
import { useRuntimeConfig } from '#imports'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  const publicConfig = config.public || {}
  const seoConfig = publicConfig.seo || {}
  const siteUrl = seoConfig.siteUrl || ''
  const siteName = seoConfig.siteName || ''

  const manifest = {
    name: siteName,
    short_name: siteName,
    description: seoConfig.description || '',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }

  event.node.res.setHeader('Content-Type', 'application/manifest+json')
  event.node.res.setHeader('Cache-Control', 'public, max-age=3600')
  return manifest
})

