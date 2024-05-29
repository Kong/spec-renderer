/**
 * @description Get the offset top of an element relative to its parent.
 * @param child
 * @param parent
 * @returns number | null
 */
export function getOffsetTopRelativeToParent(child: HTMLElement, parent: HTMLElement): number | null {
  if (typeof document === 'undefined') {
    return null
  }

  let offsetTop = 0
  let currentElement: HTMLElement | null = child

  while (currentElement && currentElement.offsetParent !== document.body && currentElement !== parent) {
    offsetTop += currentElement.offsetTop
    currentElement = currentElement.offsetParent as HTMLElement
  }

  // Calculate the scroll top of all ancestors up to the parent
  let ancestor = child
  while (ancestor && ancestor !== parent) {
    offsetTop -= ancestor.scrollTop
    ancestor = ancestor.parentNode as HTMLElement
  }

  return offsetTop
}
