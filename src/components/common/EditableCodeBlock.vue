<template>
  <div>
    <textarea v-model="currentCode" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'


const props = defineProps({
  code: {
    type: String,
    required: true,
  },
  lang: {
    type: String,
    default: '',
  },
})

const currentCode = ref<string>(props.code)

</script>

<style lang="scss" scoped>
textarea {
  width: 100%;
  min-height: 100px;
  border: solid var(--kui-border-width-10, $kui-border-width-10) var(--kui-color-border, $kui-color-border);
}
</style>