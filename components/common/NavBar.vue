<template>
  <!-- 顶部导航栏 -->
  <van-nav-bar
    class="border-primary/10 bg-primary admin-nav-bar sticky top-0 z-50 border-b shadow-sm"
    fixed
    v-bind="$attrs"
    placeholder>
    <!-- 左侧区域 -->
    <template #left>
      <div class="flex items-center">
        <template v-if="showBack">
          <span @click="handleBack">
            <van-icon name="arrow-left" class="mr-1 !text-white" />
            <span class="text-white">返回</span>
          </span>
        </template>
        <template v-else>
          <van-image
            round
            width="32"
            height="32"
            :src="authStore.user?.avatar || '/default-avatar.png'"
            @click="showUserMenu = true" />
        </template>
      </div>
    </template>

    <!-- 标题区域 -->
    <template #title>
      <div class="flex items-center justify-center">
        <span class="text-white">
          {{ title || "医院管理系统" }}
        </span>
        <!-- 如果需要显示子标题 -->
        <span v-if="subtitle" class="ml-2 text-xs text-white/70">
          {{ subtitle }}
        </span>
      </div>
    </template>

    <!-- 右侧区域 -->
    <template #right v-if="showRight">
      <slot name="right" />
    </template>
  </van-nav-bar>
</template>

<script setup lang="ts">
const authStore = useAuthStore();
const showUserMenu = ref(false);
const router = useRouter();

const handleBack = () => {
  router.back();
};

defineProps({
  showBack: {
    type: Boolean,
    default: true
  },
  showRight: {
    type: Boolean,
    default: true
  },
  title: {
    type: String,
    default: "医院管理系统"
  },
  subtitle: {
    type: String,
    default: ""
  }
});
</script>

<style scoped>
.admin-nav-bar {
  background-color: var(--van-primary-color);
  background-image: linear-gradient(
    to right,
    var(--van-primary-color),
    color-mix(in srgb, var(--van-primary-color) 90%, #000)
  );
}

/* 修改 placeholder 的背景颜色 */
.admin-nav-bar:deep(.van-nav-bar--fixed) {
  background-color: var(--van-primary-color);
  background-image: linear-gradient(
    to right,
    var(--van-primary-color),
    color-mix(in srgb, var(--van-primary-color) 90%, #000)
  );
}

/* 重要：覆盖 placeholder 的背景颜色 */
.admin-nav-bar:deep(.van-nav-bar__placeholder) {
  background-color: var(--van-primary-color);
  background-image: linear-gradient(
    to right,
    var(--van-primary-color),
    color-mix(in srgb, var(--van-primary-color) 90%, #000)
  );
}

.h-safe-area-inset-bottom {
  height: env(safe-area-inset-bottom);
}

.van-nav-bar {
  background-color: var(--van-primary-color);
  /* 添加渐变背景 */
  background-image: linear-gradient(
    to right,
    var(--van-primary-color),
    color-mix(in srgb, var(--van-primary-color) 90%, #000)
  );
}

.van-nav-bar :deep(.van-nav-bar__content) {
  height: 52px; /* 稍微增加导航栏高度 */
}

.van-nav-bar :deep(.van-nav-bar__title),
.van-nav-bar :deep(.van-nav-bar__left),
.van-nav-bar :deep(.van-nav-bar__right) {
  color: white;
}

/* 添加图标按钮点击效果 */
.van-icon {
  cursor: pointer;
  transition: opacity 0.2s;

  &:active {
    opacity: 0.7;
  }
}

/* 优化 Popover 样式 */
.van-popover {
  :deep(.van-popover__content) {
    padding: 4px 0;
    border-radius: 8px;
  }
}

/* 添加阴影效果 */
.shadow-sm {
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}
</style>
