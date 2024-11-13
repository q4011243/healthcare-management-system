<template>
  <div class="monitor-page">
    <NavBar
      title="医嘱监控"
      left-text="返回"
      left-arrow
      @click-left="router.back()"
      fixed
      class="monitor-navbar"
      placeholder />

    <!-- 统计卡片 -->
    <div class="mt-[20px] grid grid-cols-2 gap-4 p-4">
      <van-card class="stat-card bg-gradient-to-br from-blue-50 to-blue-100">
        <template #title>
          <div class="mb-2 flex items-center">
            <van-icon name="clock" class="mr-2 text-blue-600" size="20" />
            <span class="font-medium text-gray-700">待执行医嘱</span>
          </div>
        </template>
        <template #num>
          <div class="flex flex-col">
            <span class="text-2xl font-bold text-blue-600">{{ pendingCount }}</span>
            <span class="mt-1 text-xs text-gray-500">待处理项</span>
          </div>
        </template>
      </van-card>

      <van-card class="stat-card !mt-0 bg-gradient-to-br from-orange-50 to-orange-100">
        <template #title>
          <div class="mb-2 flex items-center">
            <van-icon name="warning" class="mr-2 text-orange-600" size="20" />
            <span class="font-medium text-gray-700">异常执行</span>
          </div>
        </template>
        <template #num>
          <div class="flex flex-col">
            <span class="text-2xl font-bold text-orange-600">{{ abnormalCount }}</span>
            <span class="mt-1 text-xs text-gray-500">异常项</span>
          </div>
        </template>
      </van-card>
    </div>

    <!-- 执行列表 -->
    <div class="px-4 pb-4">
      <van-tabs
        v-model:active="activeTab"
        class="monitor-tabs"
        :border="false"
        title-active-color="#1a56db"
        color="#1a56db">
        <van-tab title="今日执行">
          <div class="mt-4">
            <van-list
              v-model:loading="loading"
              :finished="finished"
              :error="error"
              :error-text="errorText"
              @load="loadTodayExecutions"
              :immediate-check="false"
              finished-text="没有更多数据了"
              class="execution-list">
              <OrderExecutionItem
                v-for="execution in orderStore.todayExecutions"
                :key="execution.id"
                :execution="execution"
                class="execution-item mb-3"
                @click="navigateToExecute(execution.orderId)" />
            </van-list>
          </div>
        </van-tab>
        <van-tab title="异常记录">
          <div class="mt-4">
            <van-list
              v-model:loading="abnormalLoading"
              :finished="abnormalFinished"
              :error="abnormalError"
              :error-text="errorText"
              @load="loadAbnormalExecutions"
              :immediate-check="false"
              finished-text="没有更多数据了"
              class="execution-list">
              <OrderExecutionItem
                v-for="execution in orderStore.abnormalExecutions"
                :key="execution.id"
                :execution="execution"
                class="execution-item mb-3"
                @click="navigateToExecute(execution.orderId)" />
            </van-list>
          </div>
        </van-tab>
      </van-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useOrderStore } from "~/stores/orderStore";
import { OrderExecutionAbnormal } from "~/types/models/order";

const router = useRouter();
const orderStore = useOrderStore();

// 状态管理
const activeTab = ref(0);
const loading = ref(false);
const finished = ref(false);
const abnormalLoading = ref(false);
const abnormalFinished = ref(false);
const error = ref(false);
const abnormalError = ref(false);
const errorText = ref("请求失败，点击重试");
const page = ref(1);
const abnormalPage = ref(1);

// 统计数据 - 直接从 store 获取数据而不使用 computed
const pendingCount = ref(0);
const abnormalCount = ref(0);

// 加载今日执行记录
const loadTodayExecutions = async () => {
  if (loading.value) return;

  try {
    loading.value = true;
    error.value = false;

    const result = await orderStore.fetchTodayExecutions(page.value);
    if (result) {
      page.value++;
      // 根据实际数据量判断是否加载完成
      finished.value = result.length < 20;
    }
  } catch (e) {
    error.value = true;
    console.error("加载今日执行记录失败:", e);
  } finally {
    loading.value = false;
  }
};

// 加载异常记录
const loadAbnormalExecutions = async () => {
  if (abnormalLoading.value) return;

  try {
    abnormalLoading.value = true;
    abnormalError.value = false;

    const result = await orderStore.fetchAbnormalExecutions(abnormalPage.value);
    if (result) {
      abnormalPage.value++;
      // 根据实际数据量判断是否加载完成
      abnormalFinished.value = result.length < 20;
    }
  } catch (e) {
    abnormalError.value = true;
    console.error("加载异常记录失败:", e);
  } finally {
    abnormalLoading.value = false;
  }
};

// 导航到执行页面
const navigateToExecute = (orderId: number) => {
  router.push(`/orders/${orderId}/execute`);
};

// 更新统计数据
const updateCounts = () => {
  pendingCount.value = orderStore.orders.filter((e) => e.status === "PENDING").length;
  abnormalCount.value = orderStore.executions.filter(
    (e) => e.abnormal === OrderExecutionAbnormal.ABNORMAL
  ).length;
};

// 初始化加载
onMounted(async () => {
  await loadTodayExecutions();
  await orderStore.fetchAllExecutions();
  await orderStore.fetchAllOrders();
  updateCounts();
});

// 监听 tab 切换
watch(activeTab, async (newTab) => {
  if (newTab === 1 && orderStore.abnormalExecutions.length === 0) {
    await loadAbnormalExecutions();
  }
});

definePageMeta({
  requiresAuth: true
});
</script>

<style scoped>
.monitor-page {
  min-height: 100vh;
  background-color: #f8fafc;
}

.monitor-navbar {
  background: linear-gradient(to right, #1a56db, #3b82f6);
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stat-card {
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.monitor-tabs {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.monitor-tabs :deep(.van-tabs__wrap) {
  padding: 0 8px;
}

.monitor-tabs :deep(.van-tab) {
  font-size: 15px;
  font-weight: 500;
  padding: 12px 0;
}

.execution-list {
  padding: 4px 0;
}

.execution-item {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.execution-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 自定义滚动条样式 */
.execution-list {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

.execution-list::-webkit-scrollbar {
  width: 6px;
}

.execution-list::-webkit-scrollbar-track {
  background: transparent;
}

.execution-list::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 3px;
}

/* Loading 和 Error 状态样式 */
:deep(.van-list__loading),
:deep(.van-list__error-text),
:deep(.van-list__finished-text) {
  color: #64748b;
  font-size: 14px;
  padding: 16px 0;
  text-align: center;
}
</style>
