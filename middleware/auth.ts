import type { RouteMeta } from 'vue-router';
import { permissionService } from '~/services/permissionService';

export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore();
  const meta = to.meta as RouteMeta;
  const permissions = meta.permissions as { resource: string; action: string };
  await authStore.checkAuth();

  // 检查是否需要认证
  if (meta.requiresAuth && !authStore.isAuthenticated) {
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath }
    });
  }

  // 超管跳过权限检查
  const user = authStore.user;

  if (authStore.isAdmin) {
    return;
  }

  // 检查权限
  if (meta.permissions) {
    try {
      const hasPermission = await permissionService.verifyPermission(
        authStore.user!.id,
        permissions.resource,
        permissions.action
      );

      if (!hasPermission) {
        throw createError({
          statusCode: 403,
          message: '权限不足'
        });
      }
    } catch (error: any) {
      return navigateTo({
        path: '/403',
        query: {
          reason: error.message,
          from: to.fullPath
        }
      });
    }
  }
});
