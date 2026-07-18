import { ref } from "vue";
import { post, get, put } from "../utils/request";
import guestAvatar from "../assets/wsdr.png";

const user = ref(JSON.parse(localStorage.getItem("user") || "null"));
const accessToken = ref(localStorage.getItem("accessToken") || "");
const refreshToken = ref(localStorage.getItem("refreshToken") || "");
const tokenExpireAt = ref(
  parseInt(localStorage.getItem("tokenExpireAt") || "0"),
);
const isNewUser = ref(localStorage.getItem("isNewUser") === "true");
const isLoggingOut = ref(false);

export function useAuth() {
  const isLoggedIn = () => !!accessToken.value;

  const isGuest = () => user.value?.role === "guest";

  const isTokenExpired = () => {
    if (!tokenExpireAt.value) return false;
    return Date.now() > tokenExpireAt.value;
  };

  const updateTokens = (tokens) => {
    accessToken.value = tokens.accessToken;
    refreshToken.value = tokens.refreshToken;
    tokenExpireAt.value = tokens.expireAt || Date.now() + 7200000;
    localStorage.setItem("accessToken", accessToken.value);
    localStorage.setItem("refreshToken", refreshToken.value);
    localStorage.setItem("tokenExpireAt", String(tokenExpireAt.value));
  };

  const login = async (credentials) => {
    try {
      const url = credentials.code ? "/login/sms" : "/login/password";
      const response = await post(url, credentials);
      if (response.code === 200) {
        const data = response.data;
        user.value = data.user;
        isNewUser.value = data.isNewUser || false;
        updateTokens({
          accessToken: data.token || data.accessToken,
          refreshToken: data.refreshToken || "",
          expireAt: data.expiresIn
            ? Date.now() + data.expiresIn * 1000
            : undefined,
        });
        localStorage.setItem("user", JSON.stringify(user.value));
        localStorage.setItem("isNewUser", String(isNewUser.value));
        return { success: true, data: response.data };
      }
      return { success: false, message: response.message || "登录失败" };
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "登录异常";
      return { success: false, message };
    }
  };

  const refreshTokenFn = async () => {
    if (!refreshToken.value) {
      return { success: false, message: "无刷新Token" };
    }
    try {
      const response = await post("/login/refresh", {
        refreshToken: refreshToken.value,
      });
      if (response.code === 200) {
        const data = response.data;
        updateTokens({
          accessToken: data.token || data.accessToken,
          refreshToken: data.refreshToken || refreshToken.value,
          expireAt: data.expiresIn
            ? Date.now() + data.expiresIn * 1000
            : undefined,
        });
        return { success: true, data: response.data };
      }
      return { success: false, message: response.message || "Token刷新失败" };
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "刷新失败";
      return { success: false, message };
    }
  };

  const sendSms = async (phone, scene = "login") => {
    try {
      const response = await post("/sms/send", { phone, scene });
      if (response.code === 200) {
        return { success: true, message: response.message || "验证码发送成功" };
      }
      return { success: false, message: response.message || "验证码发送失败" };
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "发送失败，请重试";
      return { success: false, message };
    }
  };

  const guestLogin = () => {
    const guestToken = "guest_token_" + Date.now();
    const guestUser = {
      id: "guest",
      name: "游客",
      role: "guest",
      phone: "13800000000",
      avatar: guestAvatar,
    };

    accessToken.value = guestToken;
    refreshToken.value = "";
    tokenExpireAt.value = 0;
    user.value = guestUser;
    isNewUser.value = false;
    localStorage.setItem("accessToken", guestToken);
    localStorage.setItem("refreshToken", "");
    localStorage.setItem("tokenExpireAt", "0");
    localStorage.setItem("user", JSON.stringify(guestUser));
    localStorage.setItem("isNewUser", "false");

    return { success: true, data: { token: guestToken, user: guestUser } };
  };

  const register = async (data) => {
    try {
      const response = await post("/register", data);
      if (response.code === 200) {
        const respData = response.data;
        user.value = respData.user;
        isNewUser.value = respData.isNewUser || false;
        updateTokens({
          accessToken: respData.token || respData.accessToken,
          refreshToken: respData.refreshToken || "",
          expireAt: respData.expiresIn
            ? Date.now() + respData.expiresIn * 1000
            : undefined,
        });
        localStorage.setItem("user", JSON.stringify(user.value));
        localStorage.setItem("isNewUser", String(isNewUser.value));
        return {
          success: true,
          data: respData,
          message: response.message || "注册成功",
        };
      }
      return { success: false, message: response.message || "注册失败" };
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "注册异常";
      return { success: false, message };
    }
  };

  const resetPassword = async (data) => {
    try {
      const response = await post("/password/reset", data);
      if (response.code === 200) {
        return { success: true, message: response.message || "密码重置成功" };
      }
      return { success: false, message: response.message || "密码重置失败" };
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "重置失败，请重试";
      return { success: false, message };
    }
  };

  const changePassword = async (data) => {
    try {
      const response = await post("/password/change", data);
      if (response.code === 200) {
        return { success: true, message: response.message || "密码修改成功" };
      }
      return { success: false, message: response.message || "密码修改失败" };
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "修改失败，请重试";
      return { success: false, message };
    }
  };

  const getUserProfile = async () => {
    try {
      const response = await get("/user/profile");
      if (response.code === 200) {
        const data = response.data;
        user.value = data.user || data;
        localStorage.setItem("user", JSON.stringify(user.value));
        return { success: true, data: response.data };
      }
      return {
        success: false,
        message: response.message || "获取用户信息失败",
      };
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "获取用户信息异常";
      return { success: false, message };
    }
  };

  const updateUserProfile = async (data) => {
    try {
      const response = await put("/user/profile", data);
      if (response.code === 200) {
        const userData = response.data?.user || response.data;
        if (userData) {
          user.value = userData;
          localStorage.setItem("user", JSON.stringify(user.value));
        }
        return { success: true, message: response.message || "更新成功" };
      }
      return { success: false, message: response.message || "更新失败" };
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "更新异常";
      return { success: false, message };
    }
  };

  const uploadAvatar = async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await post("/upload/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.code === 200) {
        return {
          success: true,
          data: response.data,
          message: response.message || "上传成功",
        };
      }
      return { success: false, message: response.message || "上传失败" };
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "上传异常";
      return { success: false, message };
    }
  };

  const logout = async () => {
    isLoggingOut.value = true;
    try {
      const currentRefreshToken = refreshToken.value;
      if (currentRefreshToken && !isGuest.value) {
        await post("/auth/logout", { refreshToken: currentRefreshToken }).catch(
          () => {},
        );
      }
    } finally {
      accessToken.value = "";
      refreshToken.value = "";
      tokenExpireAt.value = 0;
      user.value = null;
      isNewUser.value = false;
      isLoggingOut.value = false;
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("tokenExpireAt");
      localStorage.removeItem("user");
      localStorage.removeItem("isNewUser");
      localStorage.removeItem("loginRedirect");
    }
  };

  return {
    user,
    accessToken,
    refreshToken,
    tokenExpireAt,
    isNewUser,
    isLoggingOut,
    isLoggedIn,
    isGuest,
    isTokenExpired,
    refreshTokenFn,
    login,
    sendSms,
    guestLogin,
    register,
    resetPassword,
    changePassword,
    logout,
    getUserProfile,
    updateUserProfile,
    uploadAvatar,
  };
}
