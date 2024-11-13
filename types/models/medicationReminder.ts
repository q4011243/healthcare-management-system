import type { BaseModel } from '.';

export interface MedicationReminder extends BaseModel {
  patientId: number;
  medicationRecordId: number;
  reminderTime: Date;
  status: MedicationReminderStatus;
  notes?: string;
  medicationName?: string;
}

export interface ReminderSettings {
  enabled: boolean;
  notifyBefore: number; // minutes
  repeatInterval?: number; // minutes, for repeated medications
}

export enum MedicationReminderStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  MISSED = 'MISSED',
  CANCELLED = 'CANCELLED',
  NULL = 'NULL'
}
