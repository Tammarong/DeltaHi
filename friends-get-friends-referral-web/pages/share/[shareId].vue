<template>
  <span hidden />
</template>

<script setup lang="ts">
const route = useRoute()

await navigateTo(`/shareapp/${String(route.params.shareId || '')}`, {
  redirectCode: 307
})
</script>
