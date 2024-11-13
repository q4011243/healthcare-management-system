<template>
	<div class="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
		<van-nav-bar title="找回密码" left-arrow @click-left="router.back()" class="transparent-bg" />

		<div class="mx-auto mt-8 max-w-md">
			<van-steps :active="currentStep" class="mb-8">
				<van-step>验证身份</van-step>
				<van-step>重置密码</van-step>
				<van-step>完成</van-step>
			</van-steps>

			<!-- 步骤1：验证身份 -->
			<div v-show="currentStep === 0">
				<van-form @submit="verifyIdentity">
					<van-field
						v-model="form.phone"
						label="手机号"
						placeholder="请输入手机号"
						:rules="[
							{ required: true, pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
						]" />
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
					<div class="mt-8">
						<van-button round block type="primary" native-type="submit">下一步</van-button>
					</div>
				</van-form>
			</div>

			<!-- 步骤2：重置密码 -->
			<div v-show="currentStep === 1">
				<van-form @submit="resetPassword">
					<van-field
						v-model="form.newPassword"
						type="password"
						label="新密码"
						placeholder="请输入新密码"
						:rules="passwordRules" />
					<van-field
						v-model="form.confirmPassword"
						type="password"
						label="确认密码"
						placeholder="请再次输入新密码"
						:rules="[
							{ required: true, message: '请确认密码' },
							{ validator: validateConfirmPassword, message: '两次输入的密码不一致' }
						]" />
					<div class="mt-8">
						<van-button round block type="primary" native-type="submit">确认修改</van-button>
					</div>
				</van-form>
			</div>

			<!-- 步骤3：完成 -->
			<div v-show="currentStep === 2" class="text-center">
				<van-icon name="success" class="mb-4 text-6xl text-green-500" />
				<h2 class="mb-4 text-xl font-bold">密码重置成功</h2>
				<p class="mb-8 text-gray-600">您可以使用新密码登录系统</p>
				<van-button round block type="primary" @click="router.push('/login')">返回登录</van-button>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { showToast } from "vant";

const router = useRouter();
const currentStep = ref(0);
const countdown = ref(0);

const form = ref({
	phone: "",
	verifyCode: "",
	newPassword: "",
	confirmPassword: ""
});

// 密码验证规则
const passwordRules = [
	{ required: true, message: "请输入密码" },
	{
		pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/,
		message: "密码必须包含大小写字母和数字，长度至少8位"
	}
];

// 确认密码验证
const validateConfirmPassword = (value: string) => {
	return value === form.value.newPassword;
};

// 发送验证码
const sendVerifyCode = async () => {
	try {
		// TODO: 调用发送验证码API
		countdown.value = 60;
		const timer = setInterval(() => {
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

// 验证身份
const verifyIdentity = async () => {
	try {
		// TODO: 验证手机号和验证码
		currentStep.value = 1;
	} catch (error) {
		showToast("验证失败");
	}
};

// 重置密码
const resetPassword = async () => {
	try {
		// TODO: 调用重置密码API
		currentStep.value = 2;
	} catch (error) {
		showToast("密码重置失败");
	}
};
</script>
