import { defineNitroPlugin, useRuntimeConfig } from '#imports'
import type { NitroApp } from 'nitropack/types'
import type { OgImageConfig } from '../../../types'
import { getOgImage, waitForOgIdle } from '../utils/og-runtime'

export default defineNitroPlugin((app: NitroApp) => {
  const seo = useRuntimeConfig().public?.seo || {}
  const config: OgImageConfig = seo.ogImage || {}
  const warmup = config.warmup || {}
  if (!config.enabled || warmup.enabled === false) return
  const configured = warmup.paths?.length ? warmup.paths : Object.keys(seo.pages || {})
  const paths = [...new Set(configured.map(path => path.startsWith('/') ? path : `/${path}`))]
  const origin = String(warmup.origin || seo.siteUrl || '').replace(/\/$/, '')
  if (!origin || !paths.length) return
  let stopped = false
  const timer = setTimeout(() => {
    void (async () => {
      for (const path of paths) {
        for (const facebook of warmup.includeFacebook ? [false, true] : [false]) {
          if (stopped) return
          try {
            await getOgImage({ origin, path, facebook, config })
          }
          catch (error) {
            console.warn(`[nuxt-seo] OG warm-up failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
          }
        }
      }
    })()
  }, Math.max(0, warmup.delay ?? 1000))
  timer.unref?.()
  app.hooks.hook('close', async () => {
    stopped = true
    clearTimeout(timer)
    await waitForOgIdle()
  })
})
