# ST Resume AI Screener — 开发回顾与经验总结

> 2026-05-13 ~ 2026-05-15 | 从代码审查到生产部署的完整过程

---

## 一、项目时间线

| 阶段 | 内容 | 关键事件 |
|------|------|---------|
| **Day 1 上午** | 安全 & 架构 | AI 调用迁移到服务端、速率限制、pdf-parse 修复 |
| **Day 1 下午** | Cloud Run 部署 | Buildpacks 构建失败排查、`firebase-applet-config.json` git 泄露修复 |
| **Day 2 上午** | 性能优化 | Worker pool 并发、Firestore 改为服务端代理（大陆访问） |
| **Day 2 下午** | AI 语言 & 字体 | 中英双语一致化、字重体系重构（Bold→Semibold/Medium/Normal） |
| **Day 3** | UI 优化 | 雷达图、多人对比、面试官分享、侧栏紧凑化、盲筛闪屏修复 |
| **Day 3 晚间** | 文档 | 用户手册（中英双语，SVG 插画，打印优化） |

---

## 二、常见陷阱与解决方案

### 🔴 陷阱 1：pdf-parse 版本 API 变化

**问题**：`pdf-parse` v2.x 构造函数必须传 options，`getText()` 返回对象而非字符串

```typescript
// ❌ 错误
const parser = new PDFParse();        // 构造函数收到 undefined
await parser.load(buffer);
const text = await parser.getText();  // 返回 { text, pages, total }，非字符串

// ✅ 正确
const parser = new PDFParse({ data: buffer });
await parser.load();
const result = await parser.getText();
return result.text || "";
```

### 🔴 陷阱 2：Cloud Run Buildpacks 构建失败

**问题**：`tsc` 报 `Cannot find module '../../firebase-applet-config.json'`

**根因**：`tsconfig.json` 缺少 `resolveJsonModule: true`

**额外发现**：远程合并导致 `resolveJsonModule` 在 tsconfig 中出现 3 次重复，虽然构建通过但需清理。

### 🔴 陷阱 3：`@google/genai` SDK 版本兼容性

**问题**：SDK 内部报 `Cannot read properties of undefined (reading 'verbosity')`

**根因**：SDK v1.29.0 与 Cloud Run 的 Node.js 环境存在兼容问题

**解决**：弃用 SDK，直接调用 Gemini REST API（fetch + `x-goog-api-key` header）

### 🔴 陷阱 4：Firebase 配置泄露到 public repo

**问题**：`firebase-applet-config.json` 包含真实 projectId/apiKey 被提交到 GitHub

**解决**：
- `git filter-branch` 从全部历史中清除
- 加入 `.gitignore`
- 创建 `.example.json` 模板
- 前端改为 `import.meta.env.VITE_FIREBASE_*` 注入
- 最终改为服务端 proxy，前端完全不需 Firebase 配置

### 🔴 陷阱 5：`express.static` 缓存导致旧 JS 引用

**问题**：部署后浏览器加载旧 `index.html`，引用不存在的 `index-c5Uk6MDe.js`，白屏

**根因**：`express.static` 用自己的缓存头返回 `/`，绕过了 `app.get("*")` 的 `Cache-Control`

**解决**：
```javascript
app.use(express.static(distPath, {
  index: false,  // 禁止自动返回 index.html
  setHeaders: (res, filePath) => {
    if (filePath.includes('/assets/')) {
      res.set('Cache-Control', 'public, max-age=31536000, immutable');
    }
  },
}));
app.get('/', (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.sendFile(path.join(distPath, 'index.html'));
});
```

### 🟡 陷阱 6：CSS `filter: blur()` 泄漏溢出

**问题**：盲筛模式切换后，`blur-lg` 模糊效果污染到雷达图/AI 推荐区域

**根因**：CSS `filter: blur()` 不受 `overflow:hidden` 裁剪，视觉效果溢出容器

**解决**：移除 PdfViewer 上的 `blur-lg`，仅用半透明遮罩层（`bg-st-dark/85 backdrop-blur-md`）遮挡 PDF

### 🟡 陷阱 7：盲筛模式 DOM 闪烁

**问题**：切换盲筛时文本替换（"张三"→"Candidate #1"）触发 React 重渲染

**解决**：改用 CSS `filter: blur-sm` + `transition-all duration-500`，文本内容不变仅视觉模糊

### 🟡 陷阱 8：对比分析重复刷新

**问题**：`useEffect` 依赖 `results`，3 秒轮询每次触发 AI 重新生成对比

**解决**：用 `useRef` 记录选中候选人集合的 key，只在真正变更时重新请求

### 🟡 陷阱 9：Cloud Run 旧修订版本

**问题**：`deploy.sh` 中 `gcloud run services delete` + `--source` 部署，删除后构建失败导致服务不存在

**解决**：移除删除操作，用 `--set-build-env-vars` 触发新构建即可

---

## 三、架构决策

### ✅ 正确决策

| 决策 | 理由 |
|------|------|
| AI 调用服务端代理 | 消除 API Key 泄露，大陆可访问 |
| Firestore 改为服务端 proxy | 大陆浏览器不直连 `firestore.googleapis.com` |
| Gemini REST API（弃 SDK） | 避免 SDK 版本兼容问题，更稳定 |
| firebase-admin + ADC | Cloud Run 自动提供凭证，无需管理密钥文件 |
| 分步部署 + 日志排查 | `/health` 端点 + `gcloud run services logs read` 定位问题 |
| Worker pool 替代串行 | 4 并发 + Promise 链式领取，不阻塞 |
| Share tokens 独立集合 | `shares/{token}` 支持多面试官、独立撤销 |
| 雷达图替代柱状图 | 5 维可视化更直观，多人叠加对比一目了然 |

### ❌ 可改进决策

| 决策 | 问题 | 应如何做 |
|------|------|---------|
| 先删服务再部署 | 构建失败导致服务消失 | 不删除，直接覆盖部署 |
| `--build-env-vars` 传 Firebase 配置 | 前端改用服务端 proxy 后已不需要 | 及时清理 deploy.sh 中的冗余逻辑 |
| 全局 `font-bold` 改 `font-normal` | 一次改太多文件，容易出错 | 分批，先改 1 个文件验证效果 |

---

## 四、代码质量

### 👍 优点

- **TypeScript 全栈**：前后端类型统一，`tsc --noEmit` 无错误
- **单一数据源**：服务端统一操作 Firestore，前端无直连
- **错误处理完整**：每个 API 端点有 try-catch + 403/404 状态码
- **翻译系统覆盖**：50+ key，中英双语 UI + AI 输出同步切换
- **组件拆分清晰**：ResultCard、ScoreChart、PdfViewer、AiChatWidget 各司其职

### 👎 待改进

- **请求体积大**：base64 简历存在 Firestore，应迁移到 Storage
- **轮询开销**：3 秒轮询替代 Firestore 实时监听，高频时浪费带宽
- **无分页**：50 份简历一次性加载全部数据
- **无 Service Worker**：离线不可用
- **日志分散**：前端 `console.error` + 服务端 `console.log`，缺少统一日志系统
- **无 E2E 测试**：全靠手动验证

---

## 五、可优化方向（按优先级）

### P0 — 需尽快做
1. **简历存储迁移 Firebase Storage**：当前存 Firestore 有 1MB 文档限制，base64 编码浪费 33% 空间
2. **Service Account 最小权限**：当前 Cloud Run 用 `roles/datastore.user`，应裁剪到仅需的 Firestore 权限

### P1 — 下次迭代
3. **WebSocket/SSE 替代轮询**：减少 3 秒延迟和带宽
4. **分页加载**：结果页 >100 份时的性能
5. **错误边界 + 日志上报**：前端 ErrorBoundary 已有，缺少日志聚合
6. **CI/CD Pipeline**：GitHub Actions 自动构建 + 部署

### P2 — 长期
7. **国际化 i18n 框架**：当前手动维护 `translations.ts`，可迁移到 `react-i18next`
8. **JWT 鉴权**：当前 `x-client-id` 可伪造，接入简单 JWT 或 Firebase Anonymous Auth
9. **移动端适配**：当前仅桌面端优化
10. **A/B 测试框架**：对比不同 AI 模型的评分质量

---

## 六、部署检查清单

部署前逐项确认：

- [ ] `npm run build` 本地构建通过（`tsc --noEmit && vite build`）
- [ ] `npm run dev` 本地运行正常
- [ ] `.gitignore` 包含 `firebase-applet-config.json`、`.claude/`
- [ ] `deploy.sh` 中无冗余操作（如 `service delete`）
- [ ] Cloud Run 日志确认 `[Server] Firestore admin initialized`
- [ ] 浏览器打开无白屏（检查 Network 标签无 404）
- [ ] JD 分析、简历筛选、AI Chat 功能正常
- [ ] 中英文切换生效
- [ ] 盲筛模式无闪屏

---

## 七、关键命令速查

```bash
# 日志
gcloud run services logs read resume-ai-screen --region asia-east1 --limit 30

# 服务状态
gcloud run services describe resume-ai-screen --region asia-east1 --format="value(status.url)"

# 流量切换
gcloud run services update-traffic resume-ai-screen --region asia-east1 --to-latest

# Firestore rules
cd ~/resume-ai-screen && npm install && npx firebase deploy --only firestore:rules --project trendradar-485407
```

---

*文档生成于 2026-05-15 · 作者 Claude Code · 项目: st-resume-ai-screener*
