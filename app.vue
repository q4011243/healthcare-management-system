<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { initializeWardData } from "./api/db/seeds/ward";
import { InitDataService } from "./api/db/seeds/initData";
import { useAuthStore } from "./stores/auth";
import { seedMedicalRecords } from "./api/db/seeds/medicalRecordSeed";

const authStore = useAuthStore();

// 在应用启动时检查认证状态
onMounted(async () => {
  await authStore.checkAuth();
  // await InitDataService.initialize();
  // initializeWardData();
  // await seedMedicalRecords();
});
</script>
