import type { OrderType } from './models/order';

import type { OrderStatus } from './models/order';

export interface PageParams {
  page?: number;
  pageSize?: number;
}

export interface SearchParams {
  searchText?: string;
}

// 医嘱查询、搜索参数
export interface OrderQueryParams extends PageParams, SearchParams {
  type?: OrderType;
  status?: OrderStatus[];
}
