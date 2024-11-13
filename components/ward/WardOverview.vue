<!-- components/ward/WardOverview.vue -->
<template>
  <div class="ward-overview p-4">
    <!-- 使用率趋势图 -->
    <div class="mb-4 rounded-lg bg-white p-4">
      <div class="mb-4 text-base font-medium">床位使用趋势</div>
      <van-empty v-if="!chartData.length" description="暂无数据" />
      <!-- 这里可以使用echarts等图表库 -->
    </div>

    <!-- 待处理事项 -->
    <div class="rounded-lg bg-white p-4">
      <div class="mb-4 text-base font-medium">待处理事项</div>
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="onLoad">
        <van-cell v-for="item in todoList" :key="item.id">
          <template #title>
            <div class="flex items-center">
              <van-tag :type="item.type" class="mr-2">{{ item.tag }}</van-tag>
              <span>{{ item.title }}</span>
            </div>
          </template>
          <template #label>
            <div class="mt-1 text-xs text-gray-500">{{ item.time }}</div>
          </template>
          <template #right-icon>
            <van-icon name="arrow" class="text-gray-400" />
          </template>
        </van-cell>
      </van-list>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
  wardId: number;
}>();

// 图表数据
const chartData = ref([]);

// 列表数据
const loading = ref(false);
const finished = ref(false);
const todoList = ref([
  {
    id: 1,
    type: "primary",
    tag: "清洁",
    title: "508房间需要进行日常清洁",
    time: "2024-01-20 10:00"
  },
  {
    id: 2,
    type: "warning",
    tag: "维护",
    title: "510房间呼叫器需要维修",
    time: "2024-01-20 09:30"
  },
  {
    id: 3,
    type: "success",
    tag: "入住",
    title: "新病人待入住503床位",
    time: "2024-01-20 09:00"
  }
]);

// 加载更多
const onLoad = () => {
  // 模拟异步加载
  setTimeout(() => {
    loading.value = false;
    finished.value = true;
  }, 1000);
};
</script>

<style></style>
