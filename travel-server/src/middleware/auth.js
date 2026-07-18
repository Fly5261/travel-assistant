import { verifyToken } from "../utils/jwt.js";
import { unauthorized } from "../utils/response.js";
import { queryOne } from "../config/db.js";

export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json(unauthorized("请先登录"));
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (!decoded || decoded.type === "refresh") {
    return res.status(401).json(unauthorized("登录已过期"));
  }

  const user = await queryOne("SELECT id, phone, nickname, avatar, status FROM users WHERE id = ?", [decoded.id]);

  if (!user || user.status === 0) {
    return res.status(401).json(unauthorized("用户不存在或已禁用"));
  }

  req.user = user;
  next();
}

export async function authenticateRefresh(req, res, next) {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ code: 400, message: "缺少refreshToken", data: null });
  }

  const decoded = verifyToken(refreshToken);

  if (!decoded || decoded.type !== "refresh") {
    return res.status(401).json(unauthorized("无效的refreshToken"));
  }

  const user = await queryOne("SELECT id, phone, nickname FROM users WHERE id = ?", [decoded.id]);

  if (!user) {
    return res.status(401).json(unauthorized("用户不存在"));
  }

  req.user = user;
  req.refreshToken = refreshToken;
  next();
}
