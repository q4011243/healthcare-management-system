import { defineStore } from 'pinia';
import { db } from '~/api/db/database';
import type { Role, Permission } from '~/types/models/auth';

interface RoleState {
  roles: Role[];
  currentRole: Role | null;
  permissions: Permission[];
  loading: boolean;
  error: string | null;
}

export const useRoleStore = defineStore('role', {
  state: (): RoleState => ({
    roles: [],
    currentRole: null,
    permissions: [],
    loading: false,
    error: null
  }),

  getters: {
    activeRoles: (state) =>
      state.roles.filter((role) => role.status === 'active'),
    getRoleById: (state) => (id: number) =>
      state.roles.find((role) => role.id === id),
    getRolePermissions: (state) => async (roleId: number) => {
      const role = state.roles.find((r) => r.id === roleId);
      if (!role) return [];

      // 根据权限ID获取完整的权限信息
      return await db.permissions
        .where('id')
        .anyOf(role.permissionIds)
        .toArray();
    }
  },

  actions: {
    // 创建角色
    async createRole(role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>) {
      this.loading = true;
      try {
        const newRole = await db.transaction('rw', db.roles, async () => {
          const id = await db.roles.add({
            id: undefined,
            ...role,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          return await db.roles.get(id);
        });
        if (newRole) {
          this.roles.push(newRole);
        }
      } catch (err: any) {
        this.error = err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    // 更新角色
    async updateRole(id: number, updates: Partial<Role>) {
      this.loading = true;
      console.info('updateRole', id, updates);
      try {
        await db.transaction('rw', db.roles, async () => {
          await db.roles.update(id, {
            ...updates,
            updatedAt: new Date()
          });
          const updatedRole = await db.roles.get(id);
          if (updatedRole) {
            const index = this.roles.findIndex((r) => r.id === id);
            if (index !== -1) {
              this.roles[index] = updatedRole;
            }
          }
        });
      } catch (err: any) {
        this.error = err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    // 分配权限
    async assignPermissions(roleId: number, permissionIds: number[]) {
      this.loading = true;
      try {
        await db.transaction('rw', db.roles, async () => {
          const role = await db.roles.get(roleId);
          if (!role) throw new Error('Role not found');

          await db.roles.update(roleId, {
            permissionIds,
            updatedAt: new Date()
          });

          // 更新本地状态
          const index = this.roles.findIndex((r) => r.id === roleId);
          if (index !== -1) {
            this.roles[index] = {
              ...this.roles[index],
              permissionIds
            };
          }
        });
      } catch (err: any) {
        this.error = err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    // 加载所有角色
    async loadRoles() {
      this.loading = true;
      try {
        this.roles = await db.roles.toArray();
        this.permissions = await db.permissions.toArray();
      } catch (err: any) {
        this.error = err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    // 加载单个角色详情
    async loadRole(id: number) {
      this.loading = true;
      try {
        const role = await db.roles.get(id);
        if (role) {
          this.currentRole = role;
        }
        return role;
      } catch (err: any) {
        this.error = err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    // 删除角色
    async deleteRole(id: number) {
      this.loading = true;
      try {
        await db.transaction('rw', [db.roles, db.users], async () => {
          // 获取使用此角色的用户
          const users = await db.users.where('roleIds').equals(id).toArray();

          // 从用户的roleIds中移除此角色
          for (const user of users) {
            await db.users.update(user.id, {
              roleIds: user.roleIds.filter((rid) => rid !== id)
            });
          }

          // 删除角色
          await db.roles.delete(id);

          // 更新本地状态
          this.roles = this.roles.filter((r) => r.id !== id);
        });
      } catch (err: any) {
        this.error = err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    // 清除错误
    clearError() {
      this.error = null;
    }
  }
});
