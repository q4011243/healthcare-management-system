// types/models/ward.ts

import type { BaseModel } from '.';
import type {
  BedStatus,
  BedType,
  GenderRequirement,
  RoomStatus,
  RoomType
} from '../enums/enums';
import type { Patient } from './patient';

// 病区状态枚举
export enum WardStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

// 病区模型
export interface Ward extends BaseModel {
  code: string; // 病区编码
  name: string; // 病区名称
  department: string; // 所属科室
  floor: number; // 所在楼层
  building: string; // 所在建筑
  description?: string; // 描述
  status: WardStatus; // 状态
  totalRooms: number; // 总房间数
  totalBeds: number; // 总床位数
  availableRooms: number; // 空闲房间数
  availableBeds: number; // 空闲床位数
  totalStaff: number; // 总员工数
  doctorCount: number; // 医生人数
  nurseCount: number; // 护士人数
  lastWeekTotalBeds?: number;
  lastWeekAvailableBeds?: number;
  lastWeekTotalRooms?: number;
  lastWeekTotalStaff?: number;
}

// 房间模型
export interface Room extends BaseModel {
  roomNumber: any;
  floor: any;
  patients: any;
  wardId: number; // 所属病区ID
  code: string; // 房间编码
  name: string; // 房间名称
  type: RoomType; // 房间类型
  capacity: number; // 容纳床位数
  status: RoomStatus; // 状态
  gender: GenderRequirement; // 性别要求
  hasOxygen: boolean; // 是否有供氧
  hasToilet: boolean; // 是否有卫生间
  hasShower: boolean; // 是否有淋浴
  hasTV: boolean; // 是否有电视
  equipmentIds: number[]; // 设备ID列表
  equipments: RoomEquipment[]; // 设备列表
  lastCleanedAt: Date; // 最后清洁时间
  lastUpdate: Date; // 最后更新时间
  nextCleaningDate: Date; // 下次清洁时间
  bedIds: number[]; // 床位ID列表
  beds?: Bed[]; // 床位列表
}

// 床位模型
export interface Bed extends BaseModel {
  roomId: number; // 所属房间ID
  room?: Room;
  wardId?: number; // 所属病区ID
  ward?: Ward;
  code: string; // 床位编码
  name: string; // 床位名称
  status: BedStatus; // 状态
  type: BedType; // 床位类型
  hasCall: boolean; // 是否有呼叫器
  lastMaintainedAt?: Date; // 最后维护时间
  patientId?: number; // 患者ID
  patient?: Patient;
  lastAssignedAt?: Date;
  lastReleasedAt?: Date;
  maintenanceInfo?: {
    reason: string;
    estimatedDuration: number;
  };
  cleaningNote?: string; // 清洁备注
}

// 清洁类型枚举
export enum CleaningType {
  ROUTINE = 'routine', // 日常清洁
  DEEP = 'deep', // 深度清洁
  EMERGENCY = 'emergency' // 紧急清洁
}

// 清洁记录模型
export interface CleaningRecord extends BaseModel {
  roomId: number; // 房间ID
  staffId: number; // 清洁人员ID
  cleanedAt: Date; // 清洁时间
  type: CleaningType; // 清洁类型
  status: string; // 状态
  remarks?: string; // 备注
}

// 病区员工角色枚举
export enum WardStaffRole {
  NURSE = 'nurse',
  DOCTOR = 'doctor',
  MANAGER = 'manager'
}

// 病区员工模型
export interface WardStaff extends BaseModel {
  wardId: number; // 病区ID
  userId: number; // 用户ID
  role: WardStaffRole; // 角色
  shift: string; // 班次
  isActive: boolean; // 是否在职
}

// 设备模型
export interface RoomEquipment extends BaseModel {
  roomId: number; // 房间ID
  name: string; // 设备名称
  code: string; // 设备编码
  status: string; // 状态
  lastMaintainedAt?: Date; // 最后维护时间
  nextMaintainDate?: Date; // 下次维护日期
}

export interface BedAssignment extends BaseModel {
  bedId?: number; // 床位ID
  patientId?: number; // 患者ID
  patientName?: string; // 患者姓名
  admissionDate?: Date; // 入院日期
  assignmentType: string; // 分配类型
  note?: string; // 备注
}

export interface BedRelease extends BaseModel {
  bedId: number; // 床位ID
  releasedAt: Date; // 释放时间
  previousPatientId: number; // 之前患者ID
}
