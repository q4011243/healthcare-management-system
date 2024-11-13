import { defineStore } from 'pinia';
import { db } from '~/api/db/database';
import {
  OrderExecutionAbnormal,
  OrderStatus,
  OrderType,
  type Order
} from '~/types/models/order';
import type { OrderExecution } from '~/types/models/order';
import type { OrderQueryParams } from '~/types/queryParam';
import { PAGINATION, TIME } from '@/constants';

export const useOrderStore = defineStore('order', {
  state: () => ({
    orders: [] as Order[],
    executions: [] as OrderExecution[],
    todayExecutions: [] as OrderExecution[],
    abnormalExecutions: [] as OrderExecution[],
    currentOrder: null as Order | null,
    loading: false,
    error: null as string | null
  }),

  actions: {
    async fetchOrdersPage(
      filters: OrderQueryParams = {
        page: 1,
        pageSize: 20
      }
    ) {
      filters.page = filters.page || 1;
      filters.pageSize = filters.pageSize || 20;
      // 实现获取医嘱列表
      const orders = await db.orders
        .filter((order) => {
          // Only filter by type if provided
          if (filters?.type && order.type !== filters.type) {
            return false;
          }

          // Only filter by status if provided
          if (
            filters?.status?.length &&
            !filters.status.includes(order.status)
          ) {
            return false;
          }

          // Only filter by search text if provided
          if (
            filters?.searchText &&
            !order.content.includes(filters.searchText)
          ) {
            return false;
          }

          return true;
        })
        .offset((filters.page - 1) * filters.pageSize)
        .limit(filters.pageSize)
        .toArray();

      // 关联病人信息
      for (const order of orders) {
        order.patient = await db.patients.get(order.patientId);
      }

      // 获取医生信息
      for (const order of orders) {
        order.doctor = await db.users.get(order.doctorId);
      }

      this.orders = orders;
      return orders;
    },
    async createOrder(order: Omit<Order, 'id'>) {
      // 实现创建医嘱
      const newOrder = await db.orders.add({
        ...order,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      this.orders.push(newOrder);
      return newOrder;
    },
    async updateOrderStatus(
      orderId: number,
      status: OrderStatus,
      options: {
        reviewerId?: number;
        reviewTime?: Date;
        reviewNotes?: string;
      } = {}
    ) {
      // 实现更新医嘱状态
      await db.orders.update(orderId, { status, ...options });
      const index = this.orders.findIndex((order) => order.id === orderId);
      if (index !== -1) {
        this.orders[index].status = status;
      }
    },
    async recordExecution(execution: Omit<OrderExecution, 'id'>) {
      try {
        this.loading = true;
        const id = await db.orderExecutions.add({
          ...execution,
          createdAt: new Date()
        });

        // 如果是临时医嘱且执行完成，自动更新医嘱状态
        const order = await db.orders.get(execution.orderId);
        if (order?.type === OrderType.TEMPORARY) {
          await this.updateOrderStatus(
            execution.orderId,
            OrderStatus.COMPLETED
          );
        }

        return id;
      } catch (error) {
        this.error = '记录执行情况失败';
        return false;
      } finally {
        this.loading = false;
      }
    },
    async clearOrders() {
      this.orders = [];
    },
    async fetchOrderById(id: number) {
      try {
        this.loading = true;
        const order = await db.orders.get(id);
        if (order) {
          order.patient = await usePatientStore().fetchPatientById(
            order.patientId
          );
          order.doctor = await db.users.get(order.doctorId);
        }

        return order;
      } catch (error) {
        this.error = '获取医嘱详情失败';
        return null;
      } finally {
        this.loading = false;
      }
    },
    async deleteOrder(id: number) {
      await db.orders.delete(id);
      this.orders = this.orders.filter((order) => order.id !== id);
    },
    async fetchOrderExecutions(orderId: number) {
      try {
        this.loading = true;
        const executions = await db.orderExecutions
          .where('orderId')
          .equals(orderId)
          .reverse()
          .sortBy('executionTime');

        // 获取执行护士信息
        for (const execution of executions) {
          execution.nurse = await db.users.get(execution.nurseId);
        }

        return executions;
      } catch (error) {
        this.error = '获取执行记录失败';
        return [];
      } finally {
        this.loading = false;
      }
    },
    async stopOrder(orderId: number, reason: string) {
      try {
        this.loading = true;
        await db.orders.update(orderId, {
          status: OrderStatus.STOPPED,
          notes: reason,
          updatedAt: new Date()
        });

        if (this.currentOrder?.id === orderId) {
          this.currentOrder.status = OrderStatus.STOPPED;
          this.currentOrder.notes = reason;
          this.currentOrder.updatedAt = new Date();
        }

        return true;
      } catch (error) {
        this.error = '停止医嘱失败';
        return false;
      } finally {
        this.loading = false;
      }
    },
    async updateOrder(orderId: number, data: Partial<Order>) {
      try {
        this.loading = true;
        await db.orders.update(orderId, {
          ...data,
          updatedAt: new Date()
        });

        if (this.currentOrder?.id === orderId) {
          this.currentOrder = {
            ...this.currentOrder,
            ...data,
            updatedAt: new Date()
          };
        }

        return true;
      } catch (error) {
        this.error = '更新医嘱失败';
        return false;
      } finally {
        this.loading = false;
      }
    },
    async receiveOrder(orderId: number, nurseId: number) {
      try {
        this.loading = true;
        await db.orders.update(orderId, {
          status: OrderStatus.EXECUTING,
          updatedAt: new Date()
        });

        return true;
      } catch (error) {
        this.error = '接收医嘱失败';
        return false;
      } finally {
        this.loading = false;
      }
    },
    async reportException(
      orderId: number,
      exception: {
        description: string;
        severity: 'LOW' | 'MEDIUM' | 'HIGH';
      }
    ) {
      try {
        const nurseId = useAuthStore().user?.id;
        if (!nurseId) {
          this.error = '获取护士ID失败';
          return false;
        }

        this.loading = true;
        await db.orderExecutions.add({
          orderId,
          nurseId,
          abnormal: OrderExecutionAbnormal.ABNORMAL,
          abnormalDesc: exception.description,
          executionTime: new Date(),
          status: 'EXCEPTION',
          createdAt: new Date()
        });

        // 如果是高严重度异常，自动停止医嘱
        if (exception.severity === 'HIGH') {
          await this.updateOrderStatus(orderId, OrderStatus.STOPPED);
        }

        return true;
      } catch (error) {
        this.error = '报告异常失败';
        return false;
      } finally {
        this.loading = false;
      }
    },
    async fetchTodayExecutions(page: number) {
      const startOfDay = new Date();
      startOfDay.setHours(
        TIME.DAY_START.HOURS,
        TIME.DAY_START.MINUTES,
        TIME.DAY_START.SECONDS,
        TIME.DAY_START.MILLISECONDS
      );

      const endOfDay = new Date();
      endOfDay.setHours(
        TIME.DAY_END.HOURS,
        TIME.DAY_END.MINUTES,
        TIME.DAY_END.SECONDS,
        TIME.DAY_END.MILLISECONDS
      );

      const executions = await db.orderExecutions
        .where('executionTime')
        .between(startOfDay, endOfDay)
        .offset((page - 1) * PAGINATION.DEFAULT_PAGE_SIZE)
        .limit(PAGINATION.DEFAULT_PAGE_SIZE)
        .toArray();

      // 关联医嘱
      for (const execution of executions) {
        const order = await this.fetchOrderById(execution.orderId);
        if (order) {
          execution.order = order;
        }
      }

      this.todayExecutions = executions;
      return executions;
    },
    async fetchAbnormalExecutions(page: number) {
      const executions = await db.orderExecutions
        .where('abnormal')
        .equals(OrderExecutionAbnormal.ABNORMAL)
        .offset((page - 1) * PAGINATION.DEFAULT_PAGE_SIZE)
        .limit(PAGINATION.DEFAULT_PAGE_SIZE)
        .toArray();

      // 关联医嘱
      for (const execution of executions) {
        const order = await this.fetchOrderById(execution.orderId);
        if (order) {
          execution.order = order;
        }
      }

      this.abnormalExecutions = executions;
      return executions;
    },
    async fetchAllExecutions() {
      this.executions = await db.orderExecutions.toArray();
    },
    async fetchAllOrders() {
      this.orders = await db.orders.toArray();
    }
  }
});
