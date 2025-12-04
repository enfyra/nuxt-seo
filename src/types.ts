export interface SEOConfig {
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

export interface OrganizationData {
  name: string
  url: string
  logo?: string
  description?: string
  sameAs?: string[]
  contactPoint?: {
    '@type': string
    telephone?: string
    contactType?: string
    email?: string
  }
}

export interface ArticleData {
  headline: string
  description: string
  image?: string
  datePublished?: string
  dateModified?: string
  author?: {
    name: string
    url?: string
  }
  publisher?: OrganizationData
}

export interface ProductData {
  name: string
  description: string
  image?: string
  brand?: string
  offers?: {
    price: string
    priceCurrency: string
    availability?: string
  }
}

export interface OgImageConfig {
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

