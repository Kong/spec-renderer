import { ref, computed, onMounted } from 'vue'

/**
 * @description Utlize Vue Teleport to move custom elements out of the shadow DOM
 * @param {props} elementProps Custom Element component props
 */
export default function useTeleport(elementProps: Record<string, any>, shadowDom = true) {
  // Always default to false and then updated regardless of state in the onMounted function, this allows the element to render
  const shouldRender = ref(false)
  // Should the teleport be disabled, always defaults to true until evaluated in onMounted
  const disableTeleport = ref(true)
  // Always set to true, then the onMounted function will actually check for existence
  const teleportSelectorExists = ref(true)

  /**
   * Transform a given string into an element selector
   * @param {string} selector - The string to transform
   * @returns {string} HTML id selector
   */
  const getTeleportSelector = (selector: string): string => {
    if (!selector || selector.trim() === '') {
      return ''
    }

    return '#' + selector.trim().replace(/[^a-z0-9-_]/gi, '')
  }

  // The HTML selector to teleport the custom element to
  // Fallback to `body` when disabling the <Teleport> component to prevent throwing a console warning
  const teleportSelector = computed((): string => teleportSelectorExists.value ? getTeleportSelector(elementProps.wrapperId) : 'body')

  onMounted(() => {
    // Check if the teleportSelector exists in the DOM
    teleportSelectorExists.value = !!document.querySelector(teleportSelector.value)

    // Check if element props.wrapperId exists in the DOM
    if (shadowDom && !teleportSelectorExists.value) {
      // Disable the Teleport component and just render in the shadow DOM
      disableTeleport.value = true

      console.warn(`Could not teleport kong-spec-renderer out of shadow DOM. Element with id="${elementProps.wrapperId?.replace(/#/g, '')}" was not found.`)
    } else {
      // Fallback to the shouldTeleport prop in the parent element props
      disableTeleport.value = (!elementProps.shouldTeleport || false)
    }

    // Always set to true so the element renders, regardless of whether we are disabling the teleport functionality
    shouldRender.value = true
  })

  return {
    teleportSelector,
    disableTeleport,
    shouldRender,
  }
}
