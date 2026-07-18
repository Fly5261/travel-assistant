import express from "express";
import "dotenv/config";
import cors from "cors";
import { serveUploads } from "./services/uploadService.js";
import { errorHandler, notFound } from "./middleware/error.js";
import travelRouter from "./routes/travel.js";
import authRouter from "./routes/auth.js";
import userRouter from "./routes/user.js";
import favoritesRouter from "./routes/favorites.js";
import historyRouter from "./routes/history.js";
import uploadRouter from "./routes/upload.js";

const app = express();
const port = process.env.PORT || 3300;

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

serveUploads(app);

app.post("/api/heartbeat", (req, res) => {
  res.json({
    message: "服务端正常运行",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/travel", travelRouter);
app.use("/api/travel", authRouter);
app.use("/api/travel", userRouter);
app.use("/api/travel", favoritesRouter);
app.use("/api/travel", historyRouter);
app.use("/api/travel", uploadRouter);

app.use(notFound);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`服务端地址: http://localhost:${port}`);
});
