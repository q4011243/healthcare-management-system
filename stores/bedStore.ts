import { info } from 'autoprefixer';
import { defineStore } from 'pinia';
import { db } from '~/api/db/database';
import { BedStatus } from '~/types/enums/enums';
import { useEnum } from '~/types/enums/metadata';
import type { Bed } from '~/types/models/ward';
import type { BedAssignment } from '~/types/models/ward';
import { useRoomStore } from '~/stores/roomStore';

interface BedState {
  beds: Bed[];
  currentBed: Bed | null;
  loading: boolean;
  error: string | null;
  roomBedsMap: Map<number, Bed[]>;
}

interface BedStatusUpdateOptions {
  maintenanceInfo?: {
    reason: string;
    estimatedDuration: number;
  };
  cleaningNote?: string;
}

export const useBedStore = defineStore('bed', {
  state: (): BedState => ({
    beds: [],
    currentBed: null,
    loading: false,
    error: null,
    roomBedsMap: new Map()
  }),

  getters: {
    getBedsByRoom: (state) => (roomId: number) => {
      return state.roomBedsMap.get(roomId) || [];
    },

    availableBeds: (state) => (roomId: number) => {
      const beds = state.roomBedsMap.get(roomId) || [];
      return beds.filter((bed) => bed.status === 'available');
    },

    getBedsByStatus: (state) => (status: string) => {
      return state.beds.filter((bed) => bed.status === status);
    },
    availableBedOptions: (state) => (roomId: number | undefined) => {
      const beds = roomId ? state.availableBeds(roomId) : state.beds;
      const { getLabel } = useEnum();
      return beds.map((bed) => ({
        text: `${bed.name} (${getLabel('BedType', bed.type)})`,
        value: bed.id
      }));
    }
  },

  actions: {
    async fetchBedsByRoomId(roomId: number) {
      try {
        this.loading = true;
        const beds = await db.beds.where('roomId').equals(roomId).toArray();
        this.roomBedsMap.set(roomId, beds);
        // 获取床位对应的病人
        const bedIds = beds.map((bed) => bed.id);
        const patients = await db.patients
          .where('bedId')
          .anyOf(bedIds as any)
          .toArray();
        beds.forEach((bed) => {
          bed.patient = patients.find((p) => p.bedId === bed.id);
        });
        this.beds = beds;
        return beds;
      } catch (error) {
        this.error = (error as Error).message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async addBed(bed: Omit<Bed, 'id'>) {
      try {
        this.loading = true;
        const id = await db.beds.add(bed);
        const newBed = await db.beds.get(id);

        if (newBed) {
          const roomBeds = this.roomBedsMap.get(bed.roomId) || [];
          roomBeds.push(newBed);
          this.roomBedsMap.set(bed.roomId, roomBeds);
        }

        return newBed;
      } catch (error) {
        this.error = (error as Error).message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateBed(id: number, updates: Partial<Bed>) {
      try {
        this.loading = true;
        await db.beds.update(id, updates);
        const updatedBed = await db.beds.get(id);

        if (updatedBed) {
          const roomBeds = this.roomBedsMap.get(updatedBed.roomId) || [];
          const index = roomBeds.findIndex((b) => b.id === id);
          if (index !== -1) {
            roomBeds[index] = updatedBed;
            this.roomBedsMap.set(updatedBed.roomId, roomBeds);
          }
        }

        return updatedBed;
      } catch (error) {
        this.error = (error as Error).message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateBedStatus(
      bedId: number,
      status: BedStatus,
      options?: BedStatusUpdateOptions
    ) {
      try {
        // 更新床位状态
        await this.updateBed(bedId, {
          status,
          ...options
        });

        // 更新本地状态
        const bedIndex = this.beds.findIndex((bed) => bed.id === bedId);
        if (bedIndex !== -1) {
          this.beds[bedIndex] = {
            ...this.beds[bedIndex],
            status,
            maintenanceInfo: options?.maintenanceInfo,
            cleaningNote: options?.cleaningNote
          };
        }
      } catch (error) {
        console.error('更新床位状态失败:', error);
        throw error;
      }
    },

    async assignBed(bedId: number, assignment: BedAssignment) {
      try {
        const bed = await db.beds.get(bedId);
        if (!bed) {
          throw new Error('床位不存在');
        }

        if (bed.status !== BedStatus.AVAILABLE) {
          throw new Error('床位状态不可分配');
        }

        // 更新床位信息
        await this.updateBed(bedId, {
          status: BedStatus.OCCUPIED,
          patientId: assignment.patientId,
          lastAssignedAt: new Date()
        });

        // 创建分配记录
        await db.bedAssignments.add({
          ...assignment,
          bedId,
          createdAt: new Date()
        });

        return true;
      } catch (error) {
        console.error('床位分配失败:', error);
        throw error;
      }
    },

    async releaseBed(bedId: number) {
      try {
        const bed = await db.beds.get(bedId);
        if (!bed) {
          throw new Error('床位不存在');
        }

        if (bed.status !== BedStatus.OCCUPIED) {
          throw new Error('床位状态不正确');
        }

        // 更新床位状态
        await this.updateBed(bedId, {
          status: BedStatus.AVAILABLE,
          patientId: undefined,
          lastReleasedAt: new Date()
        });

        // 创建释放记录
        await db.bedReleases.add({
          bedId,
          releasedAt: new Date(),
          previousPatientId: bed.patientId || -1
        });

        return true;
      } catch (error) {
        console.error('床位释放失败:', error);
        throw error;
      }
    },

    // 删除床位
    async deleteBed(id: number) {
      try {
        this.loading = true;
        const bed = await db.beds.get(id);

        if (bed) {
          await db.beds.delete(id);
          const roomBeds = this.roomBedsMap.get(bed.roomId) || [];
          const updatedBeds = roomBeds.filter((b) => b.id !== id);
          this.roomBedsMap.set(bed.roomId, updatedBeds);
        }
      } catch (error) {
        this.error = (error as Error).message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // 判断床位状态是否可编辑
    isStatusDisabled(bedId: number) {
      const bed = this.beds.find((b) => b.id === bedId);
      return bed?.status === BedStatus.OCCUPIED;
    },
    async getBedById(id: number) {
      const roomStore = useRoomStore();
      // 补充病区和房间信息
      const bed = await db.beds.get(id);
      if (bed) {
        bed.room = await roomStore.fetchRoomById(bed.roomId);
      }
      const wardStore = useWardStore();
      if (bed?.wardId) {
        bed.ward = await wardStore.fetchWardById(bed.wardId);
      }
      return bed;
    }
  }
});
