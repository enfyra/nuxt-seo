import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getOgImage: vi.fn(),
  waitForOgIdle: vi.fn(),
  config: { public: { seo: { siteUrl: 'https://example.test', pages: { '/': {}, '/pricing': {} }, ogImage: { enabled: true, warmup: { enabled: true, delay: 10, concurrency: 8, includeFacebook: true } } } } },
}))
vi.mock('#imports', () => ({ defineNitroPlugin: (fn: unknown) => fn, useRuntimeConfig: () => mocks.config }))
vi.mock('../src/runtime/server/utils/og-runtime', () => ({ getOgImage: mocks.getOgImage, waitForOgIdle: mocks.waitForOgIdle }))

beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  mocks.config.public.seo.ogImage.warmup.enabled = true
  mocks.getOgImage.mockResolvedValue({ stale: false })
  mocks.waitForOgIdle.mockResolvedValue(undefined)
})
afterEach(() => {
  vi.clearAllTimers()
  vi.useRealTimers()
})

describe('OG startup warmup', () => {
  it('walks all configured pages and variants sequentially despite higher legacy concurrency', async () => {
    let active = 0
    let max = 0
    mocks.getOgImage.mockImplementation(async () => {
      active++
      max = Math.max(max, active)
      await Promise.resolve()
      active--
    })
    const plugin = (await import('../src/runtime/server/plugins/og-warmup')).default
    plugin({ hooks: { hook: vi.fn() } } as never)
    await vi.advanceTimersByTimeAsync(10)
    expect(mocks.getOgImage.mock.calls.map(([request]) => [request.path, request.facebook])).toEqual([
      ['/', false], ['/', true], ['/pricing', false], ['/pricing', true],
    ])
    expect(max).toBe(1)
  })

  it('cancels pending startup work and drains the shared queue on app close', async () => {
    const hooks = new Map<string, () => Promise<void>>()
    const plugin = (await import('../src/runtime/server/plugins/og-warmup')).default
    plugin({ hooks: { hook: (name: string, fn: () => Promise<void>) => hooks.set(name, fn) } } as never)
    await hooks.get('close')?.()
    await vi.advanceTimersByTimeAsync(100)
    expect(mocks.getOgImage).not.toHaveBeenCalled()
    expect(mocks.waitForOgIdle).toHaveBeenCalledOnce()
  })

  it('respects explicit warmup opt-out', async () => {
    mocks.config.public.seo.ogImage.warmup.enabled = false
    const plugin = (await import('../src/runtime/server/plugins/og-warmup')).default
    plugin({ hooks: { hook: vi.fn() } } as never)
    await vi.advanceTimersByTimeAsync(100)
    expect(mocks.getOgImage).not.toHaveBeenCalled()
  })
})
