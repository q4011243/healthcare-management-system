<template>
  <van-popup v-model:show="show" position="bottom" round class="h-[80vh]">
    <div class="flex h-full flex-col">
      <van-nav-bar title="病床转移" left-arrow @click-left="onClose" />

      <van-form @submit="onSubmit" class="flex-1 overflow-auto">
        <van-cell-group inset class="mt-3">
          <van-field v-model="currentBedInfo" label="当前床位" readonly />

          <popup-select
            v-model="selectedWardId"
            label="病区"
            placeholder="请选择病区"
            :options="wardStore.wardOptions"
            :rules="[{ required: true, message: '请选择病区' }]"
            @update:modelValue="onWardSelect" />
          <popup-select
            v-model="selectedRoomId"
            label="病房"
            placeholder="请选择病房"
            :options="roomStore.availableRoomOptions(selectedWardId)"
            :rules="[{ required: true, message: '请选择病房' }]"
            :disabled="!selectedWardId"
            @update:modelValue="onRoomSelect" />
          <popup-select
            v-model="selectedBedId"
            label="床位"
            placeholder="请选择床位"
            :options="bedStore.availableBedOptions(selectedRoomId)"
            :rules="[{ required: true, message: '请选择床位' }]"
            :disabled="!selectedRoomId" />

          <!-- 转床原因 -->
          <van-field
            v-model="formData.note"
            label="转床原因"
            type="textarea"
            rows="2"
            placeholder="请输入转床原因" />
        </van-cell-group>

        <div class="p-4">
          <van-button round block type="primary" native-type="submit">确认转床</van-button>
        </div>
      </van-form>
    </div>
  </van-popup>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { showSuccessToast, showFailToast } from "vant";
import { useWardStore } from "~/stores/wardStore";
import { useBedStore } from "~/stores/bedStore";
import type { Patient } from "~/types/models/patient";
import type { Bed } from "~/types/models/ward";

const props = defineProps<{
  patient: Patient;
}>();

const show = defineModel<boolean>("show", { required: true });

const emit = defineEmits<{
  (e: "transfer-complete"): void;
}>();

const wardStore = useWardStore();
const roomStore = useRoomStore();
const bedStore = useBedStore();
const patientStore = usePatientStore();

// 表单数据
const formData = ref({
  note: ""
});

// 选择状态
const selectedWardId = ref<number>();
const selectedRoomId = ref<number>();
const selectedBedId = ref<number>();

// 显示状态

const currentBed = ref<Bed>();

// 计算属性
const currentBedInfo = computed(() => {
  if (!props.patient.bedId) return "未分配床位";
  return `${currentBed.value?.ward?.name || ""} ${currentBed.value?.room?.name || ""} ${currentBed.value?.name || ""}`;
});

// 选择处理
const onWardSelect = (wardId: number | undefined) => {
  selectedRoomId.value = undefined;
  selectedBedId.value = undefined;
  if (wardId) {
    roomStore.fetchRoomsByWardId(wardId);
  }
};

const onRoomSelect = (roomId: number | undefined) => {
  selectedBedId.value = undefined;
  if (roomId) {
    bedStore.fetchBedsByRoomId(roomId);
  }
};
// 提交处理
const onSubmit = async () => {
  try {
    if (!selectedBedId.value) {
      showFailToast("请选择目标床位");
      return;
    }

    // 创建床位释放记录
    if (props.patient.bedId) {
      await bedStore.releaseBed(props.patient.bedId);
    }

    // 创建新的床位分配记录
    await bedStore.assignBed(selectedBedId.value, {
      bedId: selectedBedId.value,
      patientId: props.patient.id,
      patientName: props.patient.name,
      admissionDate: new Date(),
      assignmentType: "TRANSFER",
      note: formData.value.note
    });

    // 更新患者床位信息
    if (props.patient.id) {
      await patientStore.updatePatient(props.patient.id, {
        bedId: selectedBedId.value
      });
    }

    showSuccessToast("转床成功");
    emit("transfer-complete");
    show.value = false;
  } catch (error: any) {
    showFailToast("转床失败：" + error.message);
  }
};

const onClose = () => {
  show.value = false;
};

onMounted(async () => {
  await wardStore.fetchAllWards();
  currentBed.value = await bedStore.getBedById(props.patient.bedId);
});
</script>
