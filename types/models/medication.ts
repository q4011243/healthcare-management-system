import type { BaseModel } from '.';

export interface MedicationRecord extends BaseModel {
  patientId: number;
  medicationName: string;
  dosage: string;
  frequency: MedicationFrequency;
  route: MedicationRoute;
  startDate: Date;
  endDate?: Date;
  notes?: string;
  administeredBy: string;
  administeredAt: Date;
  status: MedicationStatus;
}

export enum MedicationFrequency {
  ONCE = 'ONCE', // 一次性
  DAILY = 'DAILY', // 每天
  BID = 'BID', // 每天两次
  TID = 'TID', // 每天三次
  QID = 'QID', // 每天四次
  PRN = 'PRN', // 按需
  NULL = 'NULL' // 无
}

export enum MedicationRoute {
  ORAL = 'ORAL', // 口服
  INJECTION = 'INJECTION', // 注射
  TOPICAL = 'TOPICAL', // 外用
  INHALATION = 'INHALATION', // 吸入
  NULL = 'NULL' // 无
}

export enum MedicationStatus {
  ACTIVE = 'ACTIVE', // 进行中
  COMPLETED = 'COMPLETED', // 已完成
  DISCONTINUED = 'DISCONTINUED' // 已停用
}
