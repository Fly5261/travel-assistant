<template>
  <div class="favorites-container">
    <van-nav-bar title="我的收藏" left-text="返回" @click-left="handleBack" />

    <van-tabs v-model:active="activeTab" @change="onTabChange" sticky>
      <van-tab title="全部" name="all" />
      <van-tab title="景点" name="spot" />
      <van-tab title="路线" name="route" />
      <van-tab title="攻略" name="guide" />
    </van-tabs>

    <div class="list-container">
      <van-pull-refresh v-model="refreshing" @refresh="loadFavorites(true)">
        <van-list
          v-model:loading="loading"
          :finished="finished"
          finished-text="没有更多了"
          @load="loadFavorites"
        >
          <div
            v-for="item in favorites"
            :key="item.id"
            class="favorite-item"
            @click="handleItemClick(item)"
          >
            <van-image :src="getCoverImage(item)" class="cover" fit="cover" />
            <div class="item-content">
              <h3 class="item-title">{{ item.title }}</h3>
              <p class="item-time">{{ formatTime(item.createdAt) }}</p>
            </div>
            <van-button
              size="mini"
              type="danger"
              @click.stop="handleUnfavorite(item)"
            >
              取消收藏
            </van-button>
          </div>
        </van-list>
      </van-pull-refresh>

      <div v-if="favorites.length === 0 && !loading" class="empty-state">
        <van-icon name="star-o" size="48" color="#ccc" />
        <p>暂无收藏内容</p>
        <van-button type="primary" @click="goDiscover">去发现好内容</van-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { showToast, showDialog } from "vant";
import { get, post } from "../utils/request";

const router = useRouter();

const activeTab = ref("all");
const favorites = ref([]);
const loading = ref(false);
const finished = ref(false);
const refreshing = ref(false);
const page = ref(1);
const pageSize = ref(10);

const typeMap = {
  all: null,
  spot: "spot",
  route: "route",
  guide: "guide",
};

const cityImages = {
  北京: `${import.meta.env.BASE_URL}images/cities/beijing.svg`,
  上海: `${import.meta.env.BASE_URL}images/cities/shanghai.svg`,
  广州: `${import.meta.env.BASE_URL}images/cities/guangzhou.svg`,
  深圳: `${import.meta.env.BASE_URL}images/cities/shenzhen.svg`,
  成都: `${import.meta.env.BASE_URL}images/cities/chengdu.svg`,
  杭州: `${import.meta.env.BASE_URL}images/cities/hangzhou.svg`,
  西安: `${import.meta.env.BASE_URL}images/cities/xian.svg`,
  南京: `${import.meta.env.BASE_URL}images/cities/nanjing.svg`,
  苏州: `${import.meta.env.BASE_URL}images/cities/suzhou.svg`,
  重庆: `${import.meta.env.BASE_URL}images/cities/chongqing.svg`,
  武汉: `${import.meta.env.BASE_URL}images/cities/wuhan.svg`,
  长沙: `${import.meta.env.BASE_URL}images/cities/changsha.svg`,
  天津: `${import.meta.env.BASE_URL}images/cities/tianjin.svg`,
  青岛: `${import.meta.env.BASE_URL}images/cities/qingdao.svg`,
  厦门: `${import.meta.env.BASE_URL}images/cities/xiamen.svg`,
  昆明: `${import.meta.env.BASE_URL}images/cities/kunming.svg`,
  丽江: `${import.meta.env.BASE_URL}images/cities/lijiang.svg`,
  三亚: `${import.meta.env.BASE_URL}images/cities/sanya.svg`,
  桂林: `${import.meta.env.BASE_URL}images/cities/guilin.svg`,
  张家界: `${import.meta.env.BASE_URL}images/cities/zhangjiajie.svg`,
};

const getCoverImage = (item) => {
  if (item.cover && item.cover !== "") {
    if (item.cover.startsWith(import.meta.env.BASE_URL)) {
      return item.cover;
    }
    if (item.cover.startsWith("/")) {
      return `${import.meta.env.BASE_URL}${item.cover.slice(1)}`;
    }
  }
  const city = item.targetId?.split("-")[0];
  if (!city || !cityImages[city]) {
    return cityImages["北京"];
  }
  return cityImages[city];
};

const loadFavorites = async (isRefresh = false) => {
  if (isRefresh) {
    page.value = 1;
    favorites.value = [];
    finished.value = false;
    refreshing.value = true;
  } else {
    loading.value = true;
  }

  try {
    const params = {
      page: page.value,
      pageSize: pageSize.value,
      type: typeMap[activeTab.value],
    };
    const response = await get("/favorites", params);

    if (response.code === 200) {
      const list = response.data?.list || [];

      if (isRefresh) {
        favorites.value = list;
      } else {
        favorites.value = [...favorites.value, ...list];
      }
      finished.value = list.length < pageSize.value;
    } else {
      showToast(response.message || "加载失败");
    }
  } catch (error) {
    showToast("加载失败");
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
};

const onTabChange = () => {
  page.value = 1;
  favorites.value = [];
  finished.value = false;
  loadFavorites();
};

const handleItemClick = (item) => {
  const type = item.targetType || item.type;
  if (type === "route") {
    const parts = item.targetId.split("-");
    const city = parts[0] || "";
    const days = parts[1] || 1;
    sessionStorage.setItem("favoriteContent", JSON.stringify(item.content));
    router.push({
      path: "/detail",
      query: {
        city,
        days,
        budget: 1000,
        fromFavorite: "true",
      },
    });
  } else if (type === "spot") {
    router.push(`/detail?id=${item.targetId}`);
  } else if (type === "guide") {
    router.push(`/detail?id=${item.targetId}`);
  }
};

const handleUnfavorite = async (item) => {
  showDialog({
    title: "取消收藏",
    message: "确定取消收藏吗？",
  })
    .then(async () => {
      try {
        const response = await post("/favorites/remove", { id: item.id });
        if (response.code === 200) {
          favorites.value = favorites.value.filter((f) => f.id !== item.id);
          showToast("已取消收藏");
        }
      } catch (error) {
        showToast("取消失败");
      }
    })
    .catch(() => {});
};

const formatTime = (time) => {
  if (!time) return "";
  const date = new Date(time);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "今天";
  if (days === 1) return "昨天";
  if (days < 30) return `${days}天前`;
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

const goDiscover = () => {
  router.push("/");
};

const handleBack = () => {
  router.back();
};

loadFavorites();
</script>

<style scoped>
.favorites-container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.list-container {
  padding-bottom: 50px;
}

.favorite-item {
  display: flex;
  align-items: center;
  padding: 15px;
  background-color: white;
  margin-bottom: 10px;
}

.cover {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  flex-shrink: 0;
}

.item-content {
  flex: 1;
  margin-left: 15px;
  overflow: hidden;
}

.item-title {
  font-size: 16px;
  font-weight: 500;
  color: #323233;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-time {
  font-size: 12px;
  color: #969799;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.empty-state p {
  margin-top: 16px;
  color: #969799;
}

.empty-state .van-button {
  margin-top: 24px;
}
</style>
