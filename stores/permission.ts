import { defineStore } from 'pinia';
import { db } from '~/api/db/database';
import type { Permission } from '~/types/models/auth';

interface PermissionState {
  permissions: Permission[];
  loading: boolean;
  error: string | null;
}

export const usePermissionStore = defineStore('permission', {
  state: (): PermissionState => ({
    permissions: [],
    loading: false,
    error: null
  }),

  actions: {
    // 加载权限列表
    async loadPermissions() {
      this.loading = true;
      try {
        this.permissions = await db.permissions.toArray();
      } catch (err: any) {
        this.error = err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    // 创建权限
    async createPermission(
      permission: Omit<Permission, 'id' | 'createdAt' | 'updatedAt'>
    ) {
      this.loading = true;
      try {
        const newPermission = {
          ...permission,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        const id = await db.permissions.add(newPermission);
        const created = await db.permissions.get(id);
        if (created) {
          this.permissions.push(created);
        }
      } catch (err: any) {
        this.error = err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    // 更新权限
    async updatePermission(id: number, updates: Partial<Permission>) {
      this.loading = true;
      try {
        await db.transaction('rw', db.permissions, async () => {
          await db.permissions.update(id, {
            ...updates,
            updatedAt: new Date()
          });
          const updated = await db.permissions.get(id);
          if (updated) {
            const index = this.permissions.findIndex((p) => p.id === id);
            if (index !== -1) {
              this.permissions[index] = updated;
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

    // 删除权限
    async deletePermission(id: number) {
      this.loading = true;
      try {
        await db.transaction('rw', [db.permissions, db.roles], async () => {
          // 从所有角色中移除此权限
          const roles = await db.roles.toArray();
          for (const role of roles) {
            if (role.permissionIds.includes(id)) {
              await db.roles.update(role.id, {
                permissionIds: role.permissionIds.filter((pid) => pid !== id),
                updatedAt: new Date()
              });
            }
          }

          // 删除权限
          await db.permissions.delete(id);
          this.permissions = this.permissions.filter((p) => p.id !== id);
        });
      } catch (err: any) {
        this.error = err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    }
  }
});
