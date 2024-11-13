// 用户基础信息
export interface User {
  password: string;
  id: number;
  username: string;
  name: string;
  avatar?: string;
  phone?: string;
  email?: string;
  department?: string;
  position?: string;
  status: UserStatus;
  roleIds: number[];
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;
}

// 用户状态枚举
export enum UserStatus {
  PENDING = 'pending', // 待审核
  ACTIVE = 'active', // 正常
  DISABLED = 'disabled', // 禁用
  LOCKED = 'locked' // 锁定
}

// 注册请求参数
export interface RegisterParams {
  username: string;
  password: string;
  name: string;
  phone: string;
  email?: string;
  department?: string;
  position?: string;
  verifyCode: string;
}

// 登录请求参数
export interface LoginParams {
  username: string;
  password: string;
  verifyCode?: string;
}

// 登录响应
export interface LoginResponse {
  token: string;
  user: User;
}

// 用户会话接口
export interface Session {
  id?: number;
  userId: number;
  token: string;
  deviceInfo: string;
  createdAt: Date;
  expiresAt: Date;
  lastAccessAt: Date;
}
