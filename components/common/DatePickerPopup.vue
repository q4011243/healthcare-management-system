<template>
  <van-popup v-model:show="show" position="bottom">
    <van-date-picker
      :title="title"
      :min-date="minDate"
      :max-date="maxDate"
      :value="modelValue"
      :rules="rules"
      @confirm="onConfirm"
      @cancel="onCancel" />
  </van-popup>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { formatDate } from "@/utils/date";
import type { FieldRule } from "vant";

interface DatePickerConfirmEvent {
  selectedValues: number[];
  selectedOptions: {
    text: string;
    value: number;
  }[];
}

const props = defineProps<{
  title?: string;
  minDate?: Date;
  maxDate?: Date;
  rules?: FieldRule[];
}>();

// 使用defineModel替代v-model绑定
const show = defineModel<boolean>("show", { required: true });
const modelValue = defineModel<Date>("modelValue");

const emit = defineEmits<{
  (e: "confirm", value: Date): void;
  (e: "cancel"): void;
}>();

// 设置默认的最小和最大日期
const minDate = computed(() => props.minDate || new Date());
const maxDate = computed(() => props.maxDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

const onConfirm = (event: DatePickerConfirmEvent) => {
  // 从选择的年月日构建新的Date对象
  const [year, month, day] = event.selectedValues;
  const newDate = new Date(year, month - 1, day);

  modelValue.value = newDate;
  emit("confirm", newDate);
  show.value = false;
};

const onCancel = () => {
  emit("cancel");
  show.value = false;
};
</script>
