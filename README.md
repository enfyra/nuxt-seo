# @enfyra/nuxt-seo

A powerful SEO optimization tool for Nuxt 4 that provides comprehensive SEO features including meta tags, Open Graph, Twitter Cards, structured data, robots.txt, sitemap generation, and automatic OG image generation.

Optimized by [Enfyra Team](https://enfyra.io).

## Features

- ✅ **Meta Tags**: Title, description, keywords, robots
- ✅ **Open Graph**: Full OG tags support for social media sharing
- ✅ **Twitter Cards**: Summary large image cards
- ✅ **Structured Data**: JSON-LD schema.org markup (Organization, Website, WebPage, Article, Product, etc.)
- ✅ **Robots.txt**: Dynamic generation with configurable rules
- ✅ **Sitemap.xml**: Automatic sitemap generation from page configurations
- ✅ **Web Manifest**: PWA support with configurable icons and manifest properties
- ✅ **OG Image Generation**: Automatic screenshot-based OG image generation with caching
- ✅ **Full TypeScript Support**: Complete type definitions with IntelliSense
- ✅ **Auto-imports**: Zero-config auto-imports for all composables (`usePageSEO`, `useSEO`)
- ✅ **Type-safe Configuration**: Type-safe config in `nuxt.config.ts` with autocomplete
- ✅ **Per-page Configuration**: Configure SEO per page in `nuxt.config.ts` or runtime
- ✅ **Global Configuration**: Set defaults for all pages
- ✅ **Disable SEO**: Easy toggle for staging/testing environments

## Installation

```bash
yarn add @enfyra/nuxt-seo
```

## Configuration

Add the module to your `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  modules: ['@enfyra/nuxt-seo'],
  
  seo: {
    enabled: true, // Set to false to disable SEO (useful for staging)
    siteUrl: 'https://example.com',
    siteName: 'My Website',
    defaultLocale: 'en',
    defaultImage: '/og-image.png',
    defaultType: 'website', // 'website' | 'article' | 'product' | 'profile'
    
    // Per-page SEO configuration
    pages: {
      '/': {
        title: 'Homepage - My Website',
        description: 'Welcome to my website',
        keywords: ['keyword1', 'keyword2'],
        changefreq: 'daily',
        priority: 1.0,
        structuredData: {
          '@type': 'SoftwareApplication',
          name: 'My App',
          // ... more structured data
        }
      },
      '/about': {
        title: 'About Us',
        description: 'Learn more about our company',
        changefreq: 'monthly',
        priority: 0.8
      }
    },
    
    // Robots.txt configuration
    robots: {
      enabled: true,
      disallow: ['/api/', '/admin/'],
      sitemap: true,
      sitemapPath: '/sitemap.xml'
    },
    
    // Social media configuration
    social: {
      twitter: {
        site: '@yourhandle',
        creator: '@yourhandle'
      },
      facebook: {
        appId: 'your-app-id'
      }
    },
    
    // Web Manifest configuration (PWA)
    webmanifest: {
      icons: [
        {
          src: '/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
      ],
      start_url: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#000000',
    }
  }
})
```

## TypeScript & Auto-imports

### 🎯 Zero-Configuration Auto-imports

**No manual imports required!** All composables are automatically available in your Nuxt app:

- ✅ `usePageSEO` - Automatically imported
- ✅ `useSEO` - Automatically imported
- ✅ Full TypeScript IntelliSense support
- ✅ Type-safe configuration in `nuxt.config.ts`

### 📦 Importing Types

If you need to use types in your code, you can import them:

```typescript
import type { 
  SEOConfig, 
  ModuleOptions,
  OgImageConfig,
  WebManifestConfig
} from '@enfyra/nuxt-seo'
```

### 🔍 Type Definitions

The module provides complete TypeScript definitions for:

- `SEOConfig` - Main SEO configuration interface
- `ModuleOptions` - Module configuration options
- `OgImageConfig` - OG image generation configuration
- `WebManifestConfig` - Web manifest (PWA) configuration
- `RobotsConfig` - Robots.txt configuration

All types are automatically available in your IDE with full IntelliSense support.

## Usage

### Auto-imported Composables

**No manual imports needed!** The module automatically imports `usePageSEO` and `useSEO` composables. Just use them directly in your components:

### Basic Usage in Pages

```vue
<script setup lang="ts">
// Automatically uses config from nuxt.config.ts for current route
usePageSEO()
</script>

<template>
  <div>Your page content</div>
</template>
```

### Override SEO in Pages

```vue
<script setup lang="ts">
// Override with page-specific config
usePageSEO({
  title: 'Custom Page Title',
  description: 'Custom description for this page',
  keywords: ['custom', 'keywords'],
  image: '/custom-og-image.png'
})
</script>
```

### Advanced Usage with Structured Data

```vue
<script setup lang="ts">
usePageSEO({
  title: 'Article Title',
  description: 'Article description',
  type: 'article',
  publishedTime: '2024-01-01T00:00:00Z',
  modifiedTime: '2024-01-02T00:00:00Z',
  author: 'John Doe',
  structuredData: {
    '@type': 'Article',
    headline: 'Article Title',
    description: 'Article description',
    author: {
      '@type': 'Person',
      name: 'John Doe'
    },
    publisher: {
      '@type': 'Organization',
      name: 'My Website'
    }
  }
})
</script>
```

### Using `useSEO` Directly

```vue
<script setup lang="ts">
// For more control, use useSEO directly
const { meta, structuredData } = useSEO({
  title: 'Page Title',
  description: 'Page description',
  url: 'https://example.com/page',
  image: '/og-image.png',
  type: 'website'
})
</script>
```

### Reactive usage (using `computed` / state)

Both `usePageSEO` and `useSEO` accept either a **plain config object** or a **function that returns a config object**, so you can safely use reactive state/computed values.

```vue
<script setup lang="ts">
const article = computed(() => ({
  title: 'Article Title',
  description: 'Article description',
  image: '/article-og.png',
}))

// Option 1: Use a function to read reactive values each time (recommended)
usePageSEO(() => ({
  title: article.value.title,
  description: article.value.description,
  image: article.value.image,
  type: 'article',
}))

// Option 2: Use directly with useSEO
const { meta, structuredData } = useSEO(() => ({
  title: article.value.title,
  description: article.value.description,
  url: `https://example.com/blog/article`,
  image: article.value.image,
  type: 'article',
}))
</script>
```

## API Reference

### Module Options

```typescript
interface ModuleOptions {
  enabled?: boolean // Enable/disable SEO globally
  siteUrl?: string // Your site URL
  siteName?: string // Your site name
  defaultLocale?: string // Default locale (e.g., 'en', 'en_US')
  defaultImage?: string // Default OG image path
  defaultType?: 'website' | 'article' | 'product' | 'profile' // Default OG type
  pages?: Record<string, PageSEOConfig> // Per-page configuration shape
  robots?: RobotsConfig // Robots.txt configuration
  social?: SocialConfig // Social media configuration shape
  ogImage?: OgImageConfig // Dynamic OG image generation configuration
  webmanifest?: WebManifestConfig // Web manifest (PWA) configuration
}
```

### SEOConfig

```typescript
interface SEOConfig {
  title?: string
  description?: string
  keywords?: string[]
  image?: string
  url?: string
  type?: 'website' | 'article' | 'product' | 'profile'
  author?: string
  publishedTime?: string
  modifiedTime?: string
  siteName?: string
  locale?: string
  alternateLocales?: string[]
  noindex?: boolean
  nofollow?: boolean
  canonical?: string
  structuredData?: Record<string, any> | Record<string, any>[]
}
```

### PageSEOConfig

Documentation shape for `pages` entries. It extends `SEOConfig` with:

```typescript
interface PageSEOConfig extends SEOConfig {
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number // 0.0 to 1.0
  lastmod?: string // ISO date string
}
```

### SocialConfig

Documentation shape for `social` configuration:

```typescript
interface SocialConfig {
  twitter?: {
    site?: string
    creator?: string
  }
  facebook?: {
    appId?: string
  }
}
```

### OgImageConfig

```typescript
interface OgImageConfig {
  enabled?: boolean
  route?: string // Public route for generated images (default: /_enfyra/nuxt-seo/og)
  viewport?: {
    width?: number
    height?: number
  }
  quality?: number
  format?: 'png' | 'jpeg' | 'webp'
  cache?: {
    ttl?: number
    memoryTtl?: number
  }
  warmup?: {
    enabled?: boolean
    origin?: string
    paths?: string[]
    delay?: number
    concurrency?: number
    includeFacebook?: boolean
  }
}
```

### Composables

#### `usePageSEO(pageConfig?: Partial<SEOConfig> | (() => Partial<SEOConfig>))`

Composable to set SEO for the current page. Automatically merges:
1. Global defaults from `nuxt.config.ts`
2. Per-page config from `nuxt.config.ts` (based on current route)
3. Runtime config passed to the composable (highest priority)

**Returns:** Result from `useSEO()`

**Example (static object):**
```typescript
usePageSEO({
  title: 'Custom Title',
  description: 'Custom Description',
})
```

**Example (reactive, using function):**
```typescript
const title = computed(() => `Blog - ${post.value.title}`)

usePageSEO(() => ({
  title: title.value,
  description: post.value.excerpt,
  image: post.value.image,
}))
```

#### `useSEO(config: SEOConfig | (() => SEOConfig))`

Core SEO composable that sets meta tags, Open Graph, Twitter Cards, and structured data.

**Returns:**
```typescript
{
  meta: Record<string, any>
  structuredData?: Record<string, any> | Record<string, any>[]
}
```

**Example:**
```typescript
const { meta, structuredData } = useSEO({
  title: 'Page Title',
  description: 'Page Description',
  url: 'https://example.com/page'
})
```

## Components

### SEOHead

Component for rendering structured data (JSON-LD).

```vue
<script setup lang="ts">
import { SEOHead } from '@enfyra/nuxt-seo/src/components/SEOHead'

const seoConfig = {
  title: 'Page Title',
  description: 'Page Description',
  structuredData: {
    '@type': 'WebPage',
    // ... more structured data
  }
}
</script>

<template>
  <SEOHead :config="seoConfig" />
</template>
```

### Breadcrumbs

Component for breadcrumb navigation with structured data.

```vue
<script setup lang="ts">
import { Breadcrumbs } from '@enfyra/nuxt-seo/src/components/Breadcrumbs'

const breadcrumbItems = [
  { name: 'Home', url: '/' },
  { name: 'Category', url: '/category' },
  { name: 'Current Page', url: '/category/page' }
]
</script>

<template>
  <Breadcrumbs :items="breadcrumbItems" />
</template>
```

## Production setup: canonical URLs, locales, and crawler routes

For a production site, configure every public route in `seo.pages` so the generated sitemap has an explicit crawl policy. `siteUrl` must be the public origin with no trailing slash. Do not point it at an internal API or admin host.

For localized Nuxt i18n routes, derive the canonical URL from the active locale and pass it to `usePageSEO`. Add the other locale codes with `alternateLocales`; this produces `og:locale` and `og:locale:alternate` metadata. Keep the sitemap entries aligned with those public URLs.

```ts
const { locale, t } = useI18n()
const canonicalPath = computed(() => locale.value === 'vi' ? '/vi' : '/')
const canonicalUrl = computed(() => `https://example.com${canonicalPath.value}`)

usePageSEO(() => ({
  title: t('seo.title'),
  description: t('seo.description'),
  url: canonicalUrl.value,
  canonical: canonicalUrl.value,
  locale: locale.value === 'vi' ? 'vi_VN' : 'en_US',
  alternateLocales: locale.value === 'vi' ? ['en_US'] : ['vi_VN'],
}))
```

Keep non-public routes such as maintenance or preview pages out of `seo.pages`, add them to `robots.disallow`, and set `noindex: true` and `nofollow: true` in that route's `usePageSEO` call. A robots rule alone is not a noindex directive for a page that has already been crawled.

The module owns `/site.webmanifest`; do not also ship `public/site.webmanifest` or add a second manual manifest link. Configure the manifest entirely through `seo.webmanifest` so browsers receive the application name, colors, display mode, and existing icon files from one source of truth.

## OG Image Generation

The module can automatically generate OG images by taking screenshots of your pages. This feature is disabled by default and can be enabled in your configuration.

### Configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@enfyra/nuxt-seo'],
  seo: {
    ogImage: {
      enabled: true,
      route: '/_enfyra/nuxt-seo/og',
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
    }
  }
})
```

### Usage

Once enabled, the module automatically creates an endpoint at `ogImage.route` (default `/_enfyra/nuxt-seo/og`). The namespaced default stays separate from `/api/**` proxies and other modules. Pass the page path with the `path` query parameter and use that URL as the page image:

```vue
<script setup lang="ts">
const config = useRuntimeConfig()
const seoConfig = config.public.seo
const siteUrl = seoConfig?.siteUrl || 'https://example.com'
const ogRoute = seoConfig?.ogImage?.route || '/_enfyra/nuxt-seo/og'
const route = useRoute()

usePageSEO({
  title: 'My Page Title',
  description: 'My page description',
  image: `${siteUrl}${ogRoute}?path=${encodeURIComponent(route.path)}`,
})
</script>
```

For a static route, pass the route path directly:

```vue
<script setup lang="ts">
usePageSEO({
  title: 'Pricing',
  description: 'Plans and pricing',
  image: '/_enfyra/nuxt-seo/og?path=%2Fpricing',
})
</script>
```

For dynamic content, keep the path stable and put the dynamic title/description in the rendered page. The image generator screenshots the page itself, so the OG image reflects what the page displays at that route:

```vue
<script setup lang="ts">
const route = useRoute()
const article = await fetchArticle(route.params.slug)

usePageSEO(() => ({
  title: article.title,
  description: article.excerpt,
  type: 'article',
  image: `/_enfyra/nuxt-seo/og?path=${encodeURIComponent(route.path)}`,
}))
</script>
```

You can preview an image directly in the browser:

```text
http://localhost:3000/_enfyra/nuxt-seo/og?path=%2Fmy-page
```

Add the `og-hide` class to elements that should be hidden only from generated OG screenshots:

```vue
<template>
  <CookieBanner class="og-hide" />
</template>
```

### Social image URLs and fallback behavior

Use an absolute public URL for the `image` field when a page is shared outside the site. For generated images, build that URL from `siteUrl` and the route path. Do not use a relative OG route as the final Open Graph value: crawlers that do not preserve the original origin can resolve it incorrectly.

```ts
const siteUrl = 'https://example.com'
const route = useRoute()

usePageSEO({
  title: 'Pricing',
  description: 'Compare plans and pricing.',
  image: `${siteUrl}/_enfyra/nuxt-seo/og?path=${encodeURIComponent(route.path)}`,
})
```

`defaultImage` is a fallback only. It is used when a screenshot cannot be generated, so it should be a public static image with a stable absolute or site-relative URL. Prefer a 1200×630 image; social crawlers can display a different aspect ratio, but their card crop will be more reliable at that size.

```ts
seo: {
  siteUrl: 'https://example.com',
  defaultImage: '/og-fallback.png',
}
```

### Startup cache warm-up

OG capture is intentionally lazy by default: the first `/_enfyra/nuxt-seo/og` request may take several seconds while Chromium renders the page. Enable `warmup` to generate selected public pages in the background after Nitro begins listening. This does not delay application readiness. If a warm-up request fails, the module logs a warning; later OG requests still retry generation and can redirect to `defaultImage` if capture fails.

When `paths` is omitted, the module warms every route in `seo.pages`. Set `includeFacebook` when you also want to pre-generate the separate 1200×630 JPEG cache used for Facebook crawlers. Keep `concurrency` low because each task launches a browser process.

```ts
seo: {
  ogImage: {
    enabled: true,
    warmup: {
      enabled: true,
      paths: ['/', '/pricing'],
      delay: 1000,
      concurrency: 1,
      includeFacebook: true,
    },
  },
}
```

### How It Works

1. **Screenshot Capture**: Uses Puppeteer to capture screenshots of your pages
2. **Image Optimization**: Converts to WebP/JPEG format with configurable quality
3. **Caching**: Two-tier caching system:
   - **Memory cache**: Fast access for frequently requested images (1 hour default)
   - **File cache**: Persistent cache stored in `.enfyra-og-cache/` directory (24 hours default)
4. **Automatic URL Detection**: Automatically detects the correct URL based on request headers (supports staging/production)
5. **Crawler Handling**: Facebook crawlers automatically receive a 1200x630 JPEG image and trigger background cache warmup for the crawled page

### Requirements

- **Development**: Requires Chrome/Chromium installed locally
- **Production**: Uses `@sparticuz/chromium` for serverless environments (Vercel, Netlify, etc.)

### Environment Variables

- `CHROME_PATH`: Custom path to Chrome/Chromium executable (optional, for development)

### Cache Management

Cache files are stored in `.enfyra-og-cache/` directory. You can safely delete this folder to clear the cache. The cache key is based on the page path and host, so different environments (staging/production) have separate caches.

### Fallback Image

Set `defaultImage` to provide a fallback when screenshot generation fails. Absolute URLs are redirected as-is, and relative paths are resolved against the current request host:

```typescript
export default defineNuxtConfig({
  modules: ['@enfyra/nuxt-seo'],
  seo: {
    siteUrl: 'https://example.com',
    defaultImage: '/og-fallback.png',
    ogImage: {
      enabled: true,
    },
  },
})
```

### Performance

- **First request**: ~2-5 seconds (screenshot generation)
- **Cached requests**: <100ms (served from cache)
- **File size**: ~100-150KB (WebP format, 1440x754)

## Server Routes

The module automatically generates:

### `/site.webmanifest`

Web App Manifest file for PWA support. The manifest is automatically generated based on your configuration. If no icons are configured, the manifest will be generated without icons to prevent errors.

**Configuration:**

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@enfyra/nuxt-seo'],
  seo: {
    webmanifest: {
      icons: [
        {
          src: '/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
      ],
      start_url: '/',
      display: 'standalone', // 'fullscreen' | 'standalone' | 'minimal-ui' | 'browser'
      background_color: '#ffffff',
      theme_color: '#000000',
    }
  }
})
```

**WebManifestConfig Interface:**

```typescript
interface WebManifestConfig {
  icons?: Array<{
    src: string
    sizes: string
    type?: string
    purpose?: string
  }>
  start_url?: string
  display?: 'fullscreen' | 'standalone' | 'minimal-ui' | 'browser'
  background_color?: string
  theme_color?: string
}
```

**Important Notes:**

- **Icons are optional**: If you don't configure icons, the manifest will be generated without them. This prevents errors when icon files don't exist.
- **Automatic link tag**: The module automatically adds a `<link rel="manifest">` tag to your pages pointing to `/site.webmanifest`.
- **Default values**: If not configured, defaults are:
  - `start_url`: `/`
  - `display`: `standalone`
  - `background_color`: `#ffffff`
  - `theme_color`: `#000000`

**Example Output:**

```json
{
  "name": "My Website",
  "short_name": "My Website",
  "description": "Website description",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### `/robots.txt`

Dynamically generated based on your configuration:

```
User-Agent: *
Allow: /
Disallow: /api/
Disallow: /admin/

Sitemap: https://example.com/sitemap.xml
```

### `/sitemap.xml`

Automatically generated from your page configurations:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>2024-01-01</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <!-- More URLs -->
</urlset>
```

## TypeScript Support

### 🚀 Full TypeScript Support

The module is built with TypeScript from the ground up and provides:

- ✅ **Auto-imported Composables**: `usePageSEO` and `useSEO` are automatically available with full type inference
- ✅ **Type-safe Configuration**: All configuration options in `nuxt.config.ts` are fully typed with IntelliSense
- ✅ **Complete Type Definitions**: All interfaces, types, and configurations are fully typed
- ✅ **IntelliSense Support**: Full autocomplete and type checking in VS Code, WebStorm, and other IDEs
- ✅ **Type Inference**: Automatic type inference for reactive configurations

### 📝 Type Definitions

All types are exported and available for import:

```typescript
import type { 
  SEOConfig,           // Main SEO configuration
  ModuleOptions,       // Module configuration
  OgImageConfig,       // OG image generation config
  WebManifestConfig,   // Web manifest (PWA) config
  RobotsConfig,        // Robots.txt config
  SitemapRoute,        // Sitemap route entry
  SitemapHandler       // Custom sitemap handler
} from '@enfyra/nuxt-seo'
```

### 💡 Type-safe Usage Examples

```typescript
// Type-safe configuration in nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@enfyra/nuxt-seo'],
  seo: {
    siteUrl: 'https://example.com', // ✅ Type-checked
    defaultType: 'website',         // ✅ Literal type: 'website' | 'article' | 'product' | 'profile'
    ogImage: {
      enabled: true,                  // ✅ Type-checked
      format: 'webp',                // ✅ Literal type: 'png' | 'jpeg' | 'webp'
      quality: 85,                   // ✅ Number type
    }
  }
})
```

```vue
<script setup lang="ts">
// ✅ usePageSEO is auto-imported with full type inference
// ✅ All parameters are type-checked
usePageSEO({
  title: 'My Page',           // ✅ string
  description: 'Description',  // ✅ string
  type: 'article',            // ✅ 'website' | 'article' | 'product' | 'profile'
  keywords: ['tag1', 'tag2'], // ✅ string[]
  image: '/og.png',           // ✅ string
})

// ✅ Reactive usage with type inference
const article = computed(() => ({
  title: 'Article Title',
  description: 'Article description',
}))

usePageSEO(() => ({
  title: article.value.title,      // ✅ Type-safe access
  description: article.value.description,
}))
</script>
```

### 🔧 Troubleshooting TypeScript

If you encounter TypeScript errors:

1. **Restart TypeScript Server**: In VS Code, press `Cmd/Ctrl + Shift + P` → "TypeScript: Restart TS Server"
2. **Run Nuxt Prepare**: `yarn nuxt prepare`
3. **Check Module Installation**: Ensure `@enfyra/nuxt-seo` is in `node_modules`
4. **Verify Auto-imports**: Check that composables are available without imports (they should be!)

## Examples

### Example 1: Basic Setup

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@enfyra/nuxt-seo'],
  seo: {
    enabled: true,
    siteUrl: 'https://example.com',
    siteName: 'My Website',
    defaultLocale: 'en',
    defaultImage: '/og-image.png'
  }
})
```

```vue
<!-- pages/index.vue -->
<script setup lang="ts">
usePageSEO()
</script>
```

### Example 2: Article Page

```vue
<!-- pages/blog/[slug].vue -->
<script setup lang="ts">
const route = useRoute()
const article = await fetchArticle(route.params.slug)

usePageSEO({
  title: article.title,
  description: article.excerpt,
  type: 'article',
  publishedTime: article.publishedAt,
  modifiedTime: article.updatedAt,
  author: article.author.name,
  image: article.image,
  structuredData: {
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    image: article.image,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: {
      '@type': 'Person',
      name: article.author.name
    }
  }
})
</script>
```

### Example 3: Product Page

```vue
<!-- pages/products/[id].vue -->
<script setup lang="ts">
const route = useRoute()
const product = await fetchProduct(route.params.id)

usePageSEO({
  title: product.name,
  description: product.description,
  type: 'product',
  image: product.image,
  structuredData: {
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image,
    brand: product.brand,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'USD',
      availability: product.inStock ? 'InStock' : 'OutOfStock'
    }
  }
})
</script>
```

### Example 4: Disable SEO for Staging

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@enfyra/nuxt-seo'],
  seo: {
    enabled: process.env.NODE_ENV === 'production', // Disable in staging
    siteUrl: 'https://example.com',
    // ... rest of config
  }
})
```

## Best Practices

1. **Always set `siteUrl`**: Required for canonical URLs and OG tags
2. **Use per-page config**: Configure SEO in `nuxt.config.ts` for static pages
3. **Override at runtime**: Use `usePageSEO()` for dynamic content
4. **Provide structured data**: Enhances search engine understanding
5. **Set appropriate `changefreq` and `priority`**: Helps search engines crawl efficiently
6. **Use unique titles and descriptions**: Avoid duplicate content
7. **Optimize images**: Use high-quality images for OG tags (1200x630px recommended)

## Troubleshooting

### SEO not working?

1. Check `seo.enabled` is `true` in `nuxt.config.ts`
2. Verify `siteUrl` is set correctly
3. Check browser console for errors
4. Ensure you're calling `usePageSEO()` in your pages

### Types or Auto-imports not working?

1. **Restart TypeScript Server**: In VS Code, press `Cmd/Ctrl + Shift + P` → "TypeScript: Restart TS Server"
2. **Run Nuxt Prepare**: `yarn nuxt prepare` to regenerate types
3. **Check Module Installation**: Ensure `@enfyra/nuxt-seo` is properly installed in `node_modules`
4. **Verify Auto-imports**: Composables should be available without imports - if not, check your Nuxt version (requires Nuxt 4+)
5. **Clear Cache**: Delete `.nuxt` folder and run `yarn nuxt prepare` again

### Robots.txt not generating?

1. Check `robots.enabled` is `true`
2. Verify the route `/robots.txt` is accessible
3. Check server logs for errors

### OG image not generating?

1. Check `seo.ogImage.enabled` is `true`
2. Verify `/_enfyra/nuxt-seo/og?path=%2Fyour-page` is accessible
3. In development, install Chrome/Chromium or set `CHROME_PATH`
4. Make sure the target page path renders successfully before the screenshot request
5. Delete `.enfyra-og-cache/` if you need to force regeneration

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
