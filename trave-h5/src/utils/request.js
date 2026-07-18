import axios from "axios";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:3300";

const request = axios.create({
  baseURL: `${apiBaseUrl}/api/travel`,
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let refreshSubscribers = [];

const onRefreshFinished = (newToken) => {
  refreshSubscribers.forEach((callback) => callback(newToken));
  refreshSubscribers = [];
};

const onRefreshFailed = () => {
  refreshSubscribers.forEach((callback) => callback(null));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (callback) => {
  refreshSubscribers.push(callback);
};

const refreshToken = async () => {
  const isLoggingOut = localStorage.getItem("isLoggingOut") === "true";
  if (isLoggingOut) {
    return null;
  }
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) {
    return null;
  }

  try {
    const response = await axios.post(
      `${apiBaseUrl}/api/travel/login/refresh`,
      {
        refreshToken,
      },
    );

    if (response.data.code === 200) {
      const data = response.data.data;
      const newAccessToken = data.token || data.accessToken;
      const newRefreshToken = data.refreshToken || refreshToken;
      const expiresIn = data.expiresIn || 7200;

      localStorage.setItem("accessToken", newAccessToken);
      localStorage.setItem("refreshToken", newRefreshToken);
      localStorage.setItem(
        "tokenExpireAt",
        String(Date.now() + expiresIn * 1000),
      );

      return newAccessToken;
    }
    return null;
  } catch (error) {
    return null;
  }
};

request.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

request.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          addRefreshSubscriber((newToken) => {
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              resolve(request(originalRequest));
            } else {
              reject(error);
            }
          });
        });
      }

      isRefreshing = true;
      originalRequest._retry = true;

      try {
        const newToken = await refreshToken();

        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          onRefreshFinished(newToken);
          return request(originalRequest);
        } else {
          onRefreshFailed();
          throw new Error("Token刷新失败");
        }
      } catch (refreshError) {
        onRefreshFailed();

        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("tokenExpireAt");
        localStorage.removeItem("user");
        localStorage.removeItem("isNewUser");

        if (typeof window !== "undefined") {
          const toast = document.createElement("div");
          toast.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            z-index: 9999;
            font-size: 14px;
            text-align: center;
          `;
          toast.textContent = "登录已过期，请重新登录";
          document.body.appendChild(toast);
          setTimeout(() => {
            toast.remove();
            window.location.href = "/#/login";
          }, 1500);
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response && error.response.data?.message) {
      error.message = error.response.data.message;
    }

    return Promise.reject(error);
  },
);

export function post(url, data, config = {}) {
  return request.post(url, data, config);
}

export function get(url, params) {
  return request.get(url, { params });
}

export function put(url, data) {
  return request.put(url, data);
}

export async function fetchStream(url, data, onChunk, OnComplete, OnError) {
  const controller = new AbortController();
  const accessToken = localStorage.getItem("accessToken");
  try {
    const response = await fetch(`${apiBaseUrl}/api/travel/${url}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
      body: JSON.stringify(data),
      signal: controller.signal,
    });

    if (response.status === 401) {
      const newToken = await refreshToken();
      if (!newToken) {
        OnError("登录已过期");
        return;
      }

      const retryResponse = await fetch(`${apiBaseUrl}/api/travel/${url}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${newToken}`,
        },
        body: JSON.stringify(data),
      });
      response.body = retryResponse.body;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let result = await reader.read();
    while (!result.done) {
      const chunk = decoder.decode(result.value, { stream: true });
      const lines = chunk.split("\n").filter((line) => line.trim());
      for (const line of lines) {
        try {
          if (line.startsWith("data:")) {
            const jsonStr = line.substring(6).trim();
            if (!jsonStr || jsonStr === "[DONE]") {
              if (jsonStr === "[DONE]") OnComplete();
              continue;
            }
            try {
              const jsonData = JSON.parse(jsonStr);
              if (jsonData.error) {
                OnError(jsonData.error);
              } else if (jsonData.done) {
                OnComplete();
              } else if (jsonData.type === "chunk") {
                onChunk(jsonData.data ?? jsonData.content ?? "");
              } else if (typeof jsonData === "string") {
                onChunk(jsonData);
              }
            } catch (jsonError) {
              console.warn("JSON解析失败，跳过该行:", jsonStr);
            }
          }
        } catch (error) {
          console.error("处理流式数据失败:", error);
        }
      }
      result = await reader.read();
    }
    OnComplete();
  } catch (error) {
    OnError(error.message);
  }
}
