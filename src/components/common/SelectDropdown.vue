<template>
  <div
    class="select-dropdown-container"
    data-testid="select-dropdown-container"
    @click="selectDropdown?.showPicker()"
  >
    <select
      ref="selectDropdown"
      class="select-dropdown"
      data-testid="select-dropdown"
      @change="changeSelectedOption"
    >
      <option
        v-for="option in optionList"
        :key="option"
        :data-testid="`select-dropdown-option-${option}`"
        :selected="option === selectedOption"
        :value="option"
      >
        {{ option }}
      </option>
    </select>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { PropType } from 'vue'

const props = defineProps({
  optionList: {
    type: Array as PropType<Array<string | number>>,
    required: true,
  },
  selectedOption: {
    type: [String, Number],
    required: true,
  },
  // if true, the width of the select element will be changed based on the selected option
  dynamicWidth: {
    type: Boolean,
    default: false,
  },
})

const selectDropdown = ref<HTMLSelectElement>()

const emit = defineEmits<{
  (e: 'selected-option-changed', option: string): void
}>()

onMounted(() => {
  if (props.dynamicWidth) {
    updateSelectWidth()
  }
})

// emit event and change width of select element based on selected option
function changeSelectedOption(event: Event) {
  const selectElement = event.target as HTMLSelectElement
  emit('selected-option-changed', selectElement.value)

  if (props.dynamicWidth) {
    updateSelectWidth()
  }
}

function updateSelectWidth() {
  if (selectDropdown.value) {
    const selectedOption = selectDropdown.value.options[selectDropdown.value.selectedIndex]
    selectDropdown.value.style.width = `${selectedOption.text.length}ch`
  }
}
</script>

<style lang="scss" scoped>
.select-dropdown-container{
  align-items: center;
  cursor: pointer;
  display: flex;

  .select-dropdown{
    @include default-select-reset;
    display: inline;
  }
}
</style>
