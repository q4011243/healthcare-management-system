<template>
  <van-dialog
    v-model:show="show"
    :title="room ? '编辑房间' : '新增房间'"
    class="room-form-dialog"
    show-cancel-button
    @confirm="handleSubmit"
    @cancel="handleCancel">
    <div class="form-container">
      <van-form @submit="handleSubmit">
        <!-- 基本信息组 -->
        <div class="form-section">
          <div class="section-title">基本信息</div>
          <van-cell-group inset>
            <van-field
              v-model="formData.code"
              label="房间号"
              placeholder="请输入房间号"
              :rules="[{ required: true, message: '请输入房间号' }]"
              class="form-field" />

            <van-field
              v-model="formData.name"
              label="房间名称"
              placeholder="请输入房间名称"
              :rules="[{ required: true, message: '请输入房间名称' }]"
              class="form-field" />

            <van-field
              v-model="formData.floor"
              type="digit"
              label="楼层"
              placeholder="请输入楼层"
              :rules="[{ required: true, message: '请输入楼层' }]"
              class="form-field" />
          </van-cell-group>
        </div>

        <!-- 房间配置组 -->
        <div class="form-section">
          <div class="section-title">房间配置</div>
          <van-cell-group inset>
            <PopupSelect
              v-model="formData.type"
              label="房间类型"
              placeholder="请选择房间类型"
              :options="enumUtil.getOptions('RoomType')"
              :rules="[{ required: true, message: '请选择房间类型' }]"
              class="form-field" />

            <van-field
              v-model="formData.capacity"
              type="digit"
              label="床位数"
              placeholder="请输入床位数"
              :rules="[
                { required: true, message: '请输入床位数' },
                { validator: validateCapacity, message: '床位数必须大于0且小于等于8' }
              ]"
              class="form-field" />

            <PopupSelect
              v-model="formData.gender"
              label="性别要求"
              placeholder="请选择性别要求"
              :options="enumUtil.getOptions('GenderRequirement')"
              :rules="[{ required: true, message: '请选择性别要求' }]"
              class="form-field" />
          </van-cell-group>
        </div>

        <!-- 设施与状态组 -->
        <div class="form-section">
          <div class="section-title">设施与状态</div>
          <van-cell-group inset>
            <van-field name="设施配置" label="设施配置" class="form-field">
              <template #input>
                <van-checkbox-group v-model="formData.facilities" class="flex flex-col gap-1">
                  <van-checkbox name="hasOxygen" class="facility-item">供氧</van-checkbox>
                  <van-checkbox name="hasToilet" class="facility-item">卫生间</van-checkbox>
                </van-checkbox-group>
              </template>
            </van-field>

            <PopupSelect
              v-model="formData.status"
              label="房间状态"
              placeholder="请选择房间状态"
              :options="enumUtil.getOptions('RoomStatus')"
              :rules="[{ required: true, message: '请选择房间状态' }]"
              class="form-field" />
          </van-cell-group>
        </div>
      </van-form>
    </div>
  </van-dialog>
</template>

<style scoped>
.room-form-dialog {
  max-width: 650px;
  width: 90%;
  margin: 0 auto;
}

.form-container {
  padding: 16px;
  max-height: 70vh;
  overflow-y: auto;
}

.form-section {
  margin-bottom: 6px;
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--van-text-color);
  margin-bottom: 6px;
  padding-left: 8px;
  border-left: 3px solid var(--van-primary-color);
}

.form-field {
  margin-bottom: 4px;
}

.form-field:last-child {
  margin-bottom: 0;
}

.facility-item {
  flex: 1;
}

:deep(.van-cell-group--inset) {
  margin: 0;
}

:deep(.van-dialog__content) {
  max-height: 80vh;
  overflow-y: auto;
}
</style>

<script setup lang="ts">
import { ref, watch } from "vue";
import type { Room } from "~/types/models/ward";
import { RoomType, RoomStatus, GenderRequirement } from "~/types/enums/enums";
import PopupSelect from "~/components/common/PopupSelect.vue";
import { useEnum } from "~/types/enums/metadata";

const show = defineModel<boolean>("show", { required: true });
const enumUtil = useEnum();

const props = defineProps<{
  room?: Room;
  wardId: number;
}>();

const emit = defineEmits<{
  (e: "update:show", value: boolean): void;
  (e: "submit", room: Partial<Room>): void;
}>();

// 表单数据
const formData = ref({
  code: "",
  name: "",
  floor: "",
  type: "" as RoomType,
  capacity: "",
  gender: "" as GenderRequirement,
  facilities: [] as string[],
  status: RoomStatus.AVAILABLE
});

// 床位数验证
const validateCapacity = (value: string) => {
  const num = Number(value);
  return num > 0 && num <= 8;
};

// 监听编辑模式
watch(
  () => props.room,
  (newRoom) => {
    if (newRoom) {
      formData.value = {
        code: newRoom.code,
        name: newRoom.name,
        floor: String(newRoom.floor),
        type: newRoom.type,
        capacity: String(newRoom.capacity),
        gender: newRoom.gender,
        facilities: [
          ...(newRoom.hasOxygen ? ["hasOxygen"] : []),
          ...(newRoom.hasToilet ? ["hasToilet"] : [])
        ],
        status: newRoom.status
      };
    } else {
      // 重置表单
      formData.value = {
        code: "",
        name: "",
        floor: "",
        type: "" as RoomType,
        capacity: "",
        gender: "" as GenderRequirement,
        facilities: [],
        status: RoomStatus.AVAILABLE
      };
    }
  },
  { immediate: true }
);

// 表单提交
const handleSubmit = () => {
  const roomData: Partial<Room> = {
    code: formData.value.code,
    name: formData.value.name,
    floor: Number(formData.value.floor),
    type: formData.value.type,
    capacity: Number(formData.value.capacity),
    gender: formData.value.gender,
    hasOxygen: formData.value.facilities.includes("hasOxygen"),
    hasToilet: formData.value.facilities.includes("hasToilet"),
    status: formData.value.status,
    wardId: props.wardId
  };

  emit("submit", roomData);
};

const handleCancel = () => {
  emit("update:show", false);
};
</script>
