import type { BaseModel } from '.';

export interface NursingRecord extends BaseModel {
  patientId: number;
  type: NursingType;
  description: string;
  notes?: string;
  performedBy: string;
  performedAt: Date;
}

export enum NursingType {
  MEDICATION = 'MEDICATION', // 用药
  DRESSING = 'DRESSING', // 换药
  FEEDING = 'FEEDING', // 饮食
  CLEANING = 'CLEANING', // 清洁
  OBSERVATION = 'OBSERVATION', // 观察
  OTHER = 'OTHER' // 其他
}
