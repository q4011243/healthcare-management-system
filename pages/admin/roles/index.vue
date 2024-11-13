<template>
  <div class="role-management">
    <!-- 使用悬浮按钮替代导航栏按钮 -->
    <van-button
      class="fab-button"
      icon="plus"
      type="primary"
      round
      fixed
      @click="showRoleDialog = true">
      新增角色
    </van-button>
    <van-button
      class="fab-button-permissions"
      icon="lock"
      type="primary"
      round
      fixed
      @click="router.push('/admin/permissions')">
      权限管理
    </van-button>

    <van-list v-model:loading="loading" :finished="finished" @load="onLoad" class="role-list">
      <template v-for="role in roles" :key="role.id" :title="role.name" inset>
        <van-divider>{{ role.name }}</van-divider>
        <van-cell :title="role.name" :label="role.description" :border="false">
          <template #value>
            <van-tag :type="role.status === 'active' ? 'success' : 'warning'" size="medium">
              {{ role.status === "active" ? "启用" : "禁用" }}
            </van-tag>
          </template>
        </van-cell>

        <van-cell :border="false">
          <template #value>
            <van-space>
              <van-button
                plain
                type="primary"
                size="small"
                icon="setting-o"
                @click="navigateToPermissions(role.id)">
                权限配置
              </van-button>
              <van-button plain type="primary" size="small" icon="edit" @click="editRole(role)">
                编辑
              </van-button>
              <van-button
                plain
                type="danger"
                size="small"
                icon="delete-o"
                @click="confirmDelete(role.id)">
                删除
              </van-button>
            </van-space>
          </template>
        </van-cell>
      </template>
    </van-list>

    <!-- 角色表单弹窗 -->
    <van-dialog
      v-model:show="showRoleDialog"
      :title="editingRole ? '编辑角色' : '新增角色'"
      show-cancel-button
      @confirm="saveRole"
      @cancel="resetForm">
      <van-form>
        <van-cell-group inset>
          <van-field
            v-model="currentRole.name"
            label="角色名称"
            placeholder="请输入角色名称"
            :rules="[{ required: true, message: '请输入角色名称' }]" />
          <van-field
            v-model="currentRole.code"
            label="角色编码"
            placeholder="请输入角色编码"
            :rules="[{ required: true, message: '请输入角色编码' }]" />
          <van-field
            v-model="currentRole.description"
            label="角色描述"
            type="textarea"
            placeholder="请输入角色描述"
            rows="2"
            autosize />
          <van-field
            v-model.number="currentRole.level"
            label="角色级别"
            type="digit"
            :rules="[{ required: true, message: '请输入角色级别' }]" />
          <van-field name="status" label="状态">
            <template #input>
              <van-switch
                v-model="currentRole.status"
                :active-value="'active'"
                :inactive-value="'inactive'" />
            </template>
          </van-field>
        </van-cell-group>
      </van-form>
    </van-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import { showToast, showDialog } from "vant";
import { useRoleStore } from "~/stores/role";
import type { Role } from "~/types/models/auth";

const router = useRouter();
const roleStore = useRoleStore();

const roles = ref<Role[]>([]);
const loading = ref(false);
const finished = ref(false);
const showRoleDialog = ref(false);
const editingRole = ref<Role | null>(null);
const currentRole = reactive<Partial<Role>>({
  name: "",
  code: "",
  description: "",
  level: 0,
  status: "active",
  permissionIds: []
});

// 加载角色列表
const onLoad = async () => {
  if (!loading.value) {
    loading.value = true;
    try {
      await roleStore.loadRoles();
      roles.value = roleStore.roles;
      finished.value = true;
    } catch (error) {
      showToast("加载失败");
    } finally {
      loading.value = false;
    }
  }
};

// 编辑角色
const editRole = (role: Role) => {
  editingRole.value = role;
  Object.assign(currentRole, role);
  showRoleDialog.value = true;
};

// 保存角色
const saveRole = async () => {
  try {
    const roleData = {
      name: currentRole.name,
      code: currentRole.code,
      description: currentRole.description,
      level: Number(currentRole.level),
      status: currentRole.status,
      permissionIds: [...(currentRole.permissionIds || [])]
    };
    if (editingRole.value) {
      await roleStore.updateRole(editingRole.value.id, roleData);
    } else {
      await roleStore.createRole(roleData as Role);
    }
    showRoleDialog.value = false;
    resetForm();
    showToast("保存成功");
    roles.value = [];
    finished.value = false;
    onLoad();
  } catch (error) {
    showToast("保存失败");
  }
};

// 确认删除
const confirmDelete = (id: number) => {
  showDialog({
    title: "确认删除",
    message: "确定要删除该角色吗？",
    showCancelButton: true
  }).then(async () => {
    try {
      await roleStore.deleteRole(id);
      showToast("删除成功");
      roles.value = roles.value.filter((r) => r.id !== id);
    } catch (error) {
      showToast("删除失败");
    }
  });
};

// 跳转到权限配置页面
const navigateToPermissions = (roleId: number) => {
  console.info("navigateToPermissions", roleId);
  router.push(`/admin/roles/${roleId}/permissions`);
};

// 重置表单
const resetForm = () => {
  editingRole.value = null;
  Object.assign(currentRole, {
    name: "",
    code: "",
    description: "",
    level: 0,
    status: "active",
    permissionIds: []
  });
};

onMounted(() => {
  onLoad();
});

definePageMeta({
  layout: "admin",
  title: "角色管理",
  requiresAuth: true
  // permissions: {
  //   resource: "roles",
  //   action: "manage"
  // }
});
</script>

<style scoped>
.role-management {
  min-height: 100vh;
  background: #f7f8fa;
  padding: 12px;
  padding-bottom: 80px;
}

.role-list {
  margin-bottom: 16px;
}

.fab-button {
  position: fixed;
  right: 16px;
  bottom: 60px;
  z-index: 99;
}

.fab-button-permissions {
  position: fixed;
  left: 16px;
  bottom: 60px;
  z-index: 99;
}

:deep(.van-cell-group) {
  margin-bottom: 12px;
}

:deep(.van-space) {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

:deep(.van-button) {
  min-width: 88px;
}
</style>
