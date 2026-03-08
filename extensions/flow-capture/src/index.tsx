import {
  Action,
  ActionPanel,
  Form,
  Icon,
  showToast,
  Toast,
  Detail,
  useNavigation,
  getPreferenceValues,
  openExtensionPreferences,
} from "@raycast/api";
import { useEffect, useState } from "react";
import { formatTicketWithAI, FormattedTicket } from "./utils/ai-formatter";
import { createLinearTask } from "./lib/linear";

interface Preferences {
  linearApiKey: string;
}

export default function Command() {
  const [isLoading, setIsLoading] = useState(true);
  const [ticket, setTicket] = useState<FormattedTicket | null>(null);
  const [titleError, setTitleError] = useState<string | undefined>();
  const { pop } = useNavigation();
  const preferences = getPreferenceValues<Preferences>();

  // 1. 初始化：自动提炼剪贴板
  useEffect(() => {
    async function initCapture() {
      try {
        const result = await formatTicketWithAI();
        if (result) {
          setTicket(result);
        }
      } catch (error) {
        // 错误已在 ai-formatter 中处理
      } finally {
        setIsLoading(false);
      }
    }
    initCapture();
  }, []);

  // 2. 提交逻辑：同步至 Linear
  async function handleSubmit(values: FormattedTicket) {
    if (!values.title) {
      setTitleError("标题不能为空");
      return;
    }

    const toast = await showToast({
      style: Toast.Style.Animated,
      title: "正在同步至 Linear...",
    });

    try {
      const priorityMap: Record<string, number> = {
        High: 2,
        Medium: 3,
        Low: 4,
      };

      const issue = await createLinearTask(preferences.linearApiKey, {
        title: values.title,
        description: values.markdownDescription,
        priority: priorityMap[values.priority] || 0,
      });

      toast.style = Toast.Style.Success;
      toast.title = "创建成功";
      toast.message = `已在 Linear 中创建 ${issue?.identifier}`;

      setTimeout(pop, 1500);
    } catch (error) {
      toast.style = Toast.Style.Failure;
      toast.title = "推送失败";
      toast.message =
        error instanceof Error
          ? error.message
          : "请检查 Linear API Key 是否正确";
    }
  }

  // 3. 加载占位视图
  if (isLoading) {
    return (
      <Detail
        isLoading={true}
        navigationTitle="FlowCapture: 正在提炼灵感..."
        markdown=""
      />
    );
  }

  // 4. 主交互表单
  return (
    <Form
      navigationTitle="FlowCapture: 确认工单内容"
      actions={
        <ActionPanel>
          <ActionPanel.Section title="核心动作">
            <Action.SubmitForm
              title="Push to Linear"
              icon={Icon.Cloud}
              onSubmit={handleSubmit}
            />
            <Action
              title="重新 AI 解析"
              icon={Icon.Repeat}
              onAction={() => {
                setIsLoading(true);
                formatTicketWithAI().then((res) => {
                  if (res) setTicket(res);
                  setIsLoading(false);
                });
              }}
              shortcut={{ modifiers: ["cmd"], key: "r" }}
            />
          </ActionPanel.Section>

          <ActionPanel.Section title="辅助功能">
            <Action.CopyToClipboard
              title="仅拷贝 Markdown 描述"
              content={ticket?.markdownDescription || ""}
              shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
            />
            <Action
              title="打开插件设置"
              icon={Icon.Gear}
              onAction={openExtensionPreferences}
              shortcut={{ modifiers: ["cmd", "shift"], key: "," }}
            />
          </ActionPanel.Section>
        </ActionPanel>
      }
    >
      <Form.Description text="💡 AI 已自动提炼，你可以微调后一键推送至 Linear。" />

      <Form.TextField
        id="title"
        title="标题"
        placeholder="任务核心标题"
        defaultValue={ticket?.title}
        error={titleError}
        onChange={() => setTitleError(undefined)}
      />

      <Form.Dropdown
        id="priority"
        title="优先级"
        defaultValue={ticket?.priority || "Medium"}
      >
        <Form.Dropdown.Item
          value="High"
          title="High / 紧急"
          icon={Icon.Circle}
        />
        <Form.Dropdown.Item
          value="Medium"
          title="Medium / 普通"
          icon={Icon.Circle}
        />
        <Form.Dropdown.Item value="Low" title="Low / 稍后" icon={Icon.Circle} />
      </Form.Dropdown>

      <Form.Separator />

      <Form.TextArea
        id="markdownDescription"
        title="详细描述"
        placeholder="由 AI 生成的点列式文档内容..."
        defaultValue={ticket?.markdownDescription}
        enableMarkdown
      />

      <Form.Description text="提示：按 ⌘+Enter 立即同步，⌘+R 重新解析剪贴板" />
    </Form>
  );
}
