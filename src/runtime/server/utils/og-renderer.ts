import puppeteer, { type LaunchOptions, type Page } from 'puppeteer-core'
import chromium from '@sparticuz/chromium'
import { access } from 'node:fs/promises'
import sharp from 'sharp'
import type { OgImageRequest } from '../types/og'

let cleanupFailed = false

async function settleVisuals(page: Page) {
  await page.evaluate(async () => {
    const nextFrame = () => new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve())
    })
    await document.fonts?.ready
    await nextFrame()
    await nextFrame()
    const deadline = Date.now() + 1500
    while (Date.now() < deadline) {
      const running = document.getAnimations?.().some(animation => animation.playState === 'running') ?? false
      const hidden = [...document.querySelectorAll('[style*="opacity:0"], [style*="opacity: 0"]')].some((element) => {
        if (getComputedStyle(element).opacity !== '0') return false
        const rect = element.getBoundingClientRect()
        return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0 && rect.top < window.innerHeight && rect.left < window.innerWidth
      })
      if (!running && !hidden) break
      await new Promise((resolve) => {
        setTimeout(resolve, 50)
      })
    }
    await nextFrame()
  })
}

export async function renderOgImage(request: OgImageRequest): Promise<Buffer> {
  if (cleanupFailed) throw Object.assign(new Error('OG renderer is unavailable after an unconfirmed browser shutdown'), { name: 'OgBrowserShutdownError' })
  const { config, facebook } = request
  const viewport = facebook ? { width: 1200, height: 630 } : { width: config.viewport?.width || 1440, height: config.viewport?.height || 754 }
  const options: LaunchOptions = { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'], protocolTimeout: 15000, timeout: 15000 }
  if (process.env.NODE_ENV === 'production') {
    options.args = chromium.args
    options.executablePath = await chromium.executablePath()
  }
  else {
    for (const file of [process.env.CHROME_PATH, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium'].filter((value): value is string => !!value)) {
      try {
        await access(file)
        options.executablePath = file
        break
      }
      catch {
        continue
      }
    }
    if (!options.executablePath) throw new Error('Chrome/Chromium executable not found. Set CHROME_PATH to an installed browser.')
  }
  const browser = await puppeteer.launch(options)
  try {
    const page = await browser.newPage()
    await page.setViewport({ ...viewport, deviceScaleFactor: 1 })
    await page.setUserAgent('Enfyra-OG-Renderer')
    const response = await page.goto(new URL(request.path, request.origin).href, { waitUntil: 'networkidle0', timeout: facebook ? 45000 : 30000 })
    if (response && response.status() >= 400) throw new Error(`OG page returned HTTP ${response.status()}`)
    await settleVisuals(page)
    await page.addStyleTag({ content: 'body{margin:0;padding:0;overflow:hidden}.og-hide{display:none!important}' })
    const screenshot = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, ...viewport } })
    const image = sharp(screenshot).resize(viewport.width, viewport.height, { fit: 'cover', position: 'center' })
    const format = facebook ? 'jpeg' : config.format || 'webp'
    const quality = config.quality || 85
    const buffer = format === 'jpeg'
      ? await image.jpeg({ quality: facebook ? 92 : quality, mozjpeg: true, progressive: true }).toBuffer()
      : format === 'png' ? await image.png().toBuffer() : await image.webp({ quality }).toBuffer()
    if (!buffer.length) throw new Error('Generated image buffer is empty')
    return buffer
  }
  finally {
    await closeBrowser()
  }

  async function closeBrowser() {
    try {
      await browser.close()
    }
    catch (error) {
      cleanupFailed = true
      throw Object.assign(new Error('OG browser shutdown could not be confirmed'), { name: 'OgBrowserShutdownError', cause: error })
    }
  }
}
