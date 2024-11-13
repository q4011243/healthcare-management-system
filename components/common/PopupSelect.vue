<template>
  <div>
    <van-field
      v-bind="$attrs"
      v-model="displayValue"
      :label="label"
      is-link
      readonly
      :placeholder="placeholder"
      :rules="rules"
      @click="showPopup = true" />

    <van-popup v-model:show="showPopup" position="bottom">
      <van-picker
        :columns="columns"
        :title="label"
        @confirm="onConfirm"
        @cancel="showPopup = false" />
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";

interface Option {
  text: string;
  value: string | number;
}

const modelValue = defineModel<string | number | undefined>("modelValue");

const props = defineProps<{
  label: string;
  placeholder?: string;
  options: Option[];
  rules?: Array<{
    required?: boolean;
    message?: string;
    validator?: (value: any) => boolean;
  }>;
}>();

const showPopup = ref(false);

// 计算显示值
const displayValue = computed(() => {
  const option = props.options.find((opt) => opt.value === modelValue.value);
  return option?.text || "";
});

// 转换选项格式
const columns = computed(() => props.options);

// 处理选择确认
const onConfirm = ({ selectedOptions }: { selectedOptions: Option[] }) => {
  modelValue.value = selectedOptions[0].value;
  showPopup.value = false;
};
</script>
