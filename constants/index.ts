/**
 * 分页相关常量
 */
export const PAGINATION = {
  /** 默认每页条数 */
  DEFAULT_PAGE_SIZE: 20,
  /** 默认当前页 */
  DEFAULT_CURRENT_PAGE: 1
} as const;

/**
 * 时间相关常量
 */
export const TIME = {
  /** 一天的开始时间 - 00:00:00.000 */
  DAY_START: {
    HOURS: 0,
    MINUTES: 0,
    SECONDS: 0,
    MILLISECONDS: 0
  },
  /** 一天的结束时间 - 23:59:59.999 */
  DAY_END: {
    HOURS: 23,
    MINUTES: 59,
    SECONDS: 59,
    MILLISECONDS: 999
  }
} as const;
