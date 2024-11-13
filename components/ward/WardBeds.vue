<!-- components/ward/WardBeds.vue -->
<template>
  <div class="ward-beds">
    <!-- 搜索和筛选区 -->
    <van-search v-model="searchText" placeholder="搜索床位号" @search="onSearch" />

    <van-dropdown-menu>
      <van-dropdown-item v-model="roomFilter" :options="roomOptions" />
      <van-dropdown-item v-model="statusFilter" :options="statusOptions" />
    </van-dropdown-menu>

    <!-- 床位列表 -->
    <van-list
      v-model:loading="loading"
      :finished="finished"
      finished-text="没有更多了"
      @load="onLoad">
      <div class="space-y-3 p-4">
        <van-swipe-cell v-for="bed in bedList" :key="bed.id" class="rounded-lg bg-white">
          <template #right>
            <div class="flex h-full">
              <van-button square type="primary" text="分配" class="h-full" @click="onAssign(bed)" />
              <van-button
                square
                type="danger"
                text="维护"
                class="h-full"
                @click="onMaintenance(bed)" />
            </div>
          </template>

          <van-cell :border="false" class="py-3">
            <template #title>
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <span class="text-lg font-medium">{{ bed.code }}</span>
                  <van-tag :type="getBedStatusType(bed.status)" class="ml-2">
                    {{ bed.statusText }}
                  </van-tag>
                </div>
                <span class="text-sm text-gray-500">
                  {{ bed.roomName }}
                </span>
              </div>
            </template>

            <template #label>
              <div class="mt-2 space-y-1">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-500">患者姓名</span>
                  <span>{{ bed.patientName || "-" }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-500">入住时间</span>
                  <span>{{ bed.checkInTime || "-" }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-500">预计出院</span>
                  <span>{{ bed.expectedCheckOut || "-" }}</span>
                </div>
              </div>
            </template>
          </van-cell>
        </van-swipe-cell>
      </div>
    </van-list>

    <!-- 分配床位弹窗 -->
    <van-dialog
      v-model:show="showAssignDialog"
      title="分配床位"
      show-cancel-button
      @confirm="confirmAssign">
      <van-form>
        <van-field
          v-model="assignForm.patientName"
          label="患者姓名"
          placeholder="请输入患者姓名"
          :rules="[{ required: true }]" />
        <van-field
          v-model="assignForm.checkInTime"
          label="入住时间"
          is-link
          readonly
          @click="showCheckInPicker = true" />
        <van-field
          v-model="assignForm.expectedCheckOut"
          label="预计出院"
          is-link
          readonly
          @click="showCheckOutPicker = true" />
      </van-form>
    </van-dialog>

    <!-- 时间选择器 -->
    <van-popup v-model:show="showCheckInPicker" position="bottom">
      <van-time-picker
        v-model="assignForm.checkInTime"
        title="选择入住时间"
        @confirm="showCheckInPicker = false"
        @cancel="showCheckInPicker = false" />
    </van-popup>

    <van-popup v-model:show="showCheckOutPicker" position="bottom">
      <van-time-picker
        v-model="assignForm.expectedCheckOut"
        title="选择预计出院时间"
        @confirm="showCheckOutPicker = false"
        @cancel="showCheckOutPicker = false" />
    </van-popup>
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
const roomFilter = ref(0);
const statusFilter = ref(0);

const roomOptions = [
  { text: "全部房间", value: 0 },
  { text: "501房", value: 1 },
  { text: "502房", value: 2 }
];

const statusOptions = [
  { text: "全部状态", value: 0 },
  { text: "空闲", value: 1 },
  { text: "占用", value: 2 },
  { text: "维护中", value: 3 }
];

// 床位列表
const loading = ref(false);
const finished = ref(false);
const bedList = ref([
  {
    id: 1,
    code: "501-1",
    roomName: "501房",
    status: "available",
    statusText: "空闲",
    patientName: "",
    checkInTime: "",
    expectedCheckOut: ""
  },
  {
    id: 2,
    code: "501-2",
    roomName: "501房",
    status: "occupied",
    statusText: "占用",
    patientName: "张三",
    checkInTime: "2024-01-19 14:30",
    expectedCheckOut: "2024-01-25 10:00"
  },
  {
    id: 3,
    code: "502-1",
    roomName: "502房",
    status: "maintenance",
    statusText: "维护中",
    patientName: "",
    checkInTime: "",
    expectedCheckOut: ""
  }
]);

// 分配床位表单
const showAssignDialog = ref(false);
const showCheckInPicker = ref(false);
const showCheckOutPicker = ref(false);
const currentBed = ref<any>(null);
const assignForm = ref({
  patientName: "",
  checkInTime: [],
  expectedCheckOut: []
});

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

const getBedStatusType = (status: string) => {
  const types: Record<string, string> = {
    available: "success",
    occupied: "warning",
    maintenance: "danger"
  };
  return types[status] || "default";
};

const onAssign = (bed: any) => {
  currentBed.value = bed;
  showAssignDialog.value = true;
};

const onMaintenance = (bed: any) => {
  showToast("设置维护: " + bed.code);
};

const confirmAssign = () => {
  showToast("分配成功");
  showAssignDialog.value = false;
};
</script>

<style></style>
