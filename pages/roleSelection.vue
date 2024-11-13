<template>
	<div class="role-selection-page">
		<van-nav-bar title="选择角色" />
		<div class="role-options">
			<van-grid :column-num="2" :gutter="16">
				<van-grid-item v-for="role in roles" :key="role.value" @click="selectRole(role.value)">
					<template #icon>
						<van-icon :name="role.icon" :color="role.color" size="32" />
					</template>
					<template #text>
						<span>{{ role.label }}</span>
					</template>
				</van-grid-item>
			</van-grid>
		</div>
	</div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { showToast } from "vant";

const router = useRouter();

const roles = [
	{ label: "医生", value: "doctor", icon: "manager", color: "#1989fa" },
	{ label: "护士", value: "nurse", icon: "service", color: "#07c160" },
	{ label: "管理员", value: "admin", icon: "setting", color: "#ee0a24" }
];

const selectRole = (role: string) => {
	console.log("Selected role:", role);
	// 这里应该更新用户的角色
	showToast(`已选择 ${role} 角色`);
	router.push("/");
};
</script>

<style scoped>
.role-selection-page {
	height: 100vh;
	display: flex;
	flex-direction: column;
}

.role-options {
	flex: 1;
	display: flex;
	flex-direction: column;
	justify-content: center;
	padding: 0 16px;
}
</style>
