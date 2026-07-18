import bcrypt from "bcryptjs";
import { query, queryOne, execute } from "../config/db.js";
import {
  generateAccessToken,
  generateRefreshToken,
  getTokenExpireTime,
  maskPhone,
} from "../utils/jwt.js";
import { setKey, getKey, delKey } from "../config/redis.js";
import { sendSmsCode } from "./smsService.js";

const SMS_EXPIRE_TIME = 300;
const SMS_LIMIT_TIME = 10;

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendSms(phone, scene) {
  if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
    return { success: false, message: "请输入正确的手机号" };
  }

  const limitKey = `sms:limit:${phone}`;
  const lastSend = await getKey(limitKey);
  if (lastSend) {
    return { success: false, message: "发送过于频繁，请稍后再试" };
  }

  const code = generateCode();
  const codeKey = `sms:code:${phone}:${scene}`;
  await setKey(codeKey, code, SMS_EXPIRE_TIME);
  await setKey(limitKey, "1", SMS_LIMIT_TIME);

  const smsResult = await sendSmsCode(phone, code, scene);

  return smsResult;
}

export async function verifySms(phone, code, scene) {
  if (!phone || !code) {
    return { success: false, message: "参数错误" };
  }

  const codeKey = `sms:code:${phone}:${scene}`;
  const storedCode = await getKey(codeKey);

  if (!storedCode) {
    return { success: false, message: "验证码错误或已过期" };
  }

  if (storedCode !== code) {
    return { success: false, message: "验证码错误或已过期" };
  }

  await delKey(codeKey);
  return { success: true };
}

export async function passwordLogin(phone, password) {
  if (!phone || !password) {
    return { success: false, message: "请输入手机号和密码" };
  }

  const user = await queryOne("SELECT * FROM users WHERE phone = ?", [phone]);

  if (!user) {
    return { success: false, message: "账号不存在" };
  }

  if (!user.password_hash) {
    return { success: false, message: "请使用短信登录" };
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    return { success: false, message: "密码错误" };
  }

  return await generateTokenResponse(user);
}

export async function smsLogin(phone, code) {
  const verifyResult = await verifySms(phone, code, "login");
  if (!verifyResult.success) {
    return verifyResult;
  }

  let user = await queryOne("SELECT * FROM users WHERE phone = ?", [phone]);

  if (!user) {
    user = await createUser(phone);
  }

  return await generateTokenResponse(user);
}

export async function register(phone, code, password) {
  const verifyResult = await verifySms(phone, code, "register");
  if (!verifyResult.success) {
    return verifyResult;
  }

  const existingUser = await queryOne("SELECT id FROM users WHERE phone = ?", [
    phone,
  ]);
  if (existingUser) {
    return { success: false, message: "该手机号已注册" };
  }

  if (!password || password.length < 8) {
    return { success: false, message: "密码长度至少8位" };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await createUser(phone, passwordHash);

  return await generateTokenResponse(user);
}

async function createUser(phone, passwordHash = null) {
  const result = await execute(
    "INSERT INTO users (phone, password_hash, nickname) VALUES (?, ?, ?)",
    [phone, passwordHash, "游客"],
  );
  const userId = result.insertId;
  return await queryOne("SELECT * FROM users WHERE id = ?", [userId]);
}

async function generateTokenResponse(user) {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  const expiresIn = parseInt(process.env.JWT_EXPIRES_IN || "7200");

  await execute(
    "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE token = VALUES(token), expires_at = VALUES(expires_at)",
    [user.id, refreshToken, getTokenExpireTime(expiresIn * 7)],
  );

  const maskedPhone = maskPhone(user.phone);

  return {
    success: true,
    data: {
      accessToken,
      refreshToken,
      expiresIn,
      user: {
        id: user.id,
        phone: maskedPhone,
        nickname: user.nickname,
        avatar: user.avatar,
        gender: user.gender,
        birthday: user.birthday,
        city: user.city,
        intro: user.intro,
      },
      isNewUser: false,
    },
  };
}

export async function refreshToken(refreshToken, oldToken) {
  const existingToken = await queryOne(
    "SELECT user_id FROM refresh_tokens WHERE token = ?",
    [oldToken],
  );

  if (!existingToken) {
    return { success: false, message: "refreshToken无效" };
  }

  const user = await queryOne("SELECT * FROM users WHERE id = ?", [
    existingToken.user_id,
  ]);
  if (!user) {
    return { success: false, message: "用户不存在" };
  }

  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);
  const expiresIn = parseInt(process.env.JWT_EXPIRES_IN || "7200");

  await execute(
    "UPDATE refresh_tokens SET token = ?, expires_at = ? WHERE token = ?",
    [newRefreshToken, getTokenExpireTime(expiresIn * 7), oldToken],
  );

  const maskedPhone = maskPhone(user.phone);

  return {
    success: true,
    data: {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn,
      user: {
        id: user.id,
        phone: maskedPhone,
        nickname: user.nickname,
        avatar: user.avatar,
      },
    },
  };
}

export async function logout(refreshToken) {
  await execute("DELETE FROM refresh_tokens WHERE token = ?", [refreshToken]);
  return { success: true, message: "登出成功" };
}

export async function resetPassword(phone, code, newPassword) {
  const verifyResult = await verifySms(phone, code, "forgot");
  if (!verifyResult.success) {
    return verifyResult;
  }

  const user = await queryOne("SELECT id FROM users WHERE phone = ?", [phone]);
  if (!user) {
    return { success: false, message: "该手机号未注册" };
  }

  if (!newPassword || newPassword.length < 8) {
    return { success: false, message: "密码长度至少8位" };
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await execute("UPDATE users SET password_hash = ? WHERE id = ?", [
    passwordHash,
    user.id,
  ]);
  await execute("DELETE FROM refresh_tokens WHERE user_id = ?", [user.id]);

  return { success: true, message: "密码重置成功" };
}

export async function changePassword(userId, oldPassword, newPassword) {
  const user = await queryOne("SELECT password_hash FROM users WHERE id = ?", [
    userId,
  ]);
  if (!user) {
    return { success: false, message: "用户不存在" };
  }

  if (!user.password_hash) {
    return { success: false, message: "请先设置登录密码" };
  }

  const isValid = await bcrypt.compare(oldPassword, user.password_hash);
  if (!isValid) {
    return { success: false, message: "旧密码错误" };
  }

  if (oldPassword === newPassword) {
    return { success: false, message: "新密码不能与旧密码相同" };
  }

  if (!newPassword || newPassword.length < 8) {
    return { success: false, message: "新密码长度至少8位" };
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await execute("UPDATE users SET password_hash = ? WHERE id = ?", [
    passwordHash,
    userId,
  ]);
  await execute("DELETE FROM refresh_tokens WHERE user_id = ?", [userId]);

  return { success: true, message: "密码修改成功" };
}
