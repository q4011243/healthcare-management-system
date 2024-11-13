import { info } from 'autoprefixer';
import { defineStore } from 'pinia';
import { db } from '~/api/db/database';
import { BedStatus } from '~/types/enums/enums';
import { PatientStatus, type Patient } from '~/types/models/patient';

export const usePatientStore = defineStore('patient', {
  state: () => ({
    patients: [] as Patient[],
    currentPatient: null as Patient | null,
    roomPatientsMap: new Map<number, Patient[]>(),
    loading: false,
    error: null as string | null,
    filters: {
      status: [] as PatientStatus[],
      dateRange: null as { start: Date; end: Date } | null
    },
    pagination: {
      page: 1,
      pageSize: 10,
      total: 0
    }
  }),

  getters: {
    getPatientById: (state) => {
      return (id: number) =>
        state.patients.find((patient) => patient.id === id);
    },

    getActivePatients: (state) => {
      return state.patients.filter(
        (patient) => patient.status === PatientStatus.ADMITTED
      );
    },

    filteredPatients: (state) => {
      return state.patients.filter((patient) => {
        const matchStatus =
          state.filters.status.length === 0 ||
          state.filters.status.includes(patient.status as PatientStatus);

        const matchDateRange =
          !state.filters.dateRange ||
          (patient.createdAt >= state.filters.dateRange.start &&
            patient.createdAt <= state.filters.dateRange.end);

        return matchStatus && matchDateRange;
      });
    },

    // 在院患者数量
    inPatientsCount: (state) => {
      return state.patients.filter(
        (patient) => patient.status === PatientStatus.ADMITTED
      ).length;
    },

    // 今日入院患者数量
    todayAdmissionsCount: (state) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return state.patients.filter((patient) => {
        const admissionDate = new Date(patient.createdAt);
        admissionDate.setHours(0, 0, 0, 0);
        return admissionDate.getTime() === today.getTime();
      }).length;
    }
  },

  actions: {
    async fetchPatientById(id: number) {
      const patient = await db.patients.get(id);
      const roomStore = useRoomStore();
      const bedStore = useBedStore();
      if (patient?.roomId) {
        patient.room = await roomStore.fetchRoomById(patient.roomId);
      }
      if (patient?.bedId) {
        patient.bed = await bedStore.getBedById(patient.bedId);
      }
      return patient;
    },
    // 创建新患者
    async createPatient(
      patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>
    ) {
      this.loading = true;
      try {
        const id = await db.patients.add({
          ...patientData,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        const newPatient = await db.patients.get(id);
        if (newPatient) {
          this.patients.push(newPatient);
        }
        return newPatient;
      } catch (error) {
        this.error = '创建患者失败';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // 更新患者信息
    async updatePatient(id: number, data: Partial<Patient>) {
      // 去掉对象字段，比如 room 和 bed
      const { room, bed, ...rest } = data;

      this.loading = true;
      try {
        await db.patients.update(id, {
          ...rest,
          updatedAt: new Date()
        });
        const updatedPatient = await db.patients.get(id);
        if (updatedPatient) {
          const index = this.patients.findIndex((p) => p.id === id);
          if (index !== -1) {
            this.patients[index] = updatedPatient;
          }
        }
        return updatedPatient;
      } catch (error) {
        this.error = '更新患者信息失败';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // 设置筛选条件
    setFilters(filters: Partial<typeof this.filters>) {
      this.filters = {
        ...this.filters,
        ...filters
      };
    },

    // 清除筛选条件
    clearFilters() {
      this.filters = {
        status: [],
        dateRange: null
      };
    },

    // 获取患者详情
    async fetchPatientDetail(id: number) {
      this.loading = true;
      try {
        const patient = await db.patients.get(id);
        if (patient) {
          this.currentPatient = patient;
        }
        return patient;
      } catch (error) {
        this.error = '获取患者详情失败';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // 批量获取患者信息
    async fetchPatients(params?: {
      page?: number;
      pageSize?: number;
      keyword?: string;
    }) {
      this.loading = true;
      try {
        const { page = 1, pageSize = 10, keyword = '' } = params || {};
        this.pagination.page = page;
        this.pagination.pageSize = pageSize;

        let query = db.patients;

        // 关键字搜索
        if (keyword) {
          query = query.filter(
            (patient) =>
              patient.name.includes(keyword) ||
              patient.id.toString().includes(keyword)
          );
        }

        // 计算总数
        const total = await query.count();
        this.pagination.total = total;

        // 分页查询
        const offset = (page - 1) * pageSize;
        const patients = await query.offset(offset).limit(pageSize).toArray();

        // 追加或替换数据
        if (page === 1) {
          this.patients = patients;
        } else {
          this.patients.push(...patients);
        }

        return {
          patients,
          pagination: this.pagination
        };
      } catch (error) {
        this.error = '获取患者列表失败';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // 保留原有的房间患者管理功能
    async fetchPatientsByRoomId(roomId: number) {
      try {
        const beds = await db.beds.where('roomId').equals(roomId).toArray();
        const bedIds = beds.map((bed) => bed.id);
        const patients = await db.patients
          .where('bedId')
          .anyOf(bedIds as number[])
          .toArray();
        this.roomPatientsMap.set(roomId, patients);
        return patients;
      } catch (error) {
        this.error = '获取房间患者信息失败';
        throw error;
      }
    },

    // 获取所有房间的患者信息
    async fetchPatientsForRooms(roomIds: number[]) {
      const patients = await db.patients
        .where('roomId')
        .anyOf(roomIds)
        .toArray();
      // 设置房间患者信息
      roomIds.forEach((roomId) => {
        this.roomPatientsMap.set(
          roomId,
          patients.filter((p) => p.roomId === roomId)
        );
      });
    },

    // 获取某个房间的患者信息
    getPatientsByRoom(roomId: number) {
      return this.roomPatientsMap.get(roomId) || [];
    },

    // 获取某个房间的患者数量
    getPatientsCountByRoom(roomId: number) {
      return this.roomPatientsMap.get(roomId)?.length || 0;
    },

    async deletePatient(id: number) {
      try {
        this.loading = true;
        const patient = await db.patients.get(id);

        if (!patient) {
          throw new Error('患者不存在');
        }

        if (patient.status !== PatientStatus.DISCHARGED) {
          throw new Error('只能删除已出院的患者');
        }

        await db.patients.delete(id);

        // 更新列表
        this.patients = this.patients.filter((p) => p.id !== id);

        return true;
      } catch (error) {
        this.error = (error as Error).message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async dischargePatient(id: number) {
      try {
        const bedStore = useBedStore();
        this.loading = true;
        const patient = await db.patients.get(id);

        if (!patient) {
          throw new Error('患者不存在');
        }

        if (patient.status === PatientStatus.DISCHARGED) {
          throw new Error('患者已出院');
        }

        // 更新患者状态
        await db.patients.update(id, {
          status: PatientStatus.DISCHARGED,
          updatedAt: new Date()
        });

        // 释放床位
        await bedStore.releaseBed(patient.bedId);

        // 更新本地状态
        if (this.currentPatient?.id === id) {
          this.currentPatient.status = PatientStatus.DISCHARGED;
        }

        // 刷新患者列表
        await this.fetchPatients();

        return true;
      } catch (error) {
        this.error = (error as Error).message;
        throw error;
      } finally {
        this.loading = false;
      }
    }
  }
});
