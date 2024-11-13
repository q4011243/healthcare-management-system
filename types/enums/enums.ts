// 3. 定义所有枚举
// 床位类型枚举
export enum BedType {
  NORMAL = 'normal', // 普通
  INTENSIVE = 'intensive', // 监护
  SPECIAL = 'special' // 特护
}

export enum RoomType {
  NORMAL = 'normal', // 普通
  INTENSIVE = 'intensive', // 重症
  ISOLATION = 'isolation' // 隔离
}

// 床位状态枚举
export enum BedStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  MAINTENANCE = 'maintenance',
  CLEANING = 'cleaning',
  OUT_OF_SERVICE = 'out_of_service'
}

// 房间状态枚举
export enum RoomStatus {
  AVAILABLE = 'available',
  MAINTENANCE = 'maintenance',
  DISABLED = 'disabled',
  OCCUPIED = 'occupied'
}

// 性别要求枚举
export enum GenderRequirement {
  MALE = 'male',
  FEMALE = 'female',
  ANY = 'any'
}
// 设备状态枚举
export enum EquipmentStatus {
  NORMAL = 'normal',
  MAINTENANCE = 'maintenance',
  MALFUNCTION = 'malfunction'
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE'
}
