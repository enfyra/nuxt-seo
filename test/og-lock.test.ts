import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtemp, rm, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { withOgRenderLock } from '../src/runtime/server/utils/og-lock'

let directory: string
let cwd: ReturnType<typeof vi.spyOn>
beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'nuxt-seo-lock-'))
  cwd = vi.spyOn(process, 'cwd').mockReturnValue(directory)
})
afterEach(async () => {
  cwd.mockRestore()
  await rm(directory, { recursive: true, force: true })
})

describe('OG app-wide filesystem lock', () => {
  it('serializes independent collectors sharing an app cache directory', async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    let entered = 0
    const first = withOgRenderLock(async () => {
      entered++
      await gate
    })
    for (let i = 0; i < 100 && entered === 0; i++) await new Promise(resolve => setTimeout(resolve, 2))
    const next = withOgRenderLock(async () => {
      entered++
    })
    await new Promise(resolve => setTimeout(resolve, 20))
    expect(entered).toBe(1)
    release()
    await Promise.all([first, next])
    expect(entered).toBe(2)
  })

  it('serializes two actual Node processes for the same app', async () => {
    const source = fileURLToPath(new URL('../src/runtime/server/utils/og-lock.ts', import.meta.url))
    const code = `import { pathToFileURL } from 'node:url'; const { withOgRenderLock } = await import(pathToFileURL(process.argv[1]).href); await withOgRenderLock(async () => { console.log('start', Date.now()); await new Promise(r => setTimeout(r, 40)); console.log('end', Date.now()); });`
    const children = [0, 1].map(() => spawn(process.execPath, ['--input-type=module', '-e', code, source], { cwd: directory, stdio: ['ignore', 'pipe', 'pipe'] }))
    try {
      const results = await Promise.all(children.map(child => new Promise<string>((resolve, reject) => {
        let output = ''
        child.stdout.on('data', (data) => {
          output += String(data)
        })
        child.once('error', reject)
        child.once('exit', code => code === 0 ? resolve(output) : reject(new Error(`Lock child failed: ${code}`)))
      })))
      const intervals = results.map(output => output.trim().split('\n').map(line => Number(line.split(' ')[1]))).sort((a, b) => a[0] - b[0])
      expect(intervals[0][1]).toBeLessThanOrEqual(intervals[1][0])
    }
    finally {
      for (const child of children) if (child.exitCode === null) child.kill('SIGKILL')
    }
  }, 3000)

  it('releases the lock after an ordinary capture failure', async () => {
    await expect(withOgRenderLock(async () => {
      throw new Error('capture failed')
    })).rejects.toThrow('capture failed')
    await expect(withOgRenderLock(async () => 'next')).resolves.toBe('next')
  })

  it('retains the lock if browser shutdown cannot be confirmed', async () => {
    await expect(withOgRenderLock(async () => {
      throw Object.assign(new Error('close failed'), { name: 'OgBrowserShutdownError' })
    })).rejects.toThrow('close failed')
    await expect(stat(join(directory, '.enfyra-og-cache/.render.lock'))).resolves.toBeDefined()
  })
})
