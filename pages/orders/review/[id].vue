<template>
  <div class="review-detail-page">
    <van-nav-bar title="医嘱审核" back-text="返回" left-arrow @click-left="router.back()" />

    <!-- 医嘱详情 -->
    <OrderCard v-if="order" :order="order" :show-actions="false" class="!mt-4 mb-4" />

    <!-- 审核表单 -->
    <van-form @submit="onSubmit" v-if="!reviewed">
      <van-cell-group inset title="审核意见">
        <van-field
          v-model="reviewNotes"
          name="reviewNotes"
          type="textarea"
          rows="3"
          autosize
          placeholder="请输入审核意见（选填）" />
      </van-cell-group>

      <!-- 审核操作按钮 -->
      <div class="fixed-bottom safe-area-bottom">
        <div class="flex gap-4 bg-white p-4">
          <van-button block type="danger" :loading="submitting" @click="handleReject">
            驳回
          </van-button>
          <van-button block type="primary" native-type="submit" :loading="submitting">
            通过
          </van-button>
        </div>
      </div>
    </van-form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { showSuccessToast, showFailToast, showDialog } from "vant";
import { useOrderStore } from "~/stores/orderStore";
import { OrderStatus, type Order } from "~/types/models/order";

const route = useRoute();
const router = useRouter();
const orderStore = useOrderStore();
const authStore = useAuthStore();

const order = ref<Order | null>(null);
const reviewNotes = ref("");
const submitting = ref(false);

// 加载医嘱详情
onMounted(async () => {
  const id = Number(route.params.id);
  if (!id) return;
  try {
    order.value = await orderStore.fetchOrderById(id);
  } catch (error) {
    showFailToast("加载失败");
    router.back();
  }
});

const reviewed = computed(() => order.value?.status === OrderStatus.APPROVED);

// 通过审核
const onSubmit = async () => {
  if (!order.value) return;
  try {
    submitting.value = true;
    if (!order.value.id) return;
    await orderStore.updateOrderStatus(order.value.id, OrderStatus.APPROVED, {
      reviewerId: authStore.user?.id,
      reviewTime: new Date(),
      reviewNotes: reviewNotes.value
    });
    showSuccessToast("审核通过");
    router.push("/orders/review");
  } catch (error) {
    showFailToast((error as Error).message);
  } finally {
    submitting.value = false;
  }
};

// 驳回审核
const handleReject = () => {
  if (!order.value) return;
  showDialog({
    title: "确认驳回",
    message: "确定要驳回该医嘱吗？",
    showCancelButton: true
  }).then(async () => {
    try {
      submitting.value = true;
      if (order.value === null || order.value.id === undefined) return;
      await orderStore.updateOrderStatus(order.value.id, OrderStatus.REJECTED, {
        reviewNotes: reviewNotes.value
      });
      showSuccessToast("已驳回");
      router.push("/orders/review");
    } catch (error) {
      showFailToast((error as Error).message);
    } finally {
      submitting.value = false;
    }
  });
};

definePageMeta({
  requiresAuth: true
});
</script>

<style scoped>
.review-detail-page {
  min-height: 100vh;
  padding-bottom: 80px;
}

.fixed-bottom {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  box-shadow: 0 -1px 2px rgba(0, 0, 0, 0.05);
}
</style>
