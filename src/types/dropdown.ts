export interface SelectItem {
  label: string
  /**
   * Must be unique for each item in the list.
   */
  value: string
  /**
   * Unique key for the item `id` and `data-testid` attributes. If not provided, the item will use a generic selector.
   * Also, `item.key` is used for generating item slots. If not provided, the item will not have a slot.
   */
  key?: string
}
