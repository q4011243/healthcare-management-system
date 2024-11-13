// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // 设置为纯客户端渲染模式
  ssr: false,

  modules: ['@pinia/nuxt', '@nuxt/eslint', '@nuxtjs/tailwindcss', '@vant/nuxt'],

  // 应用模式
  app: {
    // 设置为 SPA 模式
    baseURL: '/',
    buildAssetsDir: 'assets',
    head: {
      title: '医院管理系统',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          hid: 'description',
          name: 'description',
          content: '医院管理系统 - 离线版'
        }
      ]
    },
    // 页面切换时的过渡效果
    pageTransition: {
      name: 'page',
      mode: 'out-in'
    },
    // 布局切换时的过渡效果
    layoutTransition: {
      name: 'layout',
      mode: 'out-in'
    }
  },

  devtools: { enabled: true },

  // Vant 配置
  vant: {
    // 配置项
  },

  // 构建配置
  build: {
    transpile: ['vue-demi', 'echarts']
  },

  // 运行时配置
  runtimeConfig: {
    public: {
      // 这里可以添加一些公共配置，如版本号等
      appVersion: '1.0.0'
    }
  },

  // 开发服务器配置
  devServer: {
    port: 3000
  },

  // TypeScript 配置
  typescript: {
    strict: true
  },

  // 自动导入组件
  components: [
    {
      path: '~/components',
      pathPrefix: false
    }
  ],

  // Vite 配置
  vite: {
    // 如果需要，可以在这里添加 Vite 特定的配置
  },

  compatibilityDate: '2024-10-22'
});
