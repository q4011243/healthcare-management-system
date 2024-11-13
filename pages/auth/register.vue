<template>
  <div class="min-h-screen bg-gradient-to-b from-blue-50 to-white">
    <van-nav-bar
      title="医护人员注册"
      left-arrow
      @click-left="router.back()"
      class="transparent-bg" />

    <div class="mx-auto max-w-md p-4">
      <van-steps :active="currentStep" class="mb-8">
        <van-step>基本信息</van-step>
        <van-step>身份验证</van-step>
        <van-step>完善资料</van-step>
      </van-steps>

      <!-- 步骤1：基本信息 -->
      <van-form v-show="currentStep === 0" @submit="onBasicInfoSubmit">
        <van-cell-group inset>
          <van-field
            v-model="form.username"
            label="用户名"
            placeholder="请输入用户名"
            :rules="[{ required: true, message: '请输入用户名' }]" />
          <van-field
            v-model="form.name"
            label="姓名"
            placeholder="请输入真实姓名"
            :rules="[{ required: true, message: '请输入姓名' }]" />
          <van-field
            v-model="form.idNumber"
            label="身份证号"
            placeholder="请输入身份证号"
            :rules="[{ required: true, message: '请输入身份证号' }]" />
          <van-field
            v-model="form.phone"
            label="手机号"
            placeholder="请输入手机号"
            :rules="[{ required: true, message: '请输入手机号' }]" />
        </van-cell-group>
        <div class="mt-8">
          <van-button round block type="primary" native-type="submit">下一步</van-button>
        </div>
      </van-form>

      <!-- 步骤2：身份验证 -->
      <van-form v-show="currentStep === 1" @submit="onVerifySubmit">
        <van-cell-group inset>
          <van-field
            v-model="form.verifyCode"
            center
            label="验证码"
            placeholder="请输入验证码"
            :rules="[{ required: true, message: '请输入验证码' }]">
            <template #button>
              <van-button
                size="small"
                type="primary"
                :disabled="!!countdown"
                @click="sendVerifyCode">
                {{ countdown ? `${countdown}s后重试` : "发送验证码" }}
              </van-button>
            </template>
          </van-field>
        </van-cell-group>
        <div class="mt-8 space-y-4">
          <van-button round block type="primary" native-type="submit">下一步</van-button>
          <van-button round block plain @click="currentStep--">返回上一步</van-button>
        </div>
      </van-form>

      <!-- 步骤3：完善资料 -->
      <van-form v-show="currentStep === 2" @submit="onFinalSubmit">
        <van-cell-group inset>
          <van-field
            v-model="form.password"
            type="password"
            label="设置密码"
            placeholder="请设置登录密码"
            :rules="passwordRules" />
          <van-field
            v-model="form.confirmPassword"
            type="password"
            label="确认密码"
            placeholder="请再次输入密码"
            :rules="[
              { required: true, message: '请确认密码' },
              { validator: validateConfirmPassword, message: '两次输入的密码不一致' }
            ]" />
          <van-field
            v-model="form.department"
            is-link
            readonly
            label="所属科室"
            placeholder="请选择科室"
            :rules="[{ required: true, message: '请选择科室' }]"
            @click="showDepartmentPicker = true" />
          <van-field
            v-model="form.position"
            is-link
            readonly
            label="职位"
            placeholder="请选择职位"
            :rules="[{ required: true, message: '请选择职位' }]"
            @click="showPositionPicker = true" />
        </van-cell-group>

        <div class="mt-4 px-4">
          <van-checkbox v-model="form.agreement" shape="square">
            我已阅读并同意
            <span class="text-primary" @click.stop="showAgreement = true">《用户协议》</span>
            和
            <span class="text-primary" @click.stop="showPrivacy = true">《隐私政策》</span>
          </van-checkbox>
        </div>

        <div class="mt-8 space-y-4">
          <van-button round block type="primary" native-type="submit" :disabled="!form.agreement">
            提交注册
          </van-button>
          <van-button round block plain @click="currentStep--">返回上一步</van-button>
        </div>
      </van-form>
    </div>

    <!-- 科室选择弹窗 -->
    <van-popup v-model:show="showDepartmentPicker" position="bottom">
      <van-picker
        :columns="departmentColumns"
        @confirm="onDepartmentConfirm"
        @cancel="showDepartmentPicker = false"
        show-toolbar />
    </van-popup>

    <!-- 职位选择弹窗 -->
    <van-popup v-model:show="showPositionPicker" position="bottom">
      <van-picker
        :columns="positionColumns"
        @confirm="onPositionConfirm"
        @cancel="showPositionPicker = false"
        show-toolbar />
    </van-popup>

    <!-- 协议弹窗 -->
    <van-popup v-model:show="showAgreement" position="bottom" round class="h-3/4">
      <div class="p-4">
        <h2 class="mb-4 text-lg font-bold">用户协议</h2>
        <div class="h-[calc(100vh-200px)] overflow-y-auto">
          <!-- 协议内容 -->
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { showToast } from "vant";
import { useAuthStore } from "~/stores/auth";
import type { User } from "~/types/models/user";

const router = useRouter();
const authStore = useAuthStore();

const currentStep = ref(0);
const countdown = ref(0);
const showDepartmentPicker = ref(false);
const showPositionPicker = ref(false);
const showAgreement = ref(false);
const showPrivacy = ref(false);

// 表单数据
const form = ref({
  name: "",
  idNumber: "",
  phone: "",
  verifyCode: "",
  username: "",
  password: "",
  confirmPassword: "",
  department: "",
  position: "",
  agreement: false
});

// 密码验证规则
const passwordRules = [{ required: true, message: "请设置密码" }];

// 部门和职位选项
const departmentColumns = [
  { text: "内科", value: "内科" },
  { text: "外科", value: "外科" },
  { text: "儿科", value: "儿科" },
  { text: "妇产科", value: "妇产科" },
  { text: "急诊科", value: "急诊科" },
  { text: "骨科", value: "骨科" },
  { text: "眼科", value: "眼科" },
  { text: "口腔科", value: "口腔科" },
  { text: "皮肤科", value: "皮肤科" },
  { text: "精神科", value: "精神科" }
];

const positionColumns = [
  { text: "主任医师", value: "主任医师" },
  { text: "副主任医师", value: "副主任医师" },
  { text: "主治医师", value: "主治医师" },
  { text: "住院医师", value: "住院医师" },
  { text: "护士长", value: "护士长" },
  { text: "主管护师", value: "主管护师" },
  { text: "护师", value: "护师" },
  { text: "护士", value: "护士" }
];

// 验证确认密码
const validateConfirmPassword = (value: string) => {
  return value === form.value.password;
};

// 发送验证码
let timer: NodeJS.Timeout;
const sendVerifyCode = async () => {
  if (countdown.value > 0) return;

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

// 提交基本信息
const onBasicInfoSubmit = () => {
  currentStep.value++;
};

// 提交验证码
const onVerifySubmit = async () => {
  try {
    // TODO: 实现验证码验证
    currentStep.value++;
  } catch (error) {
    showToast("验证码错误");
  }
};

// 最终提交
const onFinalSubmit = async () => {
  if (!form.value.agreement) {
    showToast("请同意用户协议和隐私政策");
    return;
  }

  try {
    const userData: Partial<User> = {
      username: form.value.username,
      password: form.value.password,
      name: form.value.name,
      phone: form.value.phone,
      department: form.value.department,
      roles: getRoleFromPosition(form.value.position)
    };

    await authStore.register(userData as Omit<User, "id" | "status" | "createdAt">);
    showToast("注册成功，请等待管理员审核");
    router.push("/login");
  } catch (error: any) {
    showToast(error.message || "注册失败");
  }
};

// 根据职位确定角色
const getRoleFromPosition = (position: string): string[] => {
  if (position.includes("医师")) {
    return ["doctor"];
  } else if (position.includes("护")) {
    return ["nurse"];
  }
  return ["staff"];
};

// 选择科室和职位
const onDepartmentConfirm = ({ selectedValues }: { selectedValues: string[] }) => {
  form.value.department = selectedValues[0];
  showDepartmentPicker.value = false;
};

const onPositionConfirm = ({ selectedValues }: { selectedValues: string[] }) => {
  form.value.position = selectedValues[0];
  showPositionPicker.value = false;
};

// 清理定时器
onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
  }
});

// 页面元信息
definePageMeta({
  layout: "default",
  middleware: ["guest"]
});
</script>
