<template>
  <section
    class="endpoint-http-callbacks"
    data-testid="endpoint-http-callbacks"
  >
    <CollapsibleSection :border-visible="false">
      <template #title>
        <div class="http-callbacks-header">
          <h2>Callbacks</h2>
          <slot />
        </div>
      </template>

      <div class="callback-collapsible-section-content">
        <ServerEndpoint
          class="callback-path-url"
          :method="callback.method"
          :selected-server-url="callback.path"
          :server-url-list="[callback.path]"
        />
        <HttpRequest
          v-if="callback.request"
          v-bind="callback.request"
          title-prefix="Callback"
        />
        <slot name="callback-response" />
      </div>
    </CollapsibleSection>
  </section>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { IHttpCallbackOperation } from '@stoplight/types'
import CollapsibleSection from './CollapsibleSection.vue'
import HttpRequest from './HttpRequest.vue'
import ServerEndpoint from './ServerEndpoint.vue'

defineProps({
  callback: {
    type: Object as PropType<IHttpCallbackOperation>,
    default: () => {},
  },
})
</script>

<style lang="scss" scoped>
.endpoint-http-callbacks {
  .http-callbacks-header {
    align-items: center;
    display: inline-flex;
    gap: var(--kui-space-50, $kui-space-50);
  }

  .callback-collapsible-section-content {
    background: var(--kui-color-background-neutral-weakest, $kui-color-background-neutral-weakest);
    border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
    margin-top: var(--kui-space-20, $kui-space-20);
    padding: var(--kui-space-50, $kui-space-50);

    .callback-path-url {
      background: var(--kui-color-background, $kui-color-background);
      margin-bottom: var(--kui-space-50, $kui-space-50);
      padding: var(--kui-space-40, $kui-space-40);
    }
  }

}
</style>
