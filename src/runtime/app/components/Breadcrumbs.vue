<script setup lang="ts">
import { useRuntimeConfig } from '#imports'
import JsonLd from './JsonLd.vue'

interface BreadcrumbItem {
  name: string
  url: string
}

interface Props {
  items: BreadcrumbItem[]
}

const props = defineProps<Props>()

const runtimeConfig = useRuntimeConfig()
const publicConfig = (runtimeConfig.public || {}) as any
const seoConfig = publicConfig.seo || {}
const siteUrl = seoConfig.siteUrl || ''

const breadcrumbStructuredData = computed(() => {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: props.items.map((item: BreadcrumbItem, index: number) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${siteUrl}${item.url}`,
    })),
  }
})
</script>

<template>
  <nav aria-label="Breadcrumb" class="breadcrumb">
    <ol class="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
      <li v-for="(item, index) in items" :key="index" class="flex items-center gap-2">
        <template v-if="index < items.length - 1">
          <a :href="item.url" class="hover:text-foreground transition">{{ item.name }}</a>
          <Icon name="lucide:chevron-right" class="h-4 w-4" />
        </template>
        <span v-else class="text-foreground font-medium">{{ item.name }}</span>
      </li>
    </ol>
    <JsonLd :data="breadcrumbStructuredData" />
  </nav>
</template>

