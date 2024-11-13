<template>
  <div class="room-card rounded-lg bg-white p-4 transition-all duration-300 hover:shadow-lg">
    <!-- 房间头部信息 -->
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-2">
        <span class="text-lg font-medium">{{ room.name || room.code }}</span>
        <van-tag
          :type="
            room.status === RoomStatus.AVAILABLE
              ? 'success'
              : room.status === RoomStatus.MAINTENANCE
                ? 'warning'
                : 'primary'
          "
          size="medium">
          {{ enumUtil.getLabel("RoomStatus", room.status) }}
        </van-tag>
      </div>
      <van-popover
        v-model:show="showPopover"
        placement="bottom-end"
        :actions="actions"
        @select="onSelect">
        <template #reference>
          <van-icon name="ellipsis" class="cursor-pointer rounded p-1 hover:bg-gray-100" />
        </template>
      </van-popover>
    </div>

    <!-- 房间详细信息 -->
    <div class="mt-3 space-y-2">
      <div class="flex items-center text-sm text-gray-600">
        <van-icon name="location" class="mr-1" />
        <span>{{ room.floor }}层</span>
        <span class="mx-2">|</span>
        <span>{{ enumUtil.getLabel("RoomType", room.type) }}</span>
      </div>

      <!-- 床位信息 -->
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <div class="flex items-center">
            <van-icon name="hotel-o" class="text-primary mr-1" />
            <span class="text-sm">总床位：{{ room.capacity }}</span>
          </div>
          <div class="flex items-center">
            <van-icon name="checked" class="mr-1 text-green-500" />
            <span class="text-sm">空闲：{{ room.capacity - room.patients.length }}</span>
          </div>
        </div>
        <van-button size="small" type="primary" plain icon="eye-o" @click="onViewDetail">
          查看详情
        </van-button>
      </div>

      <!-- 患者信息预览 -->
      <div v-if="room.patients?.length > 0" class="mt-3">
        <div class="mb-2 flex items-center text-sm text-gray-600">
          <van-icon name="friends-o" class="mr-1" />
          <span>入住患者</span>
        </div>
        <div class="flex flex-wrap gap-2">
          <van-tag
            v-for="patient in room.patients"
            :key="patient.id"
            plain
            type="primary"
            class="flex items-center">
            <span>{{ patient.name }}</span>
            <span class="ml-1 text-xs text-gray-500">{{ patient.bedId }}床</span>
          </van-tag>
        </div>
      </div>
    </div>

    <!-- 底部操作区 -->
    <div class="mt-4 flex items-center justify-between border-t pt-3">
      <div class="flex items-center space-x-2 text-xs text-gray-500">
        <van-icon name="clock-o" />
        <span>更新于 {{ formatTime(room.updatedAt) }}</span>
      </div>
      <div class="flex space-x-2">
        <van-button size="small" type="primary" icon="plus" @click="onAddPatient">
          入住登记
        </van-button>
      </div>
    </div>

    <!-- 删除确认弹窗 -->
    <van-dialog
      v-model:show="showDeleteConfirm"
      title="删除确认"
      show-cancel-button
      @confirm="handleDelete">
      <div class="p-4">
        确定要删除房间 {{ room.name || room.code }} 吗？此操作不可恢复。
        <div v-if="room.patients?.length" class="mt-2 text-red-500">
          注意：该房间当前还有{{ room.patients.length }}名患者入住！
        </div>
      </div>
    </van-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useEnum } from "~/types/enums/metadata";
import type { Room } from "~/types/models/ward";
import type { Patient } from "~/types/models/patient";
import { RoomStatus } from "~/types/enums/enums";

const enumUtil = useEnum();
const showPopover = ref(false);
const showDeleteConfirm = ref(false);

const props = defineProps<{
  room: Room;
  patientCount: number;
  patients: Patient[];
}>();

const emit = defineEmits<{
  (e: "edit"): void;
  (e: "view-detail"): void;
  (e: "add-patient"): void;
  (e: "delete", room: Room): void;
}>();

// 右上角菜单选项
const actions = [
  { text: "编辑信息", icon: "edit" },
  { text: "查看详情", icon: "eye-o" },
  { text: "删除房间", icon: "delete-o", danger: true }
];

// 菜单选择处理
const onSelect = (action: { text: string }) => {
  switch (action.text) {
    case "编辑信息":
      emit("edit");
      break;
    case "查看详情":
      emit("view-detail");
      break;
    case "删除房间":
      showDeleteConfirm.value = true;
      break;
  }
  showPopover.value = false;
};

const onViewDetail = () => {
  emit("view-detail");
};

const onAddPatient = () => {
  emit("add-patient");
};

const handleDelete = () => {
  emit("delete", props.room);
};
</script>

<style scoped>
.room-card {
  border: 1px solid #f0f0f0;
  position: relative;
  overflow: hidden;
}

.room-card:hover {
  border-color: #e5e7eb;
}

/* 添加装饰性背景 */
.room-card::before {
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  width: 150px;
  height: 150px;
  background: linear-gradient(45deg, transparent, rgba(var(--van-primary-color), 0.03));
  border-radius: 50%;
  transform: translate(50%, -50%);
  pointer-events: none;
}
</style>
