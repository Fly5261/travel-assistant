<template>
  <div class="profile-container">
    <van-nav-bar title="我的" left-text="" :left-arrow="false" />

    <div class="user-info" @click="handleUserClick">
      <van-image :src="userAvatar" round class="avatar" />
      <div class="user-details">
        <h2 class="user-name">{{ userName }}</h2>
        <p class="user-desc">{{ userDesc }}</p>
      </div>
      <van-icon name="arrow-right" class="arrow-icon" />
    </div>

    <div v-if="isLoggedIn && !isGuest" class="stats-section">
      <div class="stat-item">
        <span class="stat-num">{{ stats.favoritesCount || 0 }}</span>
        <span class="stat-label">我的收藏</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num">{{ stats.historyCount || 0 }}</span>
        <span class="stat-label">历史记录</span>
      </div>
    </div>

    <div v-if="!isLoggedIn || isGuest" class="guest-hint">
      登录后可同步收藏和历史记录
    </div>

    <div class="menu-section">
      <h3 class="menu-title">我的服务</h3>
      <van-cell-group>
        <van-cell
          title="我的收藏"
          is-link
          :icon="'star-o'"
          @click="handleFavoritesClick"
        />
        <van-cell
          title="历史记录"
          is-link
          :icon="'history'"
          @click="handleHistoryClick"
        />
        <van-cell
          title="设置"
          is-link
          :icon="'settings'"
          @click="handleSettingsClick"
        />
      </van-cell-group>
    </div>

    <div class="menu-section">
      <h3 class="menu-title">关于</h3>
      <van-cell-group>
        <van-cell title="关于我们" is-link @click="showAboutDialog" />
        <van-cell title="版本信息" value="v1.0.0" />
      </van-cell-group>
    </div>

    <van-cell-group v-if="isLoggedIn && !isGuest" class="logout-section">
      <van-cell title="退出登录" @click="handleLogout" />
    </van-cell-group>

    <van-dialog
      v-model:show="aboutDialogVisible"
      title="关于我们"
      show-cancel-button
    >
      <div class="about-content">
        <p>智能旅游助手 v1.0.0</p>
        <p class="mt-2">基于 AI 技术的智能旅游规划平台</p>
        <p class="mt-2">为您提供个性化的旅游行程推荐和实时旅游咨询服务</p>
        <p class="mt-4 text-center">© 2026 智能旅游助手</p>
      </div>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { showToast, showDialog } from "vant";
import { useAuth } from "../composables/useAuth";

const router = useRouter();
const {
  user,
  isLoggedIn: checkLogin,
  isGuest: checkGuest,
  logout,
  getUserProfile,
} = useAuth();

const aboutDialogVisible = ref(false);
const stats = ref({ favoritesCount: 0, historyCount: 0 });
const loading = ref(false);

const isLoggedIn = computed(() => checkLogin());
const isGuest = computed(() => checkGuest());

const userAvatar = computed(() => {
  if (isGuest.value) return user.value?.avatar || "";
  return user.value?.avatar || "https://img.yzcdn.cn/vant/cat.jpeg";
});

const userName = computed(() => {
  if (isGuest.value) return "游客";
  return (
    user.value?.name || user.value?.nickname || user.value?.phone || "用户"
  );
});

const userDesc = computed(() => {
  if (isGuest.value) return "点击登录，开启智能旅程";
  return user.value?.phone ? maskPhone(user.value.phone) : "点击查看个人信息";
});

const maskPhone = (phone) => {
  if (!phone || phone.length < 11) return phone;
  return phone.slice(0, 3) + "****" + phone.slice(-4);
};

const loadUserProfile = async () => {
  if (!isLoggedIn.value || isGuest.value) return;
  loading.value = true;
  try {
    const result = await getUserProfile();
    if (result.success && result.data) {
      stats.value = {
        favoritesCount:
          result.data.favoritesCount || result.data.favorites_count || 0,
        historyCount:
          result.data.historyCount || result.data.history_count || 0,
      };
    }
  } catch (error) {
    console.log("获取用户信息失败，使用缓存数据");
  } finally {
    loading.value = false;
  }
};

const handleUserClick = () => {
  if (isGuest.value || !isLoggedIn.value) {
    localStorage.setItem("loginRedirect", "/profile");
    router.push("/login");
  } else {
    router.push("/edit-profile");
  }
};

const handleFavoritesClick = () => {
  if (!isLoggedIn.value || isGuest.value) {
    localStorage.setItem("loginRedirect", "/favorites");
    router.push("/login");
  } else {
    router.push("/favorites");
  }
};

const handleHistoryClick = () => {
  if (!isLoggedIn.value || isGuest.value) {
    localStorage.setItem("loginRedirect", "/history");
    router.push("/login");
  } else {
    router.push("/history");
  }
};

const handleSettingsClick = () => {
  if (!isLoggedIn.value || isGuest.value) {
    localStorage.setItem("loginRedirect", "/settings");
    router.push("/login");
  } else {
    router.push("/settings");
  }
};

const showAboutDialog = () => {
  aboutDialogVisible.value = true;
};

const handleLogout = async () => {
  showDialog({
    title: "确认退出",
    message: "确定要退出登录吗？",
  })
    .then(async () => {
      await logout();
      showToast("已退出登录");
      router.push("/");
    })
    .catch(() => {});
};

onMounted(() => {
  loadUserProfile();
});
</script>

<style scoped>
.profile-container {
  padding-bottom: 50px;
}

.user-info {
  display: flex;
  align-items: center;
  padding: 30px 20px;
  background: linear-gradient(135deg, #1989fa 0%, #36cbcb 100%);
  color: white;
}

.avatar {
  width: 80px;
  height: 80px;
  border: 3px solid rgba(255, 255, 255, 0.3);
}

.user-details {
  flex: 1;
  margin-left: 20px;
}

.user-name {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 5px;
}

.user-desc {
  font-size: 14px;
  opacity: 0.9;
}

.arrow-icon {
  color: rgba(255, 255, 255, 0.7);
}

.stats-section {
  display: flex;
  align-items: center;
  justify-content: space-around;
  background-color: white;
  padding: 20px 0;
  margin: 15px 10px 0;
  border-radius: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.stat-num {
  font-size: 24px;
  font-weight: 600;
  color: #1989fa;
}

.stat-label {
  font-size: 14px;
  color: #646566;
  margin-top: 4px;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background-color: #f0f0f0;
}

.guest-hint {
  background-color: #fff7e6;
  color: #fa8c16;
  font-size: 14px;
  padding: 12px 15px;
  margin: 15px 10px 0;
  border-radius: 8px;
  text-align: center;
}

.menu-section {
  margin-top: 15px;
  background-color: white;
  border-radius: 12px;
  margin: 15px 10px 0;
  overflow: hidden;
}

.menu-title {
  font-size: 14px;
  color: #646566;
  padding: 12px 15px;
  border-bottom: 1px solid #f0f0f0;
}

.logout-section {
  margin-top: 15px;
  background-color: white;
  border-radius: 12px;
  margin: 15px 10px 0;
  overflow: hidden;
}

.about-content {
  text-align: center;
  line-height: 1.6;
}

.mt-2 {
  margin-top: 8px;
}

.mt-4 {
  margin-top: 16px;
}

.text-center {
  text-align: center;
}
</style>
