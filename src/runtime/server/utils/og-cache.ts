import { mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import type { OgImageEntry, OgImageFormat } from '../types/og'

const memory = new Map<string, { entry: OgImageEntry, loadedAt: number }>()
const MAX_MEMORY_ENTRIES = 100
const MAX_MEMORY_BYTES = 64 * 1024 * 1024
const cacheDir = () => join(process.cwd(), '.enfyra-og-cache')

export async function readOgCache(key: string, format: OgImageFormat, memoryTtl: number): Promise<OgImageEntry | null> {
  const cached = memory.get(key)
  if (cached && Date.now() - cached.loadedAt < memoryTtl) return cached.entry
  memory.delete(key)
  const file = join(cacheDir(), `${key}.${format}`)
  try {
    const metadata = await stat(file)
    const buffer = await readFile(file)
    if (!buffer.length) return null
    const entry = { buffer, generatedAt: metadata.mtimeMs }
    remember(key, entry)
    return entry
  }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }
}

function remember(key: string, entry: OgImageEntry) {
  memory.delete(key)
  memory.set(key, { entry, loadedAt: Date.now() })
  let bytes = [...memory.values()].reduce((total, item) => total + item.entry.buffer.length, 0)
  while (memory.size > MAX_MEMORY_ENTRIES || bytes > MAX_MEMORY_BYTES) {
    const oldest = memory.keys().next().value!
    bytes -= memory.get(oldest)!.entry.buffer.length
    memory.delete(oldest)
  }
}

export async function writeOgCache(key: string, format: OgImageFormat, buffer: Buffer): Promise<OgImageEntry> {
  await mkdir(cacheDir(), { recursive: true })
  const file = join(cacheDir(), `${key}.${format}`)
  const temporary = `${file}.${randomUUID()}.tmp`
  try {
    await writeFile(temporary, buffer)
    await rename(temporary, file)
    const entry = { buffer, generatedAt: (await stat(file)).mtimeMs }
    remember(key, entry)
    return entry
  }
  finally {
    await rm(temporary, { force: true })
  }
}
