export type TableOfContentsProps = {
  // eslint-disable-next-line no-use-before-define
  tree: TableOfContentsItem[];
  activeId: string;
  maxDepthOpenByDefault?: number;
  externalScrollbar?: boolean;
  isInResponsiveMode?: boolean;
  onLinkClick?(): void;
};

export type TableOfContentsExternalLink = {
  title: string;
  url: string;
};

export type TableOfContentsNode<
  T = 'http_service' | 'http_operation' | 'http_webhook' | 'model' | 'article' | 'overview',
> = {
  id: string;
  slug: string;
  title: string;
  type: T;
  meta: string;
  version?: string;
};

// eslint-disable-next-line no-use-before-define
export type TableOfContentsNodeGroup = TableOfContentsNode<'http_service'> & TableOfContentsGroup;

export type TableOfContentsGroup = {
  title: string;
  // eslint-disable-next-line no-use-before-define
  items: TableOfContentsGroupItem[];
  itemsType?: 'article' | 'http_operation' | 'http_webhook' | 'model';
};

export type TableOfContentsGroupItem =
  | TableOfContentsGroup
  | TableOfContentsNodeGroup
  | TableOfContentsNode
  | TableOfContentsExternalLink;

export type TableOfContentsItem = TableOfContentsGroupItem;
