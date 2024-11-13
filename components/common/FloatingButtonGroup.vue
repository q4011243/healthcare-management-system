<template>
  <div class="floating-button-group">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: "FloatingButtonGroup"
});
</script>

<style scoped>
.floating-button-group {
  position: fixed;
  left: 20px;
  bottom: 120px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
