import express from "express";
import { authenticate } from "../middleware/auth.js";
import { success, error } from "../utils/response.js";
import { getHistory, addHistory, deleteHistory, clearHistory } from "../services/historyService.js";

const router = express.Router();

router.get("/history", authenticate, async (req, res) => {
  const { type, page = 1, pageSize = 10 } = req.query;
  const result = await getHistory(req.user.id, type, parseInt(page), parseInt(pageSize));
  if (result.success) {
    res.json(success(result.data));
  } else {
    res.json(error(result.message));
  }
});

router.post("/history/add", authenticate, async (req, res) => {
  const { type, title, summary, relatedId } = req.body;
  const result = await addHistory(req.user.id, type, title, summary, relatedId);
  if (result.success) {
    res.json(success(null, result.message));
  } else {
    res.json(error(result.message));
  }
});

router.post("/history/delete", authenticate, async (req, res) => {
  const { id } = req.body;
  const result = await deleteHistory(req.user.id, id);
  if (result.success) {
    res.json(success(null, result.message));
  } else {
    res.json(error(result.message));
  }
});

router.post("/history/clear", authenticate, async (req, res) => {
  const result = await clearHistory(req.user.id);
  if (result.success) {
    res.json(success(null, result.message));
  } else {
    res.json(error(result.message));
  }
});

export default router;
