<template>
  <van-cell-group inset class="order-card mb-3">
    <!-- 头部信息 -->
    <div class="flex items-center justify-between border-b border-gray-100 p-3">
      <div class="flex items-center">
        <span class="text-sm text-gray-500">{{ formatDate(order.createdAt) }}</span>
        <enum-tag enum-name="OrderType" :value="order.type" class="ml-2" />
        <enum-tag enum-name="OrderStatus" :value="order.status" class="ml-2" />
      </div>
      <van-button v-if="showActions" size="small" icon="ellipsis" @click="showActionSheet = true" />
    </div>

    <!-- 主要内容 -->
    <div class="p-3">
      <!-- 患者信息 -->
      <div class="mb-2 flex items-center">
        <van-icon name="user-o" class="mr-1 text-gray-500" />
        <span class="font-medium">{{ order.patient?.name }}</span>
        <span class="ml-2 text-sm text-gray-500">
          {{ `床号：${order.patient?.bedId}` }}
        </span>
      </div>

      <!-- 医嘱内容 -->
      <div class="mb-2">
        <p class="text-base">{{ order.content }}</p>
      </div>

      <!-- 执行信息 -->
      <div class="text-sm text-gray-500">
        <div class="flex items-center">
          <van-icon name="clock-o" class="mr-1" />
          <span>频次：{{ order.frequency }}</span>
        </div>
        <div class="mt-1 flex items-center">
          <van-icon name="calendar-o" class="mr-1" />
          <span>
            {{ formatDate(order.startTime) }}
            {{ order.endTime ? `至 ${formatDate(order.endTime)}` : "" }}
          </span>
        </div>
      </div>

      <!-- 备注信息 -->
      <div v-if="order.notes" class="mt-2 text-sm text-gray-500">
        <van-icon name="notes-o" class="mr-1" />
        <span>{{ order.notes }}</span>
      </div>
    </div>

    <!-- 底部信息 -->
    <div class="flex items-center justify-between border-t border-gray-100 bg-gray-50 p-3">
      <div class="text-sm text-gray-500">
        <van-icon name="manager-o" class="mr-1" />
        医生：{{ order.doctor?.name }}
      </div>
      <div v-if="order.lastExecution" class="text-sm text-gray-500">
        <van-icon name="checked" class="mr-1" />
        最近执行：{{ formatDate(order.lastExecution.executionTime) }}
      </div>
    </div>

    <!-- 审核信息 -->
    <div v-if="order.reviewNotes" class="border-t border-gray-100 p-3">
      <div class="text-sm">
        <van-tag :type="order.status === 'REJECTED' ? 'danger' : 'success'" class="mr-2">
          {{ order.status === "REJECTED" ? "已驳回" : "已通过" }}
        </van-tag>
        <span class="text-gray-500">{{ order.reviewNotes }}</span>
      </div>
    </div>

    <!-- 操作菜单 -->
    <van-action-sheet
      v-model:show="showActionSheet"
      :actions="getActions(order)"
      cancel-text="取消"
      @select="handleAction" />
  </van-cell-group>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import type { Order } from "~/types/models/order";
import { formatDate } from "~/utils/date";

const props = defineProps<{
  order: Order;
  showActions?: boolean;
}>();

const emit = defineEmits<{
  (e: "execute"): void;
  (e: "stop"): void;
  (e: "delete"): void;
}>();

const router = useRouter();
const showActionSheet = ref(false);

// 获取可用操作
const getActions = (order: Order) => {
  const actions = [];

  if (order.status === "APPROVED" || order.status === "EXECUTING") {
    actions.push({ name: "执行医嘱", action: "execute", icon: "play-circle-o" });
    actions.push({ name: "停止医嘱", action: "stop", icon: "pause-circle-o", color: "#ee0a24" });
  }

  actions.push({ name: "查看详情", action: "view", icon: "eye-o" });

  if (order.status === "PENDING") {
    actions.push({ name: "删除", action: "delete", icon: "delete-o", color: "#ee0a24" });
  }

  return actions;
};

// 处理操作
const handleAction = (action: { action: string }) => {
  switch (action.action) {
    case "execute":
      emit("execute");
      break;
    case "stop":
      emit("stop");
      break;
    case "view":
      router.push(`/orders/${props.order.id}`);
      break;
    case "delete":
      emit("delete");
      break;
  }
  showActionSheet.value = false;
};
</script>

<style scoped>
.order-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.order-card :deep(.van-cell-group__title) {
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 500;
}
</style>
