import { permissionService } from '~/services/permissionService';
import type { Permission } from '~/types/models/auth';
import { ref, watch } from 'vue';

export function usePermission() {
  const authStore = useAuthStore();
  const { user } = storeToRefs(authStore);
  const permissions = ref<Permission[]>([]);
  const loading = ref(false);

  // 加载用户权限
  const loadPermissions = async () => {
    if (!user.value) return;

    loading.value = true;
    try {
      permissions.value = await permissionService.getUserPermissions(
        user.value.id
      );
    } catch (error) {
      console.error('Failed to load permissions:', error);
    } finally {
      loading.value = false;
    }
  };

  // 检查权限
  const hasPermission = async (
    resource: string,
    action: string
  ): Promise<boolean> => {
    if (!user.value) return false;
    return permissionService.verifyPermission(user.value.id, resource, action);
  };

  // 监听用户变化
  watch(
    () => user.value?.id,
    () => {
      loadPermissions();
    },
    { immediate: true }
  );

  return {
    permissions,
    loading,
    hasPermission,
    loadPermissions
  };
}
