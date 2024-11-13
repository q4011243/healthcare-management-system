import { db } from '~/api/db/database';
import type { Permission, Role, UserRole } from '~/types/models/auth';

export class PermissionService {
  // 权限缓存
  private static permissionCache: Map<number, CachedPermissions> = new Map();

  // 获取所有权限列表
  async getAllPermissions(): Promise<Permission[]> {
    return await db.permissions.toArray();
  }

  // 验证用户权限
  async verifyPermission(
    userId: number,
    resource: string,
    action: string
  ): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.some(
      (p) =>
        p.resource === resource &&
        (p.action === action || p.action === 'manage') &&
        p.status === 'active'
    );
  }

  // 获取用户权限列表
  async getUserPermissions(userId: number): Promise<Permission[]> {
    // 检查缓存
    const cached = PermissionService.permissionCache.get(userId);
    if (cached && cached.expiresAt > new Date()) {
      return cached.permissions;
    }

    // 获取用户信息及其角色
    const user = await db.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // 获取用户的所有角色
    const roles = await db.roles
      .where('id')
      .anyOf(user.roleIds)
      .filter((role) => role.status === 'active')
      .toArray();

    // 收集所有权限ID
    const permissionIds = new Set<number>();
    roles.forEach((role) => {
      role.permissionIds.forEach((id) => permissionIds.add(id));
    });

    // 获取权限详情
    const permissions = await db.permissions
      .where('id')
      .anyOf([...permissionIds])
      .filter((p) => p.status === 'active')
      .toArray();

    // 更新缓存
    PermissionService.permissionCache.set(userId, {
      permissions,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30分钟缓存
    });

    return permissions;
  }

  // 分配角色权限
  async assignRolePermissions(
    roleId: number,
    permissionIds: number[]
  ): Promise<void> {
    await db.transaction('rw', [db.roles], async () => {
      const role = await db.roles.get(roleId);
      if (!role) throw new Error('Role not found');

      role.permissionIds = permissionIds;
      await db.roles.put(role);
    });
  }

  // 清除用户权限缓存
  clearUserPermissionCache(userId: number): void {
    PermissionService.permissionCache.delete(userId);
  }
}

export const permissionService = new PermissionService();

interface CachedPermissions {
  permissions: Permission[];
  expiresAt: Date;
}
