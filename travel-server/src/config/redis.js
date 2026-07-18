import { createClient } from "redis";

let client = null;
let isConnected = false;

export async function getRedisClient() {
  if (client && isConnected) {
    return client;
  }

  try {
    client = createClient({
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
    });

    await client.connect();
    isConnected = true;
    console.log("Redis connected successfully");
    return client;
  } catch (error) {
    console.warn("Redis connection failed, using memory fallback:", error.message);
    return null;
  }
}

export async function setRedisKey(key, value, ttl = null) {
  const redis = await getRedisClient();
  if (redis) {
    if (ttl) {
      await redis.set(key, value, { EX: ttl });
    } else {
      await redis.set(key, value);
    }
  }
}

export async function getRedisKey(key) {
  const redis = await getRedisClient();
  if (redis) {
    return await redis.get(key);
  }
  return null;
}

export async function delRedisKey(key) {
  const redis = await getRedisClient();
  if (redis) {
    await redis.del(key);
  }
}

const memoryStore = {};

export async function setKey(key, value, ttl = null) {
  await setRedisKey(key, value, ttl);
  memoryStore[key] = { value, expiresAt: ttl ? Date.now() + ttl * 1000 : null };
}

export async function getKey(key) {
  const value = await getRedisKey(key);
  if (value !== null) {
    return value;
  }
  const item = memoryStore[key];
  if (item && (!item.expiresAt || Date.now() < item.expiresAt)) {
    return item.value;
  }
  delete memoryStore[key];
  return null;
}

export async function delKey(key) {
  await delRedisKey(key);
  delete memoryStore[key];
}

export async function existsKey(key) {
  const value = await getKey(key);
  return value !== null;
}
