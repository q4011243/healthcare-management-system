<template>
  <div class="ward-management">
    <!-- 病区选择器 -->
    <div class="flex items-center justify-between bg-white p-4">
      <div v-if="loading" class="flex items-center">
        <van-loading type="spinner" size="24px" />
      </div>
      <div v-else-if="currentWard" class="flex items-center">
        <span class="text-lg font-medium">{{ currentWard.name }}</span>
        <van-tag type="primary" class="ml-2">
          {{ currentWard.department }}
        </van-tag>
      </div>
      <van-popover
        v-model:show="showWardSelector"
        placement="bottom-end"
        theme="dark"
        trigger="click">
        <template #reference>
          <van-button size="small" plain type="primary" icon="arrow-down">切换病区</van-button>
        </template>
        <div class="p-2">
          <div
            v-for="ward in wards"
            :key="ward.id"
            class="cursor-pointer rounded px-4 py-2 text-sm hover:bg-gray-100"
            :class="{ 'text-primary': ward.id === currentWard?.id }"
            @click="switchWard(ward)">
            {{ ward.name }}
          </div>
        </div>
      </van-popover>
    </div>

    <!-- 统计卡片区域 -->
    <div class="grid grid-cols-2 gap-3 p-4">
      <div
        v-for="stat in wardStatistics"
        :key="stat.title"
        class="stat-card rounded-lg bg-white p-4 transition-all duration-300 hover:shadow-lg">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-gray-600">{{ stat.title }}</span>
          <van-icon
            :name="stat.icon"
            class="bg-primary/10 text-primary rounded-full p-1.5"
            size="18" />
        </div>
        <div class="mt-3">
          <div class="flex items-baseline">
            <span class="text-2xl font-bold text-gray-900">{{ stat.value }}</span>
            <span class="ml-1 text-sm text-gray-500">{{ stat.unit }}</span>
          </div>
          <div class="mt-2 flex items-center text-xs">
            <span
              class="flex items-center"
              :class="stat.trend > 0 ? 'text-red-500' : 'text-green-500'">
              <van-icon :name="stat.trend > 0 ? 'arrow-up' : 'arrow-down'" class="mr-0.5" />
              {{ Math.abs(stat.trend) }}%
            </span>
            <span class="ml-1 text-gray-500">较上周</span>
            <span class="ml-auto text-gray-500">{{ stat.subtext }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 快捷操作区 -->
    <div class="mb-4 bg-white p-4">
      <div class="mb-3 text-base font-medium">快捷操作</div>
      <div class="grid grid-cols-4 gap-4">
        <div
          v-for="action in quickActions"
          :key="action.text"
          class="flex flex-col items-center"
          @click="action.onClick">
          <van-button :icon="action.icon" round size="small" type="primary" plain />
          <span class="mt-1 text-xs">{{ action.text }}</span>
        </div>
      </div>
    </div>

    <!-- 概览组件 -->
    <WardOverview v-if="currentWard" :ward-id="currentWard?.id" @refresh="refreshData" />

    <!-- 新增操作弹窗 -->
    <van-action-sheet
      v-model:show="showAddActions"
      :actions="addActions"
      cancel-text="取消"
      @select="onAddActionSelect" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { showToast, showDialog } from "vant";
import { useWardStore } from "~/stores/wardStore";
import WardOverview from "~/components/ward/WardOverview.vue";
import type { Ward } from "~/types/models/ward";

const router = useRouter();
const wardStore = useWardStore();
const showWardSelector = ref(false);
const showAddActions = ref(false);

// 从 store 获取数据
const loading = computed(() => wardStore.loading);
const wards = computed(() => wardStore.wards);
const currentWard = computed(() => wardStore.currentWard);

// 统计数据计算属性
const wardStatistics = computed(() => {
  if (!currentWard.value) return [];

  return [
    {
      title: "总床位数",
      value: currentWard.value.totalBeds || 0,
      unit: "张",
      subtext: `空闲床位: ${currentWard.value.availableBeds || 0}`,
      icon: "bars",
      trend: calculateTrend(currentWard.value.totalBeds, currentWard.value.lastWeekTotalBeds)
    },
    {
      title: "房间数",
      value: currentWard.value.totalRooms || 0,
      unit: "间",
      subtext: `空闲房间: ${currentWard.value.availableRooms || 0}`,
      icon: "wap-home",
      trend: calculateTrend(currentWard.value.totalRooms, currentWard.value.lastWeekTotalRooms)
    },
    {
      title: "在岗人员",
      value: currentWard.value.totalStaff || 0,
      unit: "人",
      subtext: `医生: ${currentWard.value.doctorCount || 0} 护士: ${currentWard.value.nurseCount || 0}`,
      icon: "friends",
      trend: calculateTrend(currentWard.value.totalStaff, currentWard.value.lastWeekTotalStaff)
    },
    {
      title: "床位使用率",
      value: calculateOccupancyRate(currentWard.value),
      unit: "%",
      subtext: "较上周",
      icon: "chart-trending-o",
      trend: calculateTrend(
        calculateOccupancyRate(currentWard.value),
        calculateOccupancyRate(currentWard.value, true)
      )
    }
  ];
});

// 计算趋势
const calculateTrend = (current: number = 0, previous: number = 0): number => {
  if (!previous) return 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
};

// 计算床位使用率
const calculateOccupancyRate = (ward: Ward, isLastWeek = false): number => {
  const totalBeds = isLastWeek ? ward.lastWeekTotalBeds : ward.totalBeds;
  const availableBeds = isLastWeek ? ward.lastWeekAvailableBeds : ward.availableBeds;
  if (!totalBeds) return 0;
  return Number((((totalBeds - (availableBeds || 0)) / totalBeds) * 100).toFixed(1));
};

// 切换病区
const switchWard = async (ward: Ward) => {
  try {
    await wardStore.fetchWardById(ward.id);
    showWardSelector.value = false;
    refreshData();
  } catch (error) {
    showToast("切换病区失败");
  }
};

// 刷新数据
const refreshData = async () => {
  try {
    await wardStore.fetchAllWards();
    if (!currentWard.value && wards.value.length > 0) {
      await wardStore.fetchWardById(wards.value[0].id);
    }
  } catch (error) {
    showToast("刷新数据失败");
  }
};

// 页面加载时获取数据
onMounted(async () => {
  await refreshData();
});

// 快捷操作
const quickActions = [
  {
    icon: "wap-home",
    text: "房间管理",
    onClick: () => router.push(`/ward/${currentWard.value?.id}/rooms`)
  },
  {
    icon: "hotel-o", // 使用床位相关图标
    text: "床位管理",
    onClick: () => router.push("/ward/beds")
  },
  {
    icon: "friends",
    text: "人员管理",
    onClick: () => router.push("/ward/staff")
  },
  {
    icon: "clock",
    text: "排班管理",
    onClick: () => router.push("/ward/schedule")
  }
];

// 底部操作

// 新增操作列表
const addActions = [
  { name: "新增房间", color: "#1989fa" },
  { name: "新增床位", color: "#1989fa" },
  { name: "新增人员", color: "#1989fa" }
];

const onAddActionSelect = (action: any) => {
  showToast(action.name);
  showAddActions.value = false;
};

definePageMeta({
  layout: "admin",
  title: "病区信息",
  requiresAuth: true,
  middleware: "auth"
});
</script>

<style scoped>
.ward-management {
  min-height: 100vh;
  background-color: #f7f8fa;
}

/* 添加过渡动画 */
.van-card {
  transition: all 0.3s ease;
}

.van-card:active {
  transform: scale(0.98);
}

.stat-card {
  position: relative;
  overflow: hidden;
  border: 1px solid #f0f0f0;
}

/* 添加鼠标悬停效果 */
.stat-card:hover {
  border-color: #e5e7eb;
}

/* 添加卡片激活状态效果 */
.stat-card:active {
  transform: scale(0.98);
}

/* 可选：添加装饰性背景 */
.stat-card::before {
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  width: 100px;
  height: 100px;
  background: linear-gradient(45deg, transparent, rgba(var(--van-primary-color), 0.03));
  border-radius: 50%;
  transform: translate(50%, -50%);
  pointer-events: none;
}
</style>
