import {
  BedStatus,
  BedType,
  Gender,
  GenderRequirement,
  RoomStatus,
  RoomType
} from '~/types/enums/enums';
import { db } from '../database';
import { PatientStatus } from '~/types/models/patient';
import { WardStatus } from '~/types/models/ward';

// 初始化病区数据
const seedWards = async () => {
  const wards = [
    {
      id: 1,
      code: 'W-01',
      name: '内科病区',
      department: '内科',
      floor: 3,
      building: 'A栋',
      description: '内科综合病区',
      status: WardStatus.ACTIVE,
      totalRooms: 20,
      totalBeds: 60,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 2,
      code: 'W-02',
      name: '外科病区',
      department: '外科',
      floor: 4,
      building: 'A栋',
      description: '外科综合病区',
      status: WardStatus.ACTIVE,
      totalRooms: 15,
      totalBeds: 45,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  await db.wards.bulkPut(wards);
  return wards;
};

// 初始化病房数据
const seedRooms = async () => {
  const rooms = [
    {
      id: 1,
      wardId: 1,
      code: 'R-0101',
      name: '301室',
      type: RoomType.NORMAL,
      capacity: 3,
      status: RoomStatus.AVAILABLE,
      gender: GenderRequirement.MALE,
      hasOxygen: true,
      hasToilet: true,
      lastCleanedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 2,
      wardId: 1,
      code: 'R-0102',
      name: '302室',
      type: RoomType.INTENSIVE,
      capacity: 2,
      status: RoomStatus.AVAILABLE,
      gender: GenderRequirement.ANY,
      hasOxygen: true,
      hasToilet: true,
      lastCleanedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  await db.rooms.bulkPut(rooms);
  return rooms;
};

// 初始化床位数据
const seedBeds = async () => {
  const beds = [
    {
      id: 1,
      roomId: 1,
      code: 'B-010101',
      name: '1号床',
      status: BedStatus.OCCUPIED, // 修改状态为已占用
      type: BedType.NORMAL,
      hasCall: true,
      lastMaintainedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 2,
      roomId: 1,
      code: 'B-010102',
      name: '2号床',
      status: BedStatus.AVAILABLE,
      type: BedType.NORMAL,
      hasCall: true,
      lastMaintainedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 3,
      roomId: 2,
      code: 'B-010201',
      name: '1号床',
      status: BedStatus.OCCUPIED, // 修改状态为已占用
      type: BedType.INTENSIVE,
      hasCall: true,
      lastMaintainedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  await db.beds.bulkPut(beds);
  return beds;
};

// 新增：初始化患者数据
const seedPatients = async () => {
  const patients = [
    {
      id: 1,
      bedId: 1,
      roomId: 1,
      name: '张三',
      gender: Gender.MALE,
      age: 45,
      idCard: '310123198012345678',
      phone: '13812345678',
      emergencyContact: '李四',
      emergencyPhone: '13987654321',
      admissionDate: new Date('2024-01-15'),
      diagnosis: '高血压',
      status: PatientStatus.ADMITTED,
      notes: '需要定期测量血压',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 2,
      bedId: 3,
      roomId: 2,
      name: '王五',
      gender: Gender.MALE,
      age: 62,
      idCard: '310123196012345678',
      phone: '13712345678',
      emergencyContact: '王六',
      emergencyPhone: '13687654321',
      admissionDate: new Date('2024-01-16'),
      diagnosis: '糖尿病',
      status: PatientStatus.ADMITTED,
      notes: '需要监测血糖',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  await db.patients.bulkPut(patients);
  return patients;
};

// 执行所有初始化
export const initializeWardData = async () => {
  try {
    const wards = await seedWards();
    const rooms = await seedRooms();
    const beds = await seedBeds();
    const patients = await seedPatients(); // 添加患者数据初始化

    return {
      wards,
      rooms,
      beds,
      patients // 返回初始化的患者数据
    };
  } catch (error) {
    console.error('初始化病区数据失败:', error);
    throw error;
  }
};
