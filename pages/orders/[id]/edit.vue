<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { showToast } from "vant";
import { useOrderStore } from "~/stores/orderStore";
import type { Order } from "~/types/models/order";
import DateField from "~/components/common/DateField.vue";

const route = useRoute();
const router = useRouter();
const orderStore = useOrderStore();

const order = ref<Order | null>(null);
const loading = ref(true);

// 表单数据
const formData = ref({
  content: "",
  frequency: "",
  startTime: new Date(),
  endTime: undefined as Date | undefined,
  notes: ""
});

// 加载医嘱数据
onMounted(async () => {
  try {
    const orderId = Number(route.params.id);
    const result = await orderStore.fetchOrderById(orderId);
    if (result) {
      order.value = result;
      // 初始化表单数据
      formData.value = {
        content: result.content,
        frequency: result.frequency || "",
        startTime: result.startTime,
        endTime: result.endTime,
        notes: result.notes || ""
      };
    } else {
      showToast("医嘱不存在");
      router.back();
    }
  } catch (error) {
    showToast("加载失败");
  } finally {
    loading.value = false;
  }
});

// 提交表单
const handleSubmit = async () => {
  if (!order.value?.id) return;

  const success = await orderStore.updateOrder(order.value.id, {
    content: formData.value.content,
    frequency: formData.value.frequency || undefined,
    startTime: formData.value.startTime,
    endTime: formData.value.endTime,
    notes: formData.value.notes || undefined
  });

  if (success) {
    showToast("修改成功");
    router.back();
  }
};
</script>

<template>
  <div>
    <van-nav-bar
      title="修改医嘱"
      left-text="返回"
      left-arrow
      @click-left="router.back()"
      fixed
      placeholder />

    <div v-if="loading" class="flex min-h-screen items-center justify-center">
      <van-loading type="spinner" />
    </div>

    <van-form v-else @submit="handleSubmit" class="p-4">
      <van-field
        v-model="formData.content"
        label="医嘱内容"
        type="textarea"
        rows="3"
        required
        placeholder="请输入医嘱内容" />

      <van-field v-model="formData.frequency" label="执行频率" placeholder="请输入执行频率" />

      <DateField
        v-model="formData.startTime"
        name="startTime"
        label="开始时间"
        placeholder="请选择开始时间" />

      <DateField
        v-model="formData.endTime"
        name="endTime"
        label="结束时间"
        placeholder="请选择结束时间" />

      <van-field
        v-model="formData.notes"
        label="备注说明"
        type="textarea"
        rows="3"
        placeholder="请输入备注说明" />

      <div class="mt-8">
        <van-button round block type="primary" native-type="submit">保存修改</van-button>
      </div>
    </van-form>
  </div>
</template>
