import { useRuntimeConfig, useRoute } from '#imports'
import { useSEO } from './useSEO'
import type { SEOConfig } from '../types'

export const usePageSEO = (pageConfig: Partial<SEOConfig> = {}) => {
  const runtimeConfig = useRuntimeConfig()
  const publicConfig = (runtimeConfig.public || {}) as any
  const seoConfig = publicConfig.seo || {}
  const route = useRoute()
  
  const currentPath = String(route.path || '')
  const pages = seoConfig.pages || {}
  const pageConfigFromNuxt = (pages[currentPath] || {}) as Partial<SEOConfig>
  const defaultUrl = seoConfig.siteUrl ? `${String(seoConfig.siteUrl)}${currentPath}` : currentPath
  const finalUrl = pageConfig.url || pageConfigFromNuxt.url || defaultUrl
  
  const pageConfigFromNuxtSafe = pageConfigFromNuxt ? JSON.parse(JSON.stringify(pageConfigFromNuxt)) : {}
  const pageConfigSafe = pageConfig ? JSON.parse(JSON.stringify(pageConfig)) : {}
  
  const mergedConfig: SEOConfig = {
    siteName: String(seoConfig.siteName || ''),
    locale: String(seoConfig.defaultLocale || 'en'),
    type: (seoConfig.defaultType || 'website') as 'website' | 'article' | 'product' | 'profile',
    image: String(seoConfig.defaultImage || ''),
    url: String(finalUrl),
    ...pageConfigFromNuxtSafe,
    ...pageConfigSafe,
  }
  
  const result = useSEO(mergedConfig)
  
  return {
    meta: result.meta,
    structuredData: result.structuredData,
  }
}

