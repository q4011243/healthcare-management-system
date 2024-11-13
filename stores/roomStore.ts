import { defineStore } from 'pinia';
import { db } from '~/api/db/database';
import { roomService } from '~/api/services/roomService';
import {
  type RoomType,
  type GenderRequirement,
  RoomStatus
} from '~/types/enums/enums';
import { useEnum } from '~/types/enums/metadata';
import type { Room } from '~/types/models/ward';

interface RoomState {
  rooms: Room[];
  currentRoom: Room | null;
  loading: boolean;
  error: string | null;
  filters: {
    type?: RoomType;
    status?: RoomStatus;
    gender?: GenderRequirement;
    hasOxygen?: boolean;
    hasToilet?: boolean;
  };
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  currentWardId: number | null;
}

export const useRoomStore = defineStore('room', {
  state: (): RoomState => ({
    rooms: [],
    currentRoom: null,
    loading: false,
    error: null,
    filters: {},
    pagination: {
      page: 1,
      pageSize: 10,
      total: 0,
      totalPages: 0
    },
    currentWardId: null
  }),

  getters: {
    availableRooms: (state) =>
      state.rooms.filter((room) => room.status === RoomStatus.AVAILABLE),
    roomsByType: (state) => {
      const grouped = state.rooms.reduce(
        (acc, room) => {
          if (!acc[room.type]) {
            acc[room.type] = [];
          }
          acc[room.type].push(room);
          return acc;
        },
        {} as Record<string, Room[]>
      );
      return grouped;
    },
    availableRoomOptions: (state) => (wardId: number | undefined) => {
      const rooms = wardId
        ? state.availableRooms.filter((room) => room.wardId === wardId)
        : state.availableRooms;
      const { getLabel } = useEnum();
      return rooms.map((room) => ({
        text: `${room.name} (${getLabel('RoomType', room.type)})`,
        value: room.id
      }));
    }
  },

  actions: {
    async isRoomFull(roomId: number): Promise<boolean> {
      const beds = await useBedStore().fetchBedsByRoomId(roomId);
      const room = await this.fetchRoomById(roomId);
      return room ? beds.length >= room.capacity : true;
    },
    setCurrentWard(wardId: number) {
      this.currentWardId = wardId;
      this.pagination.page = 1;
      this.rooms = [];
      this.fetchRooms();
    },

    async fetchRoomsByWardId(wardId: number) {
      this.currentWardId = wardId;
      this.pagination.page = 1;
      this.rooms = [];
      this.fetchRooms();
    },

    async fetchRooms() {
      if (!this.currentWardId) return;

      try {
        this.loading = true;
        const result = await roomService.getRooms(this.currentWardId, {
          keyword: '',
          page: this.pagination.page,
          pageSize: this.pagination.pageSize,
          ...this.filters
        });

        this.rooms = result.items;
        this.pagination = {
          page: result.page,
          pageSize: result.pageSize,
          total: result.total,
          totalPages: result.totalPages
        };
      } catch (err) {
        this.error = (err as Error).message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async fetchRoomById(id: number) {
      try {
        this.loading = true;
        const room = await roomService.getRoomById(id);

        if (room) {
          // 获取房间相关的患者信息
          const patientStore = usePatientStore();
          const equipmentStore = useRoomEquipmentStore();
          const bedStore = useBedStore();
          const patients = await patientStore.fetchPatientsByRoomId(id);
          const equipments = await equipmentStore.fetchEquipmentsByRoomId(id);
          const beds = await bedStore.fetchBedsByRoomId(id);
          this.currentRoom = room;
          this.currentRoom.patients = patients;
          this.currentRoom.equipments = equipments;
          this.currentRoom.beds = beds;
        }
        return room;
      } catch (err) {
        this.error = (err as Error).message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async createRoom(room: Omit<Room, 'id' | 'lastCleanedAt'>) {
      try {
        this.loading = true;
        await roomService.createRoom(room);
        await this.fetchRooms();
      } catch (err) {
        this.error = (err as Error).message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async updateRoom(id: number, room: Partial<Room>) {
      try {
        this.loading = true;
        await roomService.updateRoom(id, room);
        if (this.currentRoom?.id === id) {
          this.currentRoom = { ...this.currentRoom, ...room };
        }
        await this.fetchRooms();
      } catch (err) {
        this.error = (err as Error).message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async deleteRoom(id: number) {
      try {
        this.loading = true;
        await roomService.deleteRoom(id);
        if (this.currentRoom?.id === id) {
          this.currentRoom = null;
        }
        await this.fetchRooms();
      } catch (err) {
        this.error = (err as Error).message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async updateRoomStatus(id: number, status: RoomStatus) {
      try {
        this.loading = true;
        await roomService.updateRoomStatus(id, status);
        await this.fetchRooms();
      } catch (err) {
        this.error = (err as Error).message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async updateCleaningTime(id: number) {
      try {
        this.loading = true;
        await roomService.updateCleaningTime(id);
        await this.fetchRooms();
      } catch (err) {
        this.error = (err as Error).message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    setFilters(filters: RoomState['filters']) {
      this.filters = filters;
      this.pagination.page = 1;
      this.fetchRooms();
    },

    setPage(page: number) {
      this.pagination.page = page;
      this.fetchRooms();
    }
  }
});
