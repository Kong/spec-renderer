import type { ComputedRef } from 'vue'
import { computed, ref, onMounted, onUnmounted } from 'vue'
import useConfigOptions from '@/composables/useConfigOptions'
interface InjectStylesComposable {
  injectedStyles: ComputedRef<string>
}

export default function useInjectStyles(): InjectStylesComposable {
  const { shadowDom, injectCss } = useConfigOptions()

  const inlineStyles = ref<any>([])
  const injectedStyles = computed((): string => {
    let styles = ''

    // If shadow DOM and inlineStyles has value
    if (shadowDom && inlineStyles.value && inlineStyles.value.length) {
      styles += `<style type="text/css">${inlineStyles.value
        .map((styleNode: HTMLElement) => styleNode.innerHTML)
        .join('')}</style>`
    }

    // If an array of CSS links were passed, iterate through array
    if (typeof injectCss === 'object' && injectCss?.length) {
      for (const css in injectCss) {
        // Add to the shadow DOM
        styles += String(injectCss[css]).trim().length && `<style type="text/css" data-testid="inject-css-${css}">${String(injectCss[css]).trim()}</style>`
      }
    } else if (injectCss && typeof injectCss === 'string') {
      // Provide a fallback in case they passed a CSS link as a string
      // Add to the shadow DOM
      styles += String(injectCss).trim().length && `<style type="text/css" data-testid="inject-css-0">${String(injectCss).trim()}</style>`
    }

    return styles
  })

  /**
   * Parses <style> tags found in the document.head and filters them based on the given parameters.
   * Then the styles are injected into the element's shadow DOM for consumption.
   */
  const injectStyles = (): void => {
    inlineStyles.value = Array.from(document.head.getElementsByTagName('style'))
      .filter((styleNode) => {
        // Only inject styles if they contain this exact string: "/*! KONG_SPEC_RENDERER_INJECT_STYLES */"
        return (
          styleNode.innerHTML.includes('KONG_SPEC_RENDERER_INJECT_STYLES')
        )
      })
      .filter((styleNode, idx, arr) => {
        // Only return unique nodes (based on the first 100 characters -- anything more is too intensive)
        return (
          arr.findIndex((node) => node.innerHTML.substring(0, 100) === styleNode.innerHTML.substring(0, 100)) === idx
        )
      })
  }

  const observer = new MutationObserver(injectStyles)
  observer.observe(document.head, {
    childList: true,
    subtree: true,
    characterData: true,
  })

  onMounted(injectStyles)
  onUnmounted(() => {
    // Clear styles
    inlineStyles.value = []

    // Disconnect observer
    if (observer) {
      observer.disconnect()
    }
  })

  return {
    injectedStyles,
  }
}
