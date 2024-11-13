// 1. 基础类型定义
type EnumMeta = {
  value: string;
  label: string;
  color?: string;
  icon?: string;
  sort?: number;
  [key: string]: any; // 支持扩展其他元数据
};

// 2. 枚举注册器
export class EnumRegistry {
  private static instance: EnumRegistry;
  private enumMap: Map<string, Record<string, EnumMeta>>;

  private constructor() {
    this.enumMap = new Map();
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new EnumRegistry();
    }
    return this.instance;
  }

  // 注册枚举
  register(enumName: string, enumMeta: Record<string, EnumMeta>) {
    this.enumMap.set(enumName, enumMeta);
  }

  // 获取枚举元数据
  getMeta(enumName: string, value: string): EnumMeta | undefined {
    return this.enumMap.get(enumName)?.[value];
  }

  // 获取枚举所有选项
  getOptions(enumName: string) {
    const meta = this.enumMap.get(enumName);
    if (!meta) return [];
    return Object.values(meta)
      .sort((a, b) => (a.sort || 0) - (b.sort || 0))
      .map((item) => ({
        value: item.value,
        label: item.label,
        text: item.label,
        name: item.label
      }));
  }

  // 获取显示文本
  getLabel(enumName: string, value: string): string {
    return this.getMeta(enumName, value)?.label || value;
  }

  // 获取颜色
  getColor(enumName: string, value: string): string {
    return this.getMeta(enumName, value)?.color || '';
  }

  // 获取类型
  getType(enumName: string, value: string): string {
    return this.getMeta(enumName, value)?.type || '';
  }
}
