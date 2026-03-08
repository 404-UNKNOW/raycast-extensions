# FlowCapture 🚀

**FlowCapture** 是一款专为资深研发极客设计的 Raycast 插件。它能将你随手复制的混乱聊天记录、会议摘要或灵感片段，通过 AI 神经中枢瞬间转化为结构化、标准化的 Linear 工单。

## ✨ 核心特性

- 🧠 **AI 神经中枢**：内置高级产品经理逻辑，自动提取标题、设定优先级并生成点列式 Markdown 文档。
- ⚡ **极致流转**：自动读取剪贴板内容，秒级生成草案，一键推送至 Linear。
- 🛠️ **微调纠错**：在正式推送前提供 Form 面板，赋予你最后的修改确认权。
- 🎨 **原生审美**：完全遵循 Apple Human Interface 设计规范，支持 Skeleton 加载与实时的 Toast 反馈。

## 🛠️ 配置指南

1. **Linear API Key**: 
   - 前往 [Linear Settings > API](https://linear.app/settings/api) 创建一个 Personal Access Token。
2. **LLM API Key**: 
   - 支持 OpenAI 兼容格式的接口 Key。
   - 默认使用 `gpt-4o-mini` 模型，兼顾速度与解析质量。

## ⌨️ 快捷键

| 快捷键 | 动作 |
| :--- | :--- |
| `Enter` | 同步至 Linear |
| `⌘ + R` | 重新触发 AI 解析剪贴板 |
| `⌘ + Shift + C` | 仅拷贝提炼后的 Markdown 内容 |
| `⌘ + Shift + ,` | 打开插件配置界面 |

## 📦 安装与运行

```bash
# 安装依赖
npm install

# 启动开发模式
npm run dev

# 静态检查
npm run lint

# 发布
npm run publish
```

---

*“让灵感落地，不再被杂讯打断。”* 由 **Dennis** 倾力打造。
