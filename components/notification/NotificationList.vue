<template>
  <div class="notification-list">
    <van-tabs v-model:active="activeTab">
      <van-tab title="用药提醒" badge="">
        <van-list v-model:loading="loading" :finished="finished" finished-text="暂无更多提醒">
          <van-cell-group inset class="mx-2 mt-2">
            <van-cell
              v-for="reminder in todayReminders"
              :key="reminder.id"
              :title="reminder.medicationName"
              :label="formatDateCN(reminder.reminderTime)">
              <template #right-icon>
                <van-tag :type="getType('MedicationReminderStatus', reminder.status)">
                  {{ getLabel("MedicationReminderStatus", reminder.status) }}
                </van-tag>
              </template>
            </van-cell>
          </van-cell-group>
        </van-list>
      </van-tab>
      <van-tab title="异常警报" badge="">
        <van-list
          v-model:loading="alertsLoading"
          :finished="alertsFinished"
          finished-text="暂无异常警报">
          <van-cell-group inset class="mx-2 mt-2">
            <van-cell
              v-for="alert in alerts"
              :key="alert.message"
              :title="alert.message"
              :border="false">
              <template #right-icon>
                <van-tag type="danger">异常</van-tag>
              </template>
            </van-cell>
          </van-cell-group>
        </van-list>
      </van-tab>
    </van-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useMedicationReminderStore } from "~/stores/medicationReminderStore";
import { useEnum } from "~/types/enums/metadata";
import type { MedicationReminder } from "~/types/models/medicationReminder";
import type { VitalSignsAlert } from "~/types/models/vitalSigns";

const reminderStore = useMedicationReminderStore();
const { getLabel, getType } = useEnum();

const activeTab = ref(0);
const loading = ref(false);
const alertsLoading = ref(false);
const finished = ref(true);
const alertsFinished = ref(true);

const todayReminders = ref<MedicationReminder[]>([]);
const alerts = ref<VitalSignsAlert[]>([]);

// 初始化加载异常警报
const loadAlerts = async () => {
  alertsLoading.value = true;
  try {
    // alerts.value = await vitalSignsStore.fetchRecentAlerts();
    alerts.value = [];
  } finally {
    alertsLoading.value = false;
    alertsFinished.value = true;
  }
};

onMounted(async () => {
  todayReminders.value = await reminderStore.fetchTodayAllReminders();
  loadAlerts();
});
</script>

<style scoped>
.notification-list {
  max-height: 80vh;
  overflow-y: auto;
}
</style>
