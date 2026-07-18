import express from "express";
import { authenticate, authenticateRefresh } from "../middleware/auth.js";
import { success, error } from "../utils/response.js";
import {
  sendSms,
  passwordLogin,
  smsLogin,
  register,
  refreshToken,
  logout,
  resetPassword,
  changePassword,
} from "../services/authService.js";

const router = express.Router();

router.post("/sms/send", async (req, res) => {
  const { phone, scene = "login" } = req.body;
  const result = await sendSms(phone, scene);
  if (result.success) {
    res.json(success(null, result.message));
  } else {
    res.json(error(result.message));
  }
});

router.post("/login/password", async (req, res) => {
  const { phone, password } = req.body;
  const result = await passwordLogin(phone, password);
  if (result.success) {
    res.json(success(result.data));
  } else {
    res.json(error(result.message));
  }
});

router.post("/login/sms", async (req, res) => {
  const { phone, code } = req.body;
  const result = await smsLogin(phone, code);
  if (result.success) {
    res.json(success(result.data));
  } else {
    res.json(error(result.message));
  }
});

router.post("/login/refresh", authenticateRefresh, async (req, res) => {
  const { refreshToken: newRefreshToken } = req.body;
  const result = await refreshToken(newRefreshToken, req.refreshToken);
  if (result.success) {
    res.json(success(result.data));
  } else {
    res.status(401).json(error(result.message, 401));
  }
});

router.post("/register", async (req, res) => {
  const { phone, code, password } = req.body;
  const result = await register(phone, code, password);
  if (result.success) {
    res.json(success(result.data, "注册成功"));
  } else {
    res.json(error(result.message));
  }
});

router.post("/password/reset", async (req, res) => {
  const { phone, code, newPassword } = req.body;
  const result = await resetPassword(phone, code, newPassword);
  if (result.success) {
    res.json(success(null, result.message));
  } else {
    res.json(error(result.message));
  }
});

router.post("/password/change", authenticate, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const result = await changePassword(req.user.id, oldPassword, newPassword);
  if (result.success) {
    res.json(success(null, result.message));
  } else {
    res.json(error(result.message));
  }
});

router.post("/auth/logout", async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await logout(refreshToken);
  }
  res.json(success(null, "登出成功"));
});

export default router;
