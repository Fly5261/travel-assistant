<template>
  <div class="page-container">
    <div class="page-header">
      <van-nav-bar
        fixed
        left-text="返回"
        left-arrow
        @click-left="onBack"
        :title="(formData.city || '目的地') + '旅游规划详情'"
      />
    </div>
    <div class="page-content">
      <div v-if="isLoading" class="loading-container">
        <van-loading size="40" type="spinner">
          正在生成旅游规划...
        </van-loading>
      </div>
      <!-- <div v-else-if="error">
        <van-empty :description="error">
          <van-button type="primary" @click="fetchTripData">重试</van-button>
        </van-empty>
      </div> -->
      <template v-else-if="tripData">
        <div class="card overview-card">
          <div class="trip-header">
            <h2>{{ formData.city }}-{{ formData.days }}天行程</h2>
            <div class="trip-budget">预算: {{ formData.budget }}元</div>
          </div>
        </div>
        <van-collapse v-model="activeDays" class="trip-collapse">
          <van-collapse-item
            v-for="day in tripData.dailyItinerary"
            :key="day.days"
            :title="'第' + day.day + '天'"
            :name="day.days"
          >
            <div class="day-schedule">
              <div class="schedule-selection">
                <div class="section-label morning">上午</div>
                <SpotItem :data="day.morning" />
              </div>
              <div class="schedule-selection">
                <div class="section-label afternoon">下午</div>
                <SpotItem :data="day.afternoon" />
              </div>
              <div class="schedule-selection">
                <div class="section-label evening">晚上</div>
                <SpotItem :data="day.evening" />
              </div>
            </div>
          </van-collapse-item>
        </van-collapse>
        <div class="card budget-card">
          <div class="section-title">预算明细</div>
          <BudgetItem
            :data="tripData.budgetBreakdown"
            :total="tripData.totalBudget"
          />
        </div>
        <div class="card tips-card">
          <div class="section-title">温馨提示</div>
          <ul class="tips-list">
            <li v-for="(tip, index) in tripData.tips" :key="index">
              {{ tip }}
            </li>
          </ul>
        </div>
        <div class="card warnings-card">
          <div class="section-title">注意事项</div>
          <ul class="warnings-list">
            <li v-for="(warning, index) in tripData.warnings" :key="index">
              {{ warning }}
            </li>
          </ul>
        </div>
      </template>
    </div>
    <div class="detail-footer" v-if="tripData">
      <van-button
        :type="isFavorite ? 'warning' : 'default'"
        size="large"
        round
        @click="toggleFavorite"
        class="footer-button"
        >{{ isFavorite ? "已收藏" : "收藏" }}</van-button
      >
      <van-button
        type="primary"
        size="large"
        round
        @click="goToChat"
        class="footer-button"
        >咨询AI助手</van-button
      >
    </div>
  </div>
</template>
<script setup>
import { onMounted, reactive, ref } from "vue";
import { post, get } from "../utils/request";
import { useRouter, useRoute } from "vue-router";
import { showToast } from "vant";
import SpotItem from "../components/SpotItem.vue";
import BudgetItem from "../components/BudgetTable.vue";

const router = useRouter();
const route = useRoute();
const isLoading = ref(true);
const activeDays = ref([]);
const formData = reactive({
  city: "",
  budget: null,
  days: null,
});
const tripData = ref(null);
const error = ref("接口调用失败");

const isFavorite = ref(false);
const favoriteId = ref(null);

const onBack = () => {
  router.back();
};

const goToChat = () => {
  router.push({
    name: "Chat",
    query: {
      city: formData.city,
      scene: "detail",
    },
  });
};

const cacheKey = () => `${formData.city}-${formData.days}-${formData.budget}`;

const loadFromCache = () => {
  try {
    const cached = sessionStorage.getItem(`trip_${cacheKey()}`);
    if (cached) {
      tripData.value = JSON.parse(cached);
      isLoading.value = false;
      return true;
    }
  } catch (e) {
    console.log("loadFromCache error:", e);
  }
  return false;
};

const loadFromFavorite = () => {
  try {
    const cached = sessionStorage.getItem("favoriteContent");
    if (cached) {
      const content = JSON.parse(cached);
      if (content && content.dailyItinerary) {
        tripData.value = content;
        isLoading.value = false;
        sessionStorage.removeItem("favoriteContent");
        return true;
      }
    }
  } catch (e) {
    console.log("loadFromFavorite error:", e);
  }
  return false;
};

const saveToCache = (data) => {
  try {
    sessionStorage.setItem(`trip_${cacheKey()}`, JSON.stringify(data));
  } catch (e) {
    console.log("saveToCache error:", e);
  }
};

const fetchTripData = async () => {
  if (route.query.fromFavorite) {
    if (loadFromFavorite()) {
      await checkFavoriteStatus();
      return;
    }
    if (loadFromCache()) {
      await checkFavoriteStatus();
      return;
    }
  }

  const res = await post("recommend", {
    city: formData.city,
    budget: formData.budget,
    days: formData.days,
  });
  tripData.value = res;
  saveToCache(res);
  isLoading.value = false;
  await checkFavoriteStatus();
};

const checkFavoriteStatus = async () => {
  if (!formData.city) return;
  try {
    const response = await get("/favorites/check", {
      targetType: "route",
      targetId: `${formData.city}-${formData.days}`,
    });
    if (response.code === 200) {
      isFavorite.value = response.data.isFavorite;
      favoriteId.value = response.data.favoriteId;
    }
  } catch (error) {
    console.log("checkFavoriteStatus error:", error);
  }
};

const toggleFavorite = async () => {
  if (!formData.city) {
    showToast("请先生成行程");
    return;
  }

  try {
    if (isFavorite.value) {
      const response = await post("/favorites/remove", {
        id: favoriteId.value,
      });
      if (response.code === 200) {
        isFavorite.value = false;
        favoriteId.value = null;
        showToast("已取消收藏");
      } else {
        showToast(response.message || "取消收藏失败");
      }
    } else {
      const cityImages = {
        "北京": `${import.meta.env.BASE_URL}images/cities/beijing.svg`,
        "上海": `${import.meta.env.BASE_URL}images/cities/shanghai.svg`,
        "广州": `${import.meta.env.BASE_URL}images/cities/guangzhou.svg`,
        "深圳": `${import.meta.env.BASE_URL}images/cities/shenzhen.svg`,
        "成都": `${import.meta.env.BASE_URL}images/cities/chengdu.svg`,
        "杭州": `${import.meta.env.BASE_URL}images/cities/hangzhou.svg`,
        "西安": `${import.meta.env.BASE_URL}images/cities/xian.svg`,
        "南京": `${import.meta.env.BASE_URL}images/cities/nanjing.svg`,
        "苏州": `${import.meta.env.BASE_URL}images/cities/suzhou.svg`,
        "重庆": `${import.meta.env.BASE_URL}images/cities/chongqing.svg`,
        "武汉": `${import.meta.env.BASE_URL}images/cities/wuhan.svg`,
        "长沙": `${import.meta.env.BASE_URL}images/cities/changsha.svg`,
        "天津": `${import.meta.env.BASE_URL}images/cities/tianjin.svg`,
        "青岛": `${import.meta.env.BASE_URL}images/cities/qingdao.svg`,
        "厦门": `${import.meta.env.BASE_URL}images/cities/xiamen.svg`,
        "昆明": `${import.meta.env.BASE_URL}images/cities/kunming.svg`,
        "丽江": `${import.meta.env.BASE_URL}images/cities/lijiang.svg`,
        "三亚": `${import.meta.env.BASE_URL}images/cities/sanya.svg`,
        "桂林": `${import.meta.env.BASE_URL}images/cities/guilin.svg`,
        "张家界": `${import.meta.env.BASE_URL}images/cities/zhangjiajie.svg`,
      };
      const cover = cityImages[formData.city] || `${import.meta.env.BASE_URL}images/cities/beijing.svg`;
      const response = await post("/favorites/add", {
        targetType: "route",
        targetId: `${formData.city}-${formData.days}`,
        title: `${formData.city}-${formData.days}天行程`,
        cover,
        content: tripData.value,
      });
      if (response.code === 200) {
        isFavorite.value = true;
        showToast("收藏成功");
        await checkFavoriteStatus();
      } else {
        showToast(response.message || "收藏失败");
      }
    }
  } catch (error) {
    showToast("操作失败");
  }
};

onMounted(() => {
  formData.city = route.query.city;
  formData.budget = route.query.budget;
  formData.days = route.query.days;
  if (formData.city && formData.budget && formData.days) {
    fetchTripData();
  }
});
</script>
<style scoped>
.page-header {
  height: 46px;
}
.overview-card {
  margin-bottom: 16px;
}

.trip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.trip-header h2 {
  font-size: 20px;
  color: #323233;
  margin: 0;
}

.trip-budget {
  font-size: 16px;
  color: #ee0a24;
  font-weight: 600;
}

.trip-collapse {
  margin-bottom: 16px;
}

.day-schedule {
  padding: 8px 0;
}

.schedule-section {
  margin-bottom: 16px;
}

.schedule-section:last-child {
  margin-bottom: 0;
}

.section-label {
  font-size: 14px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
  margin-bottom: 8px;
}

.section-label.morning {
  background: #fff7e6;
  color: #fa8c16;
}

.section-label.afternoon {
  background: #e6f7ff;
  color: #1890ff;
}

.section-label.evening {
  background: #f6ffed;
  color: #52c41a;
}

.budget-card,
.tips-card,
.warnings-card {
  margin-bottom: 16px;
}

.tips-list,
.warnings-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.tips-list li,
.warnings-list li {
  padding: 8px 0;
  color: #666;
  font-size: 14px;
  border-bottom: 1px solid #f5f5f5;
}

.tips-list li:last-child,
.warnings-list li:last-child {
  border-bottom: none;
}

.detail-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 16px;
  background: #fff;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
  max-width: 750px;
  margin: 0 auto;
  display: flex;
  gap: 12px;
}

.footer-button {
  flex: 1;
}

.error-card {
  text-align: center;
  padding: 40px 16px;
}
</style>
