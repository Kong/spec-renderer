<template>
  <section
    class="endpoint-http-callbacks"
    data-testid="endpoint-http-callbacks"
  >
    <CollapsibleSection>
      <template #title>
        <div class="http-callbacks-header">
          <h2>Callbacks</h2>
          <slot />
        </div>
      </template>

      <div class="callback-collapsible-section-content">
        <div class="callback-path-container">
          <MethodBadge
            :method="callback.method"
            size="small"
          />
          <span class="callback-path">{{ callback.path }}</span>
        </div>

        <HttpRequest
          v-if="callback.request"
          v-bind="callback.request"
          title-prefix="Callback"
        />
        <HttpResponse
          v-if="responseList.length"
          class="http-callback-response"
          :content-list="activeResponseContentList"
          :description="activeResponseDescription"
          title="Callback Response"
        >
          <div class="callback-response-header-menu">
            <SelectDropdown
              v-for="component in responseSelectComponentList"
              :id="`http-response-header-dropdown-${callback.key}`"
              :key="component.name"
              :items="component.optionList"
              :model-value="component.value"
              @change="(item) => handleSelectInputChange(item, component.name)"
            >
              <template #2xx-item-content="{ item }">
                <ResponseCodeDot
                  v-if="item?.key"
                  response-code="2xx"
                />
                {{ item?.label }}
              </template>
              <template #4xx-item-content="{ item }">
                <ResponseCodeDot
                  v-if="item?.key"
                  response-code="4xx"
                />
                {{ item?.label }}
              </template>
            </SelectDropdown>
          </div>
        </HttpResponse>
      </div>
    </CollapsibleSection>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PropType } from 'vue'
import type { IHttpCallbackOperation } from '@stoplight/types'
import CollapsibleSection from './CollapsibleSection.vue'
import HttpRequest from './HttpRequest.vue'
import HttpResponse from './HttpResponse.vue'
import MethodBadge from '@/components/common/MethodBadge.vue'
import ResponseCodeDot from '@/components/common/ResponseCodeDot.vue'
import SelectDropdown from '@/components/common/SelectDropdown.vue'
import useCurrentResponse from '@/composables/useCurrentResponse'
import type { SelectItem } from '@/types'
import { ResponseSelectComponent } from '@/types'

const props = defineProps({
  callback: {
    type: Object as PropType<IHttpCallbackOperation>,
    default: () => {},
  },
})

// refs and computed properties to manage currently active response object
const responseList = computed(() => props.callback.responses ?? [])
const {
  activeResponseDescription,
  activeResponseCode,
  activeContentType,
  activeResponseContentList,
  responseSelectComponentList,
} = useCurrentResponse(responseList)

function handleSelectInputChange(item: SelectItem, componentName: ResponseSelectComponent) {
  if (componentName === ResponseSelectComponent.ResponseCodeSelectMenu) {
    activeResponseCode.value = item.value
  } else if (componentName === ResponseSelectComponent.ContentTypeSelectMenu) {
    activeContentType.value = item.value
  }
}
</script>

<style lang="scss" scoped>
.endpoint-http-callbacks {
  .http-callbacks-header {
    align-items: center;
    display: inline-flex;
    gap: var(--kui-space-50, $kui-space-50);
  }

  .callback-collapsible-section-content {
    padding: var(--kui-space-60, $kui-space-60) var(--kui-space-0, $kui-space-0);
    padding-left: var(--kui-space-40, $kui-space-40);

    .callback-path-container {
      align-items: center;
      border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
      border-radius: var(--kui-border-radius-30, $kui-border-radius-30);
      display: inline-flex;
      gap: var(--kui-space-40, $kui-space-40);
      margin-bottom: var(--kui-space-40, $kui-space-40);
      padding: var(--kui-space-30, $kui-space-30);

      .callback-path {
        color: var(--kui-color-text-neutral-strong, $kui-color-text-neutral-strong);
        font-family: var(--kui-font-family-code, $kui-font-family-code);
        font-size: var(--kui-font-size-20, $kui-font-size-20);
        line-height: var(--kui-line-height-20, $kui-line-height-20);
      }
    }

    .http-callback-response {
      .callback-response-header-menu {
        align-items: center;
        display: inline-flex;
        gap: var(--kui-space-20, $kui-space-20);

        :deep(.trigger-button) {
          @include small-bordered-trigger-button;
        }
      }
    }
  }

}
</style>
