import type { BaseModel } from '.';
import type { Gender } from '../enums/enums';

export interface Patient extends BaseModel {
  id?: number;
  name: string;
  gender: Gender;
  age: number;
  idCard: string;
  phone: string;
  admissionDate: Date;
  diagnosis: string;
  status: PatientStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  roomId: number;
  bedId: number;
  room?: {
    name: string;
    // 其他房间相关字段
  };
  bed?: {
    name: string;
    // 其他床位相关字段
  };
  contactName?: string;
  contactPhone?: string;
}

export enum PatientStatus {
  ADMITTED = 'ADMITTED',
  DISCHARGED = 'DISCHARGED',
  TRANSFERRED = 'TRANSFERRED'
}

export interface EmergencyContact {
  id: string;
  patientId: string;
  name: string;
  relationship: string;
  contactNumber: string;
  address?: string;
  isDefault: boolean;
}

// 医保信息
export interface InsuranceInfo {
  id: string;
  patientId: string;
  insuranceType: string;
  insuranceNumber: string;
  validFrom: Date;
  validTo?: Date;
  provider: string;
  coverage: string;
}

// 过敏信息
export interface AllergyInfo {
  id: string;
  patientId: string;
  allergen: string;
  severity: 'mild' | 'moderate' | 'severe';
  reaction: string;
  diagnosedAt: Date;
  notes?: string;
}

// 就医历史
export interface MedicalHistory {
  id: string;
  patientId: string;
  condition: string;
  diagnosisDate: Date;
  hospital: string;
  doctor: string;
  treatment: string;
  outcome: string;
  notes?: string;
}
