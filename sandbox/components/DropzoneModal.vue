<template>
  <div class="backdrop" />
  <div class="modal-container">
    <div class="dropzone-drag-inner">
      <div class="dropzone-drag-icon">
        <UploadIcon />
      </div>

      <h5 class="dropzone-drag-title">
        Drop your spec file
      </h5>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UploadIcon } from '@kong/icons'
</script>

<style lang="scss" scoped>
.backdrop {
  background-color: rgba(0, 0, 0, 0.5);
  bottom: 0;
  left: 0;
  position: fixed;
  right: 0;
  top: 0;
  z-index: 1000;
}

.modal-container {
  align-items: center;
  display: flex;
  height: 100vh;
  justify-content: center;
  left: 0;
  position: fixed;
  top: 0;
  width: 100vw;
  z-index: 1001;
}

.dropzone-drag-inner {
  align-items: center;
  background-color: $kui-color-background-success-weakest;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  gap: $kui-space-60;
  padding: $kui-space-80;
}
</style>
