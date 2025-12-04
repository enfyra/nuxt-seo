import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'
import { access, mkdir, readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import { createHash } from 'crypto'
import sharp from 'sharp'
import { defineEventHandler, getQuery, getHeaders, setHeader, createError } from 'h3'
import { useRuntimeConfig } from '#imports'

const cacheDir = join(process.cwd(), '.enfyra-og-cache')
const cacheMap = new Map()

async function ensureCacheDir() {
  try {
    await access(cacheDir)
  } catch {
    await mkdir(cacheDir, { recursive: true })
  }
}

function getCacheKey(path, host) {
  const key = host ? `${host}${path}` : path
  return createHash('md5').update(key).digest('hex')
}

async function getCachedImage(cacheKey, cacheTtl, memoryTtl) {
  const memoryCache = cacheMap.get(cacheKey)
  if (memoryCache && Date.now() - memoryCache.timestamp < memoryTtl) {
    return memoryCache.buffer
  }

  try {
    const cacheFile = join(cacheDir, `${cacheKey}.webp`)
    const stats = await import('fs/promises').then(m => m.stat(cacheFile))
    const fileAge = Date.now() - stats.mtimeMs
    
    if (fileAge < cacheTtl) {
      const buffer = await readFile(cacheFile)
      cacheMap.set(cacheKey, { buffer, timestamp: Date.now() })
      return buffer
    }
  } catch {
    // Cache file doesn't exist or error reading
  }
  
  return null
}

async function saveCachedImage(cacheKey, buffer) {
  try {
    await ensureCacheDir()
    const cacheFile = join(cacheDir, `${cacheKey}.webp`)
    await writeFile(cacheFile, buffer)
    cacheMap.set(cacheKey, { buffer, timestamp: Date.now() })
  } catch (e) {
    console.error('Failed to save cache:', e)
  }
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const seoConfig = config.public?.seo || {}
  const ogImageConfig = seoConfig.ogImage || {}
  
  if (!ogImageConfig.enabled) {
    throw createError({
      statusCode: 404,
      message: 'OG Image generation is not enabled',
    })
  }

  const query = getQuery(event)
  const path = query.path || '/'
  
  const headers = getHeaders(event)
  const host = headers.host || headers['x-forwarded-host'] || ''
  const protocol = headers['x-forwarded-proto'] || (host.includes('localhost') ? 'http' : 'https')
  
  const isDev = process.env.NODE_ENV === 'development'
  
  let targetUrl
  if (isDev) {
    targetUrl = `http://localhost:3000${path}`
  } else if (host) {
    targetUrl = `${protocol}://${host}${path}`
  } else {
    const siteUrl = seoConfig.siteUrl || process.env.NUXT_PUBLIC_SITE_URL || ''
    targetUrl = `${siteUrl}${path}`
  }

  const viewport = ogImageConfig.viewport || { width: 1440, height: 754 }
  const quality = ogImageConfig.quality || 85
  const format = ogImageConfig.format || 'webp'
  const cacheTtl = ogImageConfig.cache?.ttl || 24 * 60 * 60 * 1000
  const memoryTtl = ogImageConfig.cache?.memoryTtl || 60 * 60 * 1000

  const cacheKey = getCacheKey(path, host)
  const cached = await getCachedImage(cacheKey, cacheTtl, memoryTtl)
  
  if (cached) {
    setHeader(event, 'Content-Type', `image/${format}`)
    setHeader(event, 'Cache-Control', 'public, max-age=86400, s-maxage=86400')
    return cached
  }

  try {
    const isProduction = process.env.NODE_ENV === 'production'
    
    let browserOptions = {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    }
    
    if (isProduction) {
      browserOptions = {
        ...browserOptions,
        args: chromium.args,
        executablePath: await chromium.executablePath(),
      }
    } else {
      const chromePaths = [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Chromium.app/Contents/MacOS/Chromium',
      ]
      
      if (process.env.CHROME_PATH) {
        chromePaths.push(process.env.CHROME_PATH)
      }
      
      for (const chromePath of chromePaths) {
        try {
          await access(chromePath)
          browserOptions.executablePath = chromePath
          break
        } catch {
          continue
        }
      }
      
      if (!browserOptions.executablePath) {
        throw new Error('Chrome/Chromium executable not found. Please install Chrome or set CHROME_PATH environment variable.')
      }
    }
    
    const browser = await puppeteer.launch(browserOptions)

    const page = await browser.newPage()
    
    await page.setViewport({
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
    })

    await page.goto(targetUrl, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    })

    await page.evaluate(() => {
      // @ts-ignore - document is available in browser context
      const style = document.createElement('style')
      style.textContent = `
        body {
          margin: 0;
          padding: 0;
          overflow: hidden;
        }
        .og-hide {
          display: none !important;
        }
      `
      // @ts-ignore - document is available in browser context
      document.head.appendChild(style)
    })

    await new Promise(resolve => setTimeout(resolve, 1000))

    const screenshot = await page.screenshot({
      type: 'png',
      clip: {
        x: 0,
        y: 0,
        width: viewport.width,
        height: viewport.height,
      },
    })

    await browser.close()

    let imageBuffer
    
    if (format === 'webp') {
      imageBuffer = await sharp(screenshot)
        .webp({ quality })
        .toBuffer()
    } else if (format === 'jpeg') {
      imageBuffer = await sharp(screenshot)
        .jpeg({ quality })
        .toBuffer()
    } else {
      imageBuffer = screenshot
    }

    await saveCachedImage(cacheKey, imageBuffer)

    setHeader(event, 'Content-Type', `image/${format}`)
    setHeader(event, 'Cache-Control', 'public, max-age=86400, s-maxage=86400')

    return imageBuffer
  } catch (e) {
    console.error('OG Image capture error:', e.message)
    throw createError({
      statusCode: 500,
      message: `Failed to capture image: ${e.message}`,
    })
  }
})

