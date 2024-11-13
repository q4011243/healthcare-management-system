<template>
  <div class="vital-signs-form">
    <van-form @submit="onSubmit">
      <van-cell-group inset>
        <van-field
          v-model="formData.temperature"
          type="digit"
          label="体温"
          placeholder="请输入体温"
          :rules="[{ required: true, message: '请输入体温' }]">
          <template #right-icon>℃</template>
        </van-field>

        <van-field
          v-model="formData.pulseRate"
          type="digit"
          label="脉搏"
          placeholder="请输入脉搏"
          :rules="[{ required: true, message: '请输入脉搏' }]">
          <template #right-icon>次/分</template>
        </van-field>

        <van-field
          v-model="formData.bloodPressureSystolic"
          type="digit"
          label="收缩压"
          placeholder="请输入收缩压"
          :rules="[{ required: true, message: '请输入收缩压' }]">
          <template #right-icon>mmHg</template>
        </van-field>

        <van-field
          v-model="formData.bloodPressureDiastolic"
          type="digit"
          label="舒张压"
          placeholder="请输入舒张压"
          :rules="[{ required: true, message: '请输入舒张压' }]">
          <template #right-icon>mmHg</template>
        </van-field>

        <van-field
          v-model="formData.oxygenSaturation"
          type="digit"
          label="血氧饱和度"
          placeholder="请输入血氧饱和度"
          :rules="[{ required: true, message: '请输入血氧饱和度' }]">
          <template #right-icon>%</template>
        </van-field>

        <van-field
          v-model="formData.notes"
          type="textarea"
          label="备注"
          placeholder="请输入备注信息"
          autosize />
      </van-cell-group>

      <div class="p-4">
        <van-button round block type="primary" native-type="submit">保存记录</van-button>
      </div>
    </van-form>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { showSuccessToast, showFailToast } from "vant";
import { useVitalSignsStore } from "~/stores/vitalSignsStore";
import type { VitalSigns } from "~/types/models/vitalSigns";

const props = defineProps<{
  patientId: number;
}>();

const emit = defineEmits<{
  (event: "saved"): void;
}>();

const vitalSignsStore = useVitalSignsStore();
const authStore = useAuthStore();
const formData = ref<Partial<VitalSigns>>({});

const onSubmit = async () => {
  try {
    // 获取当前用户
    await vitalSignsStore.addVitalSigns({
      ...formData.value,
      patientId: props.patientId,
      recordedBy: authStore.user?.name,
      recordedAt: new Date()
    } as VitalSigns);

    showSuccessToast("记录保存成功");
    emit("saved");
    formData.value = {};
  } catch (error) {
    showFailToast("记录保存失败");
  }
};
</script>
