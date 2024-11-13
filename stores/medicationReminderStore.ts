import { defineStore } from 'pinia';
import { db } from '~/api/db/database';
import { MedicationFrequency } from '~/types/models/medication';
import type {
  MedicationReminder,
  ReminderSettings
} from '~/types/models/medicationReminder';

export const useMedicationReminderStore = defineStore('medicationReminder', {
  state: () => ({
    reminders: [] as MedicationReminder[],
    settings: {
      enabled: true,
      notifyBefore: 15,
      repeatInterval: 0
    } as ReminderSettings
  }),

  actions: {
    async createReminders(
      medicationRecordId: number,
      patientId: number,
      startDate: Date,
      endDate?: Date,
      notifyBefore?: number
    ) {
      // 根据用药频率创建提醒
      const medicationRecord =
        await db.medicationRecords.get(medicationRecordId);
      if (!medicationRecord) return;

      const reminderTimes = this.calculateReminderTimes(
        medicationRecord.frequency,
        startDate,
        endDate,
        notifyBefore || this.settings.notifyBefore
      );

      const reminders = reminderTimes.map((time) => ({
        patientId,
        medicationRecordId,
        reminderTime: time,
        status: 'PENDING' as MedicationReminder['status']
      }));

      await db.medicationReminders.bulkAdd(reminders);
      await this.fetchReminders(patientId);
    },

    async updateReminderStatus(
      reminderId: number,
      status: MedicationReminder['status']
    ) {
      await db.medicationReminders.update(reminderId, { status });
      // 如果错过用药，创建生命体征检查提醒
      if (status === 'MISSED') {
        const reminder = await db.medicationReminders.get(reminderId);
        if (reminder) {
        }
      }
    },

    async fetchTodayAllReminders() {
      const today = new Date();
      const tomorrow = new Date();
      today.setHours(0, 0, 0, 0);
      tomorrow.setHours(0, 0, 0, 0);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const reminders = await db.medicationReminders
        .where('reminderTime')
        .between(today, tomorrow)
        .toArray();

      // 关联上药品名称
      const medicationRecordIds = [
        ...new Set(reminders.map((r) => r.medicationRecordId))
      ];
      const medicationRecords =
        await db.medicationRecords.bulkGet(medicationRecordIds);

      reminders.forEach((reminder) => {
        reminder.medicationName = medicationRecords.find(
          (r) => r?.id === reminder.medicationRecordId
        )?.medicationName;
      });

      return reminders;
    },

    async fetchTodayReminders(patientId: number) {
      const today = new Date();
      const tomorrow = new Date();
      today.setHours(0, 0, 0, 0);
      tomorrow.setHours(0, 0, 0, 0);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const reminders = await db.medicationReminders
        .where('patientId')
        .equals(patientId)
        .and((r) => r.reminderTime >= today && r.reminderTime < tomorrow)
        .toArray();
      // 关联上药品名称
      const medicationRecords =
        await useMedicationStore().fetchMedicationRecords(patientId);

      reminders.forEach((reminder) => {
        reminder.medicationName = medicationRecords.find(
          (r) => r.id === reminder.medicationRecordId
        )?.medicationName;
      });
      return reminders;
    },

    async fetchReminders(patientId: number) {
      this.reminders = await db.medicationReminders
        .where('patientId')
        .equals(patientId)
        .toArray();
    },

    calculateReminderTimes(
      frequency: MedicationFrequency,
      startDate: Date,
      endDate?: Date,
      notifyBefore: number = 15
    ): Date[] {
      // 根据用药频率计算提醒时间
      const times: Date[] = [];
      const start = new Date(startDate);
      const end = endDate ? new Date(endDate) : new Date(start);
      end.setDate(end.getDate() + 7); // 如果没有结束日期，默认创建一周的提醒

      // 根据频率生成提醒时间
      let currentDate = start;
      while (currentDate <= end) {
        switch (frequency) {
          case MedicationFrequency.DAILY:
            // 每天一次，默认早上8点
            const dailyTime = new Date(currentDate);
            dailyTime.setHours(8, 0, 0, 0);
            times.push(dailyTime);
            currentDate.setDate(currentDate.getDate() + 1);
            break;

          case MedicationFrequency.BID:
            // 每天两次，早8点和晚8点
            const morningTime = new Date(currentDate);
            morningTime.setHours(8, 0, 0, 0);
            times.push(morningTime);

            const eveningTime = new Date(currentDate);
            eveningTime.setHours(20, 0, 0, 0);
            times.push(eveningTime);
            currentDate.setDate(currentDate.getDate() + 1);
            break;

          case MedicationFrequency.TID:
            // 每天三次，早8点、下午2点和晚8点
            const morning = new Date(currentDate);
            morning.setHours(8, 0, 0, 0);
            times.push(morning);

            const afternoon = new Date(currentDate);
            afternoon.setHours(14, 0, 0, 0);
            times.push(afternoon);

            const evening = new Date(currentDate);
            evening.setHours(20, 0, 0, 0);
            times.push(evening);
            currentDate.setDate(currentDate.getDate() + 1);
            break;

          case MedicationFrequency.QID:
            // 每天四次，早8点、中午12点、下午4点和晚8点
            const firstTime = new Date(currentDate);
            firstTime.setHours(8, 0, 0, 0);
            times.push(firstTime);

            const secondTime = new Date(currentDate);
            secondTime.setHours(12, 0, 0, 0);
            times.push(secondTime);

            const thirdTime = new Date(currentDate);
            thirdTime.setHours(16, 0, 0, 0);
            times.push(thirdTime);

            const fourthTime = new Date(currentDate);
            fourthTime.setHours(20, 0, 0, 0);
            times.push(fourthTime);
            currentDate.setDate(currentDate.getDate() + 1);
            break;
          default:
            break;
        }
      }

      // 调整提醒时间（提前通知）
      return times.map((time) => {
        time.setMinutes(time.getMinutes() - notifyBefore);
        return time;
      });
    }
  }
});
