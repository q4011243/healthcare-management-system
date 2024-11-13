export interface BaseModel {
  id?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
// 搜索参数类型
export interface SearchParams {
  keyword: string;
  page: number;
  pageSize: number;
}

// 分页结果类型
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
