<template>
  <van-popup v-model:show="show" position="bottom" round :style="{ maxHeight: '70vh' }">
    <div class="patient-picker">
      <!-- 搜索框 -->
      <van-search v-model="searchText" placeholder="搜索患者姓名或床号" @search="handleSearch" />

      <!-- 患者列表 -->
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="loadMore">
        <van-cell-group>
          <van-cell
            v-for="patient in patients"
            :key="patient.id"
            :title="patient.name"
            :label="`${getLabel('Gender', patient.gender)} | ${patient.age}岁 | 床号：${patient.bedId}`"
            clickable
            @click="handleSelect(patient)">
            <template #right-icon>
              <EnumTag enum-name="PatientStatus" :value="patient.status" />
            </template>
          </van-cell>
        </van-cell-group>
      </van-list>
    </div>
  </van-popup>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { usePatientStore } from "~/stores/patientStore";
import { useEnum } from "~/types/enums/metadata";
import type { Patient } from "~/types/models/patient";
const { getLabel } = useEnum();

const show = defineModel<boolean>("show", { required: true });
const emit = defineEmits<{
  (e: "select", patient: Patient): void;
}>();

const patientStore = usePatientStore();
const searchText = ref("");
const loading = ref(false);
const finished = ref(false);
const page = ref(1);
const patients = ref<Patient[]>([]);

// 加载患者数据
const loadMore = async () => {
  if (loading.value) return;
  loading.value = true;
  try {
    const { patients: newPatients } = await patientStore.fetchPatients({
      page: page.value,
      search: searchText.value,
      status: "IN_HOSPITAL"
    });
    patients.value.push(...newPatients);
    if (newPatients.length < 20) {
      finished.value = true;
    } else {
      page.value++;
    }
  } catch (error) {
    console.error("加载患者失败:", error);
  } finally {
    loading.value = false;
  }
};

// 搜索处理
const handleSearch = () => {
  patients.value = [];
  page.value = 1;
  finished.value = false;
  loadMore();
};

// 选择患者
const handleSelect = (patient: Patient) => {
  emit("select", patient);
  show.value = false;
};

// 监听显示状态
watch(
  () => show.value,
  (newVal) => {
    if (newVal && patients.value.length === 0) {
      loadMore();
    }
  }
);
</script>

<style scoped>
.patient-picker {
  max-height: 70vh;
  overflow-y: auto;
}
</style>
