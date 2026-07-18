export function success(data = null, message = "操作成功") {
  return {
    code: 200,
    message,
    data,
  };
}

export function error(message = "操作失败", code = 400) {
  return {
    code,
    message,
    data: null,
  };
}

export function unauthorized(message = "未授权") {
  return {
    code: 401,
    message,
    data: null,
  };
}

export function forbidden(message = "无权限") {
  return {
    code: 403,
    message,
    data: null,
  };
}

export function notFound(message = "资源不存在") {
  return {
    code: 404,
    message,
    data: null,
  };
}
