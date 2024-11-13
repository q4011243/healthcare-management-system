<template>
  <div class="ward-rooms-page">
    <!-- 顶部导航栏 -->
    <div class="sticky top-0 z-10 bg-white">
      <van-nav-bar
        :title="`${currentWard?.name || ''} - 房间管理`"
        left-arrow
        @click-left="router.back()" />
    </div>

    <!-- 房间管理组件 -->
    <WardRooms :ward-id="Number(wardId)" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import WardRooms from "~/components/ward/WardRooms.vue";
import { useWardStore } from "~/stores/wardStore";

const router = useRouter();
const route = useRoute();
const wardStore = useWardStore();

// 从路由参数获取病区ID
const wardId = computed(() => route.params.id);

// 获取当前病区信息
const currentWard = computed(() => wardStore.currentWard);

onMounted(async () => {
  await wardStore.fetchWardById(Number(wardId.value));
});

// 页面元信息
definePageMeta({
  requiresAuth: true,
  middleware: "auth"
});
</script>

<style scoped>
.ward-rooms-page {
  min-height: 100vh;
  background-color: #f7f8fa;
}
</style>
