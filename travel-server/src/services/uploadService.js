import fs from "fs";
import path from "path";
import sharp from "sharp";
import express from "express";

const uploadPath = process.env.UPLOAD_PATH || "./uploads";
const maxFileSize = 5 * 1024 * 1024;
const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const serverHost = process.env.SERVER_HOST || "http://localhost:3300";

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

export async function uploadAvatar(file) {
  if (!file) {
    return { success: false, message: "请选择文件" };
  }

  if (file.size > maxFileSize) {
    return { success: false, message: "图片大小不能超过5MB" };
  }

  if (!validTypes.includes(file.mimetype)) {
    return { success: false, message: "仅支持JPG、PNG、WEBP格式" };
  }

  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  const ext = path.extname(file.originalname);
  const filename = `avatar_${timestamp}_${random}${ext}`;
  const filePath = path.join(uploadPath, filename);

  try {
    await sharp(file.path)
      .resize({ width: 200, height: 200, fit: "cover" })
      .toFile(filePath);

    fs.unlinkSync(file.path);

    const url = `${serverHost}/uploads/${filename}`;

    return {
      success: true,
      data: { url },
      message: "上传成功",
    };
  } catch (error) {
    console.error("Upload error:", error);
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    return { success: false, message: "上传失败" };
  }
}

export function serveUploads(app) {
  app.use("/uploads", express.static(uploadPath));
}
