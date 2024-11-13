<template>
  <div class="vital-signs-history">
    <van-tabs v-model:active="activeTab" sticky>
      <van-tab title="列表视图">
        <div class="p-4">
          <van-list
            v-model:loading="loading"
            :finished="finished"
            finished-text="没有更多数据"
            @load="onLoad">
            <van-cell-group
              v-for="record in records"
              :key="record.id"
              inset
              class="mb-3 rounded-lg shadow-sm">
              <van-swipe-cell>
                <van-divider :dashed="true">{{ formatDateCN(record.recordedAt) }}</van-divider>

                <van-cell class="vital-signs-header" center>
                  <template #title>
                    <div class="flex items-center gap-2">
                      <span class="text-gray-600">记录人</span>
                      <van-tag size="medium" plain type="primary">{{ record.recordedBy }}</van-tag>
                    </div>
                  </template>
                </van-cell>

                <van-cell>
                  <template #title>
                    <div class="flex items-center gap-2">
                      <span class="text-gray-600">体温</span>
                      <van-tag :type="getAlertType(record.temperature)" size="medium">
                        {{ record.temperature }}℃
                      </van-tag>
                    </div>
                  </template>
                  <template #value>
                    <div class="flex items-center gap-2">
                      <span class="text-gray-600">血氧</span>
                      <van-tag
                        :type="record.oxygenSaturation < 95 ? 'warning' : 'success'"
                        size="medium">
                        {{ record.oxygenSaturation }}%
                      </van-tag>
                    </div>
                  </template>
                </van-cell>

                <van-cell>
                  <template #title>
                    <div class="flex items-center gap-2">
                      <span class="text-gray-600">血压</span>
                      <van-tag type="primary" size="medium">
                        {{ record.bloodPressureSystolic }}/{{ record.bloodPressureDiastolic }} mmHg
                      </van-tag>
                    </div>
                  </template>
                  <template #value>
                    <div class="flex items-center gap-2">
                      <span class="text-gray-600">脉搏</span>
                      <van-tag
                        :type="
                          record.pulseRate > 100 || record.pulseRate < 60 ? 'warning' : 'success'
                        "
                        size="medium">
                        {{ record.pulseRate }} 次/分
                      </van-tag>
                    </div>
                  </template>
                </van-cell>

                <van-cell
                  v-if="record.notes"
                  title="备注"
                  :label="record.notes"
                  class="vital-signs-notes" />

                <template #right>
                  <van-button
                    square
                    type="danger"
                    text="删除"
                    class="!h-full"
                    @click="confirmDelete(record)" />
                </template>
              </van-swipe-cell>
            </van-cell-group>
          </van-list>
        </div>
      </van-tab>

      <van-tab title="趋势图">
        <div class="p-4">
          <van-cell-group inset>
            <div class="h-64" ref="chartContainer"></div>
          </van-cell-group>
        </div>
      </van-tab>
    </van-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick, onUnmounted } from "vue";
import type { ECharts } from "echarts";
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import type { LineSeriesOption } from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  type TooltipComponentOption,
  type GridComponentOption,
  type LegendComponentOption
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { useVitalSignsStore } from "~/stores/vitalSignsStore";
import type { VitalSigns } from "~/types/models/vitalSigns";

// 注册必需的组件
echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  LineChart,
  CanvasRenderer
]);

// 定义图表选项类型
type ECOption = echarts.ComposeOption<
  LineSeriesOption | TooltipComponentOption | GridComponentOption | LegendComponentOption
>;

const props = defineProps<{
  patientId: number;
}>();

const vitalSignsStore = useVitalSignsStore();
const activeTab = ref(0);
const loading = ref(false);
const finished = ref(false);
const records = ref<VitalSigns[]>([]);
const chartContainer = ref<HTMLElement>();
let chart: ECharts | null = null;

// 格式化日期
const formatDate = (date: Date) => {
  return new Date(date).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
};

// 获取警告类型
const getAlertType = (temperature: number) => {
  if (temperature >= 39) return "danger";
  if (temperature >= 38.5) return "warning";
  if (temperature >= 37.5) return "warning";
  if (temperature <= 35) return "danger";
  return "success";
};

// 加载数据
const onLoad = async () => {
  try {
    loading.value = true;
    const result = await vitalSignsStore.fetchPatientVitalSigns(props.patientId);
    records.value = result;
    finished.value = true;

    if (activeTab.value === 1) {
      initChart();
    }
  } finally {
    loading.value = false;
  }
};

// 初始化图表
const initChart = () => {
  if (!chartContainer.value) return;

  if (!chart) {
    chart = echarts.init(chartContainer.value);
  }
  const recordsVo = records.value.reverse();
  const option: ECOption = {
    tooltip: {
      trigger: "axis"
    },
    legend: {
      data: ["体温", "收缩压", "舒张压", "脉搏"]
    },
    xAxis: {
      type: "category",
      data: recordsVo.map((r) => formatDate(r.recordedAt))
    },
    yAxis: [
      {
        type: "value",
        name: "体温(℃)",
        position: "left"
      },
      {
        type: "value",
        name: "mmHg/次",
        position: "right"
      }
    ],
    series: [
      {
        name: "体温",
        type: "line",
        data: recordsVo.map((r) => r.temperature)
      },
      {
        name: "收缩压",
        type: "line",
        yAxisIndex: 1,
        data: recordsVo.map((r) => r.bloodPressureSystolic)
      },
      {
        name: "舒张压",
        type: "line",
        yAxisIndex: 1,
        data: recordsVo.map((r) => r.bloodPressureDiastolic)
      },
      {
        name: "脉搏",
        type: "line",
        yAxisIndex: 1,
        data: recordsVo.map((r) => r.pulseRate)
      }
    ]
  };
  if (chart) {
    chart.setOption(option);
  }
};

// 监听标签页切换
watch(activeTab, (newVal) => {
  if (newVal === 1) {
    nextTick(() => {
      initChart();
    });
  }
});

// 修改 resize 事件处理函数
const handleResize = () => {
  chart?.resize();
};

onMounted(() => {
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  chart?.dispose();
  window.removeEventListener("resize", handleResize);
});

// 添加 refresh 和 showTrendChart 方法
const refresh = async () => {
  records.value = [];
  finished.value = false;
  await onLoad();
};

const showTrendChart = () => {
  activeTab.value = 1;
  nextTick(() => {
    initChart();
  });
};

// 添加删除确认方法
const confirmDelete = (record: VitalSigns) => {
  showDialog({
    title: "确认删除",
    message: `确定要删除 ${formatDateCN(record.recordedAt)} 的记录吗？此操作不可恢复。`,
    showCancelButton: true
  }).then(async () => {
    try {
      if (record.id) {
        await vitalSignsStore.deleteVitalSigns(record.id);
        showSuccessToast("删除成功");
        // 刷新列表
        await refresh();
      } else {
        showFailToast("记录不存在");
      }
    } catch (error) {
      showFailToast((error as Error).message);
    }
  });
};

// 暴露方法给父组件
defineExpose({
  refresh,
  showTrendChart
});
</script>

<style scoped>
.vital-signs-header :deep(.van-cell__title) {
  flex: 1;
}

.vital-signs-notes :deep(.van-cell__label) {
  color: #666;
  white-space: pre-wrap;
  line-height: 1.5;
  margin-top: 4px;
}

:deep(.van-tag--medium) {
  padding: 0 12px;
  height: 28px;
  line-height: 26px;
}
</style>
