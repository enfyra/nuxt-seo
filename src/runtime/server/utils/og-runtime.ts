import { createHash } from 'node:crypto'
import type { OgImageEntry, OgImageFormat, OgImageRequest, OgImageResult } from '../types/og'
import { readOgCache, writeOgCache } from './og-cache'
import { renderOgImage } from './og-renderer'
import { withOgRenderLock } from './og-lock'

const pending = new Map<string, Promise<OgImageEntry>>()
const retryAfter = new Map<string, number>()
let tail: Promise<unknown> = Promise.resolve()
let rendererUnavailable = false
const MAX_PENDING = 128
const RETRY_DELAY_MS = 30000

export async function waitForOgIdle(): Promise<void> {
  await tail
}

export async function getOgImage(request: OgImageRequest): Promise<OgImageResult> {
  const target = new URL(request.path, request.origin)
  if (!['http:', 'https:'].includes(target.protocol) || target.origin !== new URL(request.origin).origin || !request.path.startsWith('/') || request.path.startsWith('//') || request.path.includes('\\') || target.pathname === (request.config.route || '/_enfyra/nuxt-seo/og')) {
    throw new Error('Invalid OG page path')
  }
  const format: OgImageFormat = request.facebook ? 'jpeg' : request.config.format || 'webp'
  const host = new URL(request.origin).host
  const key = `${createHash('md5').update(`${host}${request.path}`).digest('hex')}_${format}`
  const ttl = request.config.cache?.ttl ?? 86400000
  const memoryTtl = request.config.cache?.memoryTtl ?? 3600000
  const cached = await readOgCache(key, format, memoryTtl)
  if (cached && Date.now() - cached.generatedAt < ttl) return { ...cached, stale: false }

  if (cached) {
    if (Date.now() >= (retryAfter.get(key) || 0)) {
      void enqueue(key, format, request, ttl).catch(() => {})
    }
    return { ...cached, stale: true }
  }
  return { ...await enqueue(key, format, request, ttl), stale: false }
}

function enqueue(key: string, format: OgImageFormat, request: OgImageRequest, ttl: number): Promise<OgImageEntry> {
  if (rendererUnavailable) return Promise.reject(new Error('OG browser shutdown requires recovery'))
  const existing = pending.get(key)
  if (existing) return existing
  if (pending.size >= MAX_PENDING) return Promise.reject(new Error('OG render queue is full'))
  const job = tail.then(() => {
    if (rendererUnavailable) throw new Error('OG browser shutdown requires recovery')
    return withOgRenderLock(async () => {
      const cached = await readOgCache(key, format, 0)
      if (cached && Date.now() - cached.generatedAt < ttl) return cached
      const buffer = await renderOgImage(request)
      return await writeOgCache(key, format, buffer)
    })
  })
  pending.set(key, job)
  tail = job.then(() => {
    retryAfter.delete(key)
    pending.delete(key)
  }, (error: unknown) => {
    if (error instanceof Error && error.name === 'OgBrowserShutdownError') rendererUnavailable = true
    retryAfter.set(key, Date.now() + RETRY_DELAY_MS)
    while (retryAfter.size > MAX_PENDING) retryAfter.delete(retryAfter.keys().next().value!)
    pending.delete(key)
    console.warn(`[nuxt-seo] OG render failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  })
  return job
}
