export type TableOfContentsProps = {

  tree: TableOfContentsItem[];
  activeId: string;
  maxDepthOpenByDefault?: number;
  externalScrollbar?: boolean;
  isInResponsiveMode?: boolean;
  onLinkClick?(): void;
}

export type TableOfContentsExternalLink = {
  title: string;
  url: string;
}

export type TableOfContentsNode<
  T = 'http_service' | 'http_operation' | 'http_webhook' | 'model' | 'article' | 'overview',
> = {
  id: string;
  slug: string;
  title: string;
  type: T;
  meta: string;
  version?: string;
  deprecated ?: boolean
}


export type TableOfContentsNodeGroup = TableOfContentsNode<'http_service'> & TableOfContentsGroup

export type TableOfContentsGroup = {
  title: string;
  hideTitle?: boolean;
  items: TableOfContentsGroupItem[];
  itemsType?: 'article' | 'http_operation' | 'http_webhook' | 'model';
  /**
   * `true` when group is expended on initial load.
   * e.g. when the group contains the active item.
   */
  initiallyExpanded: boolean;
}

export type TableOfContentsGroupItem =
  | TableOfContentsGroup
  | TableOfContentsNodeGroup
  | TableOfContentsNode
  | TableOfContentsExternalLink

export type TableOfContentsItem = TableOfContentsGroupItem
