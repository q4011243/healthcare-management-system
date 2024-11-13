<script setup lang="ts">
import { Cell, CellGroup } from "vant";
import { useEnum } from "~/types/enums/metadata";
import type { Order } from "~/types/models/order";
const { getLabel } = useEnum();

const props = defineProps<{
  order: Order;
}>();

const formatDate = (date: Date) => {
  return new Date(date).toLocaleString();
};
</script>

<template>
  <div class="bg-gray-50">
    <!-- 头部状态展示 -->
    <div class="relative mb-4 bg-white p-6 shadow-sm">
      <div class="absolute right-4 top-4">
        <EnumTag :value="order.status" enum-name="OrderStatus" />
      </div>
      <h1 class="mb-3 text-xl font-semibold text-gray-800">医嘱详情</h1>
      <div class="flex items-center text-sm text-gray-500">
        <van-icon name="clock-o" class="mr-1" />
        <span>创建时间：{{ formatDate(order.createdAt) }}</span>
      </div>
    </div>

    <!-- 医嘱基本信息 -->
    <CellGroup title="基本信息" class="mb-4 overflow-hidden rounded-lg" inset>
      <Cell title="医嘱类型" :value="getLabel('OrderType', order.type)" icon="label-o" />
      <Cell title="医嘱内容" :value="order.content" icon="description" />
      <Cell title="开始时间" :value="formatDate(order.startTime)" icon="play-circle-o" />
      <Cell
        v-if="order.endTime"
        title="结束时间"
        :value="formatDate(order.endTime)"
        icon="stop-circle-o" />
      <Cell v-if="order.frequency" title="执行频率" :value="order.frequency" icon="replay" />
    </CellGroup>

    <!-- 审核信息 -->
    <CellGroup
      v-if="order.reviewerId"
      title="审核信息"
      class="mb-4 overflow-hidden rounded-lg"
      inset>
      <Cell
        title="审核时间"
        :value="order.reviewTime ? formatDate(order.reviewTime) : ''"
        icon="certificate" />
      <Cell v-if="order.reviewNotes" title="审核意见" :value="order.reviewNotes" icon="comment-o" />
    </CellGroup>

    <!-- 备注信息 -->
    <CellGroup v-if="order.notes" title="备注说明" class="overflow-hidden rounded-lg" inset>
      <Cell :value="order.notes" icon="notes-o" class="whitespace-pre-wrap" />
    </CellGroup>
  </div>
</template>

<style scoped>
:deep(.van-cell-group__title) {
  padding: 8px 16px;
  color: #666;
  font-weight: 500;
}

:deep(.van-cell) {
  align-items: center;
  padding: 16px;
}

:deep(.van-tag) {
  padding: 4px 12px;
  font-size: 14px;
}

:deep(.van-cell__title) {
  flex: none;
  width: 80px;
  color: #666;
}

:deep(.van-cell__value) {
  color: #333;
  font-weight: 500;
}
</style>
