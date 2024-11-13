<template>
  <div class="medical-record-list">
    <template v-if="showTitle">
      <van-cell title="病历记录" size="large" :border="false" />
    </template>

    <van-empty
      v-if="!records.length"
      description="暂无病历记录"
      image="search"
      class="rounded-lg bg-white p-8" />

    <van-cell-group v-else inset class="medical-records">
      <van-cell v-for="record in records" :key="record.id" class="record-item">
        <template #default>
          <div class="record-content">
            <div class="mb-3 flex items-center justify-between">
              <span class="text-[14px] text-gray-500">
                {{ formatDate(record.createdAt) }}
              </span>
              <van-tag
                :type="getType('MedicalRecordType', record.type) as TagType"
                round
                size="medium">
                {{ getLabel("MedicalRecordType", record.type) }}
              </van-tag>
            </div>

            <div class="mb-2 text-left text-[14px] leading-6 text-gray-700">
              {{ record.content }}
            </div>

            <div class="text-[13px] text-gray-500">记录医生：{{ record.doctorName }}</div>
          </div>
        </template>
      </van-cell>
    </van-cell-group>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useEnum } from "~/types/enums/metadata";
import { useMedicalRecordStore } from "~/stores/medicalRecordStore";
import { formatDate } from "~/utils/date";
import type { MedicalRecord } from "~/types/models/medicalRecord";
import type { TagType } from "vant";

const props = withDefaults(
  defineProps<{
    patientId: number;
    showTitle?: boolean;
  }>(),
  {
    showTitle: true
  }
);

const { getLabel, getType } = useEnum();
const medicalRecordStore = useMedicalRecordStore();
const records = ref<MedicalRecord[]>([]);

onMounted(async () => {
  try {
    const result = await medicalRecordStore.fetchRecordsByPatientId(props.patientId);
    records.value = result;
  } catch (error) {
    console.error("Failed to fetch medical records:", error);
  }
});
</script>

<style scoped>
.medical-record-list {
  background-color: #f5f5f5;
}

.medical-records {
  background: #fff;
  margin: 0;
}

.record-item {
  padding: 16px;
}

.record-item :deep(.van-cell__value) {
  margin: 0;
}

.record-content {
  width: 100%;
}

/* 确保最后一个 cell 没有边框 */
.record-item:last-child {
  border-bottom: none;
}

/* 调整标签样式 */
:deep(.van-tag) {
  padding: 0 12px;
  height: 24px;
  line-height: 24px;
}
</style>
