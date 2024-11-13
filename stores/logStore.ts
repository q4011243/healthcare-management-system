import { defineStore } from 'pinia';
import { db } from '~/api/db/database';
import {
  type OperationLogDetail,
  type LogQueryParams,
  type LogStatistics,
  OperationStatus,
  OperationType,
  ResourceType
} from '~/types/models/log';

export const useLogStore = defineStore('log', {
  state: () => ({
    logs: [] as OperationLogDetail[],
    statistics: null as LogStatistics | null,
    loading: false,
    error: null as Error | null
  }),

  actions: {
    async addLog(logData: Partial<OperationLogDetail>) {
      try {
        const log: OperationLogDetail = {
          ...logData,
          createdAt: new Date(),
          updatedAt: new Date(),
          ip: await this.getClientIP(),
          userAgent: navigator.userAgent,
          status: OperationStatus.SUCCESS,
          duration: 0
        } as OperationLogDetail;

        // 存储到 IndexedDB
        const id = await db.operationLogs.add(log);
        return { ...log, id };
      } catch (error) {
        console.error('Failed to add operation log:', error);
        throw error;
      }
    },

    async queryLogs(params: LogQueryParams) {
      this.loading = true;
      try {
        let query = db.operationLogs.orderBy('createdAt');

        // 应用查询条件
        if (params.startDate) {
          query = query.filter((log) => log.createdAt >= params.startDate!);
        }
        if (params.userId) {
          query = query.filter((log) => log.userId === params.userId);
        }
        // ... 其他查询条件

        const logs = await query.reverse().toArray();
        this.logs = logs;
        return logs;
      } catch (error) {
        console.error('Failed to query logs:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async getStatistics(params: LogQueryParams): Promise<LogStatistics> {
      try {
        const logs = await this.queryLogs(params);
        // 计算统计数据
        const statistics: LogStatistics = {
          totalCount: logs.length,
          successCount: logs.filter(
            (log) => log.status === OperationStatus.SUCCESS
          ).length,
          failureCount: logs.filter(
            (log) => log.status === OperationStatus.FAILURE
          ).length,
          operationCounts: {} as Record<OperationType, number>,
          resourceCounts: {} as Record<ResourceType, number>,
          userCounts: {},
          timeDistribution: {
            hour: {},
            day: {},
            month: {}
          }
        };

        // ... 计算详细统计信息

        this.statistics = statistics;
        return statistics;
      } catch (error) {
        console.error('Failed to get statistics:', error);
        throw error;
      }
    },

    async getClientIP(): Promise<string> {
      // 在实际环境中，这可能需要从服务器获取
      return '127.0.0.1';
    }
  }
});
