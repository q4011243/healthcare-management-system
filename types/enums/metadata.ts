// 4. 注册枚举元数据
import { MedicalRecordType } from '../models/medicalRecord';
import {
  MedicationFrequency,
  MedicationRoute,
  MedicationStatus
} from '../models/medication';
import { MedicationReminderStatus } from '../models/medicationReminder';
import { NursingType } from '../models/nursing';
import {
  OrderExecutionAbnormal,
  OrderStatus,
  OrderType
} from '../models/order';
import { PatientStatus } from '../models/patient';
import {
  BedType,
  RoomType,
  BedStatus,
  RoomStatus,
  GenderRequirement,
  EquipmentStatus,
  Gender
} from './enums';
import { EnumRegistry } from './index';

const registry = EnumRegistry.getInstance();

// 注册床位类型
registry.register('BedType', {
  [BedType.NORMAL]: {
    value: BedType.NORMAL,
    label: '普通',
    color: 'blue',
    sort: 1
  },
  [BedType.INTENSIVE]: {
    value: BedType.INTENSIVE,
    label: '监护',
    color: 'red',
    sort: 2
  },
  [BedType.SPECIAL]: {
    value: BedType.SPECIAL,
    label: '特护',
    color: 'orange',
    sort: 3
  }
});

// 注册房间类型
registry.register('RoomType', {
  [RoomType.NORMAL]: {
    value: RoomType.NORMAL,
    label: '普通',
    color: 'blue',
    sort: 1
  },
  [RoomType.INTENSIVE]: {
    value: RoomType.INTENSIVE,
    label: '重症',
    color: 'red',
    sort: 2
  },
  [RoomType.ISOLATION]: {
    value: RoomType.ISOLATION,
    label: '隔离',
    color: 'red',
    sort: 3
  }
});

// 注册病人状态
registry.register('PatientStatus', {
  [PatientStatus.ADMITTED]: {
    value: PatientStatus.ADMITTED,
    label: '入院',
    type: 'success',
    color: 'blue',
    sort: 1
  },
  [PatientStatus.DISCHARGED]: {
    value: PatientStatus.DISCHARGED,
    label: '出院',
    type: 'warning',
    color: 'gray',
    sort: 2
  },
  [PatientStatus.TRANSFERRED]: {
    value: PatientStatus.TRANSFERRED,
    label: '转院',
    type: 'warning',
    color: 'green',
    sort: 3
  }
});

// 注册床位状态
registry.register('BedStatus', {
  [BedStatus.AVAILABLE]: {
    value: BedStatus.AVAILABLE,
    label: '空闲',
    color: 'blue',
    type: 'success',
    sort: 1
  },
  [BedStatus.OCCUPIED]: {
    value: BedStatus.OCCUPIED,
    label: '使用中',
    color: 'green',
    type: 'success',
    sort: 2
  },
  [BedStatus.MAINTENANCE]: {
    value: BedStatus.MAINTENANCE,
    label: '维护中',
    color: 'gray',
    type: 'warning',
    sort: 3
  }
});

// 注册房间状态
registry.register('RoomStatus', {
  [RoomStatus.AVAILABLE]: {
    value: RoomStatus.AVAILABLE,
    label: '可用',
    color: 'blue',
    type: 'success',
    sort: 1
  },
  [RoomStatus.MAINTENANCE]: {
    value: RoomStatus.MAINTENANCE,
    label: '维护',
    color: 'gray',
    type: 'warning',
    sort: 2
  },
  [RoomStatus.DISABLED]: {
    value: RoomStatus.DISABLED,
    label: '停用',
    color: 'gray',
    type: 'danger',
    sort: 3
  },
  [RoomStatus.OCCUPIED]: {
    value: RoomStatus.OCCUPIED,
    label: '占用',
    color: 'green',
    type: 'success',
    sort: 4
  }
});

// 注册性别要求
registry.register('GenderRequirement', {
  [GenderRequirement.MALE]: {
    value: GenderRequirement.MALE,
    label: '男',
    type: 'success'
  },
  [GenderRequirement.FEMALE]: {
    value: GenderRequirement.FEMALE,
    label: '女',
    type: 'success'
  },
  [GenderRequirement.ANY]: {
    value: GenderRequirement.ANY,
    label: '不限',
    type: 'success'
  }
});

// 注册设备状态
registry.register('EquipmentStatus', {
  [EquipmentStatus.NORMAL]: {
    value: EquipmentStatus.NORMAL,
    label: '正常',
    type: 'success'
  },
  [EquipmentStatus.MAINTENANCE]: {
    value: EquipmentStatus.MAINTENANCE,
    label: '维护',
    type: 'warning'
  },
  [EquipmentStatus.MALFUNCTION]: {
    value: EquipmentStatus.MALFUNCTION,
    label: '故障',
    type: 'danger'
  }
});

// 注册性别
registry.register('Gender', {
  [Gender.MALE]: {
    value: Gender.MALE,
    label: '男',
    type: 'success'
  },
  [Gender.FEMALE]: {
    value: Gender.FEMALE,
    label: '女',
    type: 'success'
  }
});

registry.register('MedicalRecordType', {
  [MedicalRecordType.ADMISSION]: {
    value: MedicalRecordType.ADMISSION,
    label: '入院记录',
    type: 'success'
  },
  [MedicalRecordType.REGULAR]: {
    value: MedicalRecordType.REGULAR,
    label: '日常记录',
    type: 'warning'
  },
  [MedicalRecordType.DISCHARGE]: {
    value: MedicalRecordType.DISCHARGE,
    label: '出院记录',
    type: 'danger'
  }
});

// 注册护理类型
registry.register('NursingType', {
  [NursingType.OTHER]: {
    value: NursingType.OTHER,
    label: '其他',
    type: 'success'
  },
  [NursingType.MEDICATION]: {
    value: NursingType.MEDICATION,
    label: '用药',
    type: 'success'
  },
  [NursingType.DRESSING]: {
    value: NursingType.DRESSING,
    label: '换药',
    type: 'success'
  },
  [NursingType.FEEDING]: {
    value: NursingType.FEEDING,
    label: '饮食',
    type: 'success'
  },
  [NursingType.CLEANING]: {
    value: NursingType.CLEANING,
    label: '清洁',
    type: 'success'
  },
  [NursingType.OBSERVATION]: {
    value: NursingType.OBSERVATION,
    label: '观察',
    type: 'success'
  }
});

// 注册用药状态
registry.register('MedicationStatus', {
  [MedicationStatus.ACTIVE]: {
    value: MedicationStatus.ACTIVE,
    label: '进行中',
    type: 'success'
  },
  [MedicationStatus.COMPLETED]: {
    value: MedicationStatus.COMPLETED,
    label: '已完成',
    type: 'success'
  },
  [MedicationStatus.DISCONTINUED]: {
    value: MedicationStatus.DISCONTINUED,
    label: '已停用',
    type: 'danger'
  }
});

// 注册用药频率
registry.register('MedicationFrequency', {
  [MedicationFrequency.ONCE]: {
    value: MedicationFrequency.ONCE,
    label: '一次',
    type: 'success'
  },
  [MedicationFrequency.DAILY]: {
    value: MedicationFrequency.DAILY,
    label: '每天',
    type: 'success'
  },
  [MedicationFrequency.BID]: {
    value: MedicationFrequency.BID,
    label: '每天两次',
    type: 'success'
  },
  [MedicationFrequency.TID]: {
    value: MedicationFrequency.TID,
    label: '每天三次',
    type: 'success'
  },
  [MedicationFrequency.QID]: {
    value: MedicationFrequency.QID,
    label: '每天四次',
    type: 'success'
  },
  [MedicationFrequency.PRN]: {
    value: MedicationFrequency.PRN,
    label: '按需',
    type: 'success'
  }
});

registry.register('MedicationRoute', {
  [MedicationRoute.ORAL]: {
    value: MedicationRoute.ORAL,
    label: '口服',
    type: 'success'
  },
  [MedicationRoute.INJECTION]: {
    value: MedicationRoute.INJECTION,
    label: '注射',
    type: 'success'
  },
  [MedicationRoute.TOPICAL]: {
    value: MedicationRoute.TOPICAL,
    label: '外用',
    type: 'success'
  },
  [MedicationRoute.INHALATION]: {
    value: MedicationRoute.INHALATION,
    label: '吸入',
    type: 'success'
  }
});

// 注册提醒状态
registry.register('MedicationReminderStatus', {
  [MedicationReminderStatus.PENDING]: {
    value: MedicationReminderStatus.PENDING,
    label: '待执行',
    type: 'warning'
  },
  [MedicationReminderStatus.COMPLETED]: {
    value: MedicationReminderStatus.COMPLETED,
    label: '已完成',
    type: 'success'
  },
  [MedicationReminderStatus.MISSED]: {
    value: MedicationReminderStatus.MISSED,
    label: '已错过',
    type: 'danger'
  },
  [MedicationReminderStatus.CANCELLED]: {
    value: MedicationReminderStatus.CANCELLED,
    label: '已取消',
    type: 'danger'
  },
  [MedicationReminderStatus.NULL]: {
    value: MedicationReminderStatus.NULL,
    label: '空',
    type: 'default'
  }
});

// 注册医嘱类型
registry.register('OrderType', {
  [OrderType.LONG_TERM]: {
    value: OrderType.LONG_TERM,
    label: '长期医嘱',
    type: 'success'
  },
  [OrderType.TEMPORARY]: {
    value: OrderType.TEMPORARY,
    label: '临时医嘱',
    type: 'warning'
  }
});

// 注册医嘱状态
registry.register('OrderStatus', {
  [OrderStatus.PENDING]: {
    value: OrderStatus.PENDING,
    label: '待审核',
    type: 'warning'
  },
  [OrderStatus.APPROVED]: {
    value: OrderStatus.APPROVED,
    label: '已审核',
    type: 'success'
  },
  [OrderStatus.EXECUTING]: {
    value: OrderStatus.EXECUTING,
    label: '执行中',
    type: 'primary'
  },
  [OrderStatus.COMPLETED]: {
    value: OrderStatus.COMPLETED,
    label: '已完成',
    type: 'success'
  },
  [OrderStatus.STOPPED]: {
    value: OrderStatus.STOPPED,
    label: '已停止',
    type: 'default'
  },
  [OrderStatus.REJECTED]: {
    value: OrderStatus.REJECTED,
    label: '已驳回',
    type: 'danger'
  }
});

// 注册执行状态
registry.register('OrderExecutionAbnormal', {
  [OrderExecutionAbnormal.NORMAL]: {
    value: OrderExecutionAbnormal.NORMAL,
    label: '正常',
    type: 'success'
  },
  [OrderExecutionAbnormal.ABNORMAL]: {
    value: OrderExecutionAbnormal.ABNORMAL,
    label: '异常',
    type: 'danger'
  }
});

// 5. 创建 Hook 便于在组件中使用
export const useEnum = () => {
  return {
    registry: EnumRegistry.getInstance(),
    // 便捷方法
    getLabel: (enumName: string, value: string) =>
      registry.getLabel(enumName, value),
    getOptions: (enumName: string) => registry.getOptions(enumName),
    getColor: (enumName: string, value: string) =>
      registry.getColor(enumName, value),
    getType: (enumName: string, value: string) =>
      registry.getType(enumName, value)
  };
};
