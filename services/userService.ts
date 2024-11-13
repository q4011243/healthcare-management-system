import { db } from '~/api/db/database';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import type { Session, User, UserStatus } from '~/types/models/user';
import type { Role } from '~/types/models/auth';
import {
  permissionService,
  type PermissionService
} from '~/services/permissionService';

export class UserService {
  // 用户注册
  async register(
    userData: Omit<User, 'id' | 'createdAt' | 'status'>
  ): Promise<User> {
    // 检查用户名是否已存在
    const existingUser = await db.users
      .where('username')
      .equals(userData.username)
      .first();
    if (existingUser) {
      throw new Error('用户名已存在');
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // 创建新用户
    const newUser: User = {
      ...userData,
      password: hashedPassword,
      status: 'active' as UserStatus,
      createdAt: new Date()
    };

    // 保存到数据库
    const id = await db.users.add(newUser);
    return { ...newUser, id };
  }

  // 用户登录
  async login(
    username: string,
    password: string
  ): Promise<{ user: User; token: string }> {
    const user = await db.users.where('username').equals(username).first();

    if (!user) {
      throw new Error('用户不存在');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new Error('密码错误');
    }

    // 查询用户角色
    if (!user.roleIds) {
      user.roleIds = [];
    }

    // 创建会话
    const token = uuidv4();
    const session: Session = {
      userId: user.id!,
      token,
      deviceInfo: navigator.userAgent,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24小时过期
      lastAccessAt: new Date()
    };

    await db.sessions.add(session);

    // 更新用户最后登录时间
    await db.users.update(user.id!, { lastLoginAt: new Date() });

    return { user, token };
  }

  // 验证会话
  async validateSession(token: string) {
    const session = await db.sessions
      .where('token')
      .equals(token)
      .and((s) => s.expiresAt > new Date())
      .first();

    if (!session) {
      throw new Error('会话已过期或无效');
    }

    const user = await db.users.get(session.userId);

    if (!user || user.status !== 'active') {
      throw new Error('用户不存在或已被禁用');
    }

    if (!user.roleIds) {
      user.roleIds = [];
    }

    return user;
  }

  // 登出
  async logout(token: string) {
    await db.sessions.where('token').equals(token).delete();
  }

  // 分配用户角色
  async assignUserRoles(userId: number, roleIds: number[]): Promise<void> {
    await db.transaction('rw', [db.users], async () => {
      const user = await db.users.get(userId);
      if (!user) {
        throw new Error('User not found');
      }

      user.roleIds = roleIds;
      await db.users.put(user);

      // 清除用户权限缓存
      permissionService.clearUserPermissionCache(userId);
    });
  }

  // 获取用户角色
  async getUserRoles(userId: number): Promise<Role[]> {
    const user = await db.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return await db.roles
      .where('id')
      .anyOf(user.roleIds)
      .filter((role) => role.status === 'active')
      .toArray();
  }
}

export const userService = new UserService();
