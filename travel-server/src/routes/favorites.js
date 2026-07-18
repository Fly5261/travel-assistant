import express from "express";
import { authenticate } from "../middleware/auth.js";
import { success, error } from "../utils/response.js";
import { getFavorites, addFavorite, removeFavorite, checkFavorite } from "../services/favoritesService.js";

const router = express.Router();

router.get("/favorites", authenticate, async (req, res) => {
  const { type, page = 1, pageSize = 10 } = req.query;
  const result = await getFavorites(req.user.id, type, parseInt(page), parseInt(pageSize));
  if (result.success) {
    res.json(success(result.data));
  } else {
    res.json(error(result.message));
  }
});

router.post("/favorites/add", authenticate, async (req, res) => {
  const { targetType, targetId, title, cover, content } = req.body;
  const result = await addFavorite(req.user.id, targetType, targetId, title, cover, content);
  if (result.success) {
    res.json(success(null, result.message));
  } else {
    res.json(error(result.message));
  }
});

router.post("/favorites/remove", authenticate, async (req, res) => {
  const { id } = req.body;
  const result = await removeFavorite(req.user.id, id);
  if (result.success) {
    res.json(success(null, result.message));
  } else {
    res.json(error(result.message));
  }
});

router.get("/favorites/check", authenticate, async (req, res) => {
  const { targetType, targetId } = req.query;
  const result = await checkFavorite(req.user.id, targetType, targetId);
  if (result.success) {
    res.json(success(result.data));
  } else {
    res.json(error(result.message));
  }
});

export default router;
