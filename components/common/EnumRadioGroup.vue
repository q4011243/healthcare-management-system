<template>
  <van-radio-group v-model="modelValue" :direction="direction" class="enum-radio-group">
    <van-radio
      v-for="option in options"
      :key="option.value"
      :name="option.value"
      :disabled="disabled">
      {{ option.label }}
    </van-radio>
  </van-radio-group>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useEnum } from "~/types/enums/metadata";

const props = withDefaults(
  defineProps<{
    enumName: string;
    direction?: "horizontal" | "vertical";
    disabled?: boolean;
  }>(),
  {
    direction: "horizontal",
    disabled: false
  }
);

const modelValue = defineModel<string>("modelValue");

const { getOptions } = useEnum();
const options = computed(() => getOptions(props.enumName));
</script>

<style></style>
