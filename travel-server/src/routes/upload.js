import express from "express";
import multer from "multer";
import { authenticate } from "../middleware/auth.js";
import { success, error } from "../utils/response.js";
import { uploadAvatar } from "../services/uploadService.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./tmp/uploads");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "_" + file.originalname);
  },
});

const upload = multer({ storage });

router.post("/upload/avatar", authenticate, upload.single("file"), async (req, res) => {
  const result = await uploadAvatar(req.file);
  if (result.success) {
    res.json(success(result.data, result.message));
  } else {
    res.json(error(result.message));
  }
});

export default router;
