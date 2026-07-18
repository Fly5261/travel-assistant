import express from "express";
import travelService from "../services/travelService.js";
import { createStreamResponse } from "../utils/streamUtils.js";
// 创建一个路由模块
const router = express.Router();
// 推荐景点接口
router.post("/recommend", async (req, res) => {
  const { city, budget, days } = req.body;
  if (!city || !budget || !days) {
    return res.status(400).json({
      success: false,
      error: "缺少必要参数：city,budget,days",
    });
  }
  // 调用推荐服务
  const result = await travelService.recommend(city, budget, days);
  return res.json(result);
  // return res.json({
  //   message: "推荐景点",
  //   timestamp: new Date().toISOString(),
  // });
});
router.post("/chat", async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({
      success: false,
      error: "缺少必要参数：message",
    });
  }
  // 对SSE流式接口返回进行处理
  const stream = createStreamResponse(res);
  //  调用大模型获取流式响应
  const result = await travelService.chat(message, (chunk) => {
    stream.send({ type: "chunk", data: chunk });
  });
  stream.send({ type: "complete", data: result });
  stream.end();
});
export default router;
