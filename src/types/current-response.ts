import type { SelectItem } from './dropdown'

export enum ResponseSelectComponent {
  ResponseCodeSelectMenu = 'response-code-select-menu',
  ContentTypeSelectMenu = 'content-type-select-menu',
}
export interface SelectComponentListItem {
  name: ResponseSelectComponent
  value: string
  optionList: Array<SelectItem>
}

