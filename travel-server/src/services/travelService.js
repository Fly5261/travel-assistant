import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import "dotenv/config";
class TravelService {
  constructor() {
    this.llm = null;
    this.initLLM();
  }
  initLLM() {
    const provider = process.env.MODEL_PROVIDER;
    if (!provider) {
      console.warn("未配置大模型供应商，AI功能将不可用");
      return;
    }
    let apikey, baseurl, modelname;
    if (provider === "QwenPlus") {
      apikey = process.env.QwenPlus_API_KEY;
      baseurl = process.env.QwenPlus_BASE_URL;
      modelname = process.env.QwenPlus_MODEL;
    } else {
      console.warn("不支持的大模型供应商:", provider);
      return;
    }
    if (!apikey || !baseurl || !modelname) {
      console.warn("大模型配置不完整");
      return;
    }
    this.llm = new ChatOpenAI({
      configuration: {
        baseURL: baseurl,
      },
      apiKey: apikey,
      model: modelname,
      temperature: 0.7,
      streaming: true,
    });
  }
  async recommend(city, budget, days) {
    if (!this.llm) {
      return { success: false, error: "大模型未配置，请联系管理员" };
    }
    if (budget < 100 || days < 1 || days > 30) {
      throw new Error("预算不能低于100元，天数必须在1-30天之间");
    }
    // 拿到提示词数据
    const message = this.getTravelPrompt(city, budget, days);
    // 判断接口调用大模型是否异常
    try {
      // 调用大模型生成推荐
      const response = await this.llm.invoke(message);
      console.log(response);
      // 获取大模型返回的内容
      const fullResponse = response.content || "";
      //   判断大模型返回的JSON格式是否正确
      try {
        const jsonMatch =
          fullResponse.match(/```json\n([\s\S]*?)\n```/) ||
          fullResponse.match(/```\n([\s\S]*?)\n```/) ||
          fullResponse.match(/\{[\s\S]*\}/);
        //   处理之后的数据
        const resData = JSON.parse(jsonMatch[1]);
        return resData;
      } catch (error) {
        return {
          success: false,
          error: "大模型返回的JSON格式错误",
          rawResponse: error.message,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
  getTravelPrompt(city, budget, days) {
    return [
      new HumanMessage(`你是一个专业的旅游规划师，擅长根据用户的需求生成详细的旅行行程。

请根据以下信息为用户生成一份详细的旅游规划：
- 目的地城市：${city}
- 预算：${budget}元
- 旅行天数：${days}天

要求：
1. 每天的行程安排（上午、下午、晚上）
2. 每个景点的详细介绍
3. 交通建议
4. 预算分配明细
5. 注意事项

请以JSON格式输出，结构如下：
{
  "city": "城市名",
  "days": 天数,
  "totalBudget": 总预算,
  "dailyItinerary": [
    { 
      "success": true,
      "day": 1,
      "date": "第1天",
      "morning": {
        "spot": "景点名称",
        "duration": "游览时长",
        "ticket": "门票价格",
        "transportation": "交通方式",
        "description": "景点介绍"
      },
      "afternoon": {
        "spot": "景点名称",
        "duration": "游览时长",
        "ticket": "门票价格",
        "transportation": "交通方式",
        "description": "景点介绍"
      },
      "evening": {
        "spot": "活动名称",
        "duration": "活动时长",
        "ticket": "费用",
        "transportation": "交通方式",
        "description": "活动介绍"
      }
    }
  ],
  "budgetBreakdown": {
    "accommodation": 住宿费用,
    "food": 餐饮费用,
    "transportation": 交通费用,
    "tickets": 门票费用,
    "other": 其他费用
  },
  "tips": ["提示1", "提示2", "提示3"],
  "warnings": ["注意事项1", "注意事项2"]
}

请确保JSON格式正确，可以被解析。`),
    ];
  }
  //   流式对话
  async chat(message, streamCallback) {
    if (!this.llm) {
      return { success: false, error: "大模型未配置，请联系管理员" };
    }
    // 组装参数
    const messages = [
      new SystemMessage(
        "你是一个专业的旅游规划师，请用中文回答用户关于旅游的问题",
      ),
      new HumanMessage(message),
    ];
    try {
      // 调用大模型流式输出
      const stream = await this.llm.stream(messages);
      let fullResponse = "";
      //     处理流式输出
      for await (const chunk of stream) {
        const content = chunk.content || "";
        // 如果返回的内容为空，跳过
        if (content.trim() === "") {
          continue;
        }
        fullResponse += content;
        if (streamCallback) {
          streamCallback(content);
        }
      }
      return {
        success: true,
        reply: fullResponse,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
export default new TravelService();
