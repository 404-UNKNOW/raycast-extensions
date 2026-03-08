import { getPreferenceValues, Clipboard, showToast, Toast } from "@raycast/api";

interface Preferences {
  llmApiKey: string;
}

export interface FormattedTicket {
  title: string;
  priority: "High" | "Medium" | "Low";
  markdownDescription: string;
}

/**
 * 核心大模型转化层：将混乱的输入（或剪贴板内容）转化为标准的 Ticket 结构
 * 采用原生 fetch 实现，追求极致轻量
 */
export async function formatTicketWithAI(
  manualInput?: string,
): Promise<FormattedTicket | null> {
  const preferences = getPreferenceValues<Preferences>();
  const apiKey = preferences.llmApiKey;

  if (!apiKey) {
    await showToast({
      style: Toast.Style.Failure,
      title: "缺少 LLM API Key",
      message: "请在插件设置中配置 LLM API Key",
    });
    return null;
  }

  // 1. 获取输入内容（优先使用手动输入，否则尝试剪贴板）
  let content = manualInput;
  if (!content) {
    const clipboardText = await Clipboard.readText();
    content = clipboardText || "";
  }

  if (!content || content.trim().length === 0) {
    await showToast({
      style: Toast.Style.Failure,
      title: "内容为空",
      message: "请输入内容或确保剪贴板中有文字",
    });
    return null;
  }

  const toast = await showToast({
    style: Toast.Style.Animated,
    title: "AI 神经中枢启动",
    message: "正在思考中...",
  });

  try {
    // 2. 原生 fetch 调用 OpenAI 兼容接口
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // 极致响应速度建议
        messages: [
          {
            role: "system",
            content:
              "你是一个高级软件产品经理，将下面这坨混乱文字提取提炼为一个极其标准的 Ticket 结构。只能返回含有下面属性的严格 JSON，且绝对不带有 Markdown 的包裹代码如 ```json：\n" +
              "- title (不超过十个字的抓人标题)\n" +
              "- priority (必须是 'High', 'Medium', 'Low' 之一)\n" +
              "- markdownDescription (包含有痛点和待办行动的点列式规范文档)",
          },
          {
            role: "user",
            content: content,
          },
        ],
        temperature: 0.3, // 降低随机性，保证结构稳定
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `API 响应错误: ${response.status} ${JSON.stringify(errorData)}`,
      );
    }

    const data = (await response.json()) as {
      choices: {
        message: {
          content: string;
        };
      }[];
    };
    const resultText = data.choices?.[0]?.message?.content;

    if (!resultText) {
      throw new Error("模型未返回有效内容");
    }

    // 3. 解析并验证 JSON
    // 过滤掉可能存在的 Markdown 代码块标签
    const cleanJson = resultText.replace(/```json|```/g, "").trim();
    const ticket = JSON.parse(cleanJson) as FormattedTicket;

    toast.style = Toast.Style.Success;
    toast.title = "思考完成";
    toast.message = "已成功提取结构化 Ticket";

    return ticket;
  } catch (error) {
    toast.style = Toast.Style.Failure;
    toast.title = "AI 转化失败";
    toast.message = error instanceof Error ? error.message : String(error);
    console.error("AI Formatter Error:", error);
    return null;
  }
}
