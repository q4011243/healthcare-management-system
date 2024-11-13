<template>
  <div class="create-order-page">
    <van-nav-bar title="开具医嘱" left-text="返回" left-arrow @click-left="router.back()" />
    <van-form @submit="onSubmit">
      <!-- 基本信息 -->
      <van-cell-group inset title="基本信息">
        <van-field
          v-model="selectedPatientName"
          name="patientId"
          label="患者"
          placeholder="请选择患者"
          readonly
          is-link
          :rules="[{ required: true, message: '请选择患者' }]"
          @click="showPatientPicker = true" />
        <PopupSelect
          v-model="formData.type"
          label="医嘱类型"
          :options="getOptions('OrderType')"
          :rules="[{ required: true, message: '请选择医嘱类型' }]" />
      </van-cell-group>

      <!-- 医嘱内容 -->
      <van-cell-group inset title="医嘱内容" class="mt-4">
        <van-field
          v-model="formData.content"
          name="content"
          label="医嘱内容"
          type="textarea"
          rows="3"
          autosize
          placeholder="请输入医嘱内容"
          :rules="[{ required: true, message: '请输入医嘱内容' }]" />
        <van-field
          v-model="formData.frequency"
          name="frequency"
          label="执行频率"
          placeholder="请输入执行频率"
          :rules="[{ required: true, message: '请输入执行频率' }]" />
      </van-cell-group>

      <!-- 执行时间 -->
      <van-cell-group inset title="执行时间" class="mt-4">
        <DateField
          v-model="formData.startTime"
          name="startTime"
          label="开始时间"
          :rules="[{ required: true, message: '请选择开始时间' }]"
          @click="showStartTimePicker = true" />

        <DateField
          v-model="formData.endTime"
          name="endTime"
          label="结束时间"
          :rules="[{ required: true, message: '请选择结束时间' }]"
          @click="showEndTimePicker = true" />
      </van-cell-group>

      <!-- 备注说明 -->
      <van-cell-group inset title="备注" class="mt-4">
        <van-field
          v-model="formData.notes"
          name="notes"
          type="textarea"
          rows="2"
          autosize
          placeholder="请输入备注说明" />
      </van-cell-group>

      <!-- 提交按钮 -->
      <div class="submit-bar">
        <van-button round block type="primary" native-type="submit" :loading="submitting">
          提交医嘱
        </van-button>
      </div>
    </van-form>

    <!-- 患者选择器 -->
    <PatientPicker v-model:show="showPatientPicker" @select="handlePatientSelect" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { showSuccessToast, showFailToast } from "vant";
import { useOrderStore } from "~/stores/orderStore";
import { OrderStatus, OrderType, type Order } from "~/types/models/order";
import PatientPicker from "~/components/patient/PatientPicker.vue";
import type { Patient } from "~/types/models/patient";
import { useEnum } from "~/types/enums/metadata";
const { getOptions } = useEnum();

const router = useRouter();
const orderStore = useOrderStore();

// 表单数据
const formData = ref({
  patientId: 0,
  type: "",
  content: "",
  frequency: "",
  startTime: new Date(),
  endTime: new Date(),
  notes: ""
});

// 提交状态
const submitting = ref(false);

// 选择器状态
const showTypePicker = ref(false);
const showStartTimePicker = ref(false);
const showEndTimePicker = ref(false);
const showPatientPicker = ref(false);

// 日期选择器配置
const minDate = new Date();
const startDate = computed(() =>
  formData.value.startTime ? new Date(formData.value.startTime) : minDate
);

// 选择器确认处理
const onTypeConfirm = (value: { text: string; value: OrderType }) => {
  formData.value.type = value.value;
  showTypePicker.value = false;
};

const onStartTimeConfirm = (value: Date) => {
  formData.value.startTime = value;
  showStartTimePicker.value = false;
};

const onEndTimeConfirm = (value: Date) => {
  formData.value.endTime = value;
  showEndTimePicker.value = false;
};

const authStore = useAuthStore();
const { user } = storeToRefs(authStore);

const selectedPatientName = ref("");

const handlePatientSelect = (patient: Patient) => {
  if (patient.id) {
    formData.value.patientId = patient.id;
    selectedPatientName.value = patient.name;
  }
};

// 表单提交
const onSubmit = async () => {
  try {
    submitting.value = true;
    await orderStore.createOrder({
      ...formData.value,
      status: OrderStatus.PENDING,
      doctorId: user.value?.id ?? 0
    } as Omit<Order, "id">);
    showSuccessToast("医嘱创建成功");
    router.push("/orders");
  } catch (error) {
    showFailToast("创建失败：" + (error as Error).message);
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.create-order-page {
  min-height: 100vh;
  background-color: var(--van-background);
  padding-bottom: 80px;
}

.submit-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background: white;
  box-shadow: 0 -1px 2px rgba(0, 0, 0, 0.05);
}
</style>
