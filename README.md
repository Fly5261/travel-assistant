# 智能旅游助手系统

基于 Vue 3 + Node.js + LangChain 构建的智能旅游助手，帮助用户获取景点介绍、旅游攻略等信息。

## 技术栈

### 前端
- Vue 3 + Vite
- Vue Router
- Vant UI 组件库
- Axios

### 后端
- Node.js + Express
- LangChain
- DashScope (阿里云大模型服务)

## 项目结构

```
├── trave-h5/          # 前端项目
│   ├── src/
│   │   ├── components/   # 公共组件
│   │   ├── views/        # 页面视图
│   │   ├── router/       # 路由配置
│   │   ├── utils/        # 工具函数
│   │   └── App.vue       # 根组件
│   └── package.json
├── travel-server/     # 后端项目
│   ├── src/
│   │   ├── routes/       # 路由
│   │   ├── services/     # 业务服务
│   │   └── utils/        # 工具函数
│   └── package.json
└── README.md
```

## 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

## 本地运行

### 1. 安装依赖

#### 前端
```bash
cd trave-h5
npm install
```

#### 后端
```bash
cd travel-server
npm install
```

### 2. 配置环境变量

#### 前端配置
复制 `trave-h5/.env.example` 为 `trave-h5/.env`：

```bash
cd trave-h5
cp .env.example .env
```

编辑 `.env` 文件：
```env
VITE_API_BASE_URL=http://127.0.0.1:3300
```

#### 后端配置
复制 `travel-server/.env.example` 为 `travel-server/.env`：

```bash
cd travel-server
cp .env.example .env
```

编辑 `.env` 文件，配置大模型 API Key：
```env
PORT=3300
MODEL_PROVIDER=QwenPlus
QwenPlus_API_KEY=your_api_key_here
QwenPlus_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
QwenPlus_MODEL=qwen3.6-flash
```

> **注意**: 需要前往阿里云 DashScope 控制台获取 API Key。

### 3. 启动服务

#### 启动后端服务
```bash
cd travel-server
npm run dev
```

后端服务将在 http://localhost:3300 运行。

#### 启动前端服务
```bash
cd trave-h5
npm run dev
```

前端服务将在 http://localhost:5173 运行。

## 功能特性

- 🏞️ 景点智能介绍
- 💬 旅游咨询对话
- 📝 旅游攻略生成
- 💰 预算规划
- 📱 响应式设计，支持移动端

## 部署说明

### 前端部署
推荐部署到 Vercel 或 Netlify：

1. 在 Vercel/Netlify 中导入项目
2. 配置环境变量 `VITE_API_BASE_URL` 指向后端地址

### 后端部署
推荐部署到 Railway 或 Render：

1. 在 Railway/Render 中导入项目
2. 配置环境变量：
   - `PORT`
   - `MODEL_PROVIDER`
   - `QwenPlus_API_KEY`
   - `QwenPlus_BASE_URL`
   - `QwenPlus_MODEL`

## 项目截图

项目包含以下主要页面：
- 首页：展示热门景点
- 聊天页：与 AI 助手对话获取旅游建议
- 详情页：景点详细信息
- 个人中心：用户设置

## License

ISC