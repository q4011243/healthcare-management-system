<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { showToast, NavBar } from "vant";
import type { Order } from "~/types/models/order";
import { OrderStatus } from "~/types/models/order";
import { useOrderStore } from "~/stores/orderStore";

const route = useRoute();
const router = useRouter();
const orderStore = useOrderStore();
const order = ref<Order | null>(null);
const loading = ref(true);

const showStopDialog = ref(false);
const stopReason = ref("");

const handleStop = async () => {
  if (!stopReason.value) {
    showToast("请输入停止原因");
    return;
  }

  const success = await orderStore.stopOrder(Number(route.params.id), stopReason.value);

  if (success) {
    showToast("医嘱已停止");
    showStopDialog.value = false;
  }
};

onMounted(async () => {
  try {
    const orderId = Number(route.params.id);
    const result = await orderStore.fetchOrderById(orderId);
    if (result) {
      order.value = result;
    } else {
      showToast("医嘱不存在");
      router.back();
    }
  } catch (error) {
    showToast("加载失败");
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div>
    <NavBar
      title="医嘱详情"
      left-text="返回"
      left-arrow
      @click-left="router.back()"
      fixed
      placeholder>
      <template #right>
        <div class="flex gap-2">
          <van-button
            v-if="order?.status === OrderStatus.PENDING"
            type="primary"
            size="small"
            plain
            @click="router.push(`/orders/${order.id}/edit`)">
            修改
          </van-button>
          <van-button
            v-if="order?.status === OrderStatus.EXECUTING"
            type="danger"
            size="small"
            plain
            @click="showStopDialog = true">
            停止医嘱
          </van-button>
        </div>
      </template>
    </NavBar>

    <div v-if="loading" class="flex min-h-screen items-center justify-center">
      <van-loading type="spinner" />
    </div>

    <template v-if="order?.id">
      <OrderDetail :order="order" />
      <OrderExecutionList :order-id="order.id" />
    </template>

    <div v-else class="flex min-h-screen items-center justify-center text-gray-500">暂无数据</div>

    <van-dialog
      v-model:show="showStopDialog"
      title="停止医嘱"
      show-cancel-button
      @confirm="handleStop">
      <div class="p-4">
        <van-field
          v-model="stopReason"
          label="停止原因"
          type="textarea"
          placeholder="请输入停止原因"
          rows="3"
          required />
      </div>
    </van-dialog>
  </div>
</template>
