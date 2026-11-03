import { mkdir, open, readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

function isProcessAlive(pid: number) {
  try {
    process.kill(pid, 0)
    return true
  }
  catch (error) {
    return (error as NodeJS.ErrnoException).code !== 'ESRCH'
  }
}

async function reclaimDeadLock(file: string) {
  let snapshot: string
  try {
    snapshot = await readFile(file, 'utf8')
  }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return true
    throw error
  }
  let pid: unknown
  try {
    pid = JSON.parse(snapshot).pid
  }
  catch {
    return false
  }
  if (typeof pid !== 'number' || !Number.isInteger(pid) || pid <= 0 || pid === process.pid) return false
  if (isProcessAlive(pid)) return false
  try {
    if (await readFile(file, 'utf8') !== snapshot) return false
    await rm(file, { force: true })
    return true
  }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return true
    throw error
  }
}

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
      if (await reclaimDeadLock(file)) continue
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
