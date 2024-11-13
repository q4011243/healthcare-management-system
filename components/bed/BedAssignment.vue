<template>
  <div class="bed-assignment">
    <van-dialog
      v-model:show="showDialog"
      title="床位分配"
      :show-cancel-button="true"
      teleport="body"
      @confirm="handleConfirm">
      <van-form @submit="handleConfirm">
        <!-- 患者信息部分 -->
        <van-cell-group inset title="患者信息">
          <van-field
            v-model="form.patientName"
            label="姓名"
            placeholder="请输入患者姓名"
            :rules="[{ required: true, message: '请输入患者姓名' }]" />
          <van-field
            v-model="form.patientId"
            label="住院号"
            placeholder="请输入住院号"
            :rules="[{ required: true, message: '请输入住院号' }]" />
          <van-field
            v-model="computedAdmissionDate"
            label="入院日期"
            readonly
            @click="showDatePicker = true" />
        </van-cell-group>

        <!-- 分配信息部分 -->
        <van-cell-group inset title="分配信息">
          <PopupSelect
            v-model="form.assignmentType"
            label="分配类型"
            :options="assignmentTypes.map((type) => ({ text: type, value: type }))"
            @cancel="showTypePopup = false" />
          <van-field
            v-model="form.note"
            label="备注"
            type="textarea"
            placeholder="请输入分配备注"
            rows="2" />
        </van-cell-group>
      </van-form>

      <!-- 日期选择器 -->
      <DatePickerPopup
        v-model:show="showDatePicker"
        v-model:modelValue="form.admissionDate"
        :min-date="minDate"
        :max-date="maxDate"
        @confirm="onDateConfirm"
        @cancel="showDatePicker = false" />
    </van-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { showToast } from "vant";
import { useBedStore } from "~/stores/bedStore";
import type { BedAssignment } from "~/types/models/ward";

const props = defineProps<{
  bedId: number;
}>();

const showDialog = defineModel<boolean>("show", { required: true });

const emit = defineEmits<{
  (e: "assigned"): void;
}>();

const bedStore = useBedStore();
const showDatePicker = ref(false);
const showTypePopup = ref(false);

const minDate = new Date();
const maxDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

const assignmentTypes = ["入院分配", "临时调整", "紧急调配"];

const form = reactive<BedAssignment>({
  patientName: "",
  patientId: undefined,
  admissionDate: undefined,
  assignmentType: "",
  note: ""
});

const handleConfirm = async () => {
  try {
    await bedStore.assignBed(props.bedId, {
      patientId: form.patientId,
      admissionDate: form.admissionDate,
      assignmentType: form.assignmentType,
      note: form.note
    });

    showToast("床位分配成功");
    emit("assigned");
    showDialog.value = false;
  } catch (error) {
    showToast("床位分配失败");
  }
};

const onDateConfirm = (value: Date) => {
  form.admissionDate = value;
  showDatePicker.value = false;
};

const computedAdmissionDate = computed(() => {
  // 将日期对象转换为字符串
  return formatDate(form.admissionDate);
});

const onTypeConfirm = (value: string) => {
  form.assignmentType = value;
  showTypePopup.value = false;
};
</script>

<style scoped>
.bed-assignment {
  .van-cell-group {
    margin: 12px 0;
  }
}
</style>
