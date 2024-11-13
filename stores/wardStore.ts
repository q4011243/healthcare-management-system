import { defineStore } from 'pinia';
import { wardService } from '~/api/services/wardService';
import { WardStatus, type Ward } from '~/types/models/ward';

interface WardState {
  wards: Ward[];
  currentWard: Ward | null;
  loading: boolean;
  error: string | null;
  filters: {
    status?: WardStatus;
    department?: string;
    floor?: number;
    building?: string;
  };
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export const useWardStore = defineStore('ward', {
  state: (): WardState => ({
    wards: [],
    currentWard: null,
    loading: false,
    error: null,
    filters: {},
    pagination: {
      page: 1,
      pageSize: 10,
      total: 0,
      totalPages: 0
    }
  }),

  getters: {
    activeWards: (state) =>
      state.wards.filter((ward) => ward.status === WardStatus.ACTIVE),
    wardsByDepartment: (state) => {
      const grouped = state.wards.reduce(
        (acc, ward) => {
          if (!acc[ward.department]) {
            acc[ward.department] = [];
          }
          acc[ward.department].push(ward);
          return acc;
        },
        {} as Record<string, Ward[]>
      );
      return grouped;
    },
    wardOptions(state) {
      return state.wards.map((ward) => ({
        text: `${ward.name} (${ward.department})`,
        value: ward.id
      }));
    }
  },

  actions: {
    // 增加获取所有病区的方法
    async fetchAllWards() {
      try {
        this.loading = true;
        const wards = await wardService.getAllWards();
        this.wards = wards;
      } catch (err) {
        this.error = (err as Error).message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async fetchWards() {
      try {
        this.loading = true;
        const result = await wardService.getWards({
          keyword: '',
          page: this.pagination.page,
          pageSize: this.pagination.pageSize,
          ...this.filters
        });

        this.wards = result.items;
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

    async fetchWardById(id: number) {
      try {
        this.loading = true;
        const ward = await wardService.getWardById(id);
        if (ward) {
          this.currentWard = ward;
        }
        return ward;
      } catch (err) {
        this.error = (err as Error).message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async createWard(ward: Omit<Ward, 'id' | 'totalRooms' | 'totalBeds'>) {
      try {
        this.loading = true;
        await wardService.createWard(ward);
        await this.fetchWards();
      } catch (err) {
        this.error = (err as Error).message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async updateWard(id: number, ward: Partial<Ward>) {
      try {
        this.loading = true;
        await wardService.updateWard(id, ward);
        if (this.currentWard?.id === id) {
          this.currentWard = { ...this.currentWard, ...ward };
        }
        await this.fetchWards();
      } catch (err) {
        this.error = (err as Error).message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async deleteWard(id: number) {
      try {
        this.loading = true;
        await wardService.deleteWard(id);
        if (this.currentWard?.id === id) {
          this.currentWard = null;
        }
        await this.fetchWards();
      } catch (err) {
        this.error = (err as Error).message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    setFilters(filters: WardState['filters']) {
      this.filters = filters;
      this.pagination.page = 1; // 重置页码
      this.fetchWards();
    },

    setPage(page: number) {
      this.pagination.page = page;
      this.fetchWards();
    }
  }
});
