import type { DOMWrapper } from '@vue/test-utils'

declare module '@vue/test-utils' {
  export class VueWrapper {
    findTestId<K extends keyof HTMLElementTagNameMap>(dataTestid: string): DOMWrapper<HTMLElementTagNameMap[K]>;
  }
}
