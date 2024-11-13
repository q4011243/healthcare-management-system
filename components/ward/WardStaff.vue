<template>
  <div class="ward-staff">
    <!-- 搜索和筛选 -->
    <van-search v-model="searchText" placeholder="搜索人员姓名" @search="onSearch" />

    <van-dropdown-menu>
      <van-dropdown-item v-model="roleFilter" :options="roleOptions" />
      <van-dropdown-item v-model="shiftFilter" :options="shiftOptions" />
    </van-dropdown-menu>

    <!-- 人员列表 -->
    <van-list
      v-model:loading="loading"
      :finished="finished"
      finished-text="没有更多了"
      @load="onLoad">
      <div class="space-y-3 p-4">
        <van-card v-for="staff in staffList" :key="staff.id" :thumb="staff.avatar" class="bg-white">
          <template #title>
            <div class="flex items-center">
              <span class="text-base font-medium">{{ staff.name }}</span>
              <van-tag :type="getRoleType(staff.role)" class="ml-2">
                {{ staff.roleText }}
              </van-tag>
            </div>
          </template>

          <template #desc>
            <div class="mt-2 space-y-1">
              <div class="flex items-center text-sm text-gray-500">
                <van-icon name="clock-o" class="mr-1" />
                <span>{{ staff.shift }}</span>
              </div>
              <div class="flex items-center text-sm text-gray-500">
                <van-icon name="phone-o" class="mr-1" />
                <span>{{ staff.phone }}</span>
              </div>
            </div>
          </template>

          <template #tags>
            <van-tag plain :type="staff.isOnDuty ? 'success' : 'default'" class="mr-1">
              {{ staff.isOnDuty ? "在岗" : "休息" }}
            </van-tag>
          </template>

          <template #footer>
            <div class="flex space-x-2">
              <van-button size="small" type="primary" plain @click="onCall(staff)">呼叫</van-button>
              <van-button size="small" type="primary" plain @click="onViewSchedule(staff)">
                排班
              </van-button>
            </div>
          </template>
        </van-card>
      </div>
    </van-list>

    <!-- 排班日历弹窗 -->
    <van-calendar
      v-model:show="showSchedule"
      :default-date="currentDate"
      type="month"
      @confirm="onScheduleConfirm" />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { showToast } from "vant";

const props = defineProps<{
  wardId: number;
}>();

// 搜索和筛选
const searchText = ref("");
const roleFilter = ref(0);
const shiftFilter = ref(0);

const roleOptions = [
  { text: "全部角色", value: 0 },
  { text: "医生", value: 1 },
  { text: "护士", value: 2 },
  { text: "护工", value: 3 }
];

const shiftOptions = [
  { text: "全部班次", value: 0 },
  { text: "早班", value: 1 },
  { text: "中班", value: 2 },
  { text: "晚班", value: 3 }
];

// 人员列表
const loading = ref(false);
const finished = ref(false);
const staffList = ref([
  {
    id: 1,
    name: "张医生",
    role: "doctor",
    roleText: "医生",
    shift: "早班 08:00-16:00",
    phone: "13800138000",
    avatar: "https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg",
    isOnDuty: true
  },
  {
    id: 2,
    name: "李护士",
    role: "nurse",
    roleText: "护士",
    shift: "中班 16:00-24:00",
    phone: "13800138001",
    avatar: "https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg",
    isOnDuty: true
  },
  {
    id: 3,
    name: "王护工",
    role: "caregiver",
    roleText: "护工",
    shift: "晚班 00:00-08:00",
    phone: "13800138002",
    avatar: "https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg",
    isOnDuty: false
  }
]);

// 排班日历
const showSchedule = ref(false);
const currentDate = ref(new Date());
const currentStaff = ref<any>(null);

// 方法
const onSearch = (val: string) => {
  showToast("搜索: " + val);
};

const onLoad = () => {
  setTimeout(() => {
    loading.value = false;
    finished.value = true;
  }, 1000);
};

const getRoleType = (role: string) => {
  const types: Record<string, string> = {
    doctor: "primary",
    nurse: "success",
    caregiver: "warning"
  };
  return types[role] || "default";
};

const onCall = (staff: any) => {
  showToast("呼叫: " + staff.name);
};

const onViewSchedule = (staff: any) => {
  currentStaff.value = staff;
  showSchedule.value = true;
};

const onScheduleConfirm = (date: Date) => {
  showToast("设置排班: " + date.toLocaleDateString());
  showSchedule.value = false;
};
</script>

<style></style>
