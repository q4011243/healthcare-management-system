<template>
  <van-collapse-item name="reminders" class="mb-3 overflow-hidden rounded-lg shadow-sm">
    <template #title>
      <div class="flex items-center">
        <span>今日用药提醒</span>
        <span
          v-if="pendingCount"
          class="ml-2 rounded-full bg-red-400 px-2 py-0.5 text-xs text-white">
          {{ pendingCount }}
        </span>
      </div>
    </template>

    <van-empty v-if="!reminders.length" description="暂无用药提醒" />

    <van-cell-group v-else :border="false">
      <van-cell
        v-for="reminder in reminders"
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
  </van-collapse-item>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import type { MedicationReminder } from "~/types/models/medicationReminder";
import { useMedicationReminderStore } from "~/stores/medicationReminderStore";
import { useEnum } from "~/types/enums/metadata";
import type { TagType } from "vant";
import { notificationService } from "~/services/notificationService";

const { getType, getLabel } = useEnum();
const props = defineProps<{
  patientId: number;
}>();

const reminderStore = useMedicationReminderStore();
const reminders = ref<MedicationReminder[]>([]);
const pendingCount = computed(() => reminders.value.filter((r) => r.status === "PENDING").length);

// 检查并发送提醒
const checkReminders = async () => {
  console.log("检查提醒");
  const now = new Date();
  console.log("pendingReminders", reminders.value);
  const pendingReminders = reminders.value.filter((reminder) => {
    if (reminder.status !== "PENDING") return false;

    const reminderTime = new Date(reminder.reminderTime);
    const timeDiff = reminderTime.getTime() - now.getTime();
    // 如果在5分钟内需要提醒
    return timeDiff > 0 && timeDiff <= 5 * 60 * 1000;
  });

  for (const reminder of pendingReminders) {
    await notificationService.sendNotification("用药提醒", {
      body: `请按时服用: ${reminder.medicationName}`,
      icon: "/icons/medicine.png",
      tag: `medication-${reminder.id}`,
      data: {
        patientId: props.patientId,
        reminderId: reminder.id
      }
    });
  }
};

// 定时检查提醒
let checkInterval: ReturnType<typeof setInterval>;

onMounted(async () => {
  reminders.value = await reminderStore.fetchTodayReminders(props.patientId);

  // 请求通知权限
  await notificationService.requestPermission();

  // 每分钟检查一次提醒
  checkInterval = setInterval(checkReminders, 60 * 1000);
  // 立即检查一次
  checkReminders();
});

onUnmounted(() => {
  if (checkInterval) {
    clearInterval(checkInterval);
  }
});
</script>
