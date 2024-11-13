import { defineStore } from 'pinia';
import { db } from '~/api/db/database';
import type { NursingRecord } from '~/types/models/nursing';

interface NursingState {
  records: NursingRecord[];
  loading: boolean;
  error: string | null;
}

export const useNursingStore = defineStore('nursing', {
  state: (): NursingState => ({
    records: [],
    loading: false,
    error: null
  }),

  actions: {
    async addNursingRecord(
      data: Omit<NursingRecord, 'id' | 'createdAt' | 'updatedAt'>
    ) {
      try {
        this.loading = true;
        const id = await db.nursingRecords.add({
          ...data,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        return id;
      } catch (error) {
        this.error = (error as Error).message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchNursingRecords(patientId: number) {
      try {
        this.loading = true;
        this.records = await db.nursingRecords
          .where('patientId')
          .equals(patientId)
          .reverse()
          .sortBy('performedAt');
        return this.records;
      } catch (error) {
        this.error = (error as Error).message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deleteNursingRecord(id: number) {
      try {
        this.loading = true;
        await db.nursingRecords.delete(id);
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
