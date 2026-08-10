# [BookBunny 分级阅读功能锚定] Design Document

> 来源：刘小排 design_doc_template
> 日期：2026-08-10
> 关联：《真需求》方法论（true-demand-methodology）——"只有情绪价值、没有功能价值锚定的商品不犀利"；六个核桃案例：给"补脑"功能想象，才有确定性消费
> 定位变更：从"AI 绘本玩具（好玩）" → "AI 分级阅读助手（有用）"

## Current Context

- BookBunny（D:\BookBunny\）是 AI 儿童绘本创作工具：Next.js 15 (App Router) + Neon PostgreSQL + Drizzle ORM + OpenAI (FLUX 图生) + Cloudflare R2 + Creem 支付 + better-auth + Resend。核心卖点："character-consistent stories in minutes"——角色一致性绘本，几分钟生成一本。
- 现有流程：create-character（创建角色，支持照片转角色）→ create-story（生成故事）→ generate-pages（生成页面）→ export-pdf / export-video（导出 PDF/视频，KDP-ready）。
- 定价：Starter 免费（3 页预览 / 1 角色 / 基础故事）/ Pro $9.99/月（无限书 / 照片转角色 / 20 页 / KDP-ready PDF / 全部画风）/ Commercial $49/月（商用版权 / 多角色 / 视频导出）。
- 现有页面：app/（landing）、app/create（创作流）、app/book（阅读页）、app/pricing、app/admin（管理后台）、app/api（auth/create-character/create-story/generate-pages/export-pdf/export-video/payments/cron-daily-digest）。
- 痛点/差距（按《真需求》诊断）：
  1. **卖点是"好玩"，功能锚定缺失**。当前定位 "AI children's book creator" = 创作工具（愉悦感），家长用完一次"哇"之后就走了，没有"为什么必须继续用"的确定性理由。书里警告：纯情绪价值无功能锚定 = 貂丁死法，脆弱。
  2. **没有"分级阅读"认知**。生成的绘本不考虑孩子的阅读水平——同一本书 3 岁和 8 岁都能看，等于谁都不精准。海外家长/老师对分级阅读（Lexile/GRL）有强认知，这是"功能想象"的天然锚点（类比六个核桃"补脑"）。
  3. **没有教育结果承诺**。家长付费心理账户是"教育投资"（$9.99/月），不是"娱乐消费"（$2.99 一个玩具）。当前产品没有告诉家长"你的孩子读了这本书会获得什么"。
  4. **留存无抓手**。一次性生成体验，没有"孩子阅读水平成长路径"——没有"从 Level A 读到 Level C"的进度感，用户没有回来的理由。

## Requirements

### Functional Requirements

1. **分级阅读生成（核心）**：创作流程新增"阅读水平选择"——按年龄（3-4/5-6/7-8/9-10）或 GRL 分级（A-Z）选择目标水平。AI 生成故事时严格匹配该水平的词汇量、句子长度、句式复杂度。
2. **分级词汇控制**：每级维护核心词表约束——生成 prompt 中注入"仅使用 Level X 高频词表 + 短句（≤8 词/句）"，生成后做词汇校验（超纲词自动替换或提示）。
3. **分级标注**：每本书详情页显示 Level 标签（如 "GRL C · 适合 5-6 岁"）+ 阅读目标说明（"读完掌握 40 个高频词"）。
4. **阅读理解 Quiz（教育锚点）**：每本书生成 3-5 道 comprehension questions（配答案），家长可打印/在线作答。这是"有用"的最强信号——老师/家长能看到可量化的学习动作。
5. **家长进度面板（留存抓手）**：新增"阅读成长"页面——孩子已读 N 本（Level 分布）、掌握词汇量、建议下一本的水平。从"生成工具"变成"成长路径"。
6. **定价/卖点更新**：Pro 页卖点从 "Unlimited books / Photo-to-character" 升级为 "分级阅读 · 按孩子水平精准匹配 + 阅读理解题 + 成长追踪"；Landing 页主标题从 "Create stories" 改为 "分级阅读绘本，匹配你孩子的阅读水平"。

### Non-Functional Requirements

- **性能**：分级词汇校验 < 2s/页（本地词表 + 正则，不走 LLM）；Quiz 生成复用现有 generate-pages 的 LLM 管线。
- **可扩展**：分级体系用配置表（grl_levels.json），新增级别不动代码；词表可扩展（后续支持西班牙语等）。
- **可观测**：按 Level 分布生成量、Quiz 完成率、家长面板留存（周回访）3 个核心指标。
- **安全**：分级词表不引入外部依赖；Quiz 内容不涉及隐私；儿童数据最小化（只存 Level 和阅读数，不存姓名照片）。
- **成本**：分级约束主要在 prompt 层面（不额外调用），Quiz 每本 +1 次 LLM 调用（可接受，Pro 已付费）。

## Design Decisions

### 1. 分级体系选型：GRL (A-Z) 为主 + 年龄映射

Will implement GRL（Guided Reading Level A-Z）为主分级体系 because:
- 海外家长/老师（目标用户）对 GRL 认知度最高（美国小学通用），A-Z 直观（"我孩子现在 C，目标 E"），比 Lexile 数字（BR-200L）对家长更友好。
- 每级有成熟的语言特征描述（词汇/句式/篇幅），可直接转成生成约束，不靠猜。
- Alternatives considered：Lexile（精确但家长无感）、AR（学校授权体系，商业化有壁垒）、年龄分段（太粗，无法体现"分级"的专业感）。
- 折中：UI 上同时显示"适合年龄"便于快速选择，内部用 GRL 约束生成。

### 2. 分级词汇控制：prompt 约束 + 本地词表校验，不引入新依赖

Will implement 双层控制（prompt 注入 + 生成后校验）because:
- 单靠 prompt 约束不保证（LLM 会超纲），单靠校验替换会破坏文意——双层配合：prompt 尽量约束，校验兜底。
- 词表用开源高频词表（Dolch 词表 + GRL 级词汇特征），本地 JSON 存储，零外部 API 依赖。
- 校验策略：超纲词 < 5% 则保留（低龄段不苛求）；超纲词 ≥ 5% 则二次生成或降级标注"推荐 Level +1"。
- Alternatives considered：全 LLM 后处理（成本翻倍）、只 prompt 不校验（不可控）。

### 3. Quiz：复用现有 LLM 管线，新增 1 次调用

Will implement Quiz 在 generate-pages 完成后调用（story 全文 + Level 约束 → 3-5 题 JSON）because:
- 复用现有 OpenAI client 与结构化输出模式（generate-pages 已用），零新架构。
- Quiz 是"有用"定位的信任状——没有 Quiz，分级只是标签；有 Quiz，家长/老师能看到"学习动作"。
- 存储：book 表新增 quiz jsonb 字段，页面渲染即用。

### 4. 家长面板：先做"极简版"，不做社交

Will implement 家长面板只含 3 块（已读书单 + Level 分布 + 建议下一步），不做排行/分享/社区 because:
- 验证"成长路径"是否驱动留存，先最小可用；社交功能是另一个产品，会分散锚定。
- 面板数据从现有 book 表聚合（authorId + level + createdAt），零新表。

## Technical Design

### 1. Core Components

```typescript
// lib/reading-levels.ts — 分级体系（新增）
export interface ReadingLevel {
  grl: string            // 'A' | 'B' | ... | 'Z'
  ageRange: string       // '3-4' | '5-6' | ...
  wordLimit: number      // 每页词数上限
  sentenceMaxWords: number // 单句最长词数
  vocabulary: string[]   // 高频词表（Dolch 级）
  description: string    // 家长可读描述
}
export const READING_LEVELS: ReadingLevel[] = [...]  // 从 grl_levels.json 加载

export function pickLevel(ageOrGrl: string): ReadingLevel
export function validateVocabulary(text: string, level: ReadingLevel): {
  overLevelWords: string[], ratio: number, passed: boolean
}

// lib/quiz-generator.ts — 阅读理解题（新增）
export async function generateQuiz(story: string, level: ReadingLevel): Promise<Quiz>
// 输出 { questions: [{ q, options: string[3], answer: number, skill: 'literal'|'inference'|'vocabulary' }] }

// lib/parent-panel.ts — 家长面板聚合（新增）
export async function getReadingProgress(userId: string): Promise<{
  booksRead: number, levelDistribution: Record<string, number>,
  totalWordsLearned: number, nextLevel: string | null
}>
```

### 2. Data Models

```typescript
// db/schema/books.ts — 扩展
class Book {
  // 现有字段不变
  level: string          // GRL: 'A'...'Z'（新增）
  ageRange: string       // '5-6'（新增）
  quiz: Quiz | null      // jsonb（新增）
  wordCount: number      // 字数统计（新增，面板用）
}

// db/schema/reading-progress.ts — 新增（可选，先用 book 聚合则不需要）
class ReadingProgress {
  userId: string
  bookId: string
  level: string
  completedAt: string
  quizScore: number | null   // Quiz 完成得分
}
// 决策：Phase 1 不加此表，用 book 表 authorId+level 聚合；Phase 2 若做"读完打卡"再加
```

### 3. Integration Points

- **数据流**：create-story（扩展：接收 level 参数，prompt 注入分级约束）→ generate-pages（扩展：页级词汇校验，超纲提示）→ 完成后 generateQuiz（1 次 LLM 调用）→ book 详情页渲染 Level 标签 + Quiz → 家长面板聚合。
- **API 契约**：`POST /api/create-story`（body 新增 level: 'C'）；`GET /api/books/:id/quiz`（返回 Quiz）；`GET /api/reading-progress`（家长面板数据）。
- **与现有模块关系**：复用 create-character、export-pdf、payments、auth 全部现有逻辑；仅 create-story、generate-pages、book 详情页、pricing、landing 五个点改造。

### 4. Files Changes

- **新增**：`lib/reading-levels.ts`、`lib/quiz-generator.ts`、`lib/parent-panel.ts`、`data/grl_levels.json`（分级词表配置）
- **修改**：`app/create/page.tsx`（新增 Level 选择器 UI）、`app/api/create-story/route.ts`（接收 level + prompt 注入）、`app/api/generate-pages/route.ts`（词汇校验）、`app/book/[id]/page.tsx`（Level 标签 + Quiz 渲染）、`app/pricing/page.tsx`（卖点更新）、`app/page.tsx`（landing 主标题 + 卖点）、`lib/db/schema.ts`（book 表新增字段）
- **不动**：auth、payments、export-pdf/export-video、admin 后台、R2 存储

## Implementation Plan

1. **Phase 1：分级生成（2-3 天）**
   - grl_levels.json + lib/reading-levels.ts（A-E 先做 5 级，覆盖 3-8 岁主战场）
   - create-story 接收 level + prompt 注入分级约束（词汇/句长/篇幅）
   - generate-pages 页级词汇校验（validateVocabulary）
   - 预期：选定 Level 后生成的绘本词汇/句长符合分级

2. **Phase 2：Quiz + 标注（2 天）**
   - lib/quiz-generator.ts + book 表 quiz 字段
   - book 详情页渲染 Level 标签 + Quiz 作答/打印
   - 预期：每本生成的书带 Level + 理解题，教育锚点落地

3. **Phase 3：家长面板 + 卖点（2 天）**
   - lib/parent-panel.ts + /api/reading-progress + 面板 UI（书单/Level 分布/建议下一本）
   - landing + pricing 卖点更新（"分级阅读 · 匹配孩子水平"）
   - 预期：从"生成工具"变成"成长路径"，留存有抓手

## Testing Strategy

### Unit Tests

- reading-levels：pickLevel 边界（年龄 5 与 6 交界、GRL 'E' 存在性）；validateVocabulary 构造超纲词样本断言 ratio/passed。
- quiz-generator：mock LLM 响应，断言输出 3-5 题、每题含 4 选项 + 答案索引、skill 字段合法。
- parent-panel：给定 book 集合，断言 levelDistribution 聚合正确、nextLevel 推荐逻辑（读完 3 本 C → 建议 D）。

### Integration Tests

- 场景：POST /api/create-story { age: 6, level: 'C' } → 断言生成故事含分级约束（句长 ≤ 8 词占比 > 80%）→ generate-pages 后 validateVocabulary passed → book 详情页出现 Level 标签 + Quiz。
- 环境：Neon 测试库 + mock OpenAI；数据：预置 3 个年龄段测试故事。

## Observability

### Logging

- 每次生成记录 level/词数/校验通过率（info）；词汇校验失败（warn，记录超纲词 Top10）。
- Quiz 生成成功/失败（info/error）。
- 家长面板访问量（info，聚合周活）。

### Metrics

- 分级生成分布（各 Level 占比）——健康：C/D/E 为主（5-7 岁主战场）
- 词汇校验通过率——目标 > 85%（低于则收紧 prompt 或放宽词表）
- Quiz 完成率（作答/曝光）——目标 > 30%（教育锚点是否被用）
- 家长面板周回访——目标 > 20%（留存抓手是否有效）

## Future Considerations

### Potential Enhancements

- 分级体系扩展：A-Z 全量 + Lexile 对照（进阶付费点）。
- 打印版 Quiz 工作纸（KDP 变现：分级绘本+练习册套装）。
- 老师模式：班级书单 + 进度报告（B2B 方向，Commercial 升级）。
- 多语言分级（西语/法语，词表本地化）。
- 分级语音朗读（LLM TTS，按 Level 语速）。
- 读完打卡 + 徽章（游戏化留存，Phase 2 面板成熟后）。

### Known Limitations

- Dolch 词表覆盖英语高频词但不含所有分级特征（句式复杂度靠 prompt 约束，校验只能查词不能查语法）。
- 低龄段（A/B 级）生成质量受限——词太少容易出怪句子，需人工抽检。
- Quiz 是生成式，可能有错误答案——Phase 2 需人工抽检 20% 样本校准。
- 家长面板 Phase 1 只聚合 book 表，已删除/未完成的书统计不准（可接受，验证期）。

## Dependencies

### Development Dependencies

- 现有：Next.js 15、Drizzle ORM、Neon、OpenAI client、Creem、better-auth、Resend
- 新增：无（分级词表为本地 JSON；Quiz 复用 OpenAI；面板复用现有 DB 查询）
- 测试：vitest（复用现有）

## Security Considerations

- **儿童数据最小化**：只存 Level/阅读数，不存姓名照片；Quiz 无个人信息。
- 认证：家长面板走现有 better-auth（仅本人可见）。
- 内容安全：分级绘本内容仍走现有内容审核链路（如有），Quiz 答案校验防注入。
- 成本防护：Quiz 调用限流（每本书仅生成一次，缓存于 quiz 字段）。

## Rollout Strategy

1. Development：Phase 1-3 本地开发 + Neon 测试库
2. Testing：单元 + 集成测试通过
3. Staging：部署 staging，用 5 个样本故事人工检查分级质量 + Quiz 准确率
4. Production：灰度——先给现有用户开分级生成（默认 C 级），观察生成质量与 Quiz 完成率
5. Monitoring：2 周盯分级分布 + Quiz 完成率 + 面板回访，达标后更新 landing/pricing 卖点

## References

- 《真需求》方法论（D:\gbrain-books\pages\zhenxuqiu.md + skill: true-demand-methodology）——"只有情绪价值、没有功能价值锚定不犀利"；六个核桃案例（功能想象驱动确定性消费）
- BookBunny 现状：package.json、app/ 目录结构、pricing 页面
- 分级阅读标准：GRL（Guided Reading Level，Fountas & Pinnell）、Dolch 高频词表——海外家长/老师通用认知
- 相关 skill：super-intern-workshop（产品开发流程）、no-crash-code（代码纪律）
