<script setup lang="ts">
import { ref, onMounted } from "vue";
import { Cell, CellGroup, Empty } from "vant";
import type { OrderExecution } from "~/types/models/order";
import { useOrderStore } from "~/stores/orderStore";

const props = defineProps<{
  orderId: number;
}>();

const orderStore = useOrderStore();
const executions = ref<OrderExecution[]>([]);
const loading = ref(true);

onMounted(async () => {
  loading.value = true;
  executions.value = await orderStore.fetchOrderExecutions(props.orderId);
  loading.value = false;
});

const formatDate = (date: Date) => {
  return new Date(date).toLocaleString();
};
</script>

<template>
  <div class="mt-4">
    <h2 class="mb-2 px-4 text-lg font-medium">执行记录</h2>

    <div v-if="loading" class="py-8 text-center">
      <van-loading type="spinner" />
    </div>

    <Empty v-else-if="!executions.length" description="暂无执行记录" />

    <CellGroup v-else inset class="rounded-lg">
      <Cell
        v-for="execution in executions"
        :key="execution.id"
        :title="formatDate(execution.executionTime)"
        :label="execution.nurse?.name">
        <template #value>
          <EnumTag :value="execution.abnormal" enum-name="OrderExecutionAbnormal" />
        </template>
        <template #label>
          <p v-if="execution.notes" class="mt-1 text-gray-500">
            {{ execution.notes }}
          </p>
          <p v-if="execution.abnormal" class="mt-1 text-red-500">
            {{ execution.abnormalDesc }}
          </p>
        </template>
      </Cell>
    </CellGroup>
  </div>
</template>
