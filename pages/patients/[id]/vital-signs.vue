<template>
  <div class="vital-signs-page">
    <van-nav-bar title="生命体征" left-arrow @click-left="router.back()" />

    <van-collapse v-model="activeNames" class="mb-20">
      <!-- 记录体征表单 -->
      <van-collapse-item
        title="记录体征"
        name="recordForm"
        class="mb-3 overflow-hidden rounded-lg shadow-sm">
        <VitalSignsForm :patient-id="Number(route.params.id)" @saved="refreshHistory" />
      </van-collapse-item>

      <!-- 体征历史记录 -->
      <van-collapse-item
        title="体征记录"
        name="history"
        class="mb-3 overflow-hidden rounded-lg shadow-sm">
        <VitalSignsHistory ref="historyRef" :patient-id="Number(route.params.id)" />
      </van-collapse-item>
    </van-collapse>

    <!-- 快速操作 -->
    <van-action-bar>
      <van-action-bar-button type="warning" text="查看趋势" @click="showTrends" />
      <van-action-bar-button
        type="danger"
        text="异常警报"
        :badge="alertCount"
        @click="showAlerts" />
    </van-action-bar>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { showDialog } from "vant";
import VitalSignsForm from "~/components/patient/VitalSignsForm.vue";
import VitalSignsHistory from "~/components/patient/VitalSignsHistory.vue";
import { useVitalSignsStore } from "~/stores/vitalSignsStore";
import MedicationReminders from "~/components/patient/MedicationReminders.vue";
import type { MedicationReminder } from "~/types/models/medicationReminder";

interface VitalSignsAlert {
  message: string;
  recordedAt: Date;
}

const router = useRouter();
const route = useRoute();
const vitalSignsStore = useVitalSignsStore();
const historyRef = ref<InstanceType<typeof VitalSignsHistory> | null>(null);
const activeNames = ref(["recordForm", "history"]);
const alertCount = ref(0);

// 刷新历史记录
const refreshHistory = () => {
  historyRef.value?.refresh();
};

// 显示趋势图
const showTrends = () => {
  historyRef.value?.showTrendChart();
};

// 显示警报
const showAlerts = async () => {
  const alerts = await vitalSignsStore.fetchRecentAlerts(Number(route.params.id));
  if (alerts.length > 0) {
    showDialog({
      title: "异常警报",
      message: alerts
        .map((alert: VitalSignsAlert) => `${alert.message} (${formatDateCN(alert.recordedAt)})`)
        .join("\n"),
      confirmButtonText: "确认"
    });
  } else {
    showDialog({
      title: "生命体征正常",
      message: "最近没有异常记录",
      confirmButtonText: "确认"
    });
  }
};

// 监听新的警报
watch(
  () => vitalSignsStore.alerts,
  (newAlerts) => {
    alertCount.value = newAlerts.length;
  }
);

onMounted(async () => {
  await vitalSignsStore.fetchRecentAlerts(Number(route.params.id));
});

definePageMeta({
  middleware: "auth",
  title: "生命体征",
  requiresAuth: true
});
</script>
