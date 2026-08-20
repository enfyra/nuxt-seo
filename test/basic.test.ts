import { describe, it, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

describe('@enfyra/nuxt-seo module', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/basic', import.meta.url)),
  })

  it('renders the page', async () => {
    const html = await $fetch('/')
    expect(html).toContain('Test Nuxt SEO')
  })

  it('generates robots.txt', async () => {
    const robots = await $fetch('/robots.txt')
    expect(robots).toContain('User-Agent')
  })

  it('generates sitemap.xml', async () => {
    const sitemap = await $fetch('/sitemap.xml')
    expect(sitemap).toContain('<?xml')
    expect(sitemap).toContain('<urlset')
  })

  it('generates webmanifest', async () => {
    const manifest = await $fetch('/site.webmanifest')
    expect(manifest).toHaveProperty('name')
  })
})

