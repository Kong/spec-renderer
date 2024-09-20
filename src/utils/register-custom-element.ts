import { defineCustomElement, mergeProps } from 'vue'
import type { KongSpecRendererOptions } from '../types'
import appStyles from '../styles/styles.scss?inline'
/**
 * Transform a given string into a lowercase, kebab-case version of the string.
 * @param {string} str - The string to kebab-case.
 * @returns {string} Lowercase and kebab-case version of the input string.
 */
const kebabize = (str: string): string => {
  if (!str || str.trim() === '') {
    return ''
  }

  return str.trim().replace(/ /g, '-').replace(/[A-Z]+(?![a-z])|[A-Z]/g, ($, ofs) => (ofs ? '-' : '') + $.toLowerCase()).replace(/--+/g, '-').replace(/-+$/g, '')
}

/**
 * Register a given Vue component as a Custom Element in the DOM.
 * @param {string} tagName - The name of the custom element to be used as the HTML tag.
 * @param {VueComponent} customElementComponent - The Vue component.
 * @param {KongSpecRendererOptions} options - Consuming app config options
 */
export default (
  tagName: string,
  customElementComponent: any,
  options?: KongSpecRendererOptions,
): void => {
  try {
    const customElementName = kebabize(tagName)

    if (!customElementName) {
      throw new Error('registerCustomElement: You must provide a valid string for the custom element tag name.')
    } else if (!customElementName.includes('-')) {
      throw new Error("registerCustomElement: You must provide a kebab-case string for the custom element tag name. Example: 'my-element'")
    }

    // If a component with the same name is already registered, exit early (and do not throw an error)
    if (window.customElements.get(customElementName)) {
      return
    }

    if (!customElementComponent) {
      throw new Error('registerCustomElement: You must provide a valid Vue Element.')
    }

    // Add a custom prop to teleport the custom element out of the shadow DOM and merge it with the existing props
    const customElementProps = mergeProps({ ...customElementComponent.props }, {
      shouldTeleport: {
        type: Boolean,
        default: options?.shadowDom === false, // should eval to true to teleport elements out of shadow DOM
      },
    })

    const vueCustomElement = defineCustomElement({
      ...customElementComponent,
      props: customElementProps,
      // Inject app styles when rendering in the shadow DOM
      styles: options?.shadowDom !== true ? [] : [appStyles],
      // Provide user options
      provide: {
        'shadow-dom': options?.shadowDom || false,
        'inject-css': options?.injectCss,
      },
    })

    customElements.define(customElementName, vueCustomElement)
  } catch (err: any) {

    console.error(err?.message)
  }
}
