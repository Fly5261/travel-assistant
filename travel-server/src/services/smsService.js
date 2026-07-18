import { createRequire } from "module";
import { Config } from "@alicloud/openapi-client";

const require = createRequire(import.meta.url);
const Dypns = require("@alicloud/dypnsapi20170525");

const ALI_ACCESS_KEY_ID = process.env.ALI_ACCESS_KEY_ID;
const ALI_ACCESS_KEY_SECRET = process.env.ALI_ACCESS_KEY_SECRET;
const ALI_SMS_SIGN_NAME = process.env.ALI_SMS_SIGN_NAME;
const ALI_SMS_TEMPLATE_CODE = process.env.ALI_SMS_TEMPLATE_CODE;

const HAS_ALI_CONFIG = ALI_ACCESS_KEY_ID && ALI_ACCESS_KEY_SECRET;

let client = null;

if (HAS_ALI_CONFIG) {
  const config = new Config({
    accessKeyId: ALI_ACCESS_KEY_ID,
    accessKeySecret: ALI_ACCESS_KEY_SECRET,
    endpoint: "dypnsapi.aliyuncs.com",
  });
  client = new Dypns.default(config);
}

export async function sendSmsCode(phone, code, scene = "login") {
  if (!HAS_ALI_CONFIG) {
    console.log(`[SMS Mock] ${scene} - Phone: ${phone}, Code: ${code}`);
    return { success: true, message: "验证码已发送（开发模式）", mock: true };
  }

  try {
    const request = new Dypns.SendSmsVerifyCodeRequest({
      phoneNumber: phone,
      signName: ALI_SMS_SIGN_NAME || "恒创联众",
      templateCode: ALI_SMS_TEMPLATE_CODE || "100001",
      templateParam: JSON.stringify({ code: code, min: "5" }),
      schemeName: "Default Scheme",
    });

    const response = await client.sendSmsVerifyCode(request);

    if (response.body.code === "OK") {
      return { success: true, message: "验证码已发送" };
    } else {
      console.error("SMS send failed:", response.body);
      return { success: false, message: response.body.message || "短信发送失败" };
    }
  } catch (error) {
    console.error("SMS send error:", error);
    return { success: false, message: "短信发送异常" };
  }
}

export async function checkSmsCode(phone, code) {
  if (!HAS_ALI_CONFIG) {
    return { success: true, message: "验证码验证成功（开发模式）", mock: true };
  }

  try {
    const request = new Dypns.CheckSmsVerifyCodeRequest({
      phoneNumber: phone,
      verifyCode: code,
    });

    const response = await client.checkSmsVerifyCode(request);

    if (response.body.code === "OK") {
      return { success: true, message: "验证码验证成功" };
    } else {
      console.error("SMS verify failed:", response.body);
      return { success: false, message: response.body.message || "验证码验证失败" };
    }
  } catch (error) {
    console.error("SMS verify error:", error);
    return { success: false, message: "验证码验证异常" };
  }
}

export function hasSmsConfig() {
  return HAS_ALI_CONFIG;
}
