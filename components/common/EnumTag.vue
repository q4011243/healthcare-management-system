<template>
  <van-tag
    :type="computedType"
    :size="size"
    :plain="plain"
    :round="round"
    :mark="mark"
    :color="customColor"
    :text-color="textColor"
    class="enum-tag"
    :class="customClass">
    <slot>{{ computedLabel }}</slot>
  </van-tag>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { TagSize, TagType } from "vant";
import { useEnum } from "~/types/enums/metadata";

interface Props {
  // 枚举类型名称
  enumName?: string;
  // 枚举值
  value?: string;
  // 标签类型
  type?: TagType;
  // 是否为空心样式
  plain?: boolean;
  // 是否为圆角样式
  round?: boolean;
  // 是否为标记样式
  mark?: boolean;
  // 大小
  size?: TagSize;
  // 自定义类名
  customClass?: string | string[];
  // 自定义颜色
  customColor?: string;
  // 文字颜色
  textColor?: string;
}

const props = withDefaults(defineProps<Props>(), {
  plain: false,
  round: false,
  mark: false,
  size: "medium"
});

const enumUtil = useEnum();

// 计算标签类型
const computedType = computed((): TagType => {
  if (props.type) {
    return props.type;
  }
  if (props.enumName && props.value !== undefined) {
    return enumUtil.getType(props.enumName, props.value) as TagType;
  }
  return "primary";
});

// 计算显示文本
const computedLabel = computed(() => {
  if (props.enumName && props.value !== undefined) {
    return enumUtil.getLabel(props.enumName, props.value);
  }
  return "";
});
</script>

<style scoped>
.enum-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.enum-tag :deep(.van-tag) {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
