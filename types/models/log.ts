import type { BaseModel } from '.';
import type { PermissionAction } from './auth';

// 操作类型枚举
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  VIEW = 'view',
  MANAGE = 'manage',
  LOGIN = 'login',
  LOGOUT = 'logout'
}

// 资源类型枚举
export enum ResourceType {
  WARD = 'ward',
  ROOM = 'room',
  BED = 'bed',
  PATIENT = 'patient',
  USER = 'user',
  ROLE = 'role',
  PERMISSION = 'permission',
  CLEANING = 'cleaning',
  EQUIPMENT = 'equipment'
}

// 操作状态枚举
export enum OperationStatus {
  SUCCESS = 'success',
  FAILURE = 'failure',
  PENDING = 'pending'
}

// 扩展操作日志接口
export interface OperationLogDetail extends BaseModel {
  userId: number;
  username: string;
  operation: OperationType;
  resource: ResourceType;
  resourceId: string;
  status: OperationStatus;
  details: {
    before?: any;
    after?: any;
    reason?: string;
    description?: string;
    metadata?: Record<string, any>;
  };
  ip: string;
  userAgent: string;
  duration?: number;
  errorMessage?: string;
}

// 日志查询参数
export interface LogQueryParams {
  startDate?: Date;
  endDate?: Date;
  userId?: number;
  operation?: OperationType;
  resource?: ResourceType;
  status?: OperationStatus;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 日志统计接口
export interface LogStatistics {
  totalCount: number;
  successCount: number;
  failureCount: number;
  operationCounts: Record<OperationType, number>;
  resourceCounts: Record<ResourceType, number>;
  userCounts: Record<number, number>;
  timeDistribution: {
    hour: Record<number, number>;
    day: Record<number, number>;
    month: Record<number, number>;
  };
}
