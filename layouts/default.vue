<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 系统状态栏 - 仅在移动应用中显示 -->
    <div class="h-safe-area-inset-top bg-primary" />

    <!-- 页面内容 -->
    <slot />

    <!-- 底部安全区域 - 仅在移动应用中显示 -->
    <div class="h-safe-area-inset-bottom" />
  </div>
</template>

<script setup lang="ts">
// 默认布局不需要太多逻辑
</script>

<style scoped>
.h-safe-area-inset-top {
  height: env(safe-area-inset-top);
}

.h-safe-area-inset-bottom {
  height: env(safe-area-inset-bottom);
}
</style>
