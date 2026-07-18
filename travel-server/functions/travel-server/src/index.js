import express from "express";
import travelRouter from "./routes/travel.js";
import "dotenv/config";
import cors from "cors";
const app = express();
app.use(cors());
const port = process.env.PORT || 9000;
// 解析请求体
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// 创建一个心跳接口
app.post("/api/heartbeat", (req, res) => {
  console.log(req.query);
  console.log(req.body);
  res.json({
    message: "服务端正常运行",
    timestamp: new Date().toISOString(),
  });
});
// 创建一个中间件
app.use("/api/travel", travelRouter);

app.listen(port, () => {
  console.log(`服务端地址: http://localhost:${port}`);
});
