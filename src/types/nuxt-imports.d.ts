/**
 * Type declarations for Nuxt auto-imports
 * These are provided at runtime by Nuxt but need declarations for TypeScript
 */

declare global {
  const usePageSEO: typeof import('../composables/usePageSEO').usePageSEO
  const useSEO: typeof import('../composables/useSEO').useSEO
}

declare module '#imports' {
  export const useRuntimeConfig: () => {
    public: {
      seo?: {
        enabled?: boolean
        siteUrl?: string
        siteName?: string
        defaultLocale?: string
        defaultImage?: string
        defaultType?: 'website' | 'article' | 'product' | 'profile'
        pages?: Record<string, any>
        social?: {
          twitter?: {
            site?: string
            creator?: string
          }
          facebook?: {
            appId?: string
          }
        }
        robots?: {
          enabled?: boolean
          disallow?: string[]
          sitemap?: boolean
          sitemapPath?: string
        }
        ogImage?: {
          enabled?: boolean
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
        }
      }
    }
    [key: string]: any
  }
  
  export const useSeoMeta: (meta: Record<string, any>) => void
  export const useHead: (head: any) => void
  export const useRoute: () => {
    path: string
    [key: string]: any
  }
  export const computed: <T>(getter: () => T) => { value: T }
  
  export function useSEO(
    config: {
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
    } | (() => {
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
    })
  ): {
    meta: Record<string, any>
    structuredData: Record<string, any> | undefined
  }
  
  export function usePageSEO(
    pageConfig?: {
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
    } | (() => {
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
    })
  ): {
    meta: Record<string, any>
    structuredData: Record<string, any> | undefined
  }
}

