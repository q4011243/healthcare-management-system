<template>
  <div class="permission-management">
    <van-nav-bar title="权限配置" left-arrow @click-left="router.back()" />

    <van-collapse v-model="activeGroups">
      <van-collapse-item
        v-for="group in permissionGroups"
        :key="group.resource"
        :title="getResourceName(group.resource)">
        <van-cell-group>
          <van-cell
            v-for="perm in group.permissions"
            :key="perm.id"
            :title="perm.name"
            :label="perm.description">
            <template #right-icon>
              <van-checkbox v-model="selectedPermissions[perm.id]" />
            </template>
          </van-cell>
        </van-cell-group>
      </van-collapse-item>
    </van-collapse>

    <div class="fixed-bottom safe-area-bottom">
      <van-button type="primary" block :loading="saving" @click="savePermissions">
        保存配置
      </van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { showToast, showDialog } from "vant";
import { useRoleStore } from "~/stores/role";
import type { Permission } from "~/types/models/auth";

const route = useRoute();
const router = useRouter();
const roleStore = useRoleStore();

const roleId = Number(route.params.id);
const saving = ref(false);
const activeGroups = ref<string[]>([]);
const selectedPermissions = ref<Record<number, boolean>>({});

// 按资源分组的权限列表
const permissionGroups = computed(() => {
  const groups: Record<string, Permission[]> = {};
  roleStore.permissions.forEach((perm) => {
    if (!groups[perm.resource]) {
      groups[perm.resource] = [];
    }
    groups[perm.resource].push(perm);
  });

  return Object.entries(groups).map(([resource, permissions]) => ({
    resource,
    permissions
  }));
});

// 初始化选中状态
const initializeSelection = async () => {
  const role = await roleStore.loadRole(roleId);
  if (role) {
    role.permissionIds.forEach((id) => {
      selectedPermissions.value[id] = true;
    });
  }
};

// 保存权限配置
const savePermissions = async () => {
  try {
    saving.value = true;
    const permissions = Object.entries(selectedPermissions.value)
      .filter(([_, selected]) => selected)
      .map(([id]) => Number(id));

    await roleStore.assignPermissions(roleId, permissions);
    showToast("保存成功");
    router.back();
  } catch (error) {
    showDialog({
      title: "保存失败",
      message: "权限配置保存失败，请重试"
    });
  } finally {
    saving.value = false;
  }
};

// 获取资源名称
const getResourceName = (resource: string): string => {
  const resourceMap: Record<string, string> = {
    patients: "患者管理",
    prescriptions: "处方管理",
    appointments: "预约管理",
    users: "用户管理",
    roles: "角色管理",
    system: "系统管理",
    medical_records: "病历管理"
  };
  return resourceMap[resource] || resource;
};

onMounted(async () => {
  await roleStore.loadRoles();
  await initializeSelection();
});
</script>

<style scoped>
.permission-management {
  height: 100vh;
  background: #f7f8fa;
  padding-bottom: 80px;
}

.fixed-bottom {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background: #fff;
}
</style>
