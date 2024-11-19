<template>
  <div class="base-modal">
    <slot
      name="trigger"
      :toggle-modal="toggleModal"
    >
      <button @click="toggleModal">
        Trigger
      </button>
    </slot>

    <Teleport to="body">
      <div
        v-if="isOpen"
        class="modal-container"
      >
        <div
          ref="modalContent"
          class="modal-content"
        >
          <slot />
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { onClickOutside } from '@vueuse/core'

const isOpen = ref(false)

const modalContainer = useTemplateRef('modalContent')

const toggleModal = () => {
  isOpen.value = !isOpen.value
}

onClickOutside(modalContainer, toggleModal)
</script>

<style lang="scss" scoped>
.modal-container {
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5);
  bottom: 0;
  display: flex;
  justify-content: center;
  left: 0;
  position: fixed;
  right: 0;
  top: 0;
  z-index: 1000;
}
</style>
