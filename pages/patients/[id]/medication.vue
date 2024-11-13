<template>
  <div class="medication-page">
    <van-nav-bar title="用药记录" left-arrow @click-left="router.back()" fixed placeholder />

    <van-collapse v-model="activeNames">
      <!-- 用药记录表单 -->
      <van-collapse-item
        title="记录用药"
        name="recordForm"
        class="mb-3 overflow-hidden rounded-lg shadow-sm">
        <van-form @submit="onSubmit">
          <van-cell-group inset>
            <van-field
              v-model="formData.medicationName"
              name="medicationName"
              label="药品名称"
              placeholder="请输入药品名称"
              :rules="[{ required: true, message: '请输入药品名称' }]" />

            <van-field
              v-model="formData.dosage"
              name="dosage"
              label="剂量"
              placeholder="请输入用药剂量"
              :rules="[{ required: true, message: '请输入用药剂量' }]" />

            <PopupSelect
              v-model="formData.frequency"
              name="frequency"
              label="用药频率"
              placeholder="请选择用药频率"
              :rules="[{ required: true, message: '请选择用药频率' }]"
              :options="getOptions('MedicationFrequency')" />

            <PopupSelect
              v-model="formData.route"
              name="route"
              label="给药途径"
              placeholder="请选择给药途径"
              :rules="[{ required: true, message: '请选择给药途径' }]"
              :options="getOptions('MedicationRoute')" />

            <DateField
              v-model="formData.startDate"
              name="startDate"
              label="开始日期"
              placeholder="请选择开始日期"
              :rules="[{ required: true, message: '请选择开始日期' }]" />

            <DateField
              v-model="formData.endDate"
              name="endDate"
              label="结束日期"
              placeholder="请选择结束日期（可选）"
              :rules="[{ required: false, message: '请选择结束日期（可选）' }]" />

            <van-field
              v-model="formData.notes"
              name="notes"
              label="备注"
              type="textarea"
              rows="2"
              placeholder="请输入备注信息" />
          </van-cell-group>

          <van-cell-group inset>
            <van-field
              v-model="reminderSettings.notifyBefore"
              type="digit"
              label="提前提醒"
              placeholder="请输入提醒时间（分钟）">
              <template #right-icon>分钟</template>
            </van-field>

            <van-cell title="启用提醒">
              <template #right-icon>
                <van-switch v-model="reminderSettings.enabled" />
              </template>
            </van-cell>
          </van-cell-group>

          <div class="p-4">
            <van-button round block type="primary" native-type="submit">提交记录</van-button>
          </div>
        </van-form>
      </van-collapse-item>

      <MedicationReminders :patient-id="Number(route.params.id)" />

      <!-- 用药历史记录 -->
      <van-collapse-item
        title="历史记录"
        name="history"
        class="mb-3 overflow-hidden rounded-lg shadow-sm">
        <van-list
          v-model:loading="loading"
          :finished="true"
          finished-text="暂无用药记录"
          class="pb-20">
          <van-cell-group
            v-for="(record, index) in medicationStore.records"
            :key="record.id"
            inset
            class="mx-4 mb-3 overflow-hidden rounded-lg bg-white">
            <van-swipe-cell>
              <van-cell>
                <!-- 标题栏：药品名称和状态标签 -->
                <template #title>
                  <div class="mb-2 flex items-center justify-between">
                    <span class="text-lg font-medium">{{ record.medicationName }}</span>
                    <van-tag
                      :type="getType('MedicationStatus', record.status) as TagType"
                      size="medium"
                      round>
                      {{ getLabel("MedicationStatus", record.status) }}
                    </van-tag>
                  </div>
                </template>

                <template #label>
                  <div class="space-y-3">
                    <!-- 用药详情 -->
                    <div class="grid grid-cols-2 gap-2 rounded-lg bg-gray-50 p-2 text-sm">
                      <div class="flex items-center gap-2">
                        <van-icon name="replay" class="text-gray-400" />
                        <span>{{ getLabel("MedicationFrequency", record.frequency) }}</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <van-icon name="guide-o" class="text-gray-400" />
                        <span>{{ getLabel("MedicationRoute", record.route) }}</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <van-icon name="balance-o" class="text-gray-400" />
                        <span>{{ record.dosage }}</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <van-icon name="underway" class="text-gray-400" />
                        <span>{{ formatDate(record.startDate) }}</span>
                      </div>
                    </div>

                    <!-- 备注信息 -->
                    <div v-if="record.notes" class="rounded-lg bg-gray-50 p-2 text-sm">
                      <div class="flex items-start gap-2">
                        <van-icon name="notes" class="mt-0.5 text-gray-400" />
                        <span class="text-gray-600">{{ record.notes }}</span>
                      </div>
                    </div>

                    <!-- 底部信息：操作人和时间 -->
                    <div class="flex items-center justify-between text-xs text-gray-400">
                      <div class="flex items-center gap-1">
                        <van-icon name="manager" />
                        <span>{{ record.administeredBy }}</span>
                      </div>
                      <span>{{ formatDate(record.administeredAt) }}</span>
                    </div>
                  </div>
                </template>
              </van-cell>
              <!-- 操作按钮 -->
              <template #right>
                <van-button
                  v-if="record.status === MedicationStatus.ACTIVE"
                  square
                  type="success"
                  class="!h-full"
                  @click="updateStatus(record.id, MedicationStatus.COMPLETED)">
                  完成
                </van-button>
                <van-button
                  v-if="record.status === MedicationStatus.ACTIVE"
                  square
                  type="warning"
                  class="!h-full"
                  @click="updateStatus(record.id, MedicationStatus.DISCONTINUED)">
                  停用
                </van-button>
                <van-button
                  v-if="record.status === MedicationStatus.DISCONTINUED"
                  square
                  type="primary"
                  class="!h-full"
                  @click="updateStatus(record.id, MedicationStatus.ACTIVE)">
                  启用
                </van-button>
                <van-button
                  v-if="record.status !== MedicationStatus.ACTIVE"
                  square
                  type="danger"
                  class="!h-full"
                  @click="confirmDelete(record)">
                  删除
                </van-button>
              </template>
            </van-swipe-cell>
          </van-cell-group>
        </van-list>
      </van-collapse-item>
    </van-collapse>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { showDialog, showSuccessToast, showFailToast, type TagType } from "vant";
import { useMedicationStore } from "~/stores/medicationStore";
import { useMedicationReminderStore } from "~/stores/medicationReminderStore";
import {
  MedicationFrequency,
  MedicationRoute,
  MedicationStatus,
  type MedicationRecord
} from "~/types/models/medication";
import { useEnum } from "~/types/enums/metadata";

const { getLabel, getOptions, getType } = useEnum();

const route = useRoute();
const router = useRouter();
const medicationStore = useMedicationStore();
const reminderStore = useMedicationReminderStore();

const activeNames = ref(["recordForm", "history"]);
const loading = ref(false);
const formData = ref({
  medicationName: "",
  dosage: "",
  frequency: MedicationFrequency.NULL,
  route: MedicationRoute.NULL,
  startDate: new Date(),
  endDate: undefined,
  notes: ""
});

const authStore = useAuthStore();
const { user } = storeToRefs(authStore);

const reminderSettings = ref({
  enabled: true,
  notifyBefore: 15,
  repeatInterval: 0
});

const onSubmit = async () => {
  try {
    const recordId = await medicationStore.addMedicationRecord({
      ...formData.value,
      patientId: Number(route.params.id),
      status: MedicationStatus.ACTIVE,
      administeredBy: user.value?.name || "",
      administeredAt: new Date()
    });

    if (reminderSettings.value.enabled && recordId) {
      await reminderStore.createReminders(
        recordId,
        Number(route.params.id),
        formData.value.startDate,
        formData.value.endDate,
        reminderSettings.value.notifyBefore
      );
    }

    showSuccessToast("记录保存成功");
    // 重置表单
    formData.value = {
      medicationName: "",
      dosage: "",
      frequency: MedicationFrequency.NULL,
      route: MedicationRoute.NULL,
      startDate: new Date(),
      endDate: undefined,
      notes: ""
    };
  } catch (error) {
    showFailToast("记录保存失败");
  }
};

const updateStatus = async (id: number | undefined, status: MedicationStatus) => {
  try {
    if (!id) {
      showFailToast("记录不存在");
      return;
    }
    await medicationStore.updateMedicationStatus(id, status);
    showSuccessToast("状态更新成功");
  } catch (error) {
    showFailToast("状态更新失败");
  }
};

const confirmDelete = (record: MedicationRecord) => {
  showDialog({
    title: "确认删除",
    message: "确定要删除这条用药记录吗？此操作不可恢复。",
    showCancelButton: true
  }).then(async () => {
    try {
      if (!record.id) {
        showFailToast("记录不存在");
        return;
      }
      await medicationStore.deleteRecord(record.id);
      showSuccessToast("删除成功");
      // 重新加载数据
      await medicationStore.fetchMedicationRecords(Number(route.params.id));
    } catch (error) {
      showFailToast((error as Error).message);
    }
  });
};

// 初始化加载数据
onMounted(async () => {
  await medicationStore.fetchMedicationRecords(Number(route.params.id));
});
</script>
