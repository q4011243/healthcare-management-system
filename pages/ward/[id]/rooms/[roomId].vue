<template>
  <div class="room-detail-view">
    <!-- 顶部导航栏 -->
    <van-nav-bar
      :title="room?.name || '病房详情'"
      left-arrow
      @click-left="router.back()"
      fixed
      placeholder>
      <template #right>
        <van-icon name="edit" class="mr-3" @click="onEdit" />
        <van-popover
          v-model:show="showMoreActions"
          placement="bottom-end"
          :actions="moreActions"
          @select="onActionSelect">
          <template #reference>
            <van-icon name="ellipsis" class="cursor-pointer" />
          </template>
        </van-popover>
      </template>
    </van-nav-bar>

    <!-- 加载状态和错误处理保持不变 -->
    <van-loading v-if="loading" class="mt-20" size="24px" vertical>加载中...</van-loading>
    <van-empty v-else-if="error" class="mt-20" :description="error" />

    <template v-else-if="room">
      <!-- 使用 Tabs 组织内容 -->
      <van-tabs v-model:active="activeTab" animated>
        <!-- 基本信息 Tab -->
        <van-tab title="基本信息">
          <!-- 基本信息卡片保持不变 -->
          <van-card class="mb-4 px-6">
            <template #title>
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold">{{ room.name }}</h3>
                <van-tag :type="getType('RoomStatus', room.status) as TagType">
                  {{ getLabel("RoomStatus", room.status) }}
                </van-tag>
              </div>
            </template>
            <template #desc>
              <div class="mt-2 space-y-2">
                <div class="flex items-center text-sm text-gray-600">
                  <van-icon name="location-o" class="mr-1" />
                  <span>{{ room.floor }}楼 {{ room.code }}</span>
                </div>
                <div class="flex items-center text-sm text-gray-600">
                  <van-icon name="friends-o" class="mr-1" />
                  <span>{{ getLabel("RoomType", room.type) }}</span>
                  <span class="ml-2">({{ getLabel("GenderRequirement", room.gender) }})</span>
                </div>
                <div class="flex items-center text-sm text-gray-600">
                  <van-icon name="hotel-o" class="mr-1" />
                  <span>容纳人数：{{ room.capacity }}人</span>
                  <span class="ml-2">(当前：{{ room.patients?.length || 0 }}人)</span>
                </div>
              </div>
            </template>
          </van-card>
          <!-- 设施信息增强 -->
          <van-cell-group inset class="mb-4" title="基础设施">
            <van-cell title="房间设施">
              <template #value>
                <div class="flex flex-wrap gap-2">
                  <van-tag plain type="primary" v-if="room.hasOxygen">供氧</van-tag>
                  <van-tag plain type="primary" v-if="room.hasToilet">独立卫生间</van-tag>
                  <van-tag plain type="primary" v-if="room.hasShower">独立淋浴</van-tag>
                  <van-tag plain type="primary" v-if="room.hasTV">电视</van-tag>
                </div>
              </template>
            </van-cell>
            <van-cell title="最后清洁时间" :value="formatTime(room.lastCleanedAt)" />
            <van-cell title="下次清洁时间" :value="formatTime(room.nextCleaningDate)" />
          </van-cell-group>
        </van-tab>

        <!-- 患者信息 Tab -->
        <van-tab title="入住患者" :badge="room.patients?.length || 0">
          <van-cell-group inset class="mb-4">
            <van-cell :value="`${room.patients?.length || 0}/${room.capacity}`" />
            <template v-if="room.patients?.length">
              <van-swipe-cell v-for="patient in room.patients" :key="patient.id">
                <van-cell>
                  <template #title>
                    <div class="flex items-center">
                      <span class="font-medium">{{ patient.name }}</span>
                      <van-tag
                        size="medium"
                        class="ml-2"
                        :type="patient.status === 'NORMAL' ? 'success' : 'warning'">
                        {{ patient.status === "NORMAL" ? "正常" : "需要关注" }}
                      </van-tag>
                    </div>
                  </template>
                  <template #value>
                    <div class="text-sm text-gray-600">
                      入院时间：{{ formatTime(patient.admissionDate) }}
                    </div>
                  </template>
                </van-cell>
                <template #right>
                  <van-button
                    square
                    type="primary"
                    text="查看"
                    class="h-full"
                    @click="onViewPatient(patient.id)" />
                  <van-button
                    square
                    type="danger"
                    text="转出"
                    class="h-full"
                    @click="onTransferPatient(patient.id)" />
                </template>
              </van-swipe-cell>
            </template>
            <van-empty v-else description="暂无患者" />
          </van-cell-group>
        </van-tab>

        <!-- 设备管理 Tab -->
        <van-tab title="设备管理" :badge="room.equipments?.length || 0">
          <div class="p-4">
            <van-button
              block
              type="primary"
              icon="plus"
              class="mb-4"
              @click="showAddEquipment = true">
              添加设备
            </van-button>
            <van-divider />
            <div class="grid gap-4" v-if="room.equipments?.length">
              <van-card
                v-for="equipment in room.equipments"
                :key="equipment.id"
                class="equipment-card"
                :class="{
                  'maintenance-needed': isMaintenanceNeeded(equipment),
                  'equipment-fault': equipment.status === EquipmentStatus.MALFUNCTION
                }">
                <template #title>
                  <div class="equipment-title-wrapper">
                    <span class="equipment-name min-w-16">{{ equipment.name }}</span>
                    <van-tag :type="getType('EquipmentStatus', equipment.status) as TagType">
                      {{ getLabel("EquipmentStatus", equipment.status) }}
                    </van-tag>
                  </div>
                </template>

                <template #desc>
                  <div class="equipment-info">
                    <div class="info-item">
                      <van-icon name="notes-o" class="mr-1" />
                      <span>编号：{{ equipment.code }}</span>
                    </div>
                    <div class="info-item">
                      <van-icon name="clock" class="mr-1" />
                      <span>上次维护：{{ formatTime(equipment.lastMaintainedAt) }}</span>
                    </div>
                    <div
                      class="info-item"
                      :class="{
                        'text-warning': isMaintenanceNeeded(equipment)
                      }">
                      <van-icon name="calendar-o" class="mr-1" />
                      <span>下次维护：{{ formatTime(equipment.nextMaintainDate) }}</span>
                    </div>
                  </div>
                </template>

                <template #footer>
                  <div class="mt-2 flex justify-end gap-2">
                    <van-button
                      size="small"
                      type="primary"
                      plain
                      @click="onMaintainEquipment(equipment)">
                      维护登记
                    </van-button>
                    <van-button
                      size="small"
                      type="danger"
                      plain
                      @click="onRemoveEquipment(equipment)">
                      移除设备
                    </van-button>
                  </div>
                </template>
              </van-card>
            </div>

            <van-empty v-else description="暂无设备" />
          </div>
        </van-tab>

        <!-- 床位管理 Tab -->
        <van-tab title="床位管理" :badge="room?.beds?.length || 0">
          <div class="p-4">
            <BedList :room-id="roomId" />
          </div>
        </van-tab>

        <!-- 历史记录 Tab -->
        <van-tab title="历史记录">
          <van-cell-group inset class="mb-4">
            <van-cell v-for="record in recentRecords" :key="record.id">
              <template #title>
                <div class="flex items-center">
                  <van-tag :type="record.type === 'CLEANING' ? 'primary' : 'warning'" class="mr-2">
                    {{ record.type === "CLEANING" ? "清洁" : "维护" }}
                  </van-tag>
                  <span>{{ record.description }}</span>
                </div>
              </template>
              <template #value>
                <div class="text-sm text-gray-600">
                  {{ formatTime(record.createdAt) }}
                </div>
              </template>
            </van-cell>
            <van-empty v-if="!recentRecords.length" description="暂无记录" />
          </van-cell-group>
        </van-tab>
      </van-tabs>

      <!-- 底部操作栏 -->
      <div class="fixed bottom-0 left-0 right-0 flex gap-2 bg-white p-4 shadow-lg">
        <van-button block type="primary" :disabled="!canAddPatient" @click="onAddPatient">
          添加患者
        </van-button>
        <van-button block plain type="primary" @click="onUpdateStatus">更新状态</van-button>
      </div>

      <!-- 弹窗组件 -->
      <!-- 状态更新弹窗 -->
      <van-action-sheet
        v-model:show="showStatusSheet"
        :actions="getOptions('RoomStatus')"
        cancel-text="取消"
        @select="handleStatusSelect"
        @cancel="showStatusSheet = false" />

      <!-- 添加设备弹窗 -->
      <van-dialog
        v-model:show="showAddEquipment"
        title="添加设备"
        show-cancel-button
        @confirm="handleAddEquipment">
        <div class="p-4">
          <van-field v-model="newEquipment.name" label="设备名称" placeholder="请输入设备名称" />
          <van-field v-model="newEquipment.code" label="设备编号" placeholder="请输入设备编号" />
        </div>
      </van-dialog>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { showToast, showDialog, type TagType } from "vant";
import { formatTime } from "@/utils/date";
import type { Room, RoomEquipment } from "@/types/models/ward";
import { useRoomStore } from "@/stores/roomStore";
import { EquipmentStatus, RoomStatus } from "~/types/enums/enums";
import { useEnum } from "~/types/enums/metadata";
import BedList from "~/components/bed/BedList.vue";
import type { TagSize } from "vant";

const router = useRouter();
const route = useRoute();
const roomStore = useRoomStore();
const roomEquipmentStore = useRoomEquipmentStore();
const { getLabel, getOptions, getType } = useEnum();

// 状态变量
const loading = ref(true);
const error = ref("");
const showStatusSheet = ref(false);
const activeTab = ref(0);
const showMoreActions = ref(false);
const showAddEquipment = ref(false);
const newEquipment = ref({
  name: "",
  code: ""
});

// 更多操作菜单
const moreActions = [
  { text: "清洁登记", icon: "brush-o" },
  { text: "打印信息", icon: "printer" },
  { text: "导出记录", icon: "down" }
];

// 获取房间数据
const roomId = Number(route.params.roomId);
const room = computed(() => roomStore.currentRoom);

// 计算属性
const canAddPatient = computed(() => {
  if (!room.value) return false;
  return (
    room.value.status === RoomStatus.AVAILABLE &&
    (room.value.patients?.length || 0) < room.value.capacity
  );
});

// 模拟最近记录数据
const recentRecords = ref([
  {
    id: 1,
    type: "CLEANING",
    description: "日常清洁",
    createdAt: new Date("2024-01-20 10:00:00")
  },
  {
    id: 2,
    type: "MAINTENANCE",
    description: "设备维护",
    createdAt: new Date("2024-01-19 15:30:00")
  }
]);

// 事件处理方法
const onUpdateStatus = () => {
  showStatusSheet.value = true;
};

const handleStatusSelect = async (action: { name: string; value: RoomStatus }) => {
  try {
    await roomStore.updateRoom(roomId, { status: action.value });
    showToast("状态更新成功");
  } catch (error) {
    showToast({
      type: "fail",
      message: "状态更新失败：" + (error as Error).message
    });
  }
  showStatusSheet.value = false;
};

const onAddPatient = () => {
  router.push(`/ward/room/${roomId}/add-patient`);
};

const onViewPatient = (patientId: number) => {
  router.push(`/patient/${patientId}`);
};

const onTransferPatient = (patientId: number) => {
  showDialog({
    title: "转出患者",
    message: "确定要将该患者转出吗？",
    showCancelButton: true
  }).then(async (action) => {
    if (action === "confirm") {
      try {
        // TODO: 实现转出患者的逻辑
        showToast("转出成功");
      } catch (error) {
        showToast({
          type: "fail",
          message: "转出失败：" + (error as Error).message
        });
      }
    }
  });
};

const onEdit = () => {
  router.push(`/ward/${route.params.id}/rooms/${roomId}/edit`);
};

const onActionSelect = (action: { text: string }) => {
  switch (action.text) {
    case "清洁登记":
      // TODO: 实现清洁登记
      break;
    case "打印信息":
      // TODO: 实现打印功能
      break;
    case "导出记录":
      // TODO: 实现导出功能
      break;
  }
  showMoreActions.value = false;
};

const onMaintainEquipment = (equipment: RoomEquipment) => {
  showDialog({
    title: "设备维护",
    message: `确定要对设备 ${equipment.name} 进行维护登记吗？`,
    showCancelButton: true
  }).then(async (action) => {
    if (action === "confirm") {
      // TODO: 实现设备维护登记逻辑
      showToast("维护登记成功");
    }
  });
};

const onRemoveEquipment = (equipment: RoomEquipment) => {
  showDialog({
    title: "移除设备",
    message: `确定要移除设备 ${equipment.name} 吗？`,
    showCancelButton: true
  }).then(async (action) => {
    if (action === "confirm") {
      await roomEquipmentStore.removeEquipment(Number(equipment.id));
      await roomStore.fetchRoomById(roomId);
      showToast("设备移除成功");
    }
  });
};

const handleAddEquipment = async () => {
  // TODO: 实现添加设备逻辑
  await roomEquipmentStore.addEquipment({
    ...newEquipment.value,
    roomId: roomId,
    status: EquipmentStatus.MALFUNCTION,
    createdAt: new Date()
  });
  showToast("设备添加成功");
  newEquipment.value = { name: "", code: "" };
};

const isMaintenanceNeeded = (equipment: RoomEquipment) => {
  if (!equipment.nextMaintainDate) return false;
  const today = new Date();
  const nextMaintainDate = new Date(equipment.nextMaintainDate);
  const daysUntilMaintenance = Math.ceil(
    (nextMaintainDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  return daysUntilMaintenance <= 7;
};

// 生命周期钩子
onMounted(async () => {
  try {
    await roomStore.fetchRoomById(roomId);
    loading.value = false;
  } catch (err) {
    error.value = (err as Error).message;
    loading.value = false;
  }
});
</script>

<style scoped>
.room-detail-view {
  min-height: 100vh;
  padding-bottom: 80px;
  background-color: #f7f8fa;
}

:deep(.van-tabs__wrap) {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}
.equipment-list {
  padding: 16px;
}

.equipment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.equipment-title {
  font-size: 18px;
  font-weight: 500;
  margin: 0;
}

.equipment-grid {
  display: grid;
  gap: 16px;
}

.equipment-card {
  background-color: #fff;
  border-radius: 8px;
  border: 1px solid #ebedf0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.equipment-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.equipment-card.maintenance-needed {
  border-color: var(--van-orange);
}

.equipment-card.equipment-fault {
  border-color: var(--van-red);
}

.equipment-title-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.equipment-name {
  font-weight: 500;
  font-size: 20px;
}

.equipment-info {
  margin-top: 8px;
  font-size: 14px;
  color: var(--van-gray-6);
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.info-icon {
  margin-right: 4px;
}

.maintenance-warning {
  color: var(--van-orange);
}

.equipment-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

.equipment-empty {
  padding: 32px 0;
}

:deep(.van-card__header) {
  padding: 12px 16px;
}

:deep(.van-card__content) {
  padding: 0 16px 12px;
}

:deep(.bed-list) {
  background-color: transparent;
}
</style>
