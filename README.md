# ⏳ 时光胶囊 (Time Capsule)

> 完全数据本地化的个人数字记忆博物馆与藏书展阁。

## 📖 项目简介
「时光胶囊」是一个本地优先（Local-First）的个人多媒体展馆应用。
- **v0.1 当前版本**：专注于【个人藏书阁 (Books)】，支持精美书脊/封面海报流、阅读进度追踪、多维度评分、精彩书摘记录及深度长评。
- **未来规划**：无缝扩展至电影、游戏、动漫全品类；支持一键打包为原生 Windows 独立客户端 (.exe)。

---

## 🛠️ 技术架构
- **前端**：Vue 3 + Vite + Tailwind CSS + Lucide Icons + Pinia
- **后端**：Node.js + Express + SQLite3 (WAL 高性能并发模式)
- **多模型协同研发**：
  - 架构设计：Google Gemini Advanced (Paid)
  - 独立代码与安全审计：OpenAI GPT-6.1 (gpt-6-thinking)
  - 全栈代码执行与落地：Antigravity Agent
