export function errorHandler(err, req, res, next) {
  console.error("Error:", err);
  const statusCode = err.statusCode || 500;
  const message = err.message || "服务器内部错误";

  res.status(statusCode).json({
    code: statusCode,
    message: process.env.NODE_ENV === "production" ? "服务器内部错误" : message,
    data: null,
  });
}

export function notFound(req, res, next) {
  res.status(404).json({
    code: 404,
    message: "接口不存在",
    data: null,
  });
}
