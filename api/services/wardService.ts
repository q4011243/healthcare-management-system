import { db } from '~/api/db/database';
import { WardStatus, type Ward } from '~/types/models/ward';
import type { PaginatedResult, SearchParams } from '~/types/models';

interface WardSearchParams extends SearchParams {
  status?: WardStatus;
  department?: string;
  floor?: number;
  building?: string;
}

export class WardService {
  async getAllWards(): Promise<Ward[]> {
    return await db.wards.toArray();
  }

  async getWards(params: WardSearchParams): Promise<PaginatedResult<Ward>> {
    console.log('params', params);
    const { keyword, page, pageSize, status, department, floor, building } =
      params;

    let query = db.wards.orderBy('code');

    // 高级筛选
    if (status) {
      query = query.filter((ward) => ward.status === status);
    }
    if (department) {
      query = query.filter((ward) => ward.department === department);
    }
    if (floor) {
      query = query.filter((ward) => ward.floor === floor);
    }
    if (building) {
      query = query.filter((ward) => ward.building === building);
    }

    // 关键字搜索
    if (keyword) {
      query = query.filter(
        (ward) =>
          ward.name.toLowerCase().includes(keyword.toLowerCase()) ||
          ward.code.toLowerCase().includes(keyword.toLowerCase()) ||
          ward.department.toLowerCase().includes(keyword.toLowerCase())
      );
    }

    const total = await query.count();
    const items = await query
      .offset((page - 1) * pageSize)
      .limit(pageSize)
      .toArray();

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }

  async getWardById(id: number): Promise<Ward | undefined> {
    return await db.wards.get(id);
  }

  async createWard(
    ward: Omit<Ward, 'id' | 'totalRooms' | 'totalBeds'>
  ): Promise<number> {
    const newWard = {
      ...ward,
      totalRooms: 0,
      totalBeds: 0,
      status: WardStatus.ACTIVE
    };
    return await db.wards.add(newWard);
  }

  async updateWard(id: number, ward: Partial<Ward>): Promise<number> {
    await db.wards.update(id, ward);
    return id;
  }

  async deleteWard(id: number): Promise<void> {
    // 检查是否存在关联的房间
    const hasRooms = (await db.rooms.where('wardId').equals(id).count()) > 0;
    if (hasRooms) {
      throw new Error('该病区存在关联的房间，无法删除');
    }
    await db.wards.delete(id);
  }

  // 更新病区统计数据
  async updateWardStats(wardId: number): Promise<void> {
    const rooms = await db.rooms.where('wardId').equals(wardId).toArray();
    const totalRooms = rooms.length;
    const totalBeds = rooms.reduce((sum, room) => sum + room.capacity, 0);

    await db.wards.update(wardId, {
      totalRooms,
      totalBeds
    });
  }
}

export const wardService = new WardService();
