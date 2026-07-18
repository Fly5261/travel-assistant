import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "travel_jwt_secret_key";
const JWT_EXPIRES_IN = parseInt(process.env.JWT_EXPIRES_IN || "7200");
const REFRESH_EXPIRES_IN = parseInt(process.env.REFRESH_EXPIRES_IN || "604800");

export function generateAccessToken(user) {
  const payload = {
    id: user.id,
    phone: user.phone,
    nickname: user.nickname,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function generateRefreshToken(user) {
  const payload = {
    id: user.id,
    phone: user.phone,
    type: "refresh",
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export function getTokenExpireTime(expiresIn) {
  const date = new Date();
  date.setSeconds(date.getSeconds() + expiresIn);
  return date;
}

export function maskPhone(phone) {
  if (!phone || phone.length < 11) return phone;
  return phone.slice(0, 3) + "****" + phone.slice(-4);
}
