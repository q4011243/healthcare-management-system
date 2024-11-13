import { defineStore } from 'pinia';
import { db } from '~/api/db/database';
import {
  AlertType,
  type VitalSigns,
  type VitalSignsAlert
} from '~/types/models/vitalSigns';

interface VitalSignsState {
  records: VitalSigns[];
  currentRecord: VitalSigns | null;
  loading: boolean;
  error: string | null;
  alerts: VitalSignsAlert[];
}

export const useVitalSignsStore = defineStore('vitalSigns', {
  state: (): VitalSignsState => ({
    records: [],
    currentRecord: null,
    loading: false,
    error: null,
    alerts: []
  }),

  actions: {
    async addVitalSigns(
      data: Omit<VitalSigns, 'id' | 'createdAt' | 'updatedAt'>
    ) {
      try {
        this.loading = true;
        const id = await db.vitalSigns.add({
          ...data,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        // Check for alerts
        this.checkVitalSignsAlerts(data);

        return id;
      } catch (error) {
        this.error = (error as Error).message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchLastestVitalSigns(patientId: number) {
      try {
        this.loading = true;
        const record = await db.vitalSigns
          .where('patientId')
          .equals(patientId)
          .reverse()
          .sortBy('recordedAt')
          .then((records) => records[0] || null);

        this.currentRecord = record;
        return record;
      } catch (error) {
        this.error = (error as Error).message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchPatientVitalSigns(patientId: number) {
      try {
        this.loading = true;
        const records = await db.vitalSigns
          .where('patientId')
          .equals(patientId)
          .reverse()
          .sortBy('recordedAt');

        this.records = records;
        return records;
      } catch (error) {
        this.error = (error as Error).message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchRecentAlerts(patientId: number) {
      try {
        const record = await this.fetchLastestVitalSigns(patientId);
        if (!record) return [];

        const alerts: VitalSignsAlert[] = [];

        const recordAlerts = this.checkVitalSignsAlerts(record);
        alerts.push(...recordAlerts);

        this.alerts = alerts;
        return alerts;
      } catch (error) {
        this.error = (error as Error).message;
        throw error;
      }
    },

    checkVitalSignsAlerts(data: VitalSigns): VitalSignsAlert[] {
      const alerts: VitalSignsAlert[] = [];

      // Define thresholds
      if (data.temperature > 38.5) {
        alerts.push({
          type: AlertType.HIGH,
          parameter: 'temperature',
          threshold: 38.5,
          message: '体温过高'
        });
      }

      if (data.oxygenSaturation < 95) {
        alerts.push({
          type: AlertType.LOW,
          parameter: 'oxygenSaturation',
          threshold: 95,
          message: '血氧饱和度过低'
        });
      }

      // If any alerts, show notification
      if (alerts.length > 0) {
        showDialog({
          title: '生命体征警报',
          message: alerts.map((alert) => alert.message).join('\n'),
          confirmButtonText: '确认'
        });
      }

      return alerts;
    },

    async deleteVitalSigns(id: number) {
      try {
        this.loading = true;
        await db.vitalSigns.delete(id);
        // 从记录列表中移除
        this.records = this.records.filter((record) => record.id !== id);
      } catch (error) {
        this.error = (error as Error).message;
        throw error;
      } finally {
        this.loading = false;
      }
    }
  }
});
