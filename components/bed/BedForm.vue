<template>
  <van-form @submit="onSubmit">
    <van-cell-group inset>
      <van-field
        v-model="formData.code"
        name="code"
        label="床位编码"
        placeholder="请输入床位编码"
        :rules="[{ required: true, message: '请输入床位编码' }]" />

      <van-field
        v-model="formData.name"
        name="name"
        label="床位名称"
        placeholder="请输入床位名称"
        :rules="[{ required: true, message: '请输入床位名称' }]" />

      <van-field
        name="type"
        label="床位类型"
        :rules="[{ required: true, message: '请选择床位类型' }]">
        <template #input>
          <EnumRadioGroup enumName="BedType" v-model="formData.type" />
        </template>
      </van-field>

      <van-field name="hasCall" label="呼叫器">
        <template #input>
          <van-switch v-model="formData.hasCall" />
        </template>
      </van-field>
    </van-cell-group>

    <div class="form-actions">
      <van-button round block type="primary" native-type="submit" class="submit-btn">
        {{ props.bed ? "保存修改" : "添加床位" }}
      </van-button>
      <van-button round block plain type="default" @click="handleCancel" class="cancel-btn">
        取消
      </van-button>
    </div>
  </van-form>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { BedStatus } from "~/types/enums/enums";
import type { Bed } from "~/types/models/ward";

const props = defineProps<{
  bed?: Bed;
  roomId: number;
}>();

const emit = defineEmits<{
  (e: "submit", data: Partial<Bed>): void;
  (e: "cancel"): void;
}>();

const formData = ref({
  code: props.bed?.code ?? "",
  name: props.bed?.name ?? "",
  type: props.bed?.type ?? "NORMAL",
  hasCall: props.bed?.hasCall ?? false,
  roomId: props.roomId,
  status: props.bed?.status ?? BedStatus.AVAILABLE
});

const onSubmit = () => {
  emit("submit", formData.value);
};

const handleCancel = () => {
  emit("cancel");
};
</script>

<style scoped>
.form-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
  padding: 0 16px 16px;
}

.submit-btn {
  margin-bottom: 8px;
}

.cancel-btn {
  --van-button-default-background: var(--van-gray-2);
  --van-button-default-border-color: var(--van-gray-3);
}
</style>
