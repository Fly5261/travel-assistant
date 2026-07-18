<template>
  <div class="login-container">
    <van-nav-bar
      title="登录"
      left-text="返回"
      left-arrow
      @click-left="goBack"
    />

    <div class="login-content">
      <div class="logo-section">
        <van-image :src="logoImage" round class="logo" />
        <h1 class="app-name">智能旅游助手</h1>
        <p class="app-desc">AI驱动的个性化旅游规划</p>
      </div>

      <van-tabs
        v-model:active="activeTab"
        class="login-tabs"
        @change="handleTabChange"
      >
        <van-tab title="密码登录" />
        <van-tab title="短信登录" />
      </van-tabs>

      <van-form ref="loginForm" @submit="onSubmit">
        <van-field
          v-model="form.phone"
          label="手机号"
          placeholder="请输入手机号"
          type="tel"
          maxlength="11"
          :rules="[
            { required: true, message: '请输入手机号' },
            { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
          ]"
        >
          <template #right-icon>
            <van-icon name="phone-o" />
          </template>
        </van-field>

        <van-field
          v-if="activeTab === 0"
          v-model="form.password"
          label="密码"
          placeholder="请输入密码"
          :type="showPassword ? 'text' : 'password'"
          :rules="[
            { required: true, message: '请输入密码' },
            { min: 8, message: '密码长度不能少于8位' },
          ]"
        >
          <template #right-icon>
            <van-icon
              :name="showPassword ? 'eye-o' : 'eye'"
              @click="showPassword = !showPassword"
            />
          </template>
        </van-field>

        <van-field
          v-if="activeTab === 1"
          v-model="form.code"
          label="验证码"
          placeholder="请输入验证码"
          :rules="[
            { required: true, message: '请输入验证码' },
            { len: 6, message: '验证码必须是6位' },
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
              {{ countdown > 0 ? `${countdown}s` : "获取验证码" }}
            </van-button>
          </template>
        </van-field>

        <div class="form-actions">
          <van-checkbox v-model="agreed">
            我已阅读并同意
            <a href="#" class="link">《用户协议》</a>
            和
            <a href="#" class="link">《隐私政策》</a>
          </van-checkbox>
        </div>

        <van-button
          type="primary"
          block
          class="submit-btn"
          :loading="loading"
          native-type="submit"
          :disabled="!canSubmit"
        >
          登录
        </van-button>

        <van-button
          type="default"
          block
          class="guest-btn"
          @click="handleGuestLogin"
        >
          游客登录
        </van-button>
      </van-form>

      <div class="bottom-links">
        <router-link to="/register" class="link">注册账号</router-link>
        <router-link v-if="activeTab === 0" to="/forgot" class="link"
          >忘记密码?</router-link
        >
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { showToast } from "vant";
import { useAuth } from "../composables/useAuth";
import logoImage from "../assets/wsdr.png";

const router = useRouter();
const route = useRoute();
const { login, sendSms, guestLogin } = useAuth();

const activeTab = ref(0);
const loading = ref(false);
const agreed = ref(true);
const countdown = ref(0);
const showPassword = ref(false);

const form = reactive({
  phone: "",
  password: "",
  code: "",
});

const canSubmit = computed(() => {
  if (!agreed.value) return false;
  if (!form.phone || !/^1[3-9]\d{9}$/.test(form.phone)) return false;
  if (activeTab.value === 0 && (!form.password || form.password.length < 8))
    return false;
  if (activeTab.value === 1 && (!form.code || form.code.length !== 6))
    return false;
  return true;
});

const goBack = () => {
  router.back();
};

const handleGuestLogin = () => {
  const result = guestLogin();
  if (result.success) {
    showToast("游客登录成功");
    const redirect = route.query.redirect || "/";
    router.replace(redirect);
  }
};

const handleTabChange = () => {
  if (activeTab.value === 1) {
    form.password = "";
  } else {
    form.code = "";
  }
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
  const result = await sendSms(form.phone, "login");
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
  loading.value = true;

  try {
    const credentials =
      activeTab.value === 0
        ? { phone: form.phone, password: form.password }
        : { phone: form.phone, code: form.code };

    const result = await login(credentials);

    if (result.success) {
      showToast(result.data.isNewUser ? "欢迎新用户" : "登录成功");
      const redirect = route.query.redirect || "/";
      router.replace(redirect);
    } else {
      showToast(result.message);
    }
  } catch (error) {
    showToast("登录失败，请重试");
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.login-content {
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

.login-tabs {
  margin-bottom: 20px;
  background-color: #fff;
}

.form-actions {
  margin-bottom: 20px;
  font-size: 12px;
  color: #646566;
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

.guest-btn {
  height: 48px;
  font-size: 16px;
  border-radius: 8px;
  margin-top: 10px;
}

.bottom-links {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
  font-size: 14px;
}
</style>
