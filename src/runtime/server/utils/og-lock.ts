import { mkdir, open, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

export async function withOgRenderLock<T>(run: () => Promise<T>): Promise<T> {
  const directory = join(process.cwd(), '.enfyra-og-cache')
  const file = join(directory, '.render.lock')
  await mkdir(directory, { recursive: true })
  const deadline = Date.now() + 60000
  while (true) {
    let handle
    try {
      handle = await open(file, 'wx', 0o600)
    }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
      if (Date.now() >= deadline) throw new Error('OG renderer is busy or requires lock recovery')
      await delay(100)
      continue
    }
    let release = false
    try {
      await handle.writeFile(JSON.stringify({ pid: process.pid }))
      const result = await run()
      release = true
      return result
    }
    catch (error) {
      release = !(error instanceof Error && error.name === 'OgBrowserShutdownError')
      throw error
    }
    finally {
      await handle.close()
      if (release) await rm(file, { force: true })
    }
  }
}
