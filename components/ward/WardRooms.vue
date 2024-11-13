<template>
  <div class="ward-rooms p-4">
    <!-- 搜索和筛选区 -->
    <div class="mb-4 flex items-center justify-between gap-3">
      <!-- 搜索框 -->
      <div class="flex-10 min-w-[220px]">
        <van-search
          v-model="searchText"
          placeholder="搜索房间号/患者姓名"
          shape="round"
          background="transparent"
          class="search-input" />
      </div>
      <!-- 新增按钮 -->
      <van-button type="primary" icon="plus" class="add-btn max-w-[110px]" @click="onAddRoom">
        新增房间
      </van-button>
    </div>

    <!-- 房间列表 -->
    <div class="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      <template v-for="room in roomsWithPatients" :key="room.id">
        <room-card
          :room="room"
          :patient-count="room.patientCount"
          :patients="room.patients"
          @edit="onEditRoom(room)"
          @delete="onDeleteRoom(room)"
          @view-detail="onViewRoomDetail(room)"
          @add-patient="onAddPatient(room)" />
      </template>
    </div>

    <!-- 空状态 -->
    <div
      v-if="roomsWithPatients.length === 0"
      class="flex flex-col items-center justify-center py-8">
      <van-empty description="暂无房间数据">
        <van-button type="primary" class="mt-2" @click="onAddRoom">添加房间</van-button>
      </van-empty>
    </div>

    <!-- 添加表单弹窗 -->
    <room-form-dialog
      v-model:show="showFormDialog"
      :room="currentRoom"
      :ward-id="wardId"
      @submit="handleRoomSubmit" />

    <!-- 删除确认弹窗 -->
    <van-dialog
      v-model:show="showDeleteDialog"
      title="删除确认"
      show-cancel-button
      @confirm="handleDeleteConfirm"
      @cancel="showDeleteDialog = false">
      <div class="p-4">
        <p class="text-gray-600">确定要删除该房间吗？</p>
        <template v-if="roomToDelete?.patients.length > 0">
          <p class="mt-2 text-red-500">
            警告：该房间当前有{{
              roomToDelete?.patients.length
            }}名患者，删除前请确保已妥善安置所有患者。
          </p>
        </template>
      </div>
    </van-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { showToast, showDialog } from "vant";
import { useRoomStore } from "~/stores/roomStore";
import { usePatientStore } from "~/stores/patientStore";
import { type Room } from "~/types/models/ward";
import { RoomStatus } from "~/types/enums/enums";
import RoomCard from "./RoomCard.vue";
import RoomFormDialog from "./RoomFormDialog.vue";
import type { ResourceType } from "~/types/models/log";

const props = defineProps<{
  wardId: number;
}>();

const roomStore = useRoomStore();
const patientStore = usePatientStore();
const logStore = useLogStore();
const router = useRouter();
const searchText = ref("");
const filterStatus = ref<RoomStatus | "all">("all");

// 使用 store 的数据
const filteredRooms = computed(() => {
  return roomStore.rooms.filter((room) => {
    const matchSearch = searchText.value
      ? room.code.includes(searchText.value) || room.name.includes(searchText.value)
      : true;

    const matchStatus = filterStatus.value === "all" ? true : room.status === filterStatus.value;

    return matchSearch && matchStatus;
  });
});

// 初始化数据
onMounted(async () => {
  roomStore.setCurrentWard(props.wardId);
  await roomStore.fetchRooms();

  // 获取所有房间的患者信息
  const roomIds = roomStore.rooms.map((room) => room.id!);
  await patientStore.fetchPatientsForRooms(roomIds);
});

// 计算属性：为每个房间添加患者信息
const roomsWithPatients = computed(() => {
  return filteredRooms.value.map((room) => ({
    ...room,
    patientCount: patientStore.getPatientsCountByRoom(room.id!),
    patients: patientStore.getPatientsByRoom(room.id!)
  }));
});

// 表单控制
const showFormDialog = ref(false);
const currentRoom = ref<Room | null>(null);

// 更新事件处理方法
const onEditRoom = (room: Room) => {
  currentRoom.value = room;
  showFormDialog.value = true;
};

const handleRoomSubmit = async (roomData: Partial<Room>) => {
  try {
    if (currentRoom.value) {
      await roomStore.updateRoom(currentRoom.value.id!, roomData);
      showToast("房间更新成功");
    } else {
      // 确保提供所有必要的字段
      const newRoomData = {
        ...roomData,
        wardId: props.wardId
      } as Omit<Room, "id">;
      console.log("newRoomData", newRoomData);

      await roomStore.createRoom(newRoomData);
      showToast("房间创建成功");
    }
    showFormDialog.value = false;
    currentRoom.value = null;
    await roomStore.fetchRooms();
  } catch (error) {
    showToast({
      type: "fail",
      message: "操作失败：" + (error as Error).message
    });
  }
};

const onViewRoomDetail = (room: Room) => {
  router.push(`/ward/${props.wardId}/rooms/${room.id}`);
};

const onAddPatient = (room: Room) => {
  // TODO: 打开添加患者弹窗
};

// 新增房间方法
const onAddRoom = () => {
  currentRoom.value = null; // 清空当前房间，表示新增模式
  showFormDialog.value = true;
};

// 删除相关的响应式变量
const showDeleteDialog = ref(false);
const roomToDelete = ref<Room | null>(null);

// 删除房间方法
const onDeleteRoom = async (room: Room) => {
  // 如果房间有患者，显示二次确认
  if (room.patients.length > -1) {
    roomToDelete.value = room;
    showDeleteDialog.value = true;
    return;
  }

  // 直接删除无患者的房间
  await handleDeleteConfirm(room);
};

// 删除确认处理
const handleDeleteConfirm = async (room: Room = roomToDelete.value!) => {
  try {
    await roomStore.deleteRoom(room.id!);
    showToast({
      type: "success",
      message: "删除成功"
    });

    // 记录操作日志
    await logStore.addLog({
      action: "delete",
      resource: "room" as ResourceType,
      resourceId: room.id!.toString(),
      details: {
        roomCode: room.code,
        roomName: room.name,
        wardId: props.wardId
      }
    });

    // 重新加载房间列表
    await roomStore.fetchRooms();
  } catch (error) {
    showToast({
      type: "fail",
      message: "删除失败：" + (error as Error).message
    });
  } finally {
    showDeleteDialog.value = false;
    roomToDelete.value = null;
  }
};
</script>

<style scoped>
.ward-rooms {
  background-color: #f5f5f5;
}

.search-input {
  :deep(.van-search__content) {
    background-color: white;
    border-radius: 8px;
  }
}

.filter-menu {
  :deep(.van-dropdown-menu__bar) {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }

  :deep(.van-dropdown-menu__item) {
    height: 36px;
    padding: 0 12px;
  }
}

.filter-btn,
.add-btn {
  height: 36px;
  border-radius: 8px;
}

.filter-popup {
  width: 80%;
  max-width: 375px;
  height: 100%;
}

/* 响应式调整 */
@media (max-width: 640px) {
  .filter-menu,
  .filter-btn,
  .add-btn {
    flex: 1;
    min-width: auto;
  }
}
</style>
