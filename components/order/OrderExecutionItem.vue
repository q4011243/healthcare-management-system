<template>
  <div class="execution-item mb-4 rounded-lg bg-white p-4 shadow-sm">
    <div class="flex items-center justify-between">
      <span class="text-sm text-gray-500">
        {{ formatTime(execution.executionTime) }}
      </span>
      <EnumTag :value="execution.status" enum-name="OrderExecutionAbnormal" />
    </div>

    <div class="mt-2">
      <p class="text-sm">{{ execution.order?.content }}</p>
      <p class="mt-1 text-xs text-gray-500">
        患者：{{ execution.order?.patient?.name }} ({{ execution.order?.patient?.bed?.name }})
      </p>
    </div>

    <div v-if="execution.notes" class="mt-2 text-xs text-gray-500">备注：{{ execution.notes }}</div>

    <div v-if="execution.abnormal === 'ABNORMAL'" class="mt-2 text-xs text-red-500">
      异常说明：{{ execution.abnormalDesc }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatTime } from "~/utils/date";
import type { OrderExecution } from "~/types/models/order";

defineProps<{
  execution: OrderExecution;
}>();
</script>

<style></style>
