import express from "express";
import { authenticate } from "../middleware/auth.js";
import { success, error } from "../utils/response.js";
import { getUserProfile, updateUserProfile } from "../services/userService.js";

const router = express.Router();

router.get("/user/profile", authenticate, async (req, res) => {
  const result = await getUserProfile(req.user.id);
  if (result.success) {
    res.json(success(result.data));
  } else {
    res.json(error(result.message));
  }
});

router.put("/user/profile", authenticate, async (req, res) => {
  const result = await updateUserProfile(req.user.id, req.body);
  if (result.success) {
    res.json(success(result.data, result.message));
  } else {
    res.json(error(result.message));
  }
});

export default router;
