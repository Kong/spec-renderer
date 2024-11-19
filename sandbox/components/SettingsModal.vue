<template>
  <BaseModal class="renderer-settings-modal">
    <template #trigger="{ toggleModal }">
      <button
        class="settings-trigger-button"
        @click="toggleModal()"
      >
        <CogIcon
          decorative
          :size="KUI_ICON_SIZE_30"
        />
        Settings
      </button>
    </template>

    <div class="renderer-settings-modal-container">
      <h2>Settings</h2>
      <p>
        You can toggle each of the settings below to see how it affects the rendered spec.
      </p>
      <div>
        <ToggleSwitch
          id="hide-schemas"
          v-model="hideSchemas"
          label="Hide schemas"
        />

        <ToggleSwitch
          id="hide-deprecated"
          v-model="hideDeprecated"
          label="Hide deprecated"
        />

        <ToggleSwitch
          id="hide-tryit"
          v-model="hideTryIt"
          label="Hide TryIt"
        />

        <ToggleSwitch
          id="allow-content-scrolling"
          v-model="allowContentScrolling"
          label="Allow Content Scrolling"
        />

        <ToggleSwitch
          id="allow-custom-server-url"
          v-model="allowCustomServerUrl"
          label="Allow custom server url"
        />

        <ToggleSwitch
          id="default-md-styling"
          v-model="markdownStyles"
          label="Default markdown styling"
        />
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { CogIcon } from '@kong/icons'
import { KUI_ICON_SIZE_30 } from '@kong/design-tokens'
import BaseModal from './BaseModal.vue'
import ToggleSwitch from '../../src/components/common/ToggleSwitch.vue'

const hideSchemas = defineModel('hideSchemas', {
  type: Boolean,
  required: true,
})

const hideDeprecated = defineModel('hideDeprecated', {
  type: Boolean,
  required: true,
})

const hideTryIt = defineModel('hideTryIt', {
  type: Boolean,
  required: true,
})

const allowContentScrolling = defineModel('allowContentScrolling', {
  type: Boolean,
  required: true,
})

const markdownStyles = defineModel('markdownStyles', {
  type: Boolean,
  required: true,
})

const allowCustomServerUrl = defineModel('allowCustomServerUrl', {
  type: Boolean,
  required: true,
})
</script>

<style lang="scss" scoped>
.renderer-settings-modal {
  button.settings-trigger-button {
    @include default-button-reset;
    align-items: center;
    background-color: $kui-color-background-transparent;
    border: $kui-border-width-10 solid $kui-color-border;
    border-radius: $kui-border-radius-20;
    color: $kui-color-text-inverse;
    cursor: pointer;
    display: inline-flex;
    font-size: $kui-font-size-30;
    gap: $kui-space-20;
    padding: $kui-space-20 $kui-space-40;
    transition: background-color 0.2s ease-in-out,
      color 0.2s ease-in-out,
      border-color 0.2s ease-in-out;

    &:hover:not(:disabled):not(:focus):not(:active) {
      background-color: $kui-color-background-primary-weakest;
      color: $kui-color-text-primary-stronger;
    }
  }
}
.renderer-settings-modal-container {
  background-color: $kui-color-background;
  padding: $kui-space-80;
  width: 400px;

  > h2 {
    margin: $kui-space-0;
    margin-bottom: $kui-space-40;
  }

  > p {
    margin: $kui-space-0;
    margin-bottom: $kui-space-80;
  }

  > div {
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
    gap: $kui-space-30;
    label {
      margin-left: $kui-space-20;
    }
  }
}
</style>
