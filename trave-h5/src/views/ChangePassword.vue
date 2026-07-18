<template>
  <div class="change-password-container">
    <van-nav-bar title="修改密码" left-text="返回" @click-left="handleBack" />

    <div class="form-section">
      <van-cell-group inset>
        <van-field
          v-model="form.oldPassword"
          type="password"
          label="旧密码"
          placeholder="请输入旧密码"
          :error-message="oldPasswordError"
          @change="validateOldPassword"
        />

        <van-field
          v-model="form.newPassword"
          type="password"
          label="新密码"
          placeholder="请输入新密码"
          :maxlength="20"
          :error-message="newPasswordError"
          @change="validateNewPassword"
        />
        <div class="field-footer">
          <span class="hint">8-20位字符</span>
        </div>

        <van-field
          v-model="form.confirmPassword"
          type="password"
          label="确认新密码"
          placeholder="请再次输入新密码"
          :error-message="confirmPasswordError"
          @change="validateConfirmPassword"
        />
      </van-cell-group>
    </div>

    <div class="button-section">
      <van-button type="primary" :disabled="!canSubmit" @click="handleSubmit">确认修改</van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { showToast } from "vant";
import { useAuth } from "../composables/useAuth";

const router = useRouter();
const { changePassword, logout } = useAuth();

const form = ref({
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
});

const oldPasswordError = ref("");
const newPasswordError = ref("");
const confirmPasswordError = ref("");

const validateOldPassword = () => {
  if (!form.value.oldPassword) {
    oldPasswordError.value = "请输入旧密码";
    return false;
  }
  oldPasswordError.value = "";
  return true;
};

const validateNewPassword = () => {
  const pwd = form.value.newPassword;
  if (!pwd) {
    newPasswordError.value = "请输入新密码";
    return false;
  }
  if (pwd.length < 8) {
    newPasswordError.value = "新密码至少8个字符";
    return false;
  }
  if (pwd.length > 20) {
    newPasswordError.value = "新密码最多20个字符";
    return false;
  }
  if (pwd === form.value.oldPassword) {
    newPasswordError.value = "新密码不能与旧密码相同";
    return false;
  }
  newPasswordError.value = "";
  return true;
};

const validateConfirmPassword = () => {
  if (!form.value.confirmPassword) {
    confirmPasswordError.value = "请确认新密码";
    return false;
  }
  if (form.value.confirmPassword !== form.value.newPassword) {
    confirmPasswordError.value = "两次输入的密码不一致";
    return false;
  }
  confirmPasswordError.value = "";
  return true;
};

const canSubmit = computed(() => {
  return (
    validateOldPassword() &&
    validateNewPassword() &&
    validateConfirmPassword()
  );
});

const handleSubmit = async () => {
  if (!canSubmit.value) return;

  const result = await changePassword({
    oldPassword: form.value.oldPassword,
    newPassword: form.value.newPassword,
  });

  if (result.success) {
    showToast("密码修改成功，请重新登录");
    setTimeout(async () => {
      await logout();
      router.push("/login");
    }, 1500);
  } else {
    showToast(result.message || "修改失败");
  }
};

const handleBack = () => {
  router.back();
};
</script>

<style scoped>
.change-password-container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.form-section {
  padding: 15px 0;
}

.field-footer {
  display: flex;
  justify-content: flex-end;
  padding-right: 15px;
  margin-top: -10px;
}

.hint {
  font-size: 12px;
  color: #969799;
}

.button-section {
  padding: 20px 15px;
}
</style>
