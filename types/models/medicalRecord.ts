import type { BaseModel } from '.';
import { useEnum } from '../enums/metadata';

// 医疗记录
export interface MedicalRecord extends BaseModel {
  patientId: number;
  content: string;
  type: MedicalRecordType;
  doctorName: string;
}
export enum MedicalRecordType {
  ADMISSION = 'ADMISSION',
  REGULAR = 'REGULAR',
  DISCHARGE = 'DISCHARGE'
}
