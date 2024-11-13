<template>
  <div class="nursing-page">
    <van-nav-bar title="护理记录" left-arrow @click-left="router.back()" fixed placeholder />

    <van-collapse v-model="activeNames">
      <!-- 记录护理表单 -->
      <van-collapse-item
        title="记录护理"
        name="recordForm"
        class="mb-3 overflow-hidden rounded-lg shadow-sm">
        <van-form @submit="onSubmit">
          <van-cell-group inset>
            <PopupSelect
              v-model="formData.type"
              name="type"
              label="护理类型"
              placeholder="请选择护理类型"
              :rules="[{ required: true, message: '请选择护理类型' }]"
              :options="getOptions('NursingType')" />

            <van-field
              v-model="formData.description"
              name="description"
              label="护理内容"
              type="textarea"
              rows="2"
              placeholder="请输入护理内容"
              :rules="[{ required: true, message: '请输入护理内容' }]" />

            <van-field
              v-model="formData.notes"
              name="notes"
              label="备注"
              type="textarea"
              rows="2"
              placeholder="请输入备注信息" />
          </van-cell-group>

          <div class="p-4">
            <van-button round block type="primary" native-type="submit">提交记录</van-button>
          </div>
        </van-form>
      </van-collapse-item>

      <!-- 护理历史记录 -->
      <van-collapse-item
        title="历史记录"
        name="history"
        class="mb-3 overflow-hidden rounded-lg shadow-sm">
        <van-list
          v-model:loading="loading"
          :finished="true"
          finished-text="没有更多数据"
          class="pb-4">
          <div v-if="nursingStore.records.length === 0" class="py-8 text-center text-gray-500">
            暂无护理记录
          </div>

          <van-cell-group
            v-for="(record, index) in nursingStore.records"
            :key="record.id"
            inset
            class="mx-4 mb-3 overflow-hidden rounded-lg bg-white">
            <van-swipe-cell>
              <van-cell>
                <template #title>
                  <div class="flex items-center justify-between">
                    <span class="text-base font-medium">
                      {{ getLabel("NursingType", record.type) }}
                    </span>
                    <van-tag
                      :type="record.type === NursingType.MEDICATION ? 'warning' : 'primary'"
                      plain
                      round
                      size="medium">
                      {{ formatDateCN(record.performedAt) }}
                    </van-tag>
                  </div>
                </template>

                <template #label>
                  <div class="mt-2 space-y-2">
                    <div class="text-sm text-gray-700">{{ record.description }}</div>
                    <div v-if="record.notes" class="text-sm text-gray-500">
                      备注：{{ record.notes }}
                    </div>
                    <div class="flex items-center text-xs text-gray-400">
                      <van-icon name="manager" class="mr-1" />
                      {{ record.performedBy }}
                    </div>
                  </div>
                </template>
              </van-cell>

              <template #right>
                <van-button
                  square
                  type="danger"
                  text="删除"
                  class="!h-full"
                  @click.stop="confirmDelete(record)" />
              </template>
            </van-swipe-cell>

            <van-divider v-if="index !== nursingStore.records.length - 1" />
          </van-cell-group>
        </van-list>
      </van-collapse-item>
    </van-collapse>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { showDialog, showSuccessToast, showFailToast } from "vant";
import { useNursingStore } from "~/stores/nursingStore";
import { useAuthStore } from "~/stores/auth";
import { useEnum } from "~/types/enums/metadata";
import { NursingType, type NursingRecord } from "~/types/models/nursing";

const router = useRouter();
const route = useRoute();
const nursingStore = useNursingStore();
const authStore = useAuthStore();
const { getLabel, getOptions } = useEnum();

const activeNames = ref(["recordForm", "history"]);
const loading = ref(false);
const showTypeSheet = ref(false);
const formData = ref({
  type: NursingType.OTHER,
  description: "",
  notes: ""
});

// 护理类型选项
const nursingTypeActions = getOptions("NursingType").map((option) => ({
  name: option.label,
  value: option.value
}));

// 选择护理类型
const onTypeSelect = (action: { name: string; value: NursingType }) => {
  formData.value.type = action.value;
  showTypeSheet.value = false;
};

// 提交表单
const onSubmit = async () => {
  try {
    await nursingStore.addNursingRecord({
      ...formData.value,
      patientId: Number(route.params.id),
      performedBy: authStore.user?.name || "",
      performedAt: new Date()
    });
    showSuccessToast("记录保存成功");
    formData.value = {
      type: NursingType.OTHER,
      description: "",
      notes: ""
    };
    // 刷新记录列表
    await nursingStore.fetchNursingRecords(Number(route.params.id));
  } catch (error) {
    showFailToast("记录保存失败");
  }
};

// 删除确认
const confirmDelete = (record: NursingRecord) => {
  showDialog({
    title: "确认删除",
    message: "确定要删除这条护理记录吗？此操作不可恢复。",
    showCancelButton: true
  }).then(async () => {
    try {
      await nursingStore.deleteNursingRecord(record.id);
      showSuccessToast("删除成功");
    } catch (error) {
      showFailToast((error as Error).message);
    }
  });
};

// 初始化加载数据
onMounted(async () => {
  await nursingStore.fetchNursingRecords(Number(route.params.id));
});

definePageMeta({
  middleware: "auth",
  title: "护理记录",
  requiresAuth: true
});
</script>
