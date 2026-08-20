import { defineNitroPlugin, useRuntimeConfig } from '#imports'

const normalizePath = (path: string) => {
  if (!path.startsWith('/'))
    return `/${path}`

  return path
}

const requestOgImage = async (origin: string, ogRoute: string, path: string, userAgent?: string) => {
  const url = new URL(ogRoute, origin)
  url.searchParams.set('path', path)

  const response = await fetch(url, {
    headers: userAgent ? { 'User-Agent': userAgent } : undefined,
  })

  if (!response.ok)
    throw new Error(`HTTP ${response.status}`)

  await response.arrayBuffer()
}

export default defineNitroPlugin(() => {
  const config = useRuntimeConfig()
  const seoConfig = config.public?.seo || {}
  const ogImage = seoConfig.ogImage || {}
  const warmup = ogImage.warmup || {}
  if (!ogImage.enabled || !warmup.enabled)
    return

  const configuredPaths = Array.isArray(warmup.paths) && warmup.paths.length
    ? warmup.paths
    : Object.keys(seoConfig.pages || {})
  const paths = [...new Set(configuredPaths.map(normalizePath))]
  if (!paths.length)
    return

  const origin = String(warmup.origin || seoConfig.siteUrl || '').replace(/\/$/, '')
  const ogRoute = String(ogImage.route || '/_enfyra/nuxt-seo/og')
  if (!origin)
    return

  const delay = Math.max(Number(warmup.delay) || 0, 0)
  const concurrency = Math.max(Math.min(Number(warmup.concurrency) || 1, 4), 1)
  const includeFacebook = warmup.includeFacebook === true

  setTimeout(() => {
    void (async () => {
      const pending = [...paths]
      const worker = async () => {
        while (pending.length) {
          const path = pending.shift()
          if (!path)
            continue

          const variants = includeFacebook
            ? [undefined, 'facebookexternalhit/1.1']
            : [undefined]
          for (const userAgent of variants) {
            try {
              await requestOgImage(origin, ogRoute, path, userAgent)
            }
            catch (error) {
              console.warn(`[nuxt-seo] OG warm-up failed for ${path}: ${error instanceof Error ? error.message : String(error)}`)
            }
          }
        }
      }

      await Promise.all(Array.from({ length: Math.min(concurrency, paths.length) }, worker))
    })()
  }, delay)
})
