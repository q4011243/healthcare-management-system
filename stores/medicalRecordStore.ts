import { defineStore } from 'pinia';
import { db } from '~/api/db/database';
import type { MedicalRecord } from '~/types/models/medicalRecord';

interface MedicalRecordState {
  records: MedicalRecord[];
  currentRecord: MedicalRecord | null;
  loading: boolean;
  error: string | null;
}

export const useMedicalRecordStore = defineStore('medicalRecord', {
  state: (): MedicalRecordState => ({
    records: [],
    currentRecord: null,
    loading: false,
    error: null
  }),

  getters: {
    getRecordsByPatientId: (state) => (patientId: number) => {
      return state.records.filter((record) => record.patientId === patientId);
    }
  },

  actions: {
    async fetchRecordsByPatientId(patientId: number) {
      try {
        this.loading = true;
        const records = await db.medicalRecords
          .where('patientId')
          .equals(patientId)
          .reverse()
          .sortBy('createdAt');

        this.records = records;
        return records;
      } catch (error) {
        this.error = (error as Error).message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async createRecord(
      record: Omit<MedicalRecord, 'id' | 'createdAt' | 'updatedAt'>
    ) {
      try {
        this.loading = true;
        const newRecord = await db.medicalRecords.add({
          ...record,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        // 刷新记录列表
        await this.fetchRecordsByPatientId(record.patientId);
        return newRecord;
      } catch (error) {
        this.error = (error as Error).message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateRecord(id: number, data: Partial<MedicalRecord>) {
      try {
        this.loading = true;
        await db.medicalRecords.update(id, {
          ...data,
          updatedAt: new Date()
        });

        // 如果更新的是当前记录，也更新状态
        if (this.currentRecord?.id === id) {
          this.currentRecord = {
            ...this.currentRecord,
            ...data,
            updatedAt: new Date()
          };
        }

        // 刷新记录列表
        if (this.currentRecord?.patientId) {
          await this.fetchRecordsByPatientId(this.currentRecord.patientId);
        }
      } catch (error) {
        this.error = (error as Error).message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deleteRecord(id: number) {
      try {
        this.loading = true;
        const record = await db.medicalRecords.get(id);
        if (!record) {
          throw new Error('记录不存在');
        }

        await db.medicalRecords.delete(id);

        // 刷新记录列表
        await this.fetchRecordsByPatientId(record.patientId);
      } catch (error) {
        this.error = (error as Error).message;
        throw error;
      } finally {
        this.loading = false;
      }
    },
    async fetchById(id: number) {
      return await db.medicalRecords.get(id);
    }
  }
});
