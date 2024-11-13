<template>
  <div class="review-page">
    <NavBar title="医嘱审核" @click-right="navigateToList">
      <template #right>
        <van-icon name="plus" size="24" color="white" />
      </template>
    </NavBar>
    <!-- 搜索栏 -->
    <van-search
      v-model="searchText"
      placeholder="搜索医嘱内容"
      @search="handleSearch"
      class="sticky top-0 z-10" />

    <!-- 审核列表 -->
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多待审核医嘱"
        @load="loadMore">
        <div class="p-4">
          <OrderCard
            v-for="order in pendingOrders"
            :key="order.id"
            :order="order"
            class="mb-4"
            @click="navigateToDetail(order.id)" />
        </div>
      </van-list>
    </van-pull-refresh>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useOrderStore } from "~/stores/orderStore";
import { OrderStatus } from "~/types/models/order";

const router = useRouter();
const orderStore = useOrderStore();

// 状态管理
const searchText = ref("");
const loading = ref(false);
const finished = ref(false);
const refreshing = ref(false);
const page = ref(1);

// 获取待审核医嘱
const pendingOrders = computed(() =>
  orderStore.orders.filter((order) => order.status === OrderStatus.PENDING)
);

// 加载更多
const loadMore = async () => {
  try {
    loading.value = true;
    await orderStore.fetchOrdersPage({
      status: [OrderStatus.PENDING],
      page: page.value,
      searchText: searchText.value
    });
    page.value++;
    if (orderStore.orders.length < page.value * 20) {
      finished.value = true;
    }
  } finally {
    loading.value = false;
    finished.value = true;
  }
};

// 搜索处理
const handleSearch = () => {
  finished.value = false;
  page.value = 1;
  orderStore.clearOrders();
  loadMore();
};

// 刷新处理
const onRefresh = async () => {
  finished.value = false;
  page.value = 1;
  orderStore.clearOrders();
  await loadMore();
  refreshing.value = false;
};

// 导航到详情页
const navigateToDetail = (id: number | undefined) => {
  if (id) {
    router.push(`/orders/review/${id}`);
  }
};

// 导航到列表页
const navigateToList = () => {
  router.push("/orders/review");
};

definePageMeta({
  requiresAuth: true
});
</script>

<style scoped>
.review-page {
  min-height: 100vh;
  background-color: var(--van-background);
}
</style>
