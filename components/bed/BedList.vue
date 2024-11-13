<template>
  <div class="bed-list">
    <div class="bed-list-header">
      <h4 class="text-lg font-medium">床位列表</h4>
      <van-button
        type="primary"
        size="small"
        icon="plus"
        :disabled="isRoomFull"
        @click="handleAddBedClick">
        添加床位
      </van-button>
    </div>

    <div class="bed-grid">
      <van-card
        v-for="bed in beds"
        :key="bed.id"
        class="bed-card"
        :class="{
          'bed-occupied': bed.status === BedStatus.OCCUPIED,
          'bed-maintenance': bed.status === BedStatus.MAINTENANCE
        }">
        <template #title>
          <div class="bed-title-wrapper">
            <span class="bed-name">{{ bed.name }}</span>
            <EnumTag enum-name="BedStatus" :value="bed.status" :round="true" />
          </div>
        </template>

        <template #desc>
          <div class="bed-info">
            <div class="info-item">
              <van-icon name="notes-o" class="info-icon" />
              <span>编号：{{ bed.code }}</span>
            </div>
            <div class="info-item">
              <van-icon name="clock" class="info-icon" />
              <span>类型：{{ enumUtil.getLabel("BedType", bed.type) }}</span>
            </div>
            <div v-if="bed.hasCall" class="info-item">
              <van-icon name="phone-o" class="info-icon" />
              <span>呼叫器</span>
            </div>

            <template v-if="bed.status === BedStatus.OCCUPIED && bed.patient">
              <div class="patient-info">
                <div class="info-item">
                  <van-icon name="contact" class="info-icon" />
                  <span>姓名：{{ bed.patient.name }}</span>
                </div>
                <div class="info-item">
                  <van-icon name="records" class="info-icon" />
                  <span>住院号：{{ bed.patient.idCard }}</span>
                </div>
              </div>
            </template>
          </div>
        </template>

        <template #footer>
          <div class="bed-actions">
            <van-button
              v-if="bed.status === BedStatus.AVAILABLE"
              size="small"
              type="primary"
              @click="handleAssign(bed.id)">
              分配床位
            </van-button>
            <van-button
              v-if="bed.status === BedStatus.OCCUPIED"
              size="small"
              type="warning"
              @click="handleRelease(bed.id)">
              释放床位
            </van-button>
            <van-button
              v-if="!isStatusDisabled(bed.id)"
              size="small"
              type="primary"
              @click="showStatusManager(bed)">
              管理状态
            </van-button>
            <van-button plain type="primary" size="small" @click="onEditBed(bed)">编辑</van-button>
            <van-button
              v-if="bed.status !== BedStatus.OCCUPIED"
              plain
              type="danger"
              size="small"
              @click="handleDelete(bed)">
              删除
            </van-button>
          </div>
        </template>
      </van-card>
    </div>

    <van-empty v-if="!beds.length" description="暂无床位" class="bed-empty" />

    <!-- 添加床位对话框 -->
    <van-dialog
      v-model:show="showAddBed"
      title="添加床位"
      :show-confirm-button="false"
      teleport="body">
      <BedForm :room-id="roomId" @submit="handleAddBed" @cancel="handleCancel('add')" />
    </van-dialog>

    <!-- 编辑床位对话框 -->
    <van-dialog
      v-model:show="showEditBed"
      title="编辑床位"
      :show-confirm-button="false"
      teleport="body">
      <BedForm
        v-if="currentBed"
        :room-id="roomId"
        :bed="currentBed"
        @submit="handleEditBed"
        @cancel="handleCancel('edit')" />
    </van-dialog>

    <!-- 删除确认对话框 -->
    <van-dialog
      v-model:show="showDeleteConfirm"
      title="删除确认"
      show-cancel-button
      teleport="body"
      @confirm="handleConfirmDelete"
      @cancel="handleCancel('delete')">
      <div class="p-4">
        <p class="text-center">确定要删除该床位吗？此操作不可恢复。</p>
      </div>
    </van-dialog>

    <!-- 管理床位状态对话框 -->
    <van-dialog
      v-model:show="showStatusDialog"
      title="管理床位状态"
      :show-confirm-button="false"
      teleport="body"
      show-cancel-button>
      <BedStatusManager v-if="currentBed" :bed="currentBed" @status-updated="handleStatusUpdated" />
    </van-dialog>

    <!-- 床位分配对话框 -->
    <BedAssignment
      v-if="currentBedId"
      v-model:show="showAssignment"
      :bed-id="currentBedId"
      @assigned="handleAssignmentComplete" />
  </div>
</template>

<script setup lang="ts">
import type { TagType } from "vant";
import { ref, onMounted } from "vue";
import { useBedStore } from "~/stores/bedStore";
import { useEnum } from "~/types/enums/metadata";
import { type Bed } from "~/types/models/ward";
import { BedStatus } from "~/types/enums/enums";
import BedForm from "~/components/bed/BedForm.vue";
import { showToast } from "vant";
import BedStatusManager from "~/components/bed/BedStatusManager.vue";
import BedAssignment from "./BedAssignment.vue";
import { roomService } from "~/api/services/roomService";
import EnumTag from "~/components/common/EnumTag.vue";

const props = defineProps<{
  roomId: number;
}>();

const bedStore = useBedStore();
const enumUtil = useEnum();
const beds = ref<Bed[]>([]);
const showAddBed = ref(false);
const showEditBed = ref(false);
const showDeleteConfirm = ref(false);
const currentBed = ref<Bed | null>(null);
const showStatusDialog = ref(false);
const showAssignment = ref(false);
const currentBedId = ref<number | null>(null);
const isRoomFull = ref(false);
const roomStore = useRoomStore();

// 获取床位列表
const fetchBeds = async () => {
  beds.value = await bedStore.fetchBedsByRoomId(props.roomId);
  await checkRoomCapacity();
};

onMounted(async () => {
  await fetchBeds();
  await checkRoomCapacity();
});

const onEditBed = (bed: Bed) => {
  currentBed.value = bed;
  showEditBed.value = true;
};

// 添加床位
const handleAddBed = async (data: Partial<Bed>) => {
  try {
    // 确保必需字段存在
    if (!data.roomId || !data.name || !data.code || !data.type) {
      showToast("请填写完整信息");
      return;
    }

    // 创建完整的床位对象
    const newBed: Omit<Bed, "id"> = {
      roomId: props.roomId,
      name: data.name,
      code: data.code,
      type: data.type,
      status: data.status || BedStatus.AVAILABLE,
      hasCall: data.hasCall || false
    };

    await bedStore.addBed(newBed);
    await fetchBeds(); // 重新获取列表
    showAddBed.value = false;
    showToast("添加成功");
  } catch (error) {
    showToast("添加失败");
  }
};

const handleEditBed = async (data: Partial<Bed>) => {
  try {
    if (!currentBed.value?.id) {
      showToast("无效的床位信息");
      return;
    }

    // 确保更新数据的完整性
    const updateData: Partial<Bed> = {
      ...data,
      roomId: props.roomId // 确保 roomId 正确
    };

    await bedStore.updateBed(currentBed.value.id, updateData);
    await fetchBeds(); // 重新获取列表
    showEditBed.value = false;
    currentBed.value = null;
    showToast("修改成功");
  } catch (error) {
    showToast("修改失败");
  }
};

// 删除床位
const handleDelete = (bed: Bed) => {
  currentBed.value = bed;
  showDeleteConfirm.value = true;
};

const handleConfirmDelete = async () => {
  try {
    if (!currentBed.value?.id) {
      showToast("无效的床位信息");
      return;
    }

    // 检查床位状态
    if (currentBed.value.status === BedStatus.OCCUPIED) {
      showToast("床位已被占用，无法删除");
      showDeleteConfirm.value = false;
      return;
    }

    await bedStore.deleteBed(currentBed.value.id);
    await fetchBeds(); // 重新获取列表
    showDeleteConfirm.value = false;
    currentBed.value = null;
    showToast("删除成功");
  } catch (error) {
    console.error("删除床位失败:", error);
    showToast("删除失败");
  }
};

// 处理取消操作
const handleCancel = (type: "add" | "edit" | "delete") => {
  switch (type) {
    case "add":
      showAddBed.value = false;
      break;
    case "edit":
      showEditBed.value = false;
      currentBed.value = null;
      break;
    case "delete":
      showDeleteConfirm.value = false;
      currentBed.value = null;
      break;
  }
};

// 添加状态管理方法
const showStatusManager = (bed: Bed) => {
  currentBed.value = bed;
  showStatusDialog.value = true;
};

// 处理状态更新
const handleStatusUpdated = async (status: BedStatus) => {
  showStatusDialog.value = false;
  await fetchBeds(); // 刷新床位列表
};

const isStatusDisabled = (bedId: number | undefined) => {
  if (!bedId) return false;
  return bedStore.isStatusDisabled(bedId);
};

// 显示分配对话框
const handleAssign = (bedId: number) => {
  currentBedId.value = bedId;
  showAssignment.value = true;
};

// 处理分配完成
const handleAssignmentComplete = async () => {
  showAssignment.value = false;
  await fetchBeds(); // 刷新床位列表
};

// 处理床位释放
const handleRelease = async (bedId: number) => {
  try {
    await bedStore.releaseBed(bedId);
    showToast("床位释放成功");
    await fetchBeds(); // 刷新床位列表
  } catch (error) {
    showToast("床位释放失败");
  }
};

// 检查房间是否已满
const checkRoomCapacity = async () => {
  isRoomFull.value = await roomStore.isRoomFull(props.roomId);
};

// 修改添加床位的点击处理
const handleAddBedClick = async () => {
  if (isRoomFull.value) {
    showToast("该房间床位已满，无法添加更多床位");
    return;
  }
  showAddBed.value = true;
};
</script>

<style scoped>
.bed-list {
  padding: 16px;
  position: relative;
}

.bed-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.bed-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

.bed-card {
  background: #fff;
  border-radius: 8px;
  border: 1px solid var(--van-gray-3);
  transition: all 0.3s;
}

.bed-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.bed-occupied {
  border-color: var(--van-orange);
}

.bed-maintenance {
  border-color: var(--van-red);
}

.bed-title-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.bed-info {
  margin-top: 8px;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.info-icon {
  margin-right: 4px;
}

.bed-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

.bed-empty {
  padding: 32px 0;
}

:deep(.van-dialog) {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2000;
}

.patient-info {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--van-gray-3);
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
  color: var(--van-text-color);
  font-size: 14px;
}

.info-icon {
  margin-right: 4px;
  color: var(--van-gray-6);
}

/* 添加禁用状态的样式 */
:deep(.van-button--disabled) {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
