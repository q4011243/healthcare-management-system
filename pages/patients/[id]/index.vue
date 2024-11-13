<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 顶部导航栏 -->
    <van-nav-bar
      fixed
      placeholder
      :title="patient?.name"
      left-arrow
      class="sticky top-0 z-10 shadow-sm"
      @click-left="router.back()" />

    <div class="space-y-4 p-4">
      <!-- 状态标签 -->
      <div class="flex items-center justify-between rounded-lg bg-white p-4 shadow-sm">
        <span class="text-gray-600">当前状态</span>
        <van-tag
          size="large"
          :type="getType('PatientStatus', getPatientStatus(patient?.status)) as TagType">
          {{ getLabel("PatientStatus", getPatientStatus(patient?.status)) }}
        </van-tag>
      </div>

      <!-- 使用 van-collapse 包裹所有折叠面板 -->
      <van-collapse v-model="activeNames" :border="false">
        <!-- 基本信息卡片 -->
        <van-collapse-item
          title="基本信息"
          name="basicInfo"
          class="mb-3 overflow-hidden rounded-lg shadow-sm">
          <van-cell-group :border="false">
            <van-cell title="性别" :value="getLabel('Gender', getPatientGender(patient?.gender))" />
            <van-cell title="年龄" :value="`${patient?.age || '-'}岁`" />
            <van-cell title="入院日期" :value="formatDate(patient?.createdAt)" />
            <van-cell title="病房" :value="getRoomName(patient)" />
            <van-cell title="床位" :value="getBedName(patient)" />
          </van-cell-group>
        </van-collapse-item>

        <!-- 联系信息卡片 -->
        <van-collapse-item
          title="联系信息"
          name="contactInfo"
          class="mb-3 overflow-hidden rounded-lg shadow-sm">
          <van-cell-group :border="false">
            <van-cell title="联系电话" :value="patient?.phone || '-'" />
            <van-cell title="紧急联系人" :value="patient?.contactName || '-'" />
            <van-cell title="联系人电话" :value="patient?.contactPhone || '-'" />
          </van-cell-group>
        </van-collapse-item>

        <!-- 病历记录 -->
        <van-collapse-item
          title="病情记录"
          name="medicalRecords"
          class="mb-3 overflow-hidden rounded-lg shadow-sm">
          <medical-record-list :patient-id="Number(route.params.id)" :show-title="false" />
        </van-collapse-item>

        <!-- 护理记录 -->
        <van-collapse-item
          title="护理记录"
          name="nursingRecords"
          class="mb-3 overflow-hidden rounded-lg shadow-sm">
          <van-cell-group :border="false">
            <van-cell
              v-for="record in nursingStore.records.slice(0, 3)"
              :key="record.id"
              :title="getLabel('NursingType', record.type)"
              :label="record.description"
              :value="formatDateCN(record.performedAt)" />
            <van-cell title="查看更多" is-link :to="`/patients/${patient?.id}/nursing`" />
          </van-cell-group>
        </van-collapse-item>

        <!-- 生命体征卡片 -->
        <van-collapse-item
          title="生命体征"
          name="vitalSigns"
          class="mb-3 overflow-hidden rounded-lg shadow-sm">
          <van-cell-group :border="false">
            <van-cell
              title="最新记录"
              :value="formatDate(latestVitalSigns?.recordedAt)"
              is-link
              :to="`/patients/${patient?.id}/vital-signs`">
              <template #label>
                <div class="flex gap-2">
                  <van-tag v-if="latestVitalSigns?.temperature" type="primary">
                    {{ latestVitalSigns.temperature }}℃
                  </van-tag>
                  <van-tag
                    v-if="
                      latestVitalSigns?.bloodPressureSystolic &&
                      latestVitalSigns?.bloodPressureDiastolic
                    "
                    type="success">
                    {{ latestVitalSigns.bloodPressureSystolic }}/{{
                      latestVitalSigns.bloodPressureDiastolic
                    }}
                  </van-tag>
                  <span v-if="!latestVitalSigns" class="text-gray-400">暂无记录</span>
                </div>
              </template>
            </van-cell>
          </van-cell-group>
        </van-collapse-item>
        <!-- 用药记录 -->
        <van-collapse-item
          title="用药记录"
          name="medicationRecords"
          class="mb-3 overflow-hidden rounded-lg shadow-sm">
          <van-cell-group :border="false">
            <van-cell
              v-for="record in medicationStore.records.slice(0, 3)"
              :key="record.id"
              :title="record.medicationName"
              :label="`${record.dosage} | ${getLabel('MedicationFrequency', record.frequency)}`"
              :value="formatDateCN(record.administeredAt)">
              <template #label>
                <van-tag :type="record.status === MedicationStatus.ACTIVE ? 'primary' : 'success'">
                  {{ getLabel("MedicationStatus", record.status) }}
                </van-tag>
              </template>
            </van-cell>
            <van-cell title="查看更多" is-link :to="`/patients/${patient?.id}/medication`" />
          </van-cell-group>
        </van-collapse-item>

        <!-- 快捷操作按钮组 -->
        <van-collapse-item
          title="快捷操作"
          name="quickActions"
          class="overflow-hidden rounded-lg shadow-sm">
          <van-grid :border="false" :column-num="3" :gutter="5" class="p-4">
            <van-grid-item class="rounded-lg bg-gray-50">
              <div class="flex flex-col items-center space-y-2" @click="showTransferForm = true">
                <van-icon name="exchange" size="24" class="text-primary" />
                <span class="text-sm text-gray-700">转床</span>
              </div>
            </van-grid-item>
            <van-grid-item
              v-for="action in quickActions"
              :key="action.name"
              class="rounded-lg bg-gray-50">
              <div class="flex flex-col items-center space-y-2" @click="handleAction(action.type)">
                <van-icon
                  :name="action.icon"
                  size="24"
                  :class="action.danger ? 'text-red-500' : 'text-primary'" />
                <span class="text-sm text-gray-700">{{ action.name }}</span>
              </div>
            </van-grid-item>
          </van-grid>
        </van-collapse-item>
      </van-collapse>
    </div>

    <!-- 添加转床表单组件 -->
    <TransferBedForm
      v-if="patient"
      v-model:show="showTransferForm"
      :patient="patient"
      @transfer-complete="refreshPatient" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { TagType } from "vant";
import { usePatientStore } from "~/stores/patientStore";
import { useEnum } from "~/types/enums/metadata";
import type { Patient, PatientStatus } from "~/types/models/patient";
import type { Gender } from "~/types/enums/enums";
import { showDialog, showSuccessToast, showFailToast } from "vant";
import { useVitalSignsStore } from "~/stores/vitalSignsStore";
import type { VitalSigns } from "~/types/models/vitalSigns";
import { MedicationStatus } from "~/types/models/medication";
import TransferBedForm from "~/components/patient/TransferBedForm.vue";

const route = useRoute();
const router = useRouter();
const patientStore = usePatientStore();
const { getLabel, getType } = useEnum();

const patient = ref<Patient | null>(null);

// 快捷操作按钮配置
const quickActions = [
  // { name: "查看病历", icon: "description", type: "viewRecords" },
  { name: "开具医嘱", icon: "edit", type: "newOrder" },
  // { name: "转床", icon: "exchange", type: "transfer" },
  { name: "出院", icon: "cross", type: "discharge" },
  { name: "编辑信息", icon: "edit", type: "edit" },
  { name: "删除", icon: "delete-o", type: "delete", danger: true }
];

// 处理快捷操作
const handleAction = async (type: string) => {
  switch (type) {
    case "viewRecords":
      router.push(`/patients/${patient.value?.id}/records`);
      break;
    case "newOrder":
      router.push(`/order/new?patientId=${patient.value?.id}`);
      break;
    case "transfer":
      router.push(`/patients/${patient.value?.id}/transfer`);
      break;
    case "discharge":
      showDialog({
        title: "确认出院",
        message: `确定为患者 ${patient.value?.name} 办理出院手续吗？`,
        showCancelButton: true
      }).then(async () => {
        try {
          if (!patient.value?.id) return;
          await patientStore.dischargePatient(patient.value.id);
          showSuccessToast("出院办理成功");
          // 刷新患者信息
          const result = await patientStore.fetchPatientById(patient.value.id);
          patient.value = result || null;
        } catch (error) {
          showFailToast((error as Error).message);
        }
      });
      break;
    case "edit":
      router.push(`/patients/${patient.value?.id}/edit`);
      break;
    case "delete":
      showDialog({
        title: "确认删除",
        message: `确定删除患者 ${patient.value?.name} 吗？`,
        showCancelButton: true
      }).then(async () => {
        try {
          if (!patient.value?.id) return;
          await patientStore.deletePatient(patient.value.id);
          showSuccessToast("删除成功");
          router.back();
        } catch (error) {
          showFailToast((error as Error).message);
        }
      });
      break;
  }
};

// 类型转换辅助函数
const getPatientStatus = (status: PatientStatus | undefined): string => {
  return status ? String(status) : "";
};

const getPatientGender = (gender: Gender | undefined): string => {
  return gender ? String(gender) : "";
};

// 获取房间和床位信息
const getRoomName = (patient: Patient | null): string => {
  return patient?.room?.name || "-";
};

const getBedName = (patient: Patient | null): string => {
  return patient?.bed?.name || "-";
};

// 替换 cardStates 为 activeNames
const activeNames = ref([
  "basicInfo",
  "contactInfo",
  // "medicalRecords",
  // "vitalSigns"
  "quickActions"
]);

// Add latestVitalSigns ref
const latestVitalSigns = ref<VitalSigns | null>(null);
const vitalSignsStore = useVitalSignsStore();
const nursingStore = useNursingStore();
const medicationStore = useMedicationStore();
// Update onMounted to fetch vital signs
onMounted(async () => {
  await onLoad();
});

const onLoad = async () => {
  const id = Number(route.params.id);
  if (!id) return;

  const result = await patientStore.fetchPatientById(id);
  patient.value = result || null;

  latestVitalSigns.value = await vitalSignsStore.fetchLastestVitalSigns(id);

  await nursingStore.fetchNursingRecords(id);
  await medicationStore.fetchMedicationRecords(id);
};

const showTransferForm = ref(false);

// 刷新病人信息
const refreshPatient = async () => {
  if (route.params.id) {
    await onLoad();
  }
};
</script>

<style scoped>
/* 自定义 van-collapse 样式 */
:deep(.van-collapse-item) {
  background-color: white;
}

:deep(.van-collapse-item__title) {
  font-size: 1.125rem;
  font-weight: 500;
  color: #111827;
  padding: 1rem;
}

:deep(.van-collapse-item__content) {
  padding: 0;
}

/* 保持网格项的动画效果 */
.van-grid-item {
  transition: all 0.2s ease;
}

.van-grid-item:active {
  transform: scale(0.95);
}
</style>
