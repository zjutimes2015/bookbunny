# [FEATURE] BookBunny 绘本动画化（Animated Book）Design Document

> 模板：刘小排 DESIGN_DOC（12节，每节必填）
> 日期：2026-08-04
> 定位：把现有"幻灯片式导出视频"升级为"AI 图生视频动画绘本"，复用已有角色一致性管线

## Current Context

**现有系统（BookBunny，Next.js 15 + Neon + R2 + Creem + better-auth）：**
- 角色管线：`create-character`（FLUX 定妆照 + refSeed）→ `generate-pages`（每页传参考图+固定 seed，保证角色一致）→ 绘本页（soft watercolor 水彩绘本风）
- 图片生成：OpenRouter FLUX（flux.2-flex），`lib/api/flux.ts` 封装，参考图+seed 机制已跑通
- 视频导出：`app/api/export-video` → `pdf-service/video.py`，**PIL 画纯色帧+文字 + FFmpeg 拼接，每页2秒静态帧**——幻灯片，无 AI 动画、无配音、无动态
- 异步模式：genId + 轮询（内存 Map store），符合 ai-media-generation-pipeline skill 的异步管线模式
- 存储：R2（lib/r2.ts，S3 presigner）
- 支付：Creem checkout/portal/webhook 已接入

**痛点：** 视频导出质量低（静态帧），与绘本本身（高质量 FLUX 插图）不匹配；无配音；无付费分层（动画版应是高阶 SKU）。

**可用资产（复用，不重写）：**
- ✅ FLUX 角色一致性管线（定妆照+seed+参考图）
- ✅ genId 异步轮询模式
- ✅ R2 存储 + Creem 支付
- ✅ 火山方舟 Seedance key（ark-0d30c9，doubao-seedance-2-5-260628，Bearer 认证，实测可用）
- ✅ ai-director-knowledge-base skill（图生视频提示词模板：多参/首尾帧/Seedance 中文）

## Requirements

### Functional Requirements
- FR1 绘本页 → 动画视频片段：每页已有插画 + 文案 → 图生视频（动态化，5-8秒/页）
- FR2 视频拼接：多片段 FFmpeg 合成完整绘本视频（转场淡入淡出）
- FR3 配音（可选增强）：绘本文案 TTS → 背景音轨 + 片段同步
- FR4 进度反馈：沿用 genId + 轮询，前端逐页显示"生成中/完成/失败"
- FR5 付费门槛：动画导出为付费功能（Creem 挡板），免费用户仍走旧导出
- FR6 失败重试：单页失败不阻塞整本，标记可重试

### Non-Functional Requirements
- 单本（10页）视频成本 ≤ $6（目标 $4-5）
- 单片段生成 ≤ 60s，整本异步 ≤ 10min
- 视频 1080p，单片段 ≤ 15s（视频模型硬限制），整本 ≤ 90s
- 视频 URL 24h 有效（Seedance TOS-Signed URL）→ 必须中转存 R2
- 生成失败率 >10% 时告警（参考有声书管线 5.9% 失败率经验）

## Design Decisions

### 1. 视频模型：火山方舟 Seedance 2.0（主） + fal.ai LTX-2（备）
采用 Seedance 因为：
- 已有 key（ark-0d30c9），Bearer 认证已跑通，无需新开户
- 成本 $0.056/秒（聚合平台比价，2026-08），5-8秒/页 → $0.28-0.45/页，10页 ≈ $3-4.5
- 原生音频支持（TTS 可后置）
- 备选 fal.ai LTX-2（$0.04-0.24/秒）——当 Seedance 质量不达标或 key 限额时切换
- 决策树：月动画量 <700 条走 API（永远 API，绘本量级达不到自部署盈亏平衡）

### 2. 架构：新增独立动画管线，不重写 export-video
- 旧 export-video（幻灯片）保留为免费版
- 新增 `animate-pages` API：图生视频异步任务
- 复用 genId+轮询模式，不引入新队列系统（当前量级内存 Map 够用）

### 3. 水彩绘本风视频标签（基于 ai-director-knowledge-base 改造）
BookBunny 实际风格是水彩绘本（非扁平风），按 skill 模板组装：
- Seedance 中文：`柔和水彩绘本风格，温暖色调，轻柔动画，儿童插画质感，画面柔和过渡`
- 英文（首尾帧）：`soft watercolor children's book illustration, gentle motion, warm colors, storybook quality, shallow depth of field`
- 约束：单片段 ≤15s、主色≤2、无文字闪烁

### 4. 配音：英文站用 OpenAI tts-1 / Gemini Flash（$0.7-1.05/本），首版可不做
- V1 只做画面动画（验证付费意愿）
- V2 加 TTS 配音（成本+$0.7-1.05/本，客单价可 +$5）

## Technical Design

### 1. Core Components

```
前端 (app/create/page.tsx)
  │ 点"生成动画视频" → POST /api/animate-pages {pages, characterImageB64, refSeed}
  ▼
app/api/animate-pages/route.ts        [新增] 异步任务：genId + 轮询
  │ 逐页：读插画图 → 组提示词 → 调 Seedance → 存 R2 → 更新状态
  ▼
lib/api/video.ts                      [新增] Seedance 调用封装
  ├─ generateClip(imageUrl, prompt, duration) → 视频URL(24h)
  └─ uploadToR2(clipUrl, bookId, pageIdx)    中转存储
  ▼
pdf-service/assemble_video.py         [新增/扩展 video.py] FFmpeg 拼接片段+转场+（V2:TTS音轨）
  ▼
R2 (视频成片) → 前端预览/下载（Creem 付费挡板）
```

### 2. Data Models

```typescript
// lib/api/video.ts 核心接口
interface ClipJob {
  genId: string
  bookId: string
  total: number
  completed: number
  status: 'running' | 'done' | 'error'
  clips: { index: number; status: 'pending'|'generating'|'done'|'error';
           videoUrl?: string; error?: string }[]
}

// Seedance 请求（火山方舟 ark.cn-beijing.volces.com/api/v3）
POST /contents/generations/tasks
{
  model: 'doubao-seedance-2-5-260628',
  content: [
    { type: 'image_url', image_url: { url: 'R2或临时URL' } },
    { type: 'text', text: '柔和水彩绘本风格，温暖色调，轻柔动画...' }
  ]
}
→ task_id → 轮询 GET /contents/generations/tasks/{task_id} → video_url (24h)
```

### 3. Integration Points
- OpenRouter FLUX：不变（图片已生成，动画化只读已生成图）
- R2：新增视频对象键 `books/{bookId}/clips/{pageIdx}.mp4` + `books/{bookId}/animated.mp4`
- Creem：动画导出按钮 → 检查订阅/额度 → 放行 API
- 火山方舟：新 .env 变量 `ARK_API_KEY`（ark- 开头，Bearer 认证，非 AK/SK）

### 4. Files Changes（仅这些文件）
```
新增:
  app/api/animate-pages/route.ts     图生视频异步 API（genId+轮询）
  lib/api/video.ts                   Seedance 封装 + R2 中转
  pdf-service/assemble_video.py      FFmpeg 片段拼接（转场）
修改:
  app/create/page.tsx                动画按钮 + 进度条 + 预览（付费挡板）
  app/api/export-video/route.ts      保留旧逻辑，付费用户走新管线（可选路由）
  .env.local                         加 ARK_API_KEY
不改:
  lib/api/flux.ts / generate-pages / create-character / Creem / R2 基础层
```

## Implementation Plan

1. **Phase 1（3天）核心动画管线**
   - D1: lib/api/video.ts（Seedance 调用 + R2 中转，curl 验证 Bearer 认证）
   - D2: app/api/animate-pages/route.ts（genId 异步 + 逐页生成）
   - D3: 前端按钮+进度条，单页动画手动验证质量

2. **Phase 2（2天）拼接与打磨**
   - D4: assemble_video.py（FFmpeg 拼接 + 淡入淡出转场 + 封面尾页）
   - D5: 10页整本跑通，成本实测（Seedance 账单核对）

3. **Phase 3（2天）生产加固**
   - D6: Creem 付费挡板 + 失败重试 + 单页失败隔离
   - D7: 部署验证（Vercel/自有服务器），R2 视频 URL 权限校验

## Testing Strategy

### Unit Tests
- video.ts：Seedance 响应解析（成功/失败/超时）、R2 中转（presign→put→公开读）
- animate-pages：genId 状态机（pending→generating→done/error）、单页失败不阻塞
- 提示词组装：水彩标签注入正确性（中英文两模式）

### Integration Tests
- 真实调 Seedance 生成 1 条 5s 片段（验证 key/模型 ID/URL 有效期）
- 2页小书端到端：create-character → generate-pages → animate-pages → 拼接 → 下载
- 付费挡板：未付费用户 API 返回 402，付费用户放行

## Observability

### Logging
- 每页生成：genId, pageIdx, model, 耗时, 成本估算, 状态
- Seedance task 轮询：task_id, 状态变化, 失败原因（结构化 JSON）
- 拼接：片段数, 总时长, 输出文件大小

### Metrics
- 单页成功率（阈值 90%，低于告警）——参考有声书 5.9% 失败率经验
- 单本平均成本（阈值 $6，超了切 LTX-2）
- 动画导出转化率（免费→付费动画的用户比例）
- 平均生成耗时（P95 < 10min）

## Future Considerations

### Potential Enhancements
- V2: TTS 配音（OpenAI tts-1/Gemini Flash）+ 音画同步
- V2: 风格切换（水彩/扁平/黏土——ai-director-knowledge-base 画风库直接调用）
- V2: 封面动态化 + 背景音乐库
- V3: 动画片段可单页重生成（编辑器模式）

### Known Limitations
- 单片段 ≤15s（Seedance 硬限制）→ 长文本页需拆分或降速
- 角色在动画中的一致性依赖 Seedance 对参考图的理解，无显式控制（开源 Animate 系可作后备）
- 内存 Map 任务存储：重启丢失，量级上来后换 Neon 表
- 水彩风格动画的动态幅度天然受限（柔和水彩=动作轻），适合"翻页动画+微动效"而非电影级运镜

## Dependencies

### Development Dependencies
- 火山方舟 SDK/API（Bearer key，模型 doubao-seedance-2-5-260628）
- FFmpeg（现有 video.py 已依赖，服务器需预装）
- 无新增 npm 包（fetch 原生调用）

### Runtime Dependencies
- R2 存储配额（视频 ~2-5MB/片段，10页 ≈ 30MB/本）
- OpenRouter（已有，图片侧不变）
- Creem（已有，付费挡板）

## Security

- ARK_API_KEY 只放 .env.local，不进 git、不进命令行参数
- Seedance 视频 URL 24h 过期 → R2 中转存储，生成 R2 presigned URL 给前端，期限控制
- R2 对象键按 bookId 隔离，越权访问校验（better-auth session）
- 付费挡板在 API 层强制（前端隐藏不够，API 必须验订阅）
- 输入校验：pages 数量 ≤ 20、文案长度 ≤ 200 字/页（防超时/防滥用烧钱）

## Rollout

- Phase 1 完成 → 内部生成 3 本测试书，人工验收动画质量（水彩风格是否保持）
- 灰度：先开放给 10% 付费用户（Vercel 路由或功能开关），收集转化率
- 全量：动画导出作为付费 SKU 上线（定价建议：现有电子书之上 +$10 或独立 $19.9）
- 回滚：功能开关关闭 → 前端隐藏按钮 + API 拒绝，无数据迁移（视频对象可留 R2）

## References

- `~/.hermes/skills/creative/ai-director-knowledge-base/SKILL.md` — 图生视频提示词模板/画风库
- `~/.hermes/skills/creative/ai-director-knowledge-base/references/toonflow-source-map.md` — 画风迁移方法
- `~/.hermes/skills/business/ai-media-generation-pipeline/references/video-generation.md` — Seedance/LTX 成本与调用细节
- Toonflow productionAgent 流水线（HBAI-Ltd/Toonflow-app）— 分镜数据模型参考

---

## 成本速算（验证可行性）

| 项 | 单价 | 10页/本 | 说明 |
|---|---|---|---|
| FLUX 插画 | $0.014-0.06/张 | $0.14-0.6 | 已有，不变 |
| Seedance 动画 | $0.056/秒 | $2.8-4.5（5-8s/页） | 主力成本 |
| TTS 配音（V2） | $0.7-1.05/本 | $0.7-1.05 | 首版不做 |
| **合计** | | **$3-5/本** | 动画版定价 $19.9 → 毛利 75-85% |

**结论：可行。** 动画版是 BookBunny 的合理高阶 SKU：成本 $3-5/本，复用全部现有管线，3天出 MVP（Phase 1），1周全量上线。
