<template>
  <div class="page-container">
    <div class="page-header">
      <van-nav-bar
        title="AI旅游助手"
        left-arrow
        left-text="返回"
        fixed
        @click-left="onBack"
      />
    </div>
    <div class="chat-container" ref="chatContainer">
      <div v-if="messages.length === 0" class="chat-empty">
        <van-empty description="开始和AI助手对话" />
        <div class="quick-questions">
          <div class="quick-title">常见问题</div>
          <van-tag
            @click="handleClickTag(question)"
            v-for="question in quickQuestions"
            :key="question"
            size="large"
            mark
            class="quick-tag"
            >{{ question }}
          </van-tag>
        </div>
      </div>
      <div v-else class="message-list">
        <ChatMessage v-for="msg in messages" :key="msg.id" :message="msg" />
        <div class="streaming-indicator" v-if="isStreaming">
          <van-loading type="spinner" size="20px" />
          <span> AI正在思考中... </span>
        </div>
      </div>
    </div>
    <div class="chat-input-area">
      <van-field
        v-model="inputMessage"
        placeholder="请输入您的问题..."
        :disabled="isStreaming"
        @keyup.enter="sendMessage"
      >
        <template #button>
          <van-button
            type="primary"
            size="small"
            :disabled="!inputMessage.trim()"
            @click="sendMessage"
          >
            发送
          </van-button>
        </template>
      </van-field>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { fetchStream } from "../utils/request";
import ChatMessage from "../components/ChatBubble.vue";
const route = useRoute();
const chatContainer = ref(null);
// 置底方法
const scrollToBottom = () => {
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
  }
};
const router = useRouter();
// 会话数据
const messages = ref([]);
// 常见问题
const quickQuestions = ref([
  "北京有哪些必去的景点？",
  "上海美食推荐",
  "成都三日游攻略",
  "如何选择旅行保险？",
]);
// 输入框内容
const inputMessage = ref("");
// 发送消息
const sendMessage = () => {
  const msg = inputMessage.value.trim();
  if (!msg || isStreaming.value) {
    return;
  }
  addUserMessage(msg);
  inputMessage.value = "";
  //    进行流式返回请求
  fetchAIMessage(msg);
};
// 获取AI回答
const fetchAIMessage = (userMsg) => {
  isStreaming.value = true;
  messages.value.push({
    id: Date.now() + 1,
    role: "ai",
    content: "",
    timestamp: new Date().toISOString(),
  });
  // fetchStream 流式返回
  let fullResponse = "";
  fetchStream(
    "chat",
    { message: userMsg },
    (chunk) => {
      fullResponse += chunk;
      const lastMsg = messages.value[messages.value.length - 1];
      if (lastMsg && lastMsg.role === "ai") {
        lastMsg.content = fullResponse;
      }
      scrollToBottom();
    },
    () => {
      // ai 流式返回完成
      isStreaming.value = false;
      scrollToBottom();
    },
    (errMsg) => {
      // ai 流式返回错误
      const lastMsg = messages.value[messages.value.length - 1];
      if (lastMsg && lastMsg.role === "ai") {
        lastMsg.content = `抱歉发生错误：${errMsg}`;
      }
      isStreaming.value = false;
      showToast("ai发生错误");
      scrollToBottom();
    },
  );
};
// ai 是否正在流式返回
const isStreaming = ref(false);
// 用户发送消息
const addUserMessage = (content) => {
  messages.value.push({
    id: Date.now(),
    role: "user",
    content,
    timestamp: new Date().toISOString(),
  });
};

// 点击标签
const handleClickTag = (question) => {};
const onBack = () => {
  router.back();
};
onMounted(() => {
  if (route.query.scene === "detail" && route.query.city) {
    inputMessage.value = `我想了解一下${route.query.city}的旅游景点`;
  }
});
</script>
<style scoped>
.page-header {
  height: 46px;
}
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding-bottom: 0px !important;
}

.chat-container {
  /* flex: 1; */
  height: 650px;
  /* 超出部分滚动 */
  overflow-y: auto;
  padding: 16px;
  padding-bottom: 60px;
}

.chat-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.quick-questions {
  margin-top: 32px;
  text-align: center;
}

.quick-title {
  font-size: 14px;
  color: #999;
  margin-bottom: 16px;
}

.quick-tag {
  margin: 8px;
  cursor: pointer;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.streaming-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  color: #999;
  font-size: 14px;
}

.chat-input-area {
  position: fixed;
  bottom: 50px;
  left: 0;
  right: 0;
  background: #fff;
  padding: 8px 16px;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
  max-width: 750px;
  margin: 0 auto;
}

.chat-input-area :deep(.van-field) {
  background: #f7f8fa;
  border-radius: 20px;
  padding: 8px 16px;
}
</style>
