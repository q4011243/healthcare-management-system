import { type Room, type GenderRequirement } from '~/types/models/ward';
import type { PaginatedResult, SearchParams } from '~/types/models';
import { wardService } from './wardService';
import { db } from '~/api/db/database';
import { type RoomType, RoomStatus } from '~/types/enums/enums';

interface RoomSearchParams extends SearchParams {
  type?: RoomType;
  status?: RoomStatus;
  gender?: GenderRequirement;
  hasOxygen?: boolean;
  hasToilet?: boolean;
}

export class RoomService {
  async getRooms(
    wardId: number,
    params: RoomSearchParams
  ): Promise<PaginatedResult<Room>> {
    const {
      keyword,
      page,
      pageSize,
      type,
      status,
      gender,
      hasOxygen,
      hasToilet
    } = params;

    let query = db.rooms.where('wardId').equals(wardId);

    // 高级筛选
    if (type) {
      query = query.filter((room) => room.type === type);
    }
    if (status) {
      query = query.filter((room) => room.status === status);
    }
    if (gender) {
      query = query.filter((room) => room.gender === gender);
    }
    if (hasOxygen !== undefined) {
      query = query.filter((room) => room.hasOxygen === hasOxygen);
    }
    if (hasToilet !== undefined) {
      query = query.filter((room) => room.hasToilet === hasToilet);
    }

    // 关键字搜索
    if (keyword) {
      query = query.filter(
        (room) =>
          room.name.toLowerCase().includes(keyword.toLowerCase()) ||
          room.code.toLowerCase().includes(keyword.toLowerCase())
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

  async getRoomById(id: number): Promise<Room | undefined> {
    return await db.rooms.get(id);
  }

  async createRoom(room: Omit<Room, 'id' | 'lastCleanedAt'>): Promise<number> {
    console.log('room', room);
    const newRoom = {
      ...room,
      lastCleanedAt: new Date(),
      status: RoomStatus.AVAILABLE
    };

    const roomId = await db.rooms.add(newRoom);

    // 更新病区统计数据
    await wardService.updateWardStats(room.wardId);

    return roomId;
  }

  async updateRoom(id: number, room: Partial<Room>): Promise<number> {
    const oldRoom = await db.rooms.get(id);
    if (!oldRoom) {
      throw new Error('房间不存在');
    }

    await db.rooms.update(id, room);

    // 如果更新了容���，需要更新病区统计数据
    if (room.capacity !== undefined) {
      await wardService.updateWardStats(oldRoom.wardId);
    }

    return id;
  }

  async deleteRoom(id: number): Promise<void> {
    const room = await db.rooms.get(id);
    if (!room) {
      throw new Error('房间不存在');
    }

    // 检查是否存在关联的床位
    const hasBeds = (await db.beds.where('roomId').equals(id).count()) > 0;
    if (hasBeds) {
      throw new Error('该房间存在关联的床位，无法删除');
    }

    await db.rooms.delete(id);

    // 更新病区统计数据
    await wardService.updateWardStats(room.wardId);
  }

  // 更新房间清洁时间
  async updateCleaningTime(id: number): Promise<void> {
    await db.rooms.update(id, {
      lastCleanedAt: new Date()
    });
  }

  // 更新房间状态
  async updateRoomStatus(id: number, status: RoomStatus): Promise<void> {
    await db.rooms.update(id, { status });
  }
}

export const roomService = new RoomService();
