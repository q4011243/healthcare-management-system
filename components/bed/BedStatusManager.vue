<template>
  <div class="bed-status-manager">
    <!-- 状态切换区域 -->
    <div class="status-switch">
      <EnumRadioGroup v-model="currentStatus" :enumName="'BedStatus'" />
    </div>

    <!-- 状态相关操作 -->
    <div class="status-actions">
      <template v-if="currentStatus === BedStatus.MAINTENANCE">
        <van-field
          v-model="maintenanceReason"
          label="维护原因"
          type="textarea"
          rows="2"
          placeholder="请输入维护原因" />
        <van-field
          v-model="estimatedDuration"
          label="预计时长"
          type="digit"
          placeholder="请输入预计维护时长(小时)" />
      </template>

      <template v-if="currentStatus === BedStatus.CLEANING">
        <van-field v-model="cleaningNote" label="清洁备注" placeholder="请输入清洁相关备注" />
      </template>
    </div>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <van-button type="primary" block :loading="loading" @click="handleStatusUpdate">
        确认更新
      </van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { BedStatus } from "~/types/enums/enums";
import { useBedStore } from "@/stores/bedStore";
import { showToast } from "vant";
import type { Bed } from "~/types/models/ward";

const props = defineProps<{
  bed: Bed;
}>();

const emit = defineEmits<{
  (e: "status-updated", status: BedStatus): void;
}>();

const bedStore = useBedStore();
const loading = ref(false);
const currentStatus = ref(props.bed.status);
const maintenanceReason = ref(props.bed.maintenanceInfo?.reason);
const estimatedDuration = ref(props.bed.maintenanceInfo?.estimatedDuration);
const cleaningNote = ref(props.bed.cleaningNote);

// 处理状态更新
const handleStatusUpdate = async () => {
  try {
    loading.value = true;
    if (!props.bed.id) return;

    await bedStore.updateBedStatus(props.bed.id, currentStatus.value, {
      maintenanceInfo:
        currentStatus.value === BedStatus.MAINTENANCE
          ? {
              reason: maintenanceReason.value,
              estimatedDuration: Number(estimatedDuration.value)
            }
          : undefined,
      cleaningNote: currentStatus.value === BedStatus.CLEANING ? cleaningNote.value : undefined
    });

    emit("status-updated", currentStatus.value);
    showToast("状态更新成功");
  } catch (error) {
    console.error("更新床位状态失败:", error);
    showToast("状态更新失败");
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.bed-status-manager {
  padding: 16px;
}

.status-switch {
  margin-bottom: 16px;
}

.status-actions {
  margin: 16px 0;
}

.action-buttons {
  margin-top: 24px;
}
</style>
