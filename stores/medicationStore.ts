import { defineStore } from 'pinia';
import { db } from '~/api/db/database';
import type {
  MedicationRecord,
  MedicationStatus
} from '~/types/models/medication';

interface MedicationState {
  records: MedicationRecord[];
  loading: boolean;
  error: string | null;
}

export const useMedicationStore = defineStore('medication', {
  state: (): MedicationState => ({
    records: [],
    loading: false,
    error: null
  }),

  actions: {
    async addMedicationRecord(
      data: Omit<MedicationRecord, 'id' | 'createdAt' | 'updatedAt'>
    ) {
      try {
        this.loading = true;
        const id = await db.medicationRecords.add({
          ...data,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        await this.fetchMedicationRecords(data.patientId);
        return id;
      } catch (error) {
        this.error = (error as Error).message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchMedicationRecords(patientId: number) {
      try {
        this.loading = true;
        this.records = await db.medicationRecords
          .where('patientId')
          .equals(patientId)
          .reverse()
          .sortBy('administeredAt');
        return this.records;
      } catch (error) {
        this.error = (error as Error).message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateMedicationStatus(id: number, status: MedicationStatus) {
      try {
        this.loading = true;
        await db.medicationRecords.update(id, {
          status,
          updatedAt: new Date()
        });
        const record = this.records.find((r) => r.id === id);
        if (record) {
          record.status = status;
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
        await db.medicationRecords.delete(id);
      } catch (error) {
        this.error = (error as Error).message;
        throw error;
      } finally {
        this.loading = false;
      }
    }
  }
});
