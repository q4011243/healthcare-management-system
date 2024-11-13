import { defineStore } from 'pinia';
import { userService } from '~/services/userService';
import type { User } from '~/types/models/user';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    token: null as string | null,
    loading: false,
    error: null as string | null
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    userRoles: (state) => state.user?.roleIds,
    isAdmin: (state) => state.user?.roleIds.includes(1)
  },

  actions: {
    async emergencyAccess() {
      return true;
    },
    async register(userData: Omit<User, 'id' | 'createdAt' | 'status'>) {
      this.loading = true;
      this.error = null;
      try {
        await userService.register(userData);
        // 注册成功后自动登录
        await this.login(userData.username, userData.password);
      } catch (err: any) {
        this.error = err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async login(username: string, password: string) {
      this.loading = true;
      this.error = null;
      try {
        const { user, token } = await userService.login(username, password);
        this.user = user;
        this.token = token;
        // 存储token到localStorage
        localStorage.setItem('auth_token', token);
      } catch (err: any) {
        this.error = err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async logout() {
      if (this.token) {
        await userService.logout(this.token);
        localStorage.removeItem('auth_token');
        this.user = null;
        this.token = null;
      }
    },

    async checkAuth() {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const user = await userService.validateSession(token);
          this.user = user;
          this.token = token;
        } catch {
          this.logout();
        }
      }
    }
  }
});
