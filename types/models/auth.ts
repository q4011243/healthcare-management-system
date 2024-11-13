// 角色定义
export interface Role {
  id: number;
  name: string;
  code: string;
  description?: string;
  level: number;
  status: 'active' | 'inactive';
  permissionIds: number[]; // 只存储权限ID数组
  createdAt: Date;
  updatedAt: Date;
}

// 权限定义
export interface Permission {
  id: number;
  name: string;
  code: string;
  resource: string;
  action: PermissionAction;
  type: PermissionType;
  status: 'active' | 'inactive';
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 用户角色关联
export interface UserRole {
  userId: number;
  roleId: number;
  scope?: string[];
  expiresAt?: Date;
  grantedBy: number;
  grantedAt: Date;
  createdAt: Date;
  updatedBy: number;
}

// 操作日志

export enum PermissionAction {
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
  Manage = 'manage'
}

export enum PermissionType {
  Menu = 'menu',
  Operation = 'operation',
  Data = 'data'
}
