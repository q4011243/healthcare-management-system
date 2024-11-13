<template>
	<div class="profile-page">
		<van-nav-bar
			title="个人资料"
			left-text="返回"
			right-text="编辑"
			left-arrow
			@click-left="onClickLeft"
			@click-right="onClickRight" />
		<div class="profile-content">
			<van-cell-group inset>
				<van-cell title="头像">
					<template #value>
						<van-image
							round
							width="50"
							height="50"
							src="https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg" />
					</template>
				</van-cell>
				<van-cell title="姓名" :value="user.name" />
				<van-cell title="角色" :value="user.role" />
				<van-cell title="邮箱" :value="user.email" />
				<van-cell title="手机号" :value="user.phone" />
			</van-cell-group>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const user = ref({
	name: "张三",
	role: "医生",
	email: "zhangsan@example.com",
	phone: "13800138000"
});

const onClickLeft = () => {
	router.back();
};

const onClickRight = () => {
	router.push("/profile/edit");
};
</script>

<style scoped>
.profile-page {
	height: 100vh;
	display: flex;
	flex-direction: column;
}

.profile-content {
	flex: 1;
	padding: 16px;
}
</style>
