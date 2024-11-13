<template>
  <van-field
    v-bind="$attrs"
    v-model="displayValue"
    readonly
    is-link
    :name="name"
    :label="label"
    :placeholder="placeholder"
    :rules="rules"
    right-icon="calendar-o"
    @click="show = true"></van-field>

  <DatePickerPopup
    v-model:show="show"
    v-model="selectedDate"
    :title="title"
    :min-date="minDate"
    :max-date="maxDate"
    @confirm="onConfirm"
    @cancel="onCancel" />
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { formatDate } from "@/utils/date";
import type { FieldRule } from "vant";

// Props 定义
const props = defineProps<{
  name?: string;
  label?: string;
  title?: string;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  rules?: FieldRule[];
  format?: string;
}>();

// 使用 defineModel 进行双向绑定
const modelValue = defineModel<Date>();

// 内部状态
const show = ref(false);
const selectedDate = ref<Date>(modelValue.value || new Date());

// 格式化显示值
const displayValue = computed(() => {
  if (!modelValue.value) return "";
  return formatDate(modelValue.value, props.format || "YYYY-MM-DD");
});

// 事件处理
const onConfirm = (date: Date) => {
  modelValue.value = date;
  show.value = false;
};

const onCancel = () => {
  show.value = false;
};
</script>
