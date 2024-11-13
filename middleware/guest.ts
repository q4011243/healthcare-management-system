import { info } from 'autoprefixer';

export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore();

  // 如果用户已登录，重定向到首页
  console.info('访客中间件,authStore 信息：' + authStore.isAuthenticated);
  await authStore.checkAuth();
  if (authStore.isAuthenticated) {
    return navigateTo('/');
  }
});
