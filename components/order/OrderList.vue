<template>
  <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
    <van-list
      v-model:loading="loading"
      :finished="finished"
      finished-text="没有更多了"
      @load="$emit('load')">
      <div class="py-4">
        <OrderCard
          v-for="order in orders"
          :key="order.id"
          :order="order"
          :show-actions="true"
          @execute="handleExecute(order)"
          @stop="handleStop(order)"
          @delete="handleDelete(order)"
          class="mb-4" />
      </div>
    </van-list>
  </van-pull-refresh>
</template>

<script setup lang="ts">
import type { TagType } from "vant";
import { ref } from "vue";
import { useRouter } from "vue-router";
import { OrderStatus, type Order } from "~/types/models/order";

const loading = defineModel<boolean>("loading", { required: false });
const finished = defineModel<boolean>("finished", { required: false });
const orderStore = useOrderStore();

defineProps<{
  orders: Order[];
}>();

const emit = defineEmits<{
  (e: "load"): void;
  (e: "refresh"): void;
}>();

const router = useRouter();
const refreshing = ref(false);
const onRefresh = () => {
  emit("refresh");
  setTimeout(() => {
    refreshing.value = false;
  }, 1000);
};

// 处理执行医嘱
const handleExecute = (order: Order) => {
  router.push(`/orders/${order.id}/execute`);
};

// 处理停止医嘱
const handleStop = (order: Order) => {
  showDialog({
    title: "确认停止",
    message: "确定要停止该医嘱吗？",
    showCancelButton: true
  }).then(async () => {
    if (order.id) {
      await orderStore.updateOrderStatus(order.id, OrderStatus.STOPPED);
    }
  });
};

// 处理删除医嘱
const handleDelete = (order: Order) => {
  showDialog({
    title: "确认删除",
    message: "确定要删除该医嘱吗？",
    showCancelButton: true
  }).then(async () => {
    if (order.id) {
      await orderStore.deleteOrder(order.id);
    }
  });
};
</script>

<style scoped>
.orders-page {
  min-height: 100vh;
  background-color: var(--van-background);
}

.order-tabs :deep(.van-tabs__wrap) {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}
</style>
