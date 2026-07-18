import { queryOne, execute } from "../config/db.js";
import { maskPhone } from "../utils/jwt.js";

export async function getUserProfile(userId) {
  const user = await queryOne(`
    SELECT id, phone, nickname, avatar, gender, birthday, city, intro, created_at 
    FROM users WHERE id = ?
  `, [userId]);

  if (!user) {
    return { success: false, message: "用户不存在" };
  }

  const favoritesCount = await queryOne(
    "SELECT COUNT(*) AS count FROM favorites WHERE user_id = ?",
    [userId]
  );

  const historyCount = await queryOne(
    "SELECT COUNT(*) AS count FROM history WHERE user_id = ?",
    [userId]
  );

  user.phone = maskPhone(user.phone);

  return {
    success: true,
    data: {
      user,
      favoritesCount: favoritesCount?.count || 0,
      historyCount: historyCount?.count || 0,
    },
  };
}

export async function updateUserProfile(userId, data) {
  const updates = [];
  const params = [];

  if (data.nickname !== undefined) {
    const nickname = data.nickname.trim();
    if (!nickname || nickname.length < 2) {
      return { success: false, message: "昵称至少2个字符" };
    }
    if (nickname.length > 20) {
      return { success: false, message: "昵称最多20个字符" };
    }
    updates.push("nickname = ?");
    params.push(nickname);
  }

  if (data.gender !== undefined) {
    if (![0, 1, 2].includes(data.gender)) {
      return { success: false, message: "性别参数错误" };
    }
    updates.push("gender = ?");
    params.push(data.gender);
  }

  if (data.birthday !== undefined) {
    const birthday = new Date(data.birthday);
    if (isNaN(birthday.getTime())) {
      return { success: false, message: "生日格式错误" };
    }
    if (birthday > new Date()) {
      return { success: false, message: "生日不能是未来日期" };
    }
    updates.push("birthday = ?");
    params.push(data.birthday);
  }

  if (data.city !== undefined) {
    const city = data.city.trim();
    if (city.length > 50) {
      return { success: false, message: "城市名称过长" };
    }
    updates.push("city = ?");
    params.push(city);
  }

  if (data.intro !== undefined) {
    const intro = data.intro.trim();
    if (intro.length > 200) {
      return { success: false, message: "个人简介不能超过200字" };
    }
    updates.push("intro = ?");
    params.push(intro);
  }

  if (data.avatar !== undefined) {
    updates.push("avatar = ?");
    params.push(data.avatar);
  }

  if (updates.length === 0) {
    return { success: false, message: "没有需要更新的字段" };
  }

  params.push(userId);

  const updateResult = await execute(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, params);

  const updatedUser = await queryOne(`
    SELECT id, phone, nickname, avatar, gender, birthday, city, intro 
    FROM users WHERE id = ?
  `, [userId]);

  if (updatedUser) {
    updatedUser.phone = maskPhone(updatedUser.phone);
  }

  return {
    success: true,
    data: updatedUser,
    message: "更新成功",
  };
}
