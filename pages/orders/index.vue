<template>
  <div class="orders-page">
    <!-- 搜索栏 -->
    <div class="sticky top-0 z-10 flex items-center">
      <van-search
        v-model="searchText"
        placeholder="搜索医嘱内容"
        @search="handleSearch"
        class="flex-1" />
      <van-button class="ml-2" icon="filter-o" @click="showFilter = true" />
    </div>

    <!-- 分类切换 -->
    <van-tabs v-model:active="activeTab" sticky offset-top="54" class="order-tabs">
      <van-tab title="长期医嘱" :name="OrderType.LONG_TERM">
        <OrderList
          :orders="filteredOrders"
          v-model:loading="loading"
          v-model:finished="finished"
          @load="loadMore"
          @refresh="onRefresh" />
      </van-tab>
      <van-tab title="临时医嘱" :name="OrderType.TEMPORARY">
        <OrderList
          :orders="filteredOrders"
          v-model:loading="loading"
          v-model:finished="finished"
          @load="loadMore"
          @refresh="onRefresh" />
      </van-tab>
    </van-tabs>

    <!-- 状态筛选器 -->
    <van-action-sheet v-model:show="showFilter" title="状态筛选">
      <div class="p-4">
        <van-checkbox-group v-model="selectedStatus">
          <van-cell-group>
            <van-cell
              v-for="status in getOptions('OrderStatus')"
              :key="status.value"
              :title="status.label"
              clickable
              @click="toggleStatus(status.value as OrderStatus)">
              <template #right-icon>
                <van-checkbox :name="status.value" />
              </template>
            </van-cell>
          </van-cell-group>
        </van-checkbox-group>
        <div class="flex justify-end gap-4 p-4">
          <van-button plain type="primary" size="small" @click="resetFilter">重置</van-button>
          <van-button type="primary" size="small" @click="showFilter = false">确定</van-button>
        </div>
      </div>
    </van-action-sheet>

    <!-- 悬浮按钮组 -->
    <FloatingButtonGroup>
      <!-- 新增医嘱按钮 -->
      <van-button v-if="canCreateOrder" icon="plus" type="primary" round @click="navigateToCreate">
        新增
      </van-button>
      <van-button icon="eye-o" type="warning" round @click="router.push('/orders/monitor')">
        监控
      </van-button>

      <!-- 待审核按钮 -->
      <van-button
        v-if="hasReviewPermission"
        type="primary"
        icon="records"
        round
        @click="router.push('/orders/review')">
        待审核
      </van-button>
    </FloatingButtonGroup>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useOrderStore } from "~/stores/orderStore";
import { useEnum } from "~/types/enums/metadata";
import { OrderStatus, OrderType } from "~/types/models/order";
import FloatingButtonGroup from "~/components/common/FloatingButtonGroup.vue";
const { getOptions } = useEnum();

const router = useRouter();
const orderStore = useOrderStore();

// 状态管理
const activeTab = ref<OrderType>(OrderType.LONG_TERM);
const searchText = ref("");
const showFilter = ref(false);
const loading = ref(false);
const finished = ref(false);
const selectedStatus = ref<OrderStatus[]>([]);
const page = ref(1);

// 权限检查
const canCreateOrder = computed(() => {
  return true;
});

const { orders } = storeToRefs(orderStore);

// 过滤后的医嘱列表
const filteredOrders = computed(() => {
  return orders.value.filter((order) => {
    const matchesType = order.type === activeTab.value;
    const matchesStatus =
      selectedStatus.value.length === 0 || selectedStatus.value.includes(order.status);
    const matchesSearch =
      searchText.value === "" ||
      order.content.toLowerCase().includes(searchText.value.toLowerCase());

    return matchesType && matchesStatus && matchesSearch;
  });
});

// 加载更多
const loadMore = async () => {
  loading.value = true;
  try {
    const newOrders = await orderStore.fetchOrdersPage({
      type: activeTab.value,
      status: selectedStatus.value,
      page: page.value,
      pageSize: 20,
      searchText: searchText.value
    });
    if (newOrders.length < 20) {
      finished.value = true;
    } else {
      page.value++;
    }
  } finally {
    loading.value = false;
  }
};

// 刷新
const onRefresh = async () => {
  finished.value = false;
  page.value = 1;
  await orderStore.clearOrders();
  await loadMore();
};

// 搜索处理
const handleSearch = () => {
  finished.value = false;
  page.value = 1;
  orderStore.clearOrders();
  loadMore();
};

// 切换状态筛选
const toggleStatus = (status: OrderStatus) => {
  const index = selectedStatus.value.indexOf(status);
  if (index === -1) {
    selectedStatus.value.push(status);
  } else {
    selectedStatus.value.splice(index, 1);
  }
  finished.value = false;
  page.value = 1;
  orderStore.clearOrders();
  loadMore();
};

// 重置筛选
const resetFilter = () => {
  selectedStatus.value = [];
  showFilter.value = false;
  finished.value = false;
  page.value = 1;
  orderStore.clearOrders();
  loadMore();
};

// 跳转到创建页面
const navigateToCreate = () => {
  router.push("/orders/create");
};

// 初始加载
onMounted(() => {
  loadMore();
});

// 权限检查
const hasReviewPermission = computed(() => {
  return true;
});

definePageMeta({
  layout: "admin",
  title: "医嘱列表",
  requiresAuth: true
});
</script>

<style scoped>
.orders-page {
  min-height: calc(100vh - 96px);
  background-color: var(--van-background);
}

.order-tabs :deep(.van-tabs__wrap) {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.van-action-sheet {
  max-height: 80vh;
  overflow-y: auto;
}
</style>
