<template>
  <div class="flex min-h-screen flex-col bg-gray-50">
    <!-- 系统状态栏 -->
    <div class="h-safe-area-inset-top bg-primary" />

    <!-- 顶部导航栏 -->
    <van-nav-bar
      class="border-primary/10 bg-primary admin-nav-bar sticky top-0 z-50 border-b shadow-sm"
      fixed
      placeholder>
      <!-- 左侧区域 -->
      <template #left>
        <div class="flex items-center">
          <template v-if="showBack">
            <span @click="handleBack">
              <van-icon name="arrow-left" class="mr-1 !text-white" />
              <span class="text-white">返回</span>
            </span>
          </template>
          <template v-else>
            <van-image
              round
              width="32"
              height="32"
              :src="authStore.user?.avatar || '/default-avatar.png'"
              @click="showUserMenu = true" />
          </template>
        </div>
      </template>

      <!-- 标题区域 -->
      <template #title>
        <div class="flex items-center justify-center">
          <span class="text-white">
            {{ (currentRoute.meta.title as string) || "医院管理系统" }}
          </span>
          <!-- 如果需要显示子标题 -->
          <span v-if="currentRoute.meta.subtitle" class="ml-2 text-xs text-white/70">
            {{ currentRoute.meta.subtitle }}
          </span>
        </div>
      </template>

      <!-- 右侧区域 -->
      <template #right v-if="showRight">
        <div class="flex items-center space-x-4">
          <!-- 搜索按钮 -->
          <van-icon
            v-if="showSearch"
            name="search"
            class="!text-white"
            size="20"
            @click="onSearch" />

          <!-- 通知图标 -->
          <div class="relative" @click="showNotifications">
            <van-badge :content="notificationCount" :max="99" position="top-right">
              <van-icon name="bell" class="!text-white" size="20" />
            </van-badge>
          </div>

          <!-- 更多菜单 -->
          <van-popover
            v-model:show="showMoreMenu"
            placement="bottom-end"
            theme="dark"
            trigger="click"
            :offset="[0, 8]"
            :show-arrow="true">
            <template #reference>
              <van-icon name="ellipsis" class="!text-white" size="20" />
            </template>
            <div class="min-w-[160px] rounded-lg py-1">
              <div
                v-for="item in moreMenuItems"
                :key="item.text"
                class="flex cursor-pointer items-center px-4 py-3 text-sm hover:bg-gray-700"
                @click="handleMoreMenuClick(item)">
                <van-icon :name="item.icon" class="mr-3" />
                {{ item.text }}
              </div>
            </div>
          </van-popover>
        </div>
      </template>
    </van-nav-bar>

    <!-- 主要内容区域 -->
    <main class="flex-1 overflow-auto">
      <slot />
    </main>

    <!-- 底部导航栏 -->
    <van-tabbar
      v-model="activeTab"
      route
      safe-area-inset-bottom
      fixed
      placeholder
      v-if="showTabbar">
      <van-tabbar-item
        v-for="tab in tabbarItems"
        :key="tab.name"
        :to="tab.path"
        :icon="tab.icon"
        :badge="tab.badge">
        {{ tab.name }}
      </van-tabbar-item>
    </van-tabbar>

    <!-- 底部安全区域 -->
    <div class="h-safe-area-inset-bottom" />

    <!-- 添加通知弹出层 -->
    <van-popup
      v-model:show="showNotificationList"
      position="right"
      :style="{ width: '80%', height: '100%' }">
      <div class="flex h-full flex-col">
        <van-nav-bar title="通知中心" left-arrow @click-left="showNotificationList = false" />
        <NotificationList class="flex-1 overflow-auto" />
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "~/stores/auth";
// import { useNotificationStore } from "~/stores/notification";
import NotificationList from "~/components/notification/NotificationList.vue";
import { useMedicationReminderStore } from "~/stores/medicationReminderStore";
import { useVitalSignsStore } from "~/stores/vitalSignsStore";
import type { MedicationReminder } from "~/types/models/medicationReminder";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
// const notificationStore = useNotificationStore();
const showNotificationList = ref(false);
const reminderStore = useMedicationReminderStore();
const vitalSignsStore = useVitalSignsStore();

// 当前路由信息
const currentRoute = computed(() => route);

// 是否显示返回按钮
const showBack = computed(() => {
  return route.meta.showBack !== false && route.path !== "/";
});

// 是否显示底部标签栏
const showTabbar = computed(() => {
  return route.meta.showTabbar !== false;
});

// 是否显示右侧操作区
const showRight = computed(() => {
  return route.meta.showRight !== false;
});

// 处理返回操作
const handleBack = () => {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push("/");
  }
};

// 底部标签栏配置
const activeTab = ref(0);
const tabbarItems = [
  { name: "首页", icon: "home-o", path: "/" },
  { name: "病区", icon: "records", path: "/ward", badge: "2" },
  { name: "患者", icon: "friends-o", path: "/patients" },
  { name: "医嘱", icon: "records", path: "/orders" },
  { name: "我的", icon: "setting-o", path: "/profile" }
];

// 用户菜单
const showUserMenu = ref(false);
const userMenuItems = [
  { text: "个人资料", action: "profile" },
  { text: "系统设置", action: "settings" },
  { text: "退出登录", action: "logout" }
];

// 通知数量
// const notificationCount = computed(() => notificationStore.unreadCount);

const todayReminders = ref<MedicationReminder[]>([]);

const notificationCount = computed(() => {
  const pendingReminders = todayReminders.value.filter((r) => r.status === "PENDING").length;
  const alertsCount = 0;
  return pendingReminders + alertsCount;
});

// 显示通知
const showNotifications = () => {
  showNotificationList.value = true;
};

// 处理用户菜单点击
const handleUserMenuClick = async (item: { text: string; action: string }) => {
  showUserMenu.value = false;

  switch (item.action) {
    case "profile":
      router.push("/auth/profile");
      break;
    case "settings":
      router.push("/settings");
      break;
    case "logout":
      await authStore.logout();
      router.push("/login");
      break;
  }
};

// 更多菜单选项
const showMoreMenu = ref(false);
const moreMenuItems = [
  { text: "个人资料", icon: "user-o", action: "profile" },
  { text: "系统设置", icon: "setting-o", action: "settings" },
  { text: "帮助中心", icon: "question-o", action: "help" },
  { text: "退出登录", icon: "cross", action: "logout" }
];

// 处理更多菜单点击
const handleMoreMenuClick = async (item: { text: string; action: string; icon: string }) => {
  showMoreMenu.value = false;

  switch (item.action) {
    case "profile":
      router.push("/auth/profile");
      break;
    case "settings":
      router.push("/settings");
      break;
    case "help":
      router.push("/help");
      break;
    case "logout":
      await authStore.logout();
      router.push("/login");
      break;
  }
};

// 搜索处理
const showSearch = computed(() => route.meta.showSearch !== false);
const onSearch = () => {
  // TODO: 实现全局搜索功能
  router.push("/search");
};

onMounted(async () => {
  todayReminders.value = await reminderStore.fetchTodayAllReminders();
});
</script>

<style scoped>
.admin-nav-bar {
  background-color: var(--van-primary-color);
  background-image: linear-gradient(
    to right,
    var(--van-primary-color),
    color-mix(in srgb, var(--van-primary-color) 90%, #000)
  );
}

/* 修改 placeholder 的背景颜色 */
.admin-nav-bar:deep(.van-nav-bar--fixed) {
  background-color: var(--van-primary-color);
  background-image: linear-gradient(
    to right,
    var(--van-primary-color),
    color-mix(in srgb, var(--van-primary-color) 90%, #000)
  );
}

/* 重要：覆盖 placeholder 的背景颜色 */
.admin-nav-bar:deep(.van-nav-bar__placeholder) {
  background-color: var(--van-primary-color);
  background-image: linear-gradient(
    to right,
    var(--van-primary-color),
    color-mix(in srgb, var(--van-primary-color) 90%, #000)
  );
}

.h-safe-area-inset-bottom {
  height: env(safe-area-inset-bottom);
}

.van-nav-bar {
  background-color: var(--van-primary-color);
  /* 添加渐变背景 */
  background-image: linear-gradient(
    to right,
    var(--van-primary-color),
    color-mix(in srgb, var(--van-primary-color) 90%, #000)
  );
}

.van-nav-bar :deep(.van-nav-bar__content) {
  height: 52px; /* 稍微增加导航栏高度 */
}

.van-nav-bar :deep(.van-nav-bar__title),
.van-nav-bar :deep(.van-nav-bar__left),
.van-nav-bar :deep(.van-nav-bar__right) {
  color: white;
}

/* 添加图标按钮点击效果 */
.van-icon {
  cursor: pointer;
  transition: opacity 0.2s;

  &:active {
    opacity: 0.7;
  }
}

/* 优化 Popover 样式 */
.van-popover {
  :deep(.van-popover__content) {
    padding: 4px 0;
    border-radius: 8px;
  }
}

/* 添加阴影效果 */
.shadow-sm {
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}
</style>
