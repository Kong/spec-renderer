<template>
  <PageHeader
    :id="`tag-${kebabCase(name)}`"
    class="http-operation-header"
    :description="description"
    :title="name"
  />
</template>

<script setup lang="ts">
import PageHeader from '../common/PageHeader.vue'
import { kebabCase } from '@/utils'

defineProps({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
})
</script>
