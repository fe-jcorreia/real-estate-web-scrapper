export interface Paginated<Model> {
  count: number;
  nodes: Model[];
  pageInfo: PageInfoModel;
}

export interface PageInputModel {
  offset?: number;
  limit: number;
}

export interface PageInfoModel {
  offset: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export const DEFAULT_PAGE_SIZE = 20;

export function buildPageInfo(args: PageInputModel, totalItems: number): PageInfoModel {
  const offset = args.offset ?? 0;
  const limit = args.limit ?? DEFAULT_PAGE_SIZE;

  return {
    limit,
    offset,
    hasNextPage: totalItems > offset + limit,
    hasPreviousPage: offset > 0,
  };
}
