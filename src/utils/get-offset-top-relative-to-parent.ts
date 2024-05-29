/**
 * @description Get the offset top of an element relative to its parent.
 * @param child
 * @param parent
 * @returns number | null
 */
export function getOffsetTopRelativeToParent(child: any, parent: any): number | null {
  let offsetTop = 0
  let currentElement = child

  while (currentElement && currentElement !== parent) {
    offsetTop += currentElement.offsetTop
    currentElement = currentElement.offsetParent
  }

  // If the parent is not in the hierarchy, return null
  if (currentElement !== parent) {
    return null
  }

  // Calculate the scroll top of all ancestors up to the parent
  let ancestor = child
  while (ancestor && ancestor !== parent) {
    offsetTop -= ancestor.scrollTop
    ancestor = ancestor.parentNode
  }

  return offsetTop
}
