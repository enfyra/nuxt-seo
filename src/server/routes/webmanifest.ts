import { defineEventHandler } from 'h3'
import { useRuntimeConfig } from '#imports'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  const publicConfig = (config.public || {}) as any
  const seoConfig = publicConfig.seo || {}
  const siteUrl = seoConfig.siteUrl || ''
  const siteName = seoConfig.siteName || ''
  const webmanifestConfig = seoConfig.webmanifest || {}

  const manifest: Record<string, any> = {
    name: siteName,
    short_name: siteName,
    description: seoConfig.description || '',
    start_url: webmanifestConfig.start_url || '/',
    display: webmanifestConfig.display || 'standalone',
    background_color: webmanifestConfig.background_color || '#ffffff',
    theme_color: webmanifestConfig.theme_color || '#000000',
  }

  // Only include icons if configured
  if (webmanifestConfig.icons && webmanifestConfig.icons.length > 0) {
    manifest.icons = webmanifestConfig.icons
  }

  event.node.res.setHeader('Content-Type', 'application/manifest+json')
  event.node.res.setHeader('Cache-Control', 'public, max-age=3600')
  return manifest
})

