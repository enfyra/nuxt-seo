import { addComponentsDir, addImportsDir, addServerHandler, addServerPlugin, createResolver, defineNuxtModule } from '@nuxt/kit'
import { defu } from 'defu'
import type { SEOConfig, OgImageConfig, WebManifestConfig, RobotsConfig } from './types'

export interface ModuleOptions extends Partial<SEOConfig> {
  enabled?: boolean
  siteUrl?: string
  siteName?: string
  defaultLocale?: string
  defaultImage?: string
  defaultType?: 'website' | 'article' | 'product' | 'profile'
  pages?: Record<string, Partial<SEOConfig & { changefreq?: string; priority?: number; lastmod?: string }>>,
  robots?: RobotsConfig
  social?: {
    twitter?: {
      site?: string
      creator?: string
    }
    facebook?: {
      appId?: string
    }
  }
  ogImage?: OgImageConfig
  webmanifest?: WebManifestConfig
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@enfyra/nuxt-seo',
    version: '0.1.26',
    configKey: 'seo',
    compatibility: {
      nuxt: '^4.0.0',
    },
  },
  defaults: {
    enabled: true,
    siteUrl: '',
    siteName: '',
    defaultLocale: 'en',
    defaultImage: '',
    defaultType: 'website',
    robots: {
      enabled: true,
      disallow: ['/api/', '/admin/'],
      sitemap: true,
      sitemapPath: '/sitemap.xml',
    },
    ogImage: {
      enabled: false,
      viewport: {
        width: 1440,
        height: 754,
      },
      quality: 85,
      format: 'webp',
      cache: {
        ttl: 24 * 60 * 60 * 1000, // 24 hours
        memoryTtl: 60 * 60 * 1000, // 1 hour
      },
    },
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    nuxt.options.runtimeConfig.public.seo = defu(nuxt.options.runtimeConfig.public.seo as Record<string, unknown> | undefined, {
      enabled: options.enabled ?? true,
      siteUrl: options.siteUrl || '',
      siteName: options.siteName || '',
      defaultLocale: options.defaultLocale || 'en',
      defaultImage: options.defaultImage || '',
      defaultType: options.defaultType || 'website',
      description: options.description || '',
      pages: options.pages || {},
      social: options.social || {},
      robots: {
        enabled: options.robots?.enabled !== false,
        disallow: options.robots?.disallow || ['/api/', '/admin/'],
        sitemap: options.robots?.sitemap !== false,
        sitemapPath: options.robots?.sitemapPath || '/sitemap.xml',
        sitemapHandler: options.robots?.sitemapHandler,
      },
      ogImage: {
        enabled: options.ogImage?.enabled ?? false,
        route: options.ogImage?.route || '/_enfyra/nuxt-seo/og',
        viewport: {
          width: options.ogImage?.viewport?.width ?? 1440,
          height: options.ogImage?.viewport?.height ?? 754,
        },
        quality: options.ogImage?.quality ?? 85,
        format: options.ogImage?.format ?? 'webp',
        cache: {
          ttl: options.ogImage?.cache?.ttl ?? 24 * 60 * 60 * 1000,
          memoryTtl: options.ogImage?.cache?.memoryTtl ?? 60 * 60 * 1000,
        },
        warmup: {
          enabled: options.ogImage?.warmup?.enabled ?? false,
          origin: options.ogImage?.warmup?.origin || options.siteUrl || '',
          paths: options.ogImage?.warmup?.paths ?? [],
          delay: options.ogImage?.warmup?.delay ?? 1000,
          concurrency: options.ogImage?.warmup?.concurrency ?? 1,
          includeFacebook: options.ogImage?.warmup?.includeFacebook ?? false,
        },
      },
      webmanifest: options.webmanifest || {},
    })

    addImportsDir(resolver.resolve('./runtime/app/composables'))
    addComponentsDir({
      path: resolver.resolve('./runtime/app/components'),
      pathPrefix: false,
    })

    if (options.robots?.enabled !== false) {
      addServerHandler({
        route: '/robots.txt',
        handler: resolver.resolve('./runtime/server/routes/robots'),
      })
    }

    if (options.robots?.sitemap !== false) {
      addServerHandler({
        route: options.robots?.sitemapPath || '/sitemap.xml',
        handler: resolver.resolve('./runtime/server/routes/sitemap'),
      })
    }

    addServerHandler({
      route: '/site.webmanifest',
      handler: resolver.resolve('./runtime/server/routes/webmanifest'),
    })

    if (options.ogImage?.enabled) {
      addServerHandler({
        route: options.ogImage?.route || '/_enfyra/nuxt-seo/og',
        handler: resolver.resolve('./runtime/server/routes/og'),
      })

      addServerHandler({
        route: '/**',
        handler: resolver.resolve('./runtime/server/middleware/og-warmup'),
        middleware: true,
      })
      if (options.ogImage?.warmup?.enabled) {
        addServerPlugin(resolver.resolve('./runtime/server/plugins/og-warmup'))
      }
    }
  },
})
