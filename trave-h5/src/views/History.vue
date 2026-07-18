<template>
  <div class="history-container">
    <van-nav-bar title="历史记录" right-text="清空" @click-right="handleClear" />

    <div class="list-container">
      <van-pull-refresh v-model="refreshing" @refresh="loadHistory(true)">
        <div v-for="group in groupedHistory" :key="group.date" class="date-group">
          <div class="date-label">{{ group.label }}</div>
          <van-list
            v-model:loading="loading"
            :finished="finished"
            :offset="0"
            @load="loadHistory"
          >
            <div
              v-for="item in group.items"
              :key="item.id"
              class="history-item"
              @click="handleItemClick(item)"
            >
              <van-icon :name="getIcon(item.type)" class="item-icon" />
              <div class="item-content">
                <h3 class="item-title">{{ item.title }}</h3>
                <p class="item-summary">{{ item.summary }}</p>
                <p class="item-time">{{ formatTime(item.createdAt) }}</p>
              </div>
              <van-button
                size="mini"
                type="danger"
                plain
                class="delete-btn"
                @click.stop="handleDelete(item)"
              >
                删除
              </van-button>
            </div>
          </van-list>
        </div>
      </van-pull-refresh>

      <div v-if="history.length === 0 && !loading" class="empty-state">
        <van-icon name="history-o" size="48" color="#ccc" />
        <p>暂无历史记录</p>
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

const history = ref([]);
const loading = ref(false);
const finished = ref(false);
const refreshing = ref(false);
const page = ref(1);
const pageSize = ref(10);

const getIcon = (type) => {
  return type === "chat" ? "chat-o" : "eye-o";
};

const formatTime = (time) => {
  if (!time) return "";
  const date = new Date(time);
  return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
};

const getDateLabel = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = Math.floor((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diff === 0) return "今天";
  if (diff === 1) return "昨天";
  if (date.getFullYear() !== now.getFullYear()) {
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  }
  return `${date.getMonth() + 1}月${date.getDate()}日`;
};

const getDateKey = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
};

const groupedHistory = computed(() => {
  const groups = {};
  history.value.forEach((item) => {
    const key = getDateKey(item.createdAt);
    if (!groups[key]) {
      groups[key] = { date: key, label: getDateLabel(item.createdAt), items: [] };
    }
    groups[key].items.push(item);
  });
  return Object.values(groups).sort((a, b) => b.date.localeCompare(a.date));
});

const loadHistory = async (isRefresh = false) => {
  if (isRefresh) {
    page.value = 1;
    history.value = [];
    finished.value = false;
    refreshing.value = true;
  } else {
    loading.value = true;
  }

  try {
    const params = {
      page: page.value,
      pageSize: pageSize.value,
    };
    const response = await get("/history", params);
    if (response.code === 200) {
      const list = response.data.list || [];
      if (isRefresh) {
        history.value = list;
      } else {
        history.value = [...history.value, ...list];
      }
      finished.value = list.length < pageSize.value;
    }
  } catch (error) {
    showToast("加载失败");
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
};

const handleItemClick = (item) => {
  if (item.type === "chat") {
    router.push(`/chat?id=${item.relatedId}`);
  } else if (item.type === "browse") {
    router.push(`/detail?id=${item.relatedId}`);
  }
};

const handleDelete = async (item) => {
  try {
    const response = await post("/history/delete", { id: item.id });
    if (response.code === 200) {
      history.value = history.value.filter((h) => h.id !== item.id);
      showToast("已删除");
    }
  } catch (error) {
    showToast("删除失败");
  }
};

const handleClear = () => {
  showDialog({
    title: "清空历史",
    message: "清空后无法恢复，是否继续？",
  }).then(async () => {
    try {
      const response = await post("/history/clear");
      if (response.code === 200) {
        history.value = [];
        showToast("已清空");
      }
    } catch (error) {
      showToast("清空失败");
    }
  }).catch(() => {});
};

loadHistory();
</script>

<style scoped>
.history-container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.list-container {
  padding-bottom: 50px;
}

.date-group {
  margin-bottom: 10px;
}

.date-label {
  font-size: 12px;
  color: #969799;
  padding: 12px 15px;
}

.history-item {
  display: flex;
  align-items: center;
  padding: 15px;
  background-color: white;
}

.item-icon {
  width: 40px;
  height: 40px;
  line-height: 40px;
  text-align: center;
  font-size: 24px;
  color: #1989fa;
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
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-summary {
  font-size: 13px;
  color: #646566;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-time {
  font-size: 12px;
  color: #969799;
}

.delete-btn {
  flex-shrink: 0;
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
</style>
