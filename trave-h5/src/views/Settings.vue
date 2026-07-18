<template>
  <div class="settings-container">
    <van-nav-bar title="设置" left-text="返回" @click-left="handleBack" />

    <div class="settings-content">
      <div class="section">
        <h3 class="section-title">账号与安全</h3>
        <van-cell-group inset>
          <van-cell title="修改密码" is-link @click="goChangePassword" />
          <van-cell title="手机号" :value="maskPhone" is-link />
        </van-cell-group>
      </div>

      <div class="section">
        <h3 class="section-title">通用设置</h3>
        <van-cell-group inset>
          <van-cell>
            <template #title>推送通知</template>
            <template #right-icon>
              <van-switch v-model="pushEnabled" @change="handlePushChange" />
            </template>
          </van-cell>
          <van-cell title="清除缓存" :value="cacheSize" is-link @click="handleClearCache" />
        </van-cell-group>
      </div>

      <div class="section">
        <h3 class="section-title">关于</h3>
        <van-cell-group inset>
          <van-cell title="用户协议" is-link @click="goAgreement" />
          <van-cell title="隐私政策" is-link @click="goPrivacy" />
          <van-cell title="关于我们" is-link @click="goAbout" />
          <van-cell title="版本检查" :value="currentVersion" is-link @click="checkVersion" />
        </van-cell-group>
      </div>
    </div>

    <div class="logout-section">
      <van-button type="danger" plain @click="handleLogout">退出登录</van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { showToast, showDialog } from "vant";
import { useAuth } from "../composables/useAuth";

const router = useRouter();
const { user, logout } = useAuth();

const pushEnabled = ref(localStorage.getItem("pushEnabled") === "true");
const cacheSize = ref("--");
const currentVersion = ref("v1.0.0");

const maskPhone = computed(() => {
  const phone = user.value?.phone || "";
  if (!phone || phone.length < 11) return "未绑定";
  return phone.slice(0, 3) + "****" + phone.slice(-4);
});

const handlePushChange = (value) => {
  localStorage.setItem("pushEnabled", String(value));
};

const handleClearCache = () => {
  showDialog({
    title: "清除缓存",
    message: "确定要清除所有缓存吗？",
  }).then(() => {
    const preserved = {
      accessToken: localStorage.getItem("accessToken"),
      refreshToken: localStorage.getItem("refreshToken"),
      tokenExpireAt: localStorage.getItem("tokenExpireAt"),
      user: localStorage.getItem("user"),
      isNewUser: localStorage.getItem("isNewUser"),
      pushEnabled: localStorage.getItem("pushEnabled"),
    };
    localStorage.clear();
    Object.entries(preserved).forEach(([key, value]) => {
      if (value) localStorage.setItem(key, value);
    });
    cacheSize.value = "0KB";
    showToast("缓存已清除");
  }).catch(() => {});
};

const goChangePassword = () => {
  router.push("/change-password");
};

const goAgreement = () => {
  showToast("用户协议页面开发中");
};

const goPrivacy = () => {
  showToast("隐私政策页面开发中");
};

const goAbout = () => {
  showToast("关于我们页面开发中");
};

const checkVersion = () => {
  showToast("已是最新版本");
};

const handleLogout = () => {
  showDialog({
    title: "确认退出",
    message: "确定要退出当前账号吗？",
  }).then(async () => {
    await logout();
    showToast("已退出登录");
    router.push("/");
  }).catch(() => {});
};

const handleBack = () => {
  router.back();
};

onMounted(() => {
  const size = localStorage.getItem("cacheSize");
  if (size) {
    cacheSize.value = size;
  }
});
</script>

<style scoped>
.settings-container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.settings-content {
  padding: 15px 0;
}

.section {
  margin-bottom: 15px;
}

.section-title {
  font-size: 14px;
  color: #646566;
  padding: 0 15px 12px;
}

.logout-section {
  padding: 20px 15px;
}

.logout-section .van-button {
  width: 100%;
  height: 44px;
  line-height: 44px;
  font-size: 16px;
}
</style>
