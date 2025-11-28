import { useRuntimeConfig, useSeoMeta, useHead } from '#imports'
import type { SEOConfig } from '../types'

interface SeoMeta {
  title?: string
  description?: string
  keywords?: string
  author?: string
  robots?: {
    index?: boolean
    follow?: boolean
  }
}

export const useSEO = (config: SEOConfig) => {
  const runtimeConfig = useRuntimeConfig()
  const publicConfig = (runtimeConfig.public || {}) as any
  const seoConfig = publicConfig.seo || {}
  
  const siteUrl = config.url || seoConfig.siteUrl || ''
  const defaultImage = seoConfig.defaultImage || ''
  const defaultSiteName = seoConfig.siteName || ''
  const defaultLocale = seoConfig.defaultLocale || 'en_US'
  
  const seoEnabled = seoConfig.enabled !== false
  
  const fullImageUrl = config.image?.startsWith('http')
    ? config.image
    : config.image
      ? `${siteUrl}${config.image.startsWith('/') ? config.image : `/${config.image}`}`
      : defaultImage
        ? `${siteUrl}${defaultImage.startsWith('/') ? defaultImage : `/${defaultImage}`}`
        : ''

  const shouldIndex = seoEnabled && !config.noindex
  const shouldFollow = seoEnabled && !config.nofollow

  const meta: SeoMeta = {
    title: config.title,
    description: config.description,
    robots: {
      index: shouldIndex,
      follow: shouldFollow,
    },
  }

  if (config.keywords && config.keywords.length > 0) {
    meta.keywords = config.keywords.join(', ')
  }

  if (config.author) {
    meta.author = config.author
  }

  const ogTags: Record<string, string> = {
    'og:title': config.title || '',
    'og:description': config.description || '',
    'og:type': config.type || seoConfig?.defaultType || 'website',
    'og:url': config.canonical || config.url || siteUrl,
    'og:site_name': config.siteName || defaultSiteName,
    'og:locale': config.locale || defaultLocale,
  }

  if (fullImageUrl) {
    ogTags['og:image'] = fullImageUrl
    ogTags['og:image:width'] = '1200'
    ogTags['og:image:height'] = '630'
    ogTags['og:image:alt'] = config.title || defaultSiteName
  }

  const twitterTags: Record<string, string> = {
    'twitter:card': 'summary_large_image',
    'twitter:title': config.title || '',
    'twitter:description': config.description || '',
  }

  if (fullImageUrl) {
    twitterTags['twitter:image'] = fullImageUrl
    twitterTags['twitter:image:alt'] = config.title || defaultSiteName
  }

  const socialConfig = seoConfig.social || {}
  const twitterConfig = socialConfig.twitter || {}
  if (twitterConfig.site) {
    twitterTags['twitter:site'] = twitterConfig.site
  }
  if (twitterConfig.creator) {
    twitterTags['twitter:creator'] = twitterConfig.creator
  }

  if (config.type === 'article') {
    if (config.author) {
      ogTags['article:author'] = config.author
    }
    if (config.publishedTime) {
      ogTags['article:published_time'] = config.publishedTime
    }
    if (config.modifiedTime) {
      ogTags['article:modified_time'] = config.modifiedTime
    }
  }

  if (config.alternateLocales && config.alternateLocales.length > 0) {
    config.alternateLocales.forEach((locale) => {
      ogTags[`og:locale:alternate`] = locale
    })
  }

  const allMeta: Record<string, any> = {
    ...meta,
    ...ogTags,
    ...twitterTags,
  }

  useSeoMeta(allMeta)

  if (config.canonical || config.url) {
    useHead({
      link: [
        {
          rel: 'canonical',
          href: config.canonical || config.url || siteUrl,
        },
      ],
    })
  }

  if (config.title) {
    useHead({
      title: config.title,
    })
  }

  const safeMeta = JSON.parse(JSON.stringify(allMeta))
  const safeStructuredData = config.structuredData 
    ? JSON.parse(JSON.stringify(config.structuredData))
    : undefined

  return {
    meta: safeMeta as Record<string, any>,
    structuredData: safeStructuredData as Record<string, any> | undefined,
  }
}

