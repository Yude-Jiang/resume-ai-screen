# AI Resume Screening — 完整优化清单

> 综合 H / M / L 三轮评审，按优先级排列。共 24 项。

---

## P0 — 立即修复（安全 & 成本漏洞）

### 1. AI 接口加速率限制
- **来源**: H4
- **问题**: `/api/ai/*` 三个端点无鉴权，公网可白嫖 Gemini 配额
- **方案**: `express-rate-limit` 按 IP 限速；后续加 Firebase ID Token 校验
- **估时**: 0.5h

### 2. 收紧 Firestore 安全规则
- **来源**: H3
- **问题**: `read: if true` / `delete: if true` / `(... || true)` 短路使数据库公开可读写
- **方案**: 用 `isOwner()` 校验 `request.auth.uid == resource.data.ownerId`；删掉 `|| true` 短路；加注释说明 default-deny 语义
- **依赖**: 需先接入匿名 Auth（见 P1-7）
- **估时**: 1h（含规则 + 基本测试）

### 3. 服务端用 weights 重算 overall_score（防注入 + 可解释）
- **来源**: M3
- **问题**: 模型自由输出 `overall_score` 与 `detailed_scores` 不一致，HR 困惑；prompt 注入可操纵总分
- **方案**: `computed = Σ(detailed_scores[id] × weight / 100)`，`overall_score = Math.round(computed)`
- **估时**: 0.5h

### 4. 删除 JD 解析双跳调用
- **来源**: M6
- **问题**: `parseJdFile` 先抽文本再让 LLM "提取 JD 文本"，纯浪费 token
- **方案**: `pdf-parse`/`mammoth` 抽出直接 `setJd`，跳过 `/api/ai/generate`
- **估时**: 0.5h

### 5. 修复 SPA fallback 对 POST 的 404
- **来源**: M5
- **问题**: `app.get("*")` 只兜 GET，POST 到 `/api/x` 返回 HTML，前端 `json()` 报 SyntaxError
- **方案**: `app.use('/api/*', ...)` 返回 JSON 404，再 `app.get('*')` 兜 SPA
- **估时**: 0.2h

### 6. 删除 `(window as any).__clearAll` 调试入口
- **来源**: M1
- **问题**: 全局挂载清库函数，生产环境用户控制台可清空数据
- **方案**: 删除该行
- **估时**: 0.05h

### 7. 批量 toast 刷屏优化
- **来源**: L8
- **问题**: 100 份简历每个成功都弹 toast，刷屏
- **方案**: 只弹失败 toast + 末尾汇总 `{success} processed, {fail} failed`
- **估时**: 0.1h

---

## P1 — 1~2 迭代内完成（稳定性 / 可解释性 / 成本）

### 8. 接入 Firebase 匿名认证（替代 localStorage clientId）
- **来源**: H2
- **问题**: localStorage UUID 清缓存丢身份、可复制冒名、Rules 无法绑定 auth.uid
- **方案**: Firebase Console 开匿名登录 → `signInAnonymously(auth)` → 全局替换 `clientId` 为 `auth.currentUser.uid`
- **依赖**: 是 P0-2（收紧 Rules）的前提
- **估时**: 1.5h

### 9. 旋转 Firebase 凭证 + 清理 .gitignore
- **来源**: H1
- **问题**: `firebase-applet-config.json` commit 了真实 projectId + apiKey
- **方案**: 加入 `.gitignore`，提供 `.example` 模板；README 补配置说明
- **估时**: 0.3h

### 10. Prompt 注入轻量防护
- **来源**: M2
- **问题**: JD/简历文本直接拼入 prompt，可注入 "Ignore previous instructions"
- **方案**: `<resume>...</resume>` 包裹 + 截断 30k 字符 + 服务端校验 score 范围（P0-3 已覆盖）
- **估时**: 0.3h

### 11. 简历 PDF 迁移到 Firebase Storage
- **来源**: H5
- **问题**: base64 入 Firestore 有 1 MiB 硬限制 + 读成本高
- **方案**: `uploadBytes(storageRef, file)` → Firestore 只存 `file_url`；PdfViewer 按 URL 加载；老数据写迁移脚本
- **估时**: 1.5 人日

### 12. 减少全表 onSnapshot
- **来源**: M4
- **问题**: 两个无 `where` 的 onSnapshot 做 totalSystemStats，数据多了费钱
- **方案**: 移除 `totalSystemStats`，UI 用已有 `allResults.length` + `jobs.length`；或加 `where('ownerId', '==', clientId)`
- **估时**: 0.3h

### 13. 统一 metadata / title / favicon
- **来源**: L5
- **问题**: `<title>`、`metadata.json`、`favicon` 三处品牌名不一致
- **方案**: 统一为 "AI Resume Screening"；favicon 换成 `public/st-logo.svg`
- **估时**: 0.2h

### 14. 补全 README
- **来源**: M10
- **问题**: 当前是 AI Studio 默认模板
- **方案**: 架构图 + 本地启动 4 行 + 环境变量表 + 隐私声明 + License
- **估时**: 1h

### 15. 清理类型债
- **来源**: M7
- **问题**: 新旧两套类型并存（ScoringWeights/WeightConfig，Candidate/AnalysisResult）
- **方案**: 选定 AnalysisResult + 动态权重为唯一模型；修复 `Job.status | JobStatus` 自引用 bug
- **估时**: 1.5h

### 16. 国际化权重一致性
- **来源**: M8
- **问题**: 权重 label 在 DB 中英文硬编码，切语言时混杂
- **方案**: 标准 5 维度 DB 只存 id，UI 用 `t[idToKey[w.id]]` 查表
- **估时**: 1h

---

## P2 — 技术债清理（长期质量）

### 17. server.ts 加 body size limit + 错误中间件
- **来源**: M9
- **问题**: 无统一错误处理，生产异常泄露 stack trace
- **方案**: `express.json({ limit: '5mb' })` + 全局 error middleware
- **估时**: 0.5h

### 18. 结果页大组件拆分
- **来源**: L2
- **问题**: ResultsPage 459 行，塞了筛选/卡片/图表/override/分享
- **方案**: 拆 ResultsFilterBar、ResultCard、ScoreChart、HROverridePanel
- **估时**: 2.5h

### 19. 移除未使用依赖
- **来源**: L1
- **问题**: `@google/generative-ai`（旧 SDK）和重复 `vite`（deps + devDeps）
- **方案**: `npm uninstall @google/generative-ai`；vite 只留 devDependencies
- **估时**: 0.1h

### 20. 配好 `@/` 路径 alias
- **来源**: L4
- **问题**: tsconfig 配了 paths 但 vite 没配 alias
- **方案**: vite.config.ts 补 `resolve.alias`
- **估时**: 0.2h

### 21. AI Chat Widget 上下文窗口
- **来源**: L9
- **问题**: 每次对话独立，无历史上文
- **方案**: 保留最近 6 轮对话拼入 prompt
- **估时**: 0.5h

### 22. Firestore Rules 加注释
- **来源**: L6
- **问题**: 新人可能误认为 default-deny 是 fallthrough
- **方案**: 加一行注释说明"下方 match 覆盖此默认拒绝"
- **估时**: 0.02h

---

## P3 — 等条件成熟再做

### 23. base64 编码移到 Web Worker
- **来源**: L3
- **前提**: P1-11（Storage 迁移）做了此项自然消失
- **方案**: 不单独投入

### 24. PDF 解析器实例复用
- **来源**: L7
- **前提**: 压测确认 PDF 解析是瓶颈
- **方案**: 当前每次 `new PDFParse()` 开销可忽略，不改

---

## 汇总

| 优先级 | 数量 | 估时 |
|--------|------|------|
| P0 立即 | 7 项 | 2.7h |
| P1 迭代 | 9 项 | 2.6 人日 |
| P2 技术债 | 6 项 | 4.3h |
| P3 搁置 | 2 项 | — |
| **合计** | **24 项** | **~4 人日** |
