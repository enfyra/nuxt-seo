<script setup lang="ts">
interface Props {
  data: Record<string, any> | Record<string, any>[]
}

const props = defineProps<Props>()

const jsonLdString = computed(() => {
  try {
    const data = Array.isArray(props.data) ? props.data : [props.data]
    const serializableData = data.map((item: Record<string, any>) => {
      const cleanItem = JSON.parse(JSON.stringify({
        '@context': 'https://schema.org',
        ...item,
      }))
      return cleanItem
    })
    return JSON.stringify(serializableData)
  } catch (error) {
    console.error('Error serializing JSON-LD data:', error)
    return '{}'
  }
})

const uniqueKey = computed(() => {
  const data = Array.isArray(props.data) ? props.data[0] : props.data
  return `json-ld-${data?.['@type'] || 'default'}-${Date.now()}`
})

watchEffect(() => {
  const scriptContent = jsonLdString.value
  if (scriptContent && scriptContent !== '{}') {
    useHead({
      script: [
        {
          type: 'application/ld+json',
          innerHTML: scriptContent,
          key: uniqueKey.value,
        },
      ],
    })
  }
})
</script>

<template>
</template>

