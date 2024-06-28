export interface SelectItem {
  label: string
  value: string
  /**
   * Unique key for the item `data-testid` attribute. If not provided, the item will use a generic selector.
   * Also, `item.key` is used for generating item slots. If not provided, the item will not have a slot.
   */
  key?: string
}
