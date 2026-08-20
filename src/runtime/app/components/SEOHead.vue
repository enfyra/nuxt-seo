<script setup lang="ts">
import { useRuntimeConfig } from '#imports'
import { useSEO } from '../composables/useSEO'
import type { SEOConfig } from '../../../types'
import JsonLd from './JsonLd.vue'

interface Props {
  config: SEOConfig
}

const props = defineProps<Props>()

const { structuredData } = useSEO(props.config)

const defaultStructuredData = computed(() => {
  if (props.config.structuredData) {
    return props.config.structuredData
  }

  const runtimeConfig = useRuntimeConfig()
  const publicConfig = (runtimeConfig.public || {}) as any
  const seoConfig = publicConfig.seo || {}
  const siteUrl = props.config.url || seoConfig.siteUrl || ''
  const siteName = props.config.siteName || seoConfig.siteName || ''
  const socialConfig = seoConfig.social || {}
  const twitterConfig = socialConfig.twitter || {}
  const twitterSite = twitterConfig.site || ''

  const organization = {
    '@type': 'Organization',
    name: siteName,
    url: siteUrl,
    description: props.config.description || '',
    sameAs: twitterSite ? [`https://twitter.com/${twitterSite.replace('@', '')}`] : [],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      url: siteUrl,
    },
  }

  const website = {
    '@type': 'WebSite',
    name: siteName,
    url: siteUrl,
    description: props.config.description || '',
  }

  const webPage = {
    '@type': 'WebPage',
    '@id': `${siteUrl}#webpage`,
    url: props.config.canonical || props.config.url || siteUrl,
    name: props.config.title || siteName,
    description: props.config.description || '',
    isPartOf: {
      '@id': `${siteUrl}#website`,
    },
    about: {
      '@id': `${siteUrl}#organization`,
    },
  }

  return [organization, website, webPage]
})

const finalStructuredData = computed(() => {
  if (structuredData) {
    return structuredData
  }
  return defaultStructuredData.value
})
</script>

<template>
  <JsonLd v-if="finalStructuredData" :data="finalStructuredData" />
</template>
