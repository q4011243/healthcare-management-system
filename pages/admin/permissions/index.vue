<template>
  <div class="permission-management">
    <!-- 移除悬浮按钮 -->

    <van-list v-model:loading="loading" :finished="finished" @load="onLoad" class="permission-list">
      <template v-for="group in permissionGroups" :key="group.resource">
        <!-- 资源组标题栏 -->
        <div class="resource-group-header">
          <div class="resource-info">
            <van-tag type="primary" size="medium" class="resource-tag">
              {{ getResourceName(group.resource) }}
            </van-tag>
            <span class="permission-count">{{ group.permissions.length }}个权限</span>
          </div>
          <!-- 添加资源级别的新增按钮 -->
          <van-button
            plain
            type="primary"
            size="small"
            icon="plus"
            @click="addPermissionForResource(group.resource)">
            新增权限
          </van-button>
        </div>

        <!-- 简化的权限列表卡片 -->
        <van-cell-group inset class="permission-group">
          <van-cell
            v-for="permission in group.permissions"
            :key="permission.id"
            class="permission-item">
            <template #title>
              <div class="permission-main">
                <span class="permission-name">{{ permission.name }}</span>
                <van-tag
                  :type="getActionTagType(permission.action)"
                  size="small"
                  class="permission-action">
                  {{ getActionName(permission.action) }}
                </van-tag>
              </div>
              <div class="permission-sub">
                <span class="permission-code">{{ permission.code }}</span>
                <span v-if="permission.description" class="permission-description">
                  {{ permission.description }}
                </span>
              </div>
            </template>

            <template #right-icon>
              <div class="permission-actions">
                <van-button
                  plain
                  type="primary"
                  size="small"
                  icon="edit"
                  @click.stop="editPermission(permission)">
                  编辑
                </van-button>
                <van-button
                  plain
                  type="danger"
                  size="small"
                  icon="delete-o"
                  @click.stop="confirmDelete(permission.id)">
                  删除
                </van-button>
              </div>
            </template>
          </van-cell>
        </van-cell-group>
      </template>
    </van-list>

    <!-- 优化表单弹窗 -->
    <van-dialog
      v-model:show="showPermissionDialog"
      :title="editingPermission ? '编辑权限' : '新增权限'"
      show-cancel-button
      @confirm="savePermission"
      @cancel="resetForm">
      <van-form>
        <van-cell-group inset>
          <van-field
            v-model="currentPermission.name"
            label="权限名称"
            placeholder="请输入权限名称"
            :rules="[{ required: true, message: '请输入权限名称' }]" />
          <van-field
            v-model="permissionCode"
            label="权限编码"
            placeholder="请输入权限编码"
            disabled
            :rules="[{ required: true, message: '请输入权限编码' }]" />
          <van-field
            v-model="resourceText"
            label="资源类型"
            placeholder="请选择资源类型"
            is-link
            @click="showResourcePicker = true"
            :rules="[{ required: true, message: '请选择资源类型' }]" />
          <van-field
            v-model="actionText"
            label="操作类型"
            placeholder="请选择操作类型"
            is-link
            @click="showActionPicker = true"
            :rules="[{ required: true, message: '请选择操作类型' }]" />
          <van-field
            v-model="currentPermission.description"
            label="权限描述"
            type="textarea"
            placeholder="请输入权限描述"
            rows="2"
            autosize />
        </van-cell-group>
      </van-form>
    </van-dialog>

    <!-- 添加资源类型选择器 -->
    <van-popup v-model:show="showResourcePicker" position="bottom">
      <van-picker
        :columns="Object.entries(getResourceMap()).map(([value, text]) => ({ text, value }))"
        @confirm="onResourceSelect"
        @cancel="showResourcePicker = false"
        show-toolbar
        title="选择资源类型" />
    </van-popup>

    <!-- 添加操作类型选择器 -->
    <van-popup v-model:show="showActionPicker" position="bottom">
      <van-picker
        :columns="Object.entries(getActionMap()).map(([value, text]) => ({ text, value }))"
        @confirm="onActionSelect"
        @cancel="showActionPicker = false"
        show-toolbar
        title="选择操作类型" />
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { showToast, showDialog } from "vant";
import { usePermissionStore } from "~/stores/permission";
import type { Permission, PermissionAction } from "~/types/models/auth";

const permissionStore = usePermissionStore();

const loading = ref(false);
const finished = ref(false);
const showPermissionDialog = ref(false);
const editingPermission = ref<Permission | null>(null);
const currentPermission = ref<Partial<Permission>>({
  name: "",
  code: "",
  resource: "",
  action: "" as PermissionAction,
  description: ""
});

// 添加新的状态
const showResourcePicker = ref(false);
const showActionPicker = ref(false);

// 资源类型选项
const resourceOptions = computed(() => {
  return Object.entries(getResourceMap()).map(([value, label]) => ({
    text: label,
    value
  }));
});

// 操作类型选项
const actionOptions = computed(() => {
  return Object.entries(getActionMap()).map(([value, label]) => ({
    text: label,
    value
  }));
});

// 按资源分组的权限列表
const permissionGroups = computed(() => {
  const groups: Record<string, Permission[]> = {};
  permissionStore.permissions.forEach((perm) => {
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

// 加载权限列表
const onLoad = async () => {
  if (!loading.value) {
    loading.value = true;
    try {
      await permissionStore.loadPermissions();
      finished.value = true;
    } catch (error) {
      showToast("加载失败");
    } finally {
      loading.value = false;
    }
  }
};

// 编辑权限
const editPermission = (permission: Permission) => {
  editingPermission.value = permission;
  currentPermission.value = { ...permission };
  showPermissionDialog.value = true;
};

// 保存权限
const savePermission = async () => {
  try {
    const permissionData = {
      name: currentPermission.value.name!,
      code: currentPermission.value.code!,
      resource: currentPermission.value.resource!,
      action: currentPermission.value.action!,
      description: currentPermission.value.description
    };

    if (editingPermission.value) {
      await permissionStore.updatePermission(editingPermission.value.id, permissionData);
    } else {
      await permissionStore.createPermission(permissionData as Permission);
    }

    showPermissionDialog.value = false;
    resetForm();
    showToast("保存成功");
    finished.value = false;
    await onLoad();
  } catch (error) {
    showToast("保存失败");
  }
};

// 确认删除
const confirmDelete = (id: number) => {
  showDialog({
    title: "确认删除",
    message: "确定要删除该权限吗？删除后关联的角色将失去此权限。",
    showCancelButton: true
  })
    .then(async () => {
      try {
        await permissionStore.deletePermission(id);
        showToast("删除成功");
        finished.value = false;
        await onLoad();
      } catch (error) {
        showToast("删除失败");
      }
    })
    .catch(() => {});
};

// 重置表单
const resetForm = () => {
  editingPermission.value = null;
  currentPermission.value = {
    name: "",
    code: "",
    resource: "",
    action: "" as PermissionAction,
    description: ""
  };
};

// 获取资源名称
const getResourceName = (resource: string): string => {
  const resourceMap: Record<string, string> = {
    patients: "患者管理",
    prescriptions: "处方管理",
    appointments: "预约管理",
    users: "用户管理",
    roles: "角色管理",
    permissions: "权限管理",
    system: "系统管理",
    medical_records: "病历管理"
  };
  return resourceMap[resource] || resource;
};

// 获取操作类型对应的标签类型
const getActionTagType = (action: string): string => {
  const typeMap: Record<string, string> = {
    create: "success",
    read: "primary",
    update: "warning",
    delete: "danger",
    manage: "primary"
  };
  return typeMap[action] || "default";
};

// 获取操作类型的中文名称
const getActionName = (action: string): string => {
  const nameMap: Record<string, string> = {
    create: "创建",
    read: "读取",
    update: "更新",
    delete: "删除",
    manage: "管理"
  };
  return nameMap[action] || action;
};

// 为特定资源添加权限
const addPermissionForResource = (resource: string) => {
  currentPermission.value = {
    name: "",
    code: "",
    resource,
    action: "" as PermissionAction,
    description: ""
  };
  showPermissionDialog.value = true;
};

// 选择资源类型
const onResourceSelect = ({ selectedValues }: { selectedValues: string[] }) => {
  currentPermission.value.resource = selectedValues.join(",");
  showResourcePicker.value = false;
};

const resourceText = computed(() => {
  return getResourceName(currentPermission.value.resource || "");
});

// 选择操作类型
const onActionSelect = ({ selectedValues }: { selectedValues: string[] }) => {
  currentPermission.value.action = selectedValues.join(",") as PermissionAction;
  showActionPicker.value = false;
};

const actionText = computed(() => {
  return getActionName(currentPermission.value.action || "");
});

const permissionCode = computed(() => {
  return `${currentPermission.value.resource}.${currentPermission.value.action}`;
});

// 获取资源映射表
const getResourceMap = (): Record<string, string> => ({
  patients: "患者管理",
  prescriptions: "处方管理",
  appointments: "预约管理",
  users: "用户管理",
  roles: "角色管理",
  permissions: "权限管理",
  system: "系统管理",
  medical_records: "病历管理"
});

// 获取操作映射表
const getActionMap = (): Record<string, string> => ({
  create: "创建",
  read: "读取",
  update: "更新",
  delete: "删除",
  manage: "管理"
});

onMounted(onLoad);

definePageMeta({
  layout: "admin",
  title: "权限管理",
  requiresAuth: true
});
</script>

<style scoped>
.permission-management {
  min-height: 100vh;
  background: #f7f8fa;
  padding: 12px;
  padding-bottom: 80px;
}

.permission-list {
  margin-bottom: 16px;
}

.resource-group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 16px 8px;
}

.resource-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.resource-tag {
  font-weight: 500;
}

.permission-count {
  color: var(--van-gray-6);
  font-size: 14px;
}

.permission-group {
  margin-bottom: 16px;
}

.permission-item {
  padding: 12px 16px;
}

.permission-main {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.permission-sub {
  display: flex;
  flex-direction: column;
  align-items: start;
  gap: 12px;
}

.permission-name {
  font-size: 15px;
  font-weight: normal;
}

.permission-code {
  font-size: 13px;
  color: var(--van-gray-6);
  font-family: monospace;
}

.permission-description {
  font-size: 13px;
  color: var(--van-gray-6);
}

:deep(.van-cell__right-icon) {
  display: none;
}

:deep(.van-cell) {
  padding: 16px;
  align-items: flex-start;
}

:deep(.van-cell__title) {
  flex: 1;
}

:deep(.van-button) {
  min-width: 72px;
  height: 32px;
  padding: 0 12px;
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .permission-item:hover {
    background-color: var(--van-background-3);
  }

  .permission-code {
    background: var(--van-background-3);
  }
}

.permission-actions {
  display: flex;
  gap: 8px;
}

:deep(.van-button) {
  min-width: 72px;
  height: 32px;
  padding: 0 12px;
}

:deep(.van-cell__right-icon) {
  display: none;
}

:deep(.van-cell) {
  padding: 16px;
  align-items: center;
}

:deep(.van-cell__title) {
  flex: 1;
}
</style>
