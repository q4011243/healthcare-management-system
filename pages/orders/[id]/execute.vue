<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { showToast, NavBar, Form, Field, Popup } from "vant";
import { useOrderStore } from "~/stores/orderStore";
import { useAuthStore } from "~/stores/auth";
import { OrderExecutionAbnormal, type Order } from "~/types/models/order";

const route = useRoute();
const router = useRouter();
const orderStore = useOrderStore();
const authStore = useAuthStore();

const order = ref<Order | null>(null);
const loading = ref(true);
const showTimePicker = ref(false);

// 表单数据
const formData = ref({
  executionTime: new Date(),
  notes: "",
  abnormal: false,
  abnormalDesc: ""
});

// 加载医嘱数据
onMounted(async () => {
  try {
    const orderId = Number(route.params.id);
    const result = await orderStore.fetchOrderById(orderId);
    if (result) {
      order.value = result;
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

// 提交执行记录
const handleSubmit = async () => {
  console.log("handleSubmit");
  console.log(order.value);
  console.log(authStore.user);
  if (!order.value?.id || !authStore.user?.id) return;

  const success = await orderStore.recordExecution({
    orderId: order.value.id,
    nurseId: authStore.user.id,
    executionTime: formData.value.executionTime,
    status: formData.value.abnormal ? "ABNORMAL" : "NORMAL",
    notes: formData.value.notes,
    abnormal: formData.value.abnormal
      ? OrderExecutionAbnormal.ABNORMAL
      : OrderExecutionAbnormal.NORMAL,
    abnormalDesc: formData.value.abnormalDesc
  });

  if (success) {
    showToast("记录成功");
    router.back();
  }
};

// 报告异常
const reportException = async () => {
  if (!order.value?.id) return;

  const success = await orderStore.reportException(order.value.id, {
    description: formData.value.abnormalDesc,
    severity: "MEDIUM"
  });

  if (success) {
    showToast("异常已报告");
    router.back();
  }
};
definePageMeta({
  requiresAuth: true
});
</script>

<template>
  <div>
    <NavBar
      title="执行医嘱"
      left-text="返回"
      left-arrow
      @click-left="router.back()"
      fixed
      placeholder />

    <div v-if="loading" class="flex min-h-screen items-center justify-center">
      <van-loading type="spinner" />
    </div>

    <Form v-else @submit="handleSubmit" class="p-4">
      <OrderDetail v-if="order" :order="order" />

      <div class="mt-4">
        <DateField v-model="formData.executionTime" name="executionTime" label="执行时间" />

        <Field
          v-model="formData.notes"
          label="执行备注"
          type="textarea"
          rows="2"
          placeholder="请输入执行备注" />

        <Field name="abnormal" label="是否异常">
          <template #input>
            <van-switch v-model="formData.abnormal" />
          </template>
        </Field>

        <Field
          v-if="formData.abnormal"
          v-model="formData.abnormalDesc"
          label="异常说明"
          type="textarea"
          rows="2"
          required
          placeholder="请描述异常情况" />
      </div>

      <div class="mt-8 flex gap-4">
        <van-button v-if="formData.abnormal" round block type="danger" @click="reportException">
          报告异常
        </van-button>
        <van-button v-else round block type="primary" native-type="submit">记录执行</van-button>
      </div>
    </Form>
  </div>
</template>
