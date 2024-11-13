<template>
  <div class="dashboard pb-safe">
    <!-- 快速操作区 -->
    <div class="bg-primary p-4 pb-8">
      <div class="grid grid-cols-4 gap-4 rounded-lg bg-white p-4">
        <div
          v-for="action in quickActions"
          :key="action.name"
          class="cursor-pointer text-center"
          @click="router.push(action.path)">
          <div
            class="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full"
            :class="action.bgColor">
            <van-icon :name="action.icon" size="24" :color="action.iconColor" />
          </div>
          <span class="text-sm">{{ action.name }}</span>
        </div>
      </div>
    </div>

    <!-- 统计卡片区域 -->
    <div class="relative -mt-4 px-4">
      <van-row gutter="12">
        <van-col span="12" v-for="stat in statistics" :key="stat.title">
          <div class="mb-4 rounded-lg bg-white p-4 shadow-sm">
            <h3 class="mb-2 text-sm text-gray-600">{{ stat.title }}</h3>
            <p class="text-xl font-bold">{{ stat.value }}</p>
            <div class="mt-2 text-xs" :class="stat.trend > 0 ? 'text-red-500' : 'text-green-500'">
              {{ stat.trend > 0 ? "↑" : "↓" }} {{ Math.abs(stat.trend) }}%
              <span class="text-gray-500">较上周</span>
            </div>
          </div>
        </van-col>
      </van-row>
    </div>

    <!-- 图表区域 -->
    <div class="mx-4 mb-4 rounded-lg bg-white p-4">
      <h2 class="mb-4 text-lg font-bold">患者趋势</h2>
      <v-chart class="h-64 w-full" :option="chartOption" />
    </div>

    <!-- 待办事项 -->
    <div class="mx-4 mb-4 rounded-lg bg-white p-4">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-bold">待办事项</h2>
        <van-tabs v-model:active="activeTaskTab" class="flex-1">
          <van-tab title="今日" name="today" />
          <van-tab title="待处理" name="pending" />
        </van-tabs>
      </div>
      <van-list v-model:loading="loading" :finished="finished" @load="onLoad">
        <div
          v-for="todo in currentTasks"
          :key="todo.id"
          class="mb-3 flex items-center justify-between rounded-lg border p-3">
          <div class="flex items-center">
            <van-tag :type="todo.priority === 'high' ? 'danger' : 'primary'" class="mr-2">
              {{ todo.priority === "high" ? "紧急" : "普通" }}
            </van-tag>
            <span>{{ todo.title }}</span>
          </div>
          <span class="text-sm text-gray-500">{{ todo.time }}</span>
        </div>
      </van-list>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

// 快捷操作配置
const quickActions = [
  {
    name: "入院登记",
    path: "/patients/admission",
    icon: "plus",
    bgColor: "bg-blue-100",
    iconColor: "#1989fa"
  },
  {
    name: "病房查看",
    path: "/ward/overview",
    icon: "hotel-o",
    bgColor: "bg-green-100",
    iconColor: "#07c160"
  },
  {
    name: "医嘱管理",
    path: "/orders",
    icon: "records",
    bgColor: "bg-orange-100",
    iconColor: "#ff976a"
  },
  {
    name: "数据统计",
    path: "/statistics",
    icon: "chart-trending-o",
    bgColor: "bg-purple-100",
    iconColor: "#7232dd"
  }
];

// 统计数据
const statistics = [
  {
    title: "在院患者",
    value: "128",
    trend: -5
  },
  {
    title: "今日入院",
    value: "12",
    trend: 8
  },
  {
    title: "待处理医嘱",
    value: "25",
    trend: 15
  },
  {
    title: "病床使用率",
    value: "85%",
    trend: -2
  }
];

// 图表配置
const chartOption = {
  tooltip: {
    trigger: "axis"
  },
  legend: {
    data: ["入院人数", "出院人数"]
  },
  grid: {
    left: "3%",
    right: "4%",
    bottom: "3%",
    containLabel: true
  },
  xAxis: {
    type: "category",
    data: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]
  },
  yAxis: {
    type: "value"
  },
  series: [
    {
      name: "入院人数",
      type: "line",
      data: [12, 15, 10, 18, 14, 9, 12]
    },
    {
      name: "出院人数",
      type: "line",
      data: [8, 12, 11, 14, 16, 10, 9]
    }
  ]
};

// 待办事项相关
const activeTaskTab = ref("today");
const loading = ref(false);
const finished = ref(false);
const tasks: Record<string, any[]> = {
  today: [
    { id: 1, title: "张三的术前检查", time: "10:30", priority: "high" },
    { id: 2, title: "李四的出院评估", time: "14:00", priority: "normal" },
    { id: 3, title: "查房记录整理", time: "16:00", priority: "normal" }
  ],
  pending: [
    { id: 4, title: "王五的康复计划制定", time: "明天 09:00", priority: "high" },
    { id: 5, title: "赵六的复查预约", time: "明天 11:00", priority: "normal" },
    { id: 6, title: "孙八待出院", time: "明天 10:00", priority: "normal" }
  ]
};

const currentTasks = computed(() => tasks[activeTaskTab.value]);

const onLoad = () => {
  setTimeout(() => {
    loading.value = false;
    finished.value = true;
  }, 1000);
};

// 页面元数据
definePageMeta({
  layout: "admin",
  title: "仪表板",
  requiresAuth: true,
  permissions: ["VIEW_DASHBOARD"]
});
</script>

<style scoped>
.van-nav-bar {
  background-color: var(--van-primary-color);
}

.van-nav-bar :deep(.van-nav-bar__title) {
  color: white;
}

/* 添加点击反馈效果 */
.cursor-pointer:active {
  opacity: 0.7;
}
</style>
