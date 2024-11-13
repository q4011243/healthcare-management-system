<template>
  <div class="min-h-screen bg-gray-100">
    <!-- 顶部搜索栏 -->
    <van-sticky>
      <div class="space-y-2 bg-white p-4">
        <van-search
          v-model="searchText"
          placeholder="搜索患者姓名/ID"
          shape="round"
          @search="onSearch"
          @clear="onClear" />
        <div class="flex items-center justify-between">
          <van-button plain size="small" @click="showFilter = true">
            <template #icon>
              <van-icon name="filter-o" />
            </template>
            筛选
            <template v-if="hasActiveFilters">
              <van-badge dot color="var(--van-primary-color)" />
            </template>
          </van-button>
          <div class="text-sm text-gray-500">共 {{ filteredTotal }} 位患者</div>
        </div>
      </div>
    </van-sticky>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-2 gap-4 p-4">
      <van-card class="bg-blue-50">
        <template #title>
          <div class="text-lg font-bold">{{ statistics.inPatients }}</div>
          <div class="text-sm text-gray-600">在院患者</div>
        </template>
      </van-card>
      <van-card class="bg-green-50">
        <template #title>
          <div class="text-lg font-bold">{{ statistics.todayAdmissions }}</div>
          <div class="text-sm text-gray-600">今日入院</div>
        </template>
      </van-card>
    </div>

    <!-- 患者列表 -->
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        class="pb-24"
        @load="onLoad">
        <van-cell-group
          v-for="patient in patientStore.filteredPatients"
          :key="patient.id"
          inset
          class="mb-3">
          <van-swipe-cell>
            <van-cell
              :title="patient.name"
              :label="`住院号: ${patient.id}`"
              is-link
              :to="`/patients/${patient.id}`">
              <template #value>
                <van-tag :type="getType('PatientStatus', patient.status) as TagType">
                  {{ getLabel("PatientStatus", patient.status) }}
                </van-tag>
              </template>
            </van-cell>
            <template #right>
              <van-button
                v-if="patient.status === PatientStatus.DISCHARGED"
                square
                type="danger"
                text="删除"
                class="!h-full"
                @click="confirmDelete(patient)" />
            </template>
          </van-swipe-cell>
        </van-cell-group>
      </van-list>
    </van-pull-refresh>

    <!-- 筛选抽屉 -->
    <van-popup v-model:show="showFilter" position="right" class="h-full w-3/4">
      <div class="flex h-full flex-col">
        <van-nav-bar
          title="筛选条件"
          left-arrow
          right-text="重置"
          @click-left="showFilter = false"
          @click-right="resetFilters" />

        <div class="flex-1 space-y-4 overflow-auto p-4">
          <!-- 状态筛选 -->
          <div>
            <div class="mb-2 font-medium">患者状态</div>
            <van-checkbox-group v-model="filterForm.status">
              <van-cell-group inset>
                <van-cell
                  v-for="status in getOptions('PatientStatus')"
                  :key="status.value"
                  :title="status.label"
                  clickable
                  @click="toggleStatus(status.value as PatientStatus)">
                  <template #right-icon>
                    <van-checkbox :name="status.value" />
                  </template>
                </van-cell>
              </van-cell-group>
            </van-checkbox-group>
          </div>

          <!-- 入院时间筛选 -->
          <div>
            <div class="mb-2 font-medium">入院时间</div>
            <van-cell-group inset>
              <van-field
                readonly
                clickable
                label="开始日期"
                :model-value="formatDate(filterForm.dateRange?.start)"
                placeholder="请选择"
                @click="showStartDatePicker = true" />
              <van-field
                readonly
                clickable
                label="结束日期"
                :model-value="formatDate(filterForm.dateRange?.end)"
                placeholder="请选择"
                @click="showEndDatePicker = true" />
            </van-cell-group>
          </div>
        </div>

        <div class="border-t p-4">
          <van-button block type="primary" @click="applyFilters">确认</van-button>
        </div>
      </div>
    </van-popup>

    <!-- 日期选择器 -->
    <van-calendar v-model:show="showStartDatePicker" @confirm="onStartDateConfirm" />
    <van-calendar v-model:show="showEndDatePicker" @confirm="onEndDateConfirm" />

    <!-- 底部添加按钮 -->
    <van-button
      type="primary"
      icon="plus"
      class="!fixed bottom-20 right-4 w-auto rounded-full shadow-lg"
      @click="router.push('/patients/admission')">
      入院登记
    </van-button>
  </div>
</template>

<script setup lang="ts">
import type { TagType } from "vant";
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { usePatientStore } from "~/stores/patientStore";
import { useEnum } from "~/types/enums/metadata";
import { PatientStatus, type Patient } from "~/types/models/patient";
import { debounce } from "lodash";
import { showDialog, showSuccessToast, showFailToast } from "vant";

const router = useRouter();
const patientStore = usePatientStore();
const { getLabel, getType, getOptions } = useEnum();

// 状态
const searchText = ref("");
const refreshing = ref(false);
const loading = ref(false);
const finished = ref(false);

const statistics = computed(() => ({
  inPatients: patientStore.inPatientsCount,
  todayAdmissions: patientStore.todayAdmissionsCount
}));

const searchParams = ref({
  page: 1,
  pageSize: 10,
  keyword: ""
});

// 新增状态
const showFilter = ref(false);
const showStartDatePicker = ref(false);
const showEndDatePicker = ref(false);

const filterForm = ref({
  status: [] as PatientStatus[],
  dateRange: null as { start: Date; end: Date } | null
});

// 计算属性
const hasActiveFilters = computed(() => {
  return filterForm.value.status.length > 0 || filterForm.value.dateRange !== null;
});

const filteredTotal = computed(() => {
  return patientStore.filteredPatients.length;
});

// 方法
const formatDate = (date?: Date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("zh-CN");
};

const toggleStatus = (status: PatientStatus) => {
  const index = filterForm.value.status.indexOf(status);
  if (index > -1) {
    filterForm.value.status.splice(index, 1);
  } else {
    filterForm.value.status.push(status);
  }
};

const resetFilters = () => {
  filterForm.value = {
    status: [],
    dateRange: null
  };
};

const applyFilters = () => {
  patientStore.setFilters({
    status: filterForm.value.status,
    dateRange: filterForm.value.dateRange
  });
  showFilter.value = false;
  searchParams.value.page = 1;
  patientStore.fetchPatients();
};

const onSearch = () => {
  searchParams.value = {
    ...searchParams.value,
    page: 1,
    keyword: searchText.value
  };
  finished.value = false;
  patientStore.fetchPatients(searchParams.value);
};

const onClear = () => {
  searchText.value = "";
  onSearch();
};

const onStartDateConfirm = (date: Date) => {
  if (!filterForm.value.dateRange) {
    filterForm.value.dateRange = { start: date, end: date };
  } else {
    filterForm.value.dateRange.start = date;
  }
  showStartDatePicker.value = false;
};

const onEndDateConfirm = (date: Date) => {
  if (!filterForm.value.dateRange) {
    filterForm.value.dateRange = { start: date, end: date };
  } else {
    filterForm.value.dateRange.end = date;
  }
  showEndDatePicker.value = false;
};

// 分页相关
const onRefresh = async () => {
  try {
    searchParams.value.page = 1;
    finished.value = false;
    await patientStore.fetchPatients(searchParams.value);
  } finally {
    refreshing.value = false;
  }
};

// 上拉加载
const onLoad = async () => {
  try {
    loading.value = true;
    const { pagination } = await patientStore.fetchPatients(searchParams.value);

    // 判断是否加载完成
    const { page, pageSize, total } = pagination;
    if (page * pageSize >= total) {
      finished.value = true;
    } else {
      searchParams.value.page += 1;
    }
  } finally {
    loading.value = false;
  }
};

watch(searchText, () => {
  const search = debounce(() => {
    onSearch();
  }, 500);
  search();
});

// 初始化
onMounted(async () => {
  await patientStore.fetchPatients();
});

definePageMeta({
  layout: "admin",
  middleware: "auth",
  title: "患者管理",
  requiresAuth: true
});

// 删除确认
const confirmDelete = (patient: Patient) => {
  showDialog({
    title: "确认删除",
    message: `确定要删除患者 ${patient.name} 的记录吗？此操作不可恢复。`,
    showCancelButton: true
  }).then(async () => {
    try {
      await patientStore.deletePatient(patient.id as number);
      showSuccessToast("删除成功");
      // 刷新列表
      onRefresh();
    } catch (error) {
      showFailToast((error as Error).message);
    }
  });
};
</script>
