<template>
  <div class="ward-card rounded-lg bg-white p-4 shadow-sm transition-all hover:shadow-md">
    <!-- 病区头部信息 -->
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-2">
        <span class="text-lg font-medium">{{ ward.name }}</span>
        <van-tag :type="ward.status === 'active' ? 'success' : 'warning'">
          {{ ward.status === "active" ? "运行中" : "已停用" }}
        </van-tag>
      </div>
      <div class="flex items-center space-x-2">
        <van-button size="small" icon="setting-o" @click="showActions" />
      </div>
    </div>

    <!-- 病区基本信息 -->
    <div class="mt-3 space-y-2">
      <div class="flex items-center text-sm text-gray-600">
        <van-icon name="location" class="mr-1" />
        <span>{{ ward.building }} {{ ward.floor }}层</span>
        <span class="mx-2">|</span>
        <span>{{ ward.department }}</span>
      </div>

      <!-- 统计信息 -->
      <div class="grid grid-cols-2 gap-4">
        <div class="rounded-lg bg-gray-50 p-3">
          <div class="text-sm text-gray-500">房间数</div>
          <div class="mt-1 text-lg font-medium">{{ ward.totalRooms }}</div>
        </div>
        <div class="rounded-lg bg-gray-50 p-3">
          <div class="text-sm text-gray-500">床位数</div>
          <div class="mt-1 text-lg font-medium">{{ ward.totalBeds }}</div>
        </div>
      </div>
    </div>

    <!-- 底部操作区 -->
    <div class="mt-4 flex items-center justify-between border-t pt-3">
      <span class="text-sm text-gray-500">编号：{{ ward.code }}</span>
      <div class="flex space-x-2">
        <van-button size="small" icon="edit" plain @click="$emit('edit', ward)">编辑</van-button>
        <van-button size="small" type="primary" icon="arrow" @click="$emit('view-rooms', ward)">
          查看房间
        </van-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { showActionSheet } from "vant";
import type { Ward, WardStatus } from "~/types/models/ward";

const props = defineProps<{
  ward: Ward;
}>();

const emit = defineEmits<{
  (e: "edit", ward: Ward): void;
  (e: "view-rooms", ward: Ward): void;
  (e: "change-status", ward: Ward, status: WardStatus): void;
}>();

const showActions = () => {
  showActionSheet({
    actions: [{ name: props.ward.status === "active" ? "停用病区" : "启用病区", color: "#ee0a24" }],
    cancel: "取消",
    onSelect: (action) => {
      const newStatus = props.ward.status === "active" ? WardStatus.INACTIVE : WardStatus.ACTIVE;
      emit("change-status", props.ward, newStatus);
    }
  });
};
</script>
