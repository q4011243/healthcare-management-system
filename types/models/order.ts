import type { BaseModel } from '.';
import type { Patient } from './patient';
import type { User } from './user';

export enum OrderType {
  LONG_TERM = 'LONG_TERM', // 长期医嘱
  TEMPORARY = 'TEMPORARY' // 临时医嘱
}

export enum OrderStatus {
  PENDING = 'PENDING', // 待审核
  APPROVED = 'APPROVED', // 已审核
  EXECUTING = 'EXECUTING', // 执行中
  COMPLETED = 'COMPLETED', // 已完成
  STOPPED = 'STOPPED', // 已停止
  REJECTED = 'REJECTED' // 已驳回
}

export enum OrderExecutionAbnormal {
  NORMAL = 'NORMAL', // 正常
  ABNORMAL = 'ABNORMAL' // 异常
}

export interface Order extends BaseModel {
  patientId: number; // 患者ID
  patient?: Patient; // 患者
  doctorId: number; // 开具医生ID
  doctor?: User; // 开具医生
  doctorName?: string; // 开具医生姓名
  type: OrderType; // 医嘱类型
  status: OrderStatus; // 医嘱状态
  content: string; // 医嘱内容
  startTime: Date; // 开始时间
  endTime?: Date; // 结束时间（可选）
  frequency?: string; // 执行频率
  notes?: string; // 备注说明
  reviewerId?: number; // 审核人ID
  reviewTime?: Date; // 审核时间
  reviewNotes?: string; // 审核意见
  lastExecution?: OrderExecution; // 最近执行
}

export interface OrderExecution extends BaseModel {
  orderId: number; // 医嘱ID
  order?: Order; // 医嘱
  nurseId: number; // 执行护士ID
  nurse?: User; // 执行护士
  executionTime: Date; // 执行时间
  status: string; // 执行状态
  notes?: string; // 执行备注
  abnormal?: OrderExecutionAbnormal; // 是否异常
  abnormalDesc?: string; // 异常描述
}
