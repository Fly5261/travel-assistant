import { query, queryOne, execute } from "../config/db.js";

const validTypes = ["spot", "route", "guide"];

export async function getFavorites(
  userId,
  type = null,
  page = 1,
  pageSize = 10,
) {
  const pageNum = parseInt(page) || 1;
  const size = parseInt(pageSize) || 10;
  const offset = (pageNum - 1) * size;
  let sql = "SELECT * FROM favorites WHERE user_id = ?";
  const params = [userId];

  if (type && validTypes.includes(type)) {
    sql += " AND target_type = ?";
    params.push(type);
  }

  sql += ` ORDER BY created_at DESC LIMIT ${size} OFFSET ${offset}`;

  const rawList = await query(sql, params);
  const list = rawList.map((item) => ({
    id: item.id,
    targetType: item.target_type,
    targetId: item.target_id,
    title: item.target_title,
    cover: item.target_cover,
    createdAt: item.created_at,
    content: item.content ? JSON.parse(item.content) : null,
  }));

  const countSql = "SELECT COUNT(*) AS count FROM favorites WHERE user_id = ?";
  const countParams = [userId];
  if (type && validTypes.includes(type)) {
    countSql += " AND target_type = ?";
    countParams.push(type);
  }
  const countResult = await queryOne(countSql, countParams);

  return {
    success: true,
    data: {
      list,
      total: countResult?.count || 0,
      page,
      pageSize,
    },
  };
}

export async function addFavorite(
  userId,
  targetType,
  targetId,
  title,
  cover = null,
  content = null,
) {
  if (!validTypes.includes(targetType)) {
    return { success: false, message: "无效的目标类型" };
  }

  if (!targetId || !title) {
    return { success: false, message: "缺少必要参数" };
  }

  try {
    await execute(
      "INSERT INTO favorites (user_id, target_type, target_id, target_title, target_cover, content) VALUES (?, ?, ?, ?, ?, ?)",
      [userId, targetType, targetId, title, cover, content],
    );
    return { success: true, message: "收藏成功" };
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return { success: false, message: "已收藏" };
    }
    throw err;
  }
}

export async function removeFavorite(userId, favoriteId) {
  const favorite = await queryOne(
    "SELECT user_id FROM favorites WHERE id = ?",
    [favoriteId],
  );

  if (!favorite) {
    return { success: false, message: "收藏记录不存在" };
  }

  if (favorite.user_id !== userId) {
    return { success: false, message: "无权限操作" };
  }

  await execute("DELETE FROM favorites WHERE id = ?", [favoriteId]);

  return { success: true, message: "已取消收藏" };
}

export async function checkFavorite(userId, targetType, targetId) {
  if (!validTypes.includes(targetType)) {
    return { success: false, message: "无效的目标类型" };
  }

  const favorite = await queryOne(
    "SELECT id FROM favorites WHERE user_id = ? AND target_type = ? AND target_id = ?",
    [userId, targetType, targetId],
  );

  return {
    success: true,
    data: {
      isFavorite: !!favorite,
      favoriteId: favorite?.id || null,
    },
  };
}
