<template>
  <div class="min-h-screen bg-gray-50">
    <van-nav-bar
      title="编辑患者信息"
      left-arrow
      class="sticky top-0 z-10 shadow-sm"
      @click-left="router.back()" />

    <div class="p-4">
      <van-form @submit="onSubmit">
        <!-- 基本信息 -->
        <div class="mb-4 rounded-lg bg-white p-4 shadow-sm">
          <h2 class="mb-4 text-lg font-medium text-gray-900">基本信息</h2>
          <van-cell-group inset>
            <van-field
              v-model="formData.name"
              name="name"
              label="姓名"
              placeholder="请输入姓名"
              :rules="[{ required: true, message: '请输入姓名' }]" />
            <van-field
              v-model="formData.age"
              type="number"
              name="age"
              label="年龄"
              placeholder="请输入年龄"
              :rules="[{ required: true, message: '请输入年龄' }]" />
            <van-field
              name="gender"
              label="性别"
              :rules="[{ required: true, message: '请选择性别' }]">
              <template #input>
                <van-radio-group v-model="formData.gender" direction="horizontal">
                  <van-radio :name="Gender.MALE">男</van-radio>
                  <van-radio :name="Gender.FEMALE">女</van-radio>
                </van-radio-group>
              </template>
            </van-field>
            <van-field
              v-model="formData.phone"
              name="phone"
              label="联系电话"
              placeholder="请输入联系电话"
              :rules="[{ required: true, message: '请输入联系电话' }]" />
          </van-cell-group>
        </div>

        <!-- 联系人信息 -->
        <div class="mb-4 rounded-lg bg-white p-4 shadow-sm">
          <h2 class="mb-4 text-lg font-medium text-gray-900">紧急联系人</h2>
          <van-cell-group inset>
            <van-field
              v-model="formData.contactName"
              name="contactName"
              label="姓名"
              placeholder="请输入联系人姓名" />
            <van-field
              v-model="formData.contactPhone"
              name="contactPhone"
              label="电话"
              placeholder="请输入联系人电话" />
          </van-cell-group>
        </div>

        <!-- 提交按钮 -->
        <div class="mt-8">
          <van-button round block type="primary" native-type="submit">保存修改</van-button>
        </div>
      </van-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { showSuccessToast, showFailToast } from "vant";
import type { Patient } from "~/types/models/patient";
import { Gender } from "~/types/enums/enums";

const route = useRoute();
const router = useRouter();
const patientStore = usePatientStore();

const formData = ref<Partial<Patient>>({
  name: "",
  age: 0,
  gender: Gender.MALE,
  phone: "",
  contactName: "",
  contactPhone: ""
});

// 加载患者数据
onMounted(async () => {
  const id = Number(route.params.id);
  if (!id) return;

  try {
    const patient = await patientStore.fetchPatientById(id);
    if (patient) {
      formData.value = {
        ...patient,
        contactName: patient.contactName || "",
        contactPhone: patient.contactPhone || ""
      };
    }
  } catch (error) {
    console.error("Failed to fetch patient:", error);
    showFailToast("加载患者信息失败");
  }
});

// 提交表单
const onSubmit = async () => {
  try {
    const id = Number(route.params.id);
    if (!id) return;

    await patientStore.updatePatient(id, formData.value);
    showSuccessToast("保存成功");
    router.back();
  } catch (error) {
    console.error("Failed to update patient:", error);
    showFailToast("保存失败");
  }
};
</script>
