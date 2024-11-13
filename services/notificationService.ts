import { showNotify } from 'vant';

export class NotificationService {
  private static instance: NotificationService;
  private worker: ServiceWorker | null = null;

  private constructor() {
    this.initServiceWorker();
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new NotificationService();
    }
    return this.instance;
  }

  private async initServiceWorker() {
    if ('serviceWorker' in navigator && 'Notification' in window) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        this.worker = registration.active;
      } catch (error) {
        console.error('Service Worker 注册失败:', error);
      }
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  async sendNotification(title: string, options: NotificationOptions = {}) {
    // 先尝试系统通知
    if ('Notification' in window && Notification.permission === 'granted') {
      return new Notification(title, options);
    }

    // 降级到应用内通知
    showNotify({
      type: 'primary',
      message: title,
      duration: 4000
    });
  }
}

export const notificationService = NotificationService.getInstance();
