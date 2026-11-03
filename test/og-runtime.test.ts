import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtemp, rm, readdir, utimes } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const state = vi.hoisted(() => ({ launches: 0, active: 0, maxActive: 0, image: 'first', fail: false, closeFail: false, gate: undefined as Promise<void> | undefined, closeGate: undefined as Promise<void> | undefined }))
vi.mock('puppeteer-core', () => ({ default: { launch: async () => {
  state.launches++
  state.active++
  state.maxActive = Math.max(state.maxActive, state.active)
  return {
    newPage: async () => ({
      setViewport: async () => {},
      setUserAgent: async () => {},
      goto: async () => { if (state.gate) await state.gate },
      addStyleTag: async () => {},
      evaluate: async () => {},
      screenshot: async () => {
        if (state.fail) throw new Error('capture failed')
        return Buffer.from(state.image)
      },
    }),
    close: async () => {
      if (state.closeGate) await state.closeGate
      if (state.closeFail) throw new Error('browser close failed')
      state.active--
    },
  }
} } }))
vi.mock('@sparticuz/chromium', () => ({ default: { args: [], executablePath: async () => '/mock-chromium' } }))
vi.mock('sharp', () => ({ default: (input: Buffer) => {
  const chain: Record<string, unknown> = {}
  for (const name of ['resize', 'webp', 'jpeg', 'png']) chain[name] = () => chain
  chain.toBuffer = async () => input
  return chain
} }))
vi.mock('#imports', () => ({ useRuntimeConfig: () => ({ public: { seo: { siteUrl: 'https://example.test', ogImage: { enabled: true, cache: { ttl: 86400000, memoryTtl: 3600000 } } } } }) }))
vi.mock('h3', () => ({
  defineEventHandler: (fn: unknown) => fn,
  getQuery: (event: { query: unknown }) => event.query,
  getHeaders: (event: { headers: unknown }) => event.headers,
  setHeader: (event: { responseHeaders: Record<string, unknown> }, name: string, value: unknown) => { event.responseHeaders[name] = value },
  createError: (data: { message: string }) => Object.assign(new Error(data.message), data),
}))

let directory: string
let cwd: ReturnType<typeof vi.spyOn>
const event = (path = '/docs/example', facebook = false) => ({ query: { path }, headers: { host: 'example.test', ...(facebook ? { 'user-agent': 'facebookexternalhit/1.1' } : {}) }, responseHeaders: {} as Record<string, unknown> })
const handler = async () => (await import('../src/runtime/server/routes/og')).default
async function until(check: () => boolean) {
  for (let i = 0; i < 100 && !check(); i++) await new Promise(resolve => setTimeout(resolve, 2))
  expect(check()).toBe(true)
}

beforeEach(async () => {
  vi.resetModules()
  directory = await mkdtemp(join(tmpdir(), 'nuxt-seo-runtime-'))
  cwd = vi.spyOn(process, 'cwd').mockReturnValue(directory)
  Object.assign(state, { launches: 0, active: 0, maxActive: 0, image: 'first', fail: false, closeFail: false, gate: undefined, closeGate: undefined })
  vi.stubEnv('NODE_ENV', 'production')
})
afterEach(async () => {
  cwd.mockRestore()
  vi.unstubAllEnvs()
  await rm(directory, { recursive: true, force: true })
})

describe('OG serialized stale-while-revalidate runtime', () => {
  it('keeps a fresh cache across requests and handler contexts', async () => {
    const first = await handler()
    expect((await first(event() as never)).toString()).toBe('first')
    await first(event() as never)
    vi.resetModules()
    await (await handler())(event() as never)
    expect(state.launches).toBe(1)
  })

  it('coalesces concurrent misses for the same cache key', async () => {
    let release!: () => void
    state.gate = new Promise((resolve) => {
      release = resolve
    })
    const run = await handler()
    const a = run(event() as never)
    const b = run(event() as never)
    await until(() => state.launches > 0)
    release()
    await Promise.all([a, b])
    expect(state.launches).toBe(1)
    expect(state.maxActive).toBe(1)
  })

  it('serializes different cold pages and image variants through one browser slot', async () => {
    const run = await handler()
    await Promise.all([run(event('/a') as never), run(event('/b') as never), run(event('/a', true) as never)])
    expect(state.launches).toBe(3)
    expect(state.maxActive).toBe(1)
    expect(state.active).toBe(0)
  })

  it('serves expired disk cache immediately and renews one copy in background', async () => {
    await (await handler())(event() as never)
    const cache = join(directory, '.enfyra-og-cache')
    const old = new Date(Date.now() - 90000000)
    for (const file of await readdir(cache)) await utimes(join(cache, file), old, old)
    vi.resetModules()
    state.image = 'renewed'
    let release!: () => void
    state.gate = new Promise((resolve) => {
      release = resolve
    })
    const run = await handler()
    const a = event()
    const b = event()
    const first = run(a as never)
    const second = run(b as never)
    let returned = false
    void Promise.all([first, second]).then(() => {
      returned = true
    })
    await until(() => state.launches >= 2)
    await new Promise(resolve => setTimeout(resolve, 10))
    const staleReturned = returned
    release()
    expect((await first).toString()).toBe('first')
    await second
    await (await import('../src/runtime/server/utils/og-runtime')).waitForOgIdle()
    expect(state.launches).toBe(2)
    expect((await run(event() as never)).toString()).toBe('renewed')
    expect(staleReturned).toBe(true)
    expect(a.responseHeaders['Cache-Control']).toContain('stale-while-revalidate')
    expect(a.responseHeaders['Cache-Control']).not.toContain('immutable')
    await until(() => state.active === 0)
  })

  it('retains stale data and frees the queue when renewal fails', async () => {
    await (await handler())(event() as never)
    const old = new Date(Date.now() - 90000000)
    const cache = join(directory, '.enfyra-og-cache')
    for (const file of await readdir(cache)) await utimes(join(cache, file), old, old)
    vi.resetModules()
    state.fail = true
    const run = await handler()
    expect((await run(event() as never)).toString()).toBe('first')
    await (await import('../src/runtime/server/utils/og-runtime')).waitForOgIdle()
    expect(state.launches).toBe(2)
    state.fail = false
    expect((await run(event() as never)).toString()).toBe('first')
    expect(state.launches).toBe(2)
    await run(event('/next') as never)
    expect(state.maxActive).toBe(1)
  })

  it('waits for browser shutdown before launching another capture', async () => {
    let release!: () => void
    state.closeGate = new Promise((resolve) => {
      release = resolve
    })
    const run = await handler()
    const a = run(event('/a') as never)
    const b = run(event('/b') as never)
    await until(() => state.launches === 1)
    await new Promise(resolve => setTimeout(resolve, 10))
    expect(state.launches).toBe(1)
    release()
    await Promise.all([a, b])
    expect(state.maxActive).toBe(1)
  })

  it('fails closed after an unconfirmed browser shutdown', async () => {
    state.closeFail = true
    const run = await handler()
    await expect(run(event('/a') as never)).rejects.toThrow('temporarily unavailable')
    state.closeFail = false
    await expect(run(event('/b') as never)).rejects.toThrow('temporarily unavailable')
    expect(state.launches).toBe(1)
  })

  it('bounds the cold-render queue while preserving its only active browser', async () => {
    let release!: () => void
    state.gate = new Promise((resolve) => {
      release = resolve
    })
    const run = await handler()
    const jobs = Array.from({ length: 129 }, (_, i) => run(event(`/queue/${i}`) as never))
    const settled = Promise.allSettled(jobs)
    await until(() => state.launches === 1)
    await new Promise(resolve => setTimeout(resolve, 20))
    release()
    const results = await settled
    expect(results.filter(result => result.status === 'rejected')).toHaveLength(1)
    expect(state.maxActive).toBe(1)
  })

  it.each(['https://elsewhere.test/', '//elsewhere.test/', '/a\\\\b', '/_enfyra/nuxt-seo/og'])('rejects an invalid capture target (%s)', async (path) => {
    await expect((await handler())(event(path) as never)).rejects.toThrow('Invalid OG page path')
    expect(state.launches).toBe(0)
  })
})
