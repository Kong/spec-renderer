<template>
  <div class="tryit-btn-wrapper">
    <button
      class="tryit-btn"
      :data-testid="`tryit-btn-${data.id}`"
      @click="startApiCall"
    >
      Try It! {{ hideInsomnia }}
    </button>

    <SelectDropdown
      :id="`tryit-select-dropdown-${data.id}`"
      :change="onChange"
      :items="dropdownItems"
      placement="bottom-end"
      trigger-button=""
    >
      <template #item-2-item-content>
        <KongIcon />
        Item 2
      </template>

      <template #item-3-item>
        <a
          href="http://localhost:5173/spec-renderer/comppnents"
          target="_blank"
        >
          Item 3 (link)
        </a>
      </template>

      <template #item-4-item>
        <button @click="onDropdownButtonClick">
          Item 4 (action button)
        </button>
      </template>
    </SelectDropdown>
  </div>
</template>

<script setup lang="ts">
import { inject, ref, computed } from 'vue'
import type { PropType, Ref } from 'vue'
import type { IHttpOperation } from '@stoplight/types'
import SelectDropdown from '@/components/common/SelectDropdown.vue'


defineProps({
  data: {
    type: Object as PropType<IHttpOperation>,
    required: true,
  },
})

const emit = defineEmits<{
  (e: 'tryit-api-call'): void,
}>()


const hideInsomniaTryIt = inject<Ref<boolean>>('hide-insomnia-tryit', ref(false))
const specUrl = inject<Ref<string>>('spec-url', ref(''))

// when property forced or url of the specification is not provided
const hideInsomnia = computed((): boolean => {
  return hideInsomniaTryIt.value || !specUrl.value
})

const dropdownItems = [
  { label: 'Item 1', value: 'item-1' },
  { label: 'Item 2', value: 'item-2', key: 'item-2' },
  { label: 'Item 3', value: 'item-3', key: 'item-3' },
  { label: 'Item 4', value: 'item-4', key: 'item-4' },
]


const startApiCall = () => {
  emit('tryit-api-call')
}

const onDropdownButtonClick = () => {
  console.log('Item 4 clicked')
}

const onChange = () => {
  console.log('on change')
}
</script>

<style lang="scss" scoped>
.tryit-btn-wrapper {
  display: flex;
  margin-left: auto;
  align-items: center;
  justify-content: center;

  .tryit-btn {
    border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
  }
}
</style>
