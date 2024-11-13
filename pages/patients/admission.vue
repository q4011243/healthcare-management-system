<template>
  <div class="min-h-screen bg-gray-50">
    <van-nav-bar
      title="入院登记"
      left-arrow
      class="sticky top-0 z-10 shadow-sm"
      @click-left="router.back()" />

    <div class="p-4">
      <van-form @submit="onSubmit">
        <!-- 基本信息 -->
        <van-cell-group inset class="mb-4 rounded-lg">
          <van-field
            v-model="formData.name"
            name="name"
            label="姓名"
            placeholder="请输入患者姓名"
            :rules="[{ required: true, message: '请输入姓名' }]" />
          <van-field
            v-model="formData.age"
            type="number"
            name="age"
            label="年龄"
            placeholder="请输入年龄"
            :rules="[{ required: true, message: '请输入年龄' }]" />
          <van-field name="gender" label="性别">
            <template #input>
              <van-radio-group v-model="formData.gender" direction="horizontal">
                <van-radio :name="Gender.MALE">男</van-radio>
                <van-radio :name="Gender.FEMALE">女</van-radio>
              </van-radio-group>
            </template>
          </van-field>
          <van-field
            v-model="formData.idCard"
            name="idCard"
            label="身份证号"
            placeholder="请输入身份证号"
            :rules="[{ required: true, message: '请输入身份证号' }]" />
          <van-field
            v-model="formData.phone"
            name="phone"
            label="联系电话"
            placeholder="请输入联系电话"
            :rules="[{ required: true, message: '请输入联系电话' }]" />
        </van-cell-group>

        <!-- 入院信息 -->
        <van-cell-group inset class="mb-4 rounded-lg">
          <van-field
            v-model="formData.diagnosis"
            name="diagnosis"
            label="初步诊断"
            type="textarea"
            placeholder="请输入初步诊断"
            :rules="[{ required: true, message: '请输入初步诊断' }]" />
          <van-field
            v-model="formData.notes"
            name="notes"
            label="备注"
            type="textarea"
            placeholder="请输入备注信息" />
        </van-cell-group>

        <!-- 紧急联系人 -->
        <van-cell-group inset class="mb-4 rounded-lg">
          <van-field
            v-model="formData.contactName"
            name="contactName"
            label="紧急联系人"
            placeholder="请输入紧急联系人姓名"
            :rules="[{ required: true, message: '请输入紧急联系人' }]" />
          <van-field
            v-model="formData.contactPhone"
            name="contactPhone"
            label="联系人电话"
            placeholder="请输入紧急联系人电话"
            :rules="[{ required: true, message: '请输入紧急联系人电话' }]" />
        </van-cell-group>

        <!-- 病房分配 -->
        <van-cell-group inset class="mb-4 rounded-lg">
          <popup-select
            v-model="selectedWardId"
            label="病区"
            placeholder="请选择病区"
            :options="wardStore.wardOptions"
            :rules="[{ required: true, message: '请选择病区' }]"
            @update:modelValue="handleWardChange" />
          <popup-select
            v-model="selectedRoomId"
            label="病房"
            placeholder="请选择病房"
            :options="roomStore.availableRoomOptions(selectedWardId)"
            :rules="[{ required: true, message: '请选择病房' }]"
            :disabled="!selectedWardId"
            @update:modelValue="handleRoomChange" />
          <popup-select
            v-model="selectedBedId"
            label="床位"
            placeholder="请选择床位"
            :options="bedStore.availableBedOptions(selectedRoomId)"
            :rules="[{ required: true, message: '请选择床位' }]"
            :disabled="!selectedRoomId" />
        </van-cell-group>

        <div class="mt-8">
          <van-button round block type="primary" native-type="submit">提交入院</van-button>
        </div>
      </van-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import PopupSelect from "~/components/common/PopupSelect.vue";
import { useRouter } from "vue-router";
import { showSuccessToast, showFailToast } from "vant";
import type { Patient } from "~/types/models/patient";
import { Gender } from "~/types/enums/enums";
import { PatientStatus } from "~/types/models/patient";
import { useWardStore } from "~/stores/wardStore";
import { useRoomStore } from "~/stores/roomStore";
import { useBedStore } from "~/stores/bedStore";

const router = useRouter();
const patientStore = usePatientStore();
const wardStore = useWardStore();
const roomStore = useRoomStore();
const bedStore = useBedStore();

const formData = ref<Partial<Patient>>({
  name: "",
  age: 0,
  gender: Gender.MALE,
  idCard: "",
  phone: "",
  diagnosis: "",
  notes: "",
  status: PatientStatus.ADMITTED,
  contactName: "",
  contactPhone: "",
  admissionDate: new Date()
});

// 选择数据
const selectedWardId = ref<number>();
const selectedRoomId = ref<number>();
const selectedBedId = ref<number>();

// 处理选择变化
const handleWardChange = async (wardId: number) => {
  selectedRoomId.value = undefined;
  selectedBedId.value = undefined;
  await roomStore.fetchRoomsByWardId(wardId);
};

const handleRoomChange = async (roomId: number) => {
  selectedBedId.value = undefined;
  await bedStore.fetchBedsByRoomId(roomId);
};

const onSubmit = async () => {
  if (!selectedBedId.value || !selectedRoomId.value) {
    showFailToast("请选择床位");
    return;
  }

  try {
    const patientData = {
      ...formData.value,
      roomId: selectedRoomId.value,
      bedId: selectedBedId.value
    };

    const patient = await patientStore.createPatient(
      patientData as Omit<Patient, "id" | "createdAt" | "updatedAt">
    );

    // 创建床位分配记录
    await bedStore.assignBed(selectedBedId.value, {
      bedId: selectedBedId.value,
      patientId: patient?.id,
      patientName: patient?.name,
      admissionDate: new Date(),
      assignmentType: "ADMISSION",
      note: formData.value.notes
    });

    showSuccessToast("入院登记成功");
    router.push(`/patients/${patient?.id}`);
  } catch (error) {
    console.error("Failed to create patient:", error);
    showFailToast("入院登记失败");
  }
};

// 初始化加载病区列表
onMounted(async () => {
  await wardStore.fetchAllWards();
});

definePageMeta({
  middleware: "auth",
  title: "入院登记",
  requiresAuth: true
});
</script>
