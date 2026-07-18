import { query, queryOne, execute } from "../config/db.js";

const validTypes = ["chat", "browse"];

export async function getHistory(userId, type = null, page = 1, pageSize = 10) {
  const offset = (page - 1) * pageSize;
  let sql = "SELECT * FROM history WHERE user_id = ?";
  const params = [userId];

  if (type && validTypes.includes(type)) {
    sql += " AND type = ?";
    params.push(type);
  }

  sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  params.push(pageSize, offset);

  const list = await query(sql, params);

  const countSql = "SELECT COUNT(*) AS count FROM history WHERE user_id = ?";
  const countParams = [userId];
  if (type && validTypes.includes(type)) {
    countSql += " AND type = ?";
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

export async function addHistory(userId, type, title, summary = null, relatedId = null) {
  if (!validTypes.includes(type)) {
    return { success: false, message: "无效的记录类型" };
  }

  if (!title) {
    return { success: false, message: "标题不能为空" };
  }

  if (summary && summary.length > 200) {
    return { success: false, message: "摘要不能超过200字" };
  }

  await execute(
    "INSERT INTO history (user_id, type, title, summary, related_id) VALUES (?, ?, ?, ?, ?)",
    [userId, type, title, summary, relatedId]
  );

  return { success: true, message: "记录成功" };
}

export async function deleteHistory(userId, historyId) {
  const history = await queryOne("SELECT user_id FROM history WHERE id = ?", [historyId]);

  if (!history) {
    return { success: false, message: "记录不存在" };
  }

  if (history.user_id !== userId) {
    return { success: false, message: "无权限操作" };
  }

  await execute("DELETE FROM history WHERE id = ?", [historyId]);

  return { success: true, message: "已删除" };
}

export async function clearHistory(userId) {
  await execute("DELETE FROM history WHERE user_id = ?", [userId]);
  return { success: true, message: "已清空" };
}
