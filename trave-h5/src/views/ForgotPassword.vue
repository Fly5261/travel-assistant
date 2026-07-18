<template>
  <div class="forgot-container">
    <van-nav-bar title="忘记密码" left-text="返回" left-arrow @click-left="goBack" />

    <div class="forgot-content">
      <div class="logo-section">
        <van-image :src="logoImage" round class="logo" />
        <h1 class="app-name">智能旅游助手</h1>
        <p class="app-desc">AI驱动的个性化旅游规划</p>
      </div>

      <van-form ref="forgotForm" @submit="onSubmit">
        <van-field
          v-model="form.phone"
          label="手机号"
          placeholder="请输入手机号"
          type="tel"
          maxlength="11"
          :rules="[
            { required: true, message: '请输入手机号' },
            { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
          ]"
        >
          <template #right-icon>
            <van-icon name="phone-o" />
          </template>
        </van-field>

        <van-field
          v-model="form.code"
          label="验证码"
          placeholder="请输入验证码"
          :rules="[
            { required: true, message: '请输入验证码' },
            { len: 6, message: '验证码必须是6位' }
          ]"
        >
          <template #right-icon>
            <van-button
              size="small"
              type="primary"
              :disabled="countdown > 0"
              class="code-btn"
              @click="sendCode"
            >
              {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
            </van-button>
          </template>
        </van-field>

        <van-field
          v-model="form.password"
          label="新密码"
          placeholder="请输入新密码（8-20位）"
          type="password"
          :rules="[
            { required: true, message: '请输入新密码' },
            { min: 8, message: '密码长度不能少于8位' },
            { max: 20, message: '密码长度不能超过20位' }
          ]"
        >
          <template #right-icon>
            <van-icon :name="showPassword ? 'eye-o' : 'eye'" @click="showPassword = !showPassword" />
          </template>
        </van-field>

        <van-field
          v-model="form.confirmPassword"
          label="确认新密码"
          placeholder="请再次输入新密码"
          type="password"
          :rules="[
            { required: true, message: '请确认新密码' },
            {
              validator: (val) => val === form.password,
              message: '两次输入的密码不一致'
            }
          ]"
        >
          <template #right-icon>
            <van-icon :name="showConfirmPassword ? 'eye-o' : 'eye'" @click="showConfirmPassword = !showConfirmPassword" />
          </template>
        </van-field>

        <van-button
          type="primary"
          block
          class="submit-btn"
          :loading="loading"
          native-type="submit"
        >
          重置密码
        </van-button>
      </van-form>

      <div class="bottom-link">
        <span>还记得密码?</span>
        <router-link to="/login" class="link">立即登录</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import { showToast } from "vant";
import { useAuth } from "../composables/useAuth";
import logoImage from "../assets/wsdr.png";

const router = useRouter();
const { resetPassword, sendSms } = useAuth();

const loading = ref(false);
const countdown = ref(0);
const showPassword = ref(false);
const showConfirmPassword = ref(false);

const form = reactive({
  phone: "",
  code: "",
  password: "",
  confirmPassword: "",
});

const goBack = () => {
  router.back();
};

const sendCode = async () => {
  if (!form.phone) {
    showToast("请先输入手机号");
    return;
  }
  if (!/^1[3-9]\d{9}$/.test(form.phone)) {
    showToast("请输入正确的手机号");
    return;
  }

  loading.value = true;
  const result = await sendSms(form.phone, "forgot");
  loading.value = false;

  if (result.success) {
    showToast(result.message);
    countdown.value = 60;
    const timer = setInterval(() => {
      countdown.value--;
      if (countdown.value <= 0) {
        clearInterval(timer);
      }
    }, 1000);
  } else {
    showToast(result.message);
  }
};

const onSubmit = async () => {
  if (!form.phone || !/^1[3-9]\d{9}$/.test(form.phone)) {
    showToast("请输入正确的手机号");
    return;
  }

  if (!form.code || form.code.length !== 6) {
    showToast("请输入6位验证码");
    return;
  }

  if (!form.password || form.password.length < 8 || form.password.length > 20) {
    showToast("密码长度必须在8-20位之间");
    return;
  }

  if (form.password !== form.confirmPassword) {
    showToast("两次输入的密码不一致");
    return;
  }

  loading.value = true;

  try {
    const result = await resetPassword({
      phone: form.phone,
      password: form.password,
      code: form.code,
    });

    if (result.success) {
      showToast("密码重置成功");
      setTimeout(() => {
        router.replace("/login");
      }, 1500);
    } else {
      showToast(result.message);
    }
  } catch (error) {
    showToast("重置失败，请重试");
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.forgot-container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.forgot-content {
  padding: 30px 20px;
}

.logo-section {
  text-align: center;
  margin-bottom: 30px;
}

.logo {
  width: 80px;
  height: 80px;
  margin: 0 auto 16px;
  border: 4px solid #1989fa;
}

.app-name {
  font-size: 24px;
  font-weight: 600;
  color: #323233;
  margin: 0 0 8px;
}

.app-desc {
  font-size: 14px;
  color: #969799;
  margin: 0;
}

.link {
  color: #1989fa;
  text-decoration: none;
}

.submit-btn {
  height: 48px;
  font-size: 16px;
  border-radius: 8px;
}

.bottom-link {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: #646566;
}
</style>
