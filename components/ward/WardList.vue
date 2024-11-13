<template>
  <div class="ward-list">
    <!-- 顶部操作栏 -->
    <div class="mb-4 flex items-center justify-between bg-white p-4">
      <div class="flex items-center space-x-4">
        <van-search v-model="searchText" placeholder="搜索病区编号/名称" shape="round" />

        <van-dropdown-menu>
          <van-dropdown-item v-model="filterDepartment" :options="departmentOptions" />
          <van-dropdown-item v-model="filterStatus" :options="statusOptions" />
        </van-dropdown-menu>
      </div>

      <van-button type="primary" icon="plus" @click="showAddWardDialog">新增病区</van-button>
    </div>

    <!-- 病区列表 -->
    <div class="grid gap-4 p-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      <ward-card
        v-for="ward in filteredWards"
        :key="ward.id"
        :ward="ward"
        @edit="onEditWard"
        @view-rooms="onViewWardRooms"
        @change-status="onChangeWardStatus" />
    </div>

    <!-- 空状态 -->
    <div v-if="filteredWards.length === 0" class="flex flex-col items-center justify-center py-8">
      <van-empty description="暂无病区数据" />
    </div>

    <!-- 新增/编辑病区弹窗 -->
    <ward-form-dialog v-model:show="showDialog" :ward="currentWard" @submit="onSubmitWard" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useWardStore } from "~/stores/wardStore";
import { WardStatus, type Ward } from "~/types/models/ward";
import WardFormDialog from "./WardFormDialog.vue";

const wardStore = useWardStore();
const searchText = ref("");
const filterDepartment = ref("all");
const filterStatus = ref<WardStatus | "all">("all");
const showDialog = ref(false);
const currentWard = ref<Ward | null>(null);

// 部门选项 - 实际应该从配置或API获取
const departmentOptions = [
  { text: "全部科室", value: "all" },
  { text: "内科", value: "内科" },
  { text: "外科", value: "外科" },
  { text: "儿科", value: "儿科" }
  // ... 更多科室
];

const statusOptions = [
  { text: "全部状态", value: "all" },
  { text: "运行中", value: WardStatus.ACTIVE },
  { text: "已停用", value: WardStatus.INACTIVE }
];

// 过滤后的病区列表
const filteredWards = computed(() => {
  return wardStore.wards.filter((ward) => {
    const matchSearch = searchText.value
      ? ward.name.includes(searchText.value) || ward.code.includes(searchText.value)
      : true;

    const matchDepartment =
      filterDepartment.value === "all" ? true : ward.department === filterDepartment.value;

    const matchStatus = filterStatus.value === "all" ? true : ward.status === filterStatus.value;

    return matchSearch && matchDepartment && matchStatus;
  });
});

// 事件处理方法
const showAddWardDialog = () => {
  currentWard.value = null;
  showDialog.value = true;
};

const onEditWard = (ward: Ward) => {
  currentWard.value = ward;
  showDialog.value = true;
};

const onViewWardRooms = (ward: Ward) => {
  // TODO: 导航到病区房间列表页面
};

const onChangeWardStatus = async (ward: Ward, status: WardStatus) => {
  try {
    await wardStore.updateWard(ward.id!, { status });
  } catch (error) {
    console.error("更新病区状态失败:", error);
  }
};

const onSubmitWard = async (wardData: Partial<Ward>) => {
  try {
    if (currentWard.value) {
      await wardStore.updateWard(currentWard.value.id!, wardData);
    } else {
      await wardStore.createWard(wardData as Omit<Ward, "id" | "totalRooms" | "totalBeds">);
    }
    showDialog.value = false;
  } catch (error) {
    console.error("保存病区失败:", error);
  }
};
</script>
