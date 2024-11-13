import type { BaseModel } from '.';

export interface VitalSigns extends BaseModel {
  patientId: number;
  temperature: number;
  pulseRate: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  respiratoryRate: number;
  oxygenSaturation: number;
  consciousness: ConsciousnessType;
  notes?: string;
  recordedBy: string;
  recordedAt: Date;
}

export interface VitalSignsAlert {
  type: AlertType;
  parameter: keyof VitalSigns;
  threshold: number;
  message: string;
}

export enum AlertType {
  HIGH = 'HIGH',
  LOW = 'LOW'
}

export enum ConsciousnessType {
  ALERT = 'ALERT',
  VERBAL = 'VERBAL',
  PAIN = 'PAIN',
  UNRESPONSIVE = 'UNRESPONSIVE'
}
