<template>
  <div class="param-wrapper">
    <InputLabel
      class="param-label"
      :for="`auth-input-oauth2-authorizationCode-token-${dataId}`"
    >
      Access token
    </InputLabel>
    <div class="input-wrapper">
      <input
        :id="`auth-input-oauth2-authorizationCode-token-${dataId}`"
        v-model="authInputs[`${schemeKey}-token`]"
        autocomplete="off"
        :data-testid="`tryit-auth-manual-token-${dataId}`"
        placeholder="Bearer eyJhbGciOi..."
        :type="showToken ? 'text' : 'password'"
      >
      <VisibilityToggleButton
        v-model="showToken"
        class="visibility-toggle-btn"
        label="token"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// Access token input for when the user signs in outside Try It.
import { ref } from 'vue'
import InputLabel from '@/components/common/InputLabel.vue'
import VisibilityToggleButton from '@/components/common/VisibilityToggleButton.vue'
import composables from '@/composables'

const { schemeKey, dataId } = defineProps<{
  schemeKey: string
  dataId: string
}>()

const { authInputs } = composables.useAuth()

const showToken = ref<boolean>(false)
</script>

<style lang="scss" scoped>
.panel-body {
  @include try-it-auth-fields;

  .input-wrapper {
    align-items: center;
    display: flex;
    position: relative;

    input {
      flex: 1;
      @include input-default;
      padding-right: var(--kui-space-80, $kui-space-80);
    }

    .visibility-toggle-btn {
      padding-right: var(--kui-space-40, $kui-space-40);
      position: absolute;
      right: 0;
    }
  }
}
</style>
