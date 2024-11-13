import { defineStore } from 'pinia';
import { db } from '~/api/db/database';
import type { RoomEquipment } from '~/types/models/ward';

interface RoomEquipmentState {
  equipments: RoomEquipment[];
  currentEquipment: RoomEquipment | null;
  loading: boolean;
  error: string | null;
  roomEquipmentsMap: Map<number, RoomEquipment[]>;
}

export const useRoomEquipmentStore = defineStore('roomEquipment', {
  state: (): RoomEquipmentState => ({
    equipments: [],
    currentEquipment: null,
    loading: false,
    error: null,
    roomEquipmentsMap: new Map()
  }),

  getters: {
    getEquipmentsByRoom: (state) => (roomId: number) => {
      return state.roomEquipmentsMap.get(roomId) || [];
    },

    getEquipmentsByStatus: (state) => (status: string) => {
      return state.equipments.filter(
        (equipment) => equipment.status === status
      );
    },

    getUpcomingMaintenance: (state) => {
      const today = new Date();
      return state.equipments.filter((equipment) => {
        const nextMaintainDate = equipment.nextMaintainDate
          ? new Date(equipment.nextMaintainDate)
          : new Date();
        const daysUntilMaintenance = Math.ceil(
          (nextMaintainDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysUntilMaintenance <= 7; // 7天内需要维护的设备
      });
    }
  },

  actions: {
    async fetchEquipmentsByRoomId(roomId: number) {
      try {
        this.loading = true;
        const equipments = await db.roomEquipment
          .where('roomId')
          .equals(roomId)
          .toArray();

        this.roomEquipmentsMap.set(roomId, equipments);
        return equipments;
      } catch (error) {
        this.error = (error as Error).message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async addEquipment(equipment: Omit<RoomEquipment, 'id'>) {
      try {
        this.loading = true;
        const id = await db.roomEquipment.add(equipment);
        const newEquipment = await db.roomEquipment.get(id);

        if (newEquipment) {
          const roomEquipments =
            this.roomEquipmentsMap.get(equipment.roomId) || [];
          roomEquipments.push(newEquipment);
          this.roomEquipmentsMap.set(equipment.roomId, roomEquipments);
        }

        return newEquipment;
      } catch (error) {
        this.error = (error as Error).message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateEquipment(id: number, updates: Partial<RoomEquipment>) {
      try {
        this.loading = true;
        await db.roomEquipment.update(id, updates);

        // 更新本地缓存
        const equipment = await db.roomEquipment.get(id);
        if (equipment) {
          const roomEquipments =
            this.roomEquipmentsMap.get(equipment.roomId) || [];
          const index = roomEquipments.findIndex((e) => e.id === id);
          if (index !== -1) {
            roomEquipments[index] = equipment;
            this.roomEquipmentsMap.set(equipment.roomId, roomEquipments);
          }
        }

        return equipment;
      } catch (error) {
        this.error = (error as Error).message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async removeEquipment(id: number) {
      try {
        this.loading = true;
        const equipment = await db.roomEquipment.get(id);

        if (equipment) {
          await db.roomEquipment.delete(id);

          // 更新本地缓存
          const roomEquipments =
            this.roomEquipmentsMap.get(equipment.roomId) || [];
          const updatedEquipments = roomEquipments.filter((e) => e.id !== id);
          this.roomEquipmentsMap.set(equipment.roomId, updatedEquipments);
        }
      } catch (error) {
        this.error = (error as Error).message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async recordMaintenance(
      id: number,
      maintenanceDate: Date,
      nextMaintainDate: Date
    ) {
      try {
        this.loading = true;
        await this.updateEquipment(id, {
          lastMaintainedAt: maintenanceDate,
          nextMaintainDate
        });
      } catch (error) {
        this.error = (error as Error).message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // 批量操作方法
    async batchAddEquipments(equipments: Array<Omit<RoomEquipment, 'id'>>) {
      try {
        this.loading = true;
        const addedIds = await db.roomEquipment.bulkAdd(
          equipments as RoomEquipment[],
          { allKeys: true }
        );

        // 更新本地缓存
        await Promise.all(
          equipments.map(async (equipment, index) => {
            const id = addedIds[index];
            const newEquipment = await db.roomEquipment.get(id);
            if (newEquipment) {
              const roomEquipments =
                this.roomEquipmentsMap.get(equipment.roomId) || [];
              roomEquipments.push(newEquipment);
              this.roomEquipmentsMap.set(equipment.roomId, roomEquipments);
            }
          })
        );
      } catch (error) {
        this.error = (error as Error).message;
        throw error;
      } finally {
        this.loading = false;
      }
    }
  }
});
