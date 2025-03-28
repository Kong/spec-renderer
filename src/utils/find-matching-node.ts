import { slugify } from '@/stoplight/elements-core/utils/string'
import type { ServiceNode, ServiceChildNode } from '@/types'

export const findMatchingNode = (spDoc: ServiceNode, forPath: string): ServiceChildNode | null => {
  const cNode = spDoc.children.find(child => child.uri === forPath)
  if (cNode) {
    return cNode
  }
  /*
   if the section has multiple-tags, slugified tag name will be injected into section's uri.
   eg:
   section has uri: /paths/list/get
   and two tags: system and mesh

   so here when we are searching document sections by path name we need to encounter that path could hold tag name in it,
   because in our document children section's path will have no tag.

   Eg: forPath = '/paths/mesh/list/get'

   child with uri = '/paths/list/get' and tags: `system`, `mesh`. this item should be returned as path whith tag matched the path.
 */
  const multiTagNodes = spDoc.children.filter(child=> child.tags.length > 1)
  for (const multiTagNode of multiTagNodes) {
    for (const tagName of multiTagNode.tags) {
      if (multiTagNode.uri.split('/').toSpliced(2, 0 , slugify(tagName).toLowerCase()).join('/') === forPath) {
        return multiTagNode
      }
    }
  }

  return null
}
