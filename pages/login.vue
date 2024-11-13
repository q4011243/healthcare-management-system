<template>
  <div class="pb-safe min-h-screen bg-gradient-to-b from-blue-50 to-white">
    <!-- 顶部 Logo 区域 -->
    <div class="pb-8 pt-12 text-center">
      <div class="mb-4">
        <van-image round width="80" height="80" src="/logo.png" alt="医院 Logo" />
      </div>
      <h1 class="text-2xl font-bold text-gray-800">医院管理系统</h1>
      <p class="mt-2 text-sm text-gray-600">专业、高效的医疗管理平台</p>
    </div>

    <!-- 登录说明 -->
    <div class="mb-6 px-4 text-center">
      <p class="text-sm text-gray-600">首次使用需要完成注册并等待管理员审核</p>
    </div>

    <!-- 登录表单区域 -->
    <div class="mx-auto max-w-md px-4">
      <van-form @submit="onSubmit" class="space-y-6">
        <!-- 登录方式选择 -->
        <van-tabs v-model:active="activeTab" class="login-tabs">
          <van-tab title="账号密码" name="account">
            <div class="space-y-4 pt-6">
              <van-field
                v-model="form.username"
                name="username"
                label="用户名"
                placeholder="请输入用户名"
                :rules="[{ required: true, message: '请填写用户名' }]">
                <template #left-icon>
                  <van-icon name="user-o" class="text-gray-400" />
                </template>
              </van-field>

              <van-field
                v-model="form.password"
                type="password"
                name="password"
                label="密码"
                placeholder="请输入密码"
                :rules="[{ required: true, message: '请填写密码' }]">
                <template #left-icon>
                  <van-icon name="lock" class="text-gray-400" />
                </template>
              </van-field>
            </div>
          </van-tab>

          <van-tab title="手机验证码" name="phone">
            <div class="space-y-4 pt-6">
              <van-field
                v-model="form.phone"
                name="phone"
                label="手机号"
                placeholder="请输入手机号"
                :rules="[
                  { required: true, pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
                ]">
                <template #left-icon>
                  <van-icon name="phone-o" class="text-gray-400" />
                </template>
              </van-field>

              <van-field
                v-model="form.smsCode"
                center
                label="验证码"
                placeholder="请输入验证码"
                :rules="[{ required: true, message: '请填写验证码' }]">
                <template #left-icon>
                  <van-icon name="shield-o" class="text-gray-400" />
                </template>
                <template #button>
                  <van-button
                    size="small"
                    type="primary"
                    :disabled="!!countdown"
                    @click="sendSmsCode">
                    {{ countdown ? `${countdown}s后重试` : "发送验证码" }}
                  </van-button>
                </template>
              </van-field>
            </div>
          </van-tab>
        </van-tabs>

        <!-- 记住登录和忘记密码 -->
        <div class="flex items-center justify-between px-2">
          <van-checkbox v-model="form.remember" shape="square" class="text-sm">
            记住登录
          </van-checkbox>
          <a href="#" class="text-sm text-blue-600">忘记密码？</a>
        </div>

        <!-- 登录按钮 -->
        <div class="space-y-4">
          <van-button
            round
            block
            type="primary"
            native-type="submit"
            :loading="isLoading"
            size="large">
            登录
          </van-button>

          <!-- 生物识别登录 -->
          <van-button
            v-if="supportsBiometric"
            round
            block
            plain
            icon="fingerprint"
            size="large"
            @click="onBiometricLogin">
            {{ biometricType === "face" ? "面容识别" : "指纹识别" }}
          </van-button>
        </div>
      </van-form>

      <!-- 其他登录方式 -->
      <div class="mt-8">
        <van-divider>其他登录方式</van-divider>

        <!-- 紧急访问 -->
        <div class="space-y-4">
          <van-button type="danger" plain block icon="warning-o" @click="onEmergencyAccess">
            紧急访问
          </van-button>

          <!-- 注册说明 -->
          <p class="text-center text-xs text-gray-500">如需注册新账号，请点击底部"立即注</p>
        </div>
      </div>

      <!-- 底部信息 -->
      <div class="mt-8 px-4">
        <!-- 注册入口 -->
        <div class="mb-6 text-center">
          <span class="text-sm text-gray-600">还没有账号？</span>
          <button class="text-primary ml-2 text-sm" @click="router.push('/auth/register')">
            立即注册
          </button>
        </div>

        <!-- 版权信息 -->
        <div class="text-center text-xs text-gray-500">
          <p>版本 1.0.0</p>
          <p class="mt-1">© 2024 医院管理系统</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from "vue";
import { showToast, showDialog } from "vant";
import { useRouter } from "vue-router";
import { useAuthStore } from "~/stores/auth";

const router = useRouter();
const authStore = useAuthStore();
const activeTab = ref("account");

// 表单数据
const form = reactive({
  username: "",
  password: "",
  phone: "",
  smsCode: "",
  remember: false
});

// 状态变量
const isLoading = ref(false);
const countdown = ref(0);
let timer: NodeJS.Timeout;
const supportsBiometric = ref(false);
const biometricType = ref<"face" | "fingerprint">("fingerprint");

// 检查生物识别支持
onMounted(async () => {
  // TODO: 实际检查设备是否支持生物识别
  supportsBiometric.value = true;
  biometricType.value = "fingerprint";
});

// 发送验证码
const sendSmsCode = async () => {
  if (countdown.value > 0) return;

  if (!form.phone) {
    showToast("请输入手机号");
    return;
  }

  try {
    // TODO: 实现发送验证码的API
    countdown.value = 60;
    timer = setInterval(() => {
      countdown.value--;
      if (countdown.value <= 0) {
        clearInterval(timer);
      }
    }, 1000);
    showToast("验证码已发送");
  } catch (error) {
    showToast("发送验证码失败");
  }
};

// 表单提交
const onSubmit = async () => {
  try {
    if (activeTab.value === "account") {
      await authStore.login(form.username, form.password);
    } else {
      // TODO: 实现手机验证码登录
      showToast("手机验证码登录功能开发中");
      return;
    }

    showToast("登录成功");
    router.push("/");
  } catch (error: any) {
    showToast(error.message || "登录失败");
  }
};

// 生物识别登录
const onBiometricLogin = async () => {
  try {
    // TODO: 实现生物识别登录
    showToast("生物识别登录功能开发中");
  } catch (error: any) {
    showToast({
      type: "fail",
      message: error?.message || "认证失败"
    });
  }
};

// 紧急访问
const onEmergencyAccess = () => {
  showDialog({
    title: "紧急访问",
    message: "紧急访问仅供特殊情况使用，所有操作将被记录。是否继续？",
    confirmButtonText: "确认",
    cancelButtonText: "取消",
    confirmButtonColor: "#ee0a24"
  }).then(async () => {
    try {
      await authStore.emergencyAccess();
      showToast("紧急访问成功");
      router.push("/");
    } catch (error: any) {
      showToast(error.message || "紧急访问失败");
    }
  });
};

// 清理定时器
onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
  }
});

// 禁用默认布局
definePageMeta({
  layout: "default",
  middleware: ["guest"]
});
</script>

<style scoped>
.login-tabs {
  :deep(.van-tabs__wrap) {
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
}

/* 添加安全区域内边距类 */
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 20px);
}

/* 主要按钮悬停效果 */
.van-button--primary {
  &:hover {
    opacity: 0.9;
  }
}

/* 文字按钮悬停效果 */
.text-primary {
  &:hover {
    opacity: 0.8;
  }
}
</style>
