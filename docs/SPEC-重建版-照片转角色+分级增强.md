# [BookBunny v2.0] 定位重建：从"分级阅读工具"到"My Kid is the Hero"

> 版本：2.0 ｜ 日期：2026-08-10
> 前身：SPEC-分级阅读-功能锚定.md（v1.0，六件套审查后判定定位漂移，作废）
> 审查依据：BookBunny-六件套对抗性审查.md（2026-08-10）
> 一句话：**用你孩子的脸，生成他/她自己的分级绘本。**

## 一、Current Context（现状与问题）

| 项 | 现状 | 问题 |
|----|------|------|
| 定位 | v1.0 改口"AI 分级阅读助手" | 正面硬刚 Epic!/Raz-Kids 正版库，必死战场 |
| 卖点 | 分级阅读锚定 | 方法论推出来的，零市场验证 |
| 技术 | 照片转角色 + FLUX + 分级生成 Phase 1 已通 | 优先级错位：词表功夫 > 图片一致性 |
| 留存 | 家长面板（计划中） | 空壳风险：词汇统计无数据支撑 |
| 技术债 | drizzle peer 冲突 --legacy-peer-deps | 部署/CI 必踩 |
| 市场 | KDP 内容工厂赚钱（DreamStories $6M） | 工具 SaaS 留存差，双轮没启动 |

**v1.0 的致命错误：把"功能锚定"当"需求验证"，拿创作工具去跟正版库竞争。**

## 二、Requirements（需求）

### 定位收敛（核心决策）

**放弃"分级阅读助手"主定位，回到"AI 绘本创作工具"，分级降级为增强功能。**

为什么这个定位能赢（正反合）：
- 正面：创作工具打的是"孩子是主角"的个性化战场——正版库（Epic!/Raz-Kids）做不了"你孩子的脸进故事"，ReadKidz 只能文字描述角色，你做照片转角色。这是三边都够不着的缝隙
- 反面：分级阅读主定位 = 跟 4 万本正版书比内容质量，AI 生成必输；跟 ReadKidz 比价格，它有先发优势
- 综合：**"照片转角色 + 分级匹配"组合 = 个性化（正版库不能）+ 教育锚点（纯创作工具不能）**

### Functional Requirements

| # | 功能 | 级别 | 说明 |
|---|------|------|------|
| F1 | 照片转角色（保真） | P0 | 已有基础，升级为"多参考图 + 固定 seed + 一致性评分自动重试" |
| F2 | 角色一致性管线 | P0 | FLUX 多图 conditioning + CLIP 相似度评分，<0.75 自动重生成（品类生死线） |
| F3 | 分级生成（增强） | P1 | 保留 v1.0 Phase 1 代码（grl_levels A-E + 词汇校验），加角色名 allowlist |
| F4 | 分级标注 | P1 | 书详情页 "GRL C · 适合 5-6 岁"（保留，但不作为首页主卖点） |
| F5 | Quiz（条件性） | P2 | 验证留存后才做；必须带失败处理（LLM 非法 JSON → 隐藏 Quiz，不给坏体验） |
| F6 | 家长面板（极简） | P2 | 只做已读书单 + 下一本建议；**砍掉"词汇量掌握"统计**（无数据支撑的空壳） |
| F7 | KDP 导出（出版双轮） | P1 | 已有 KDP-ready PDF，升级为"一键出版"引导 + 亚马逊 ISBN/尺寸校验 |

### Non-Functional Requirements

- 性能：生成全程 < 3 分钟/本（FLUX 20s/图 × 10 页 + 分级校验 <2s）
- 成本：单本 ≤ $0.7（现有 $0.67 达标）；图片重试计入成本上限（≤1 次重试/页）
- 可观测：注册→生成转化率、付费率、7 日留存、KDP 单本收入——4 个核心指标
- 儿童隐私：只存 Level 和阅读数，不存姓名照片（沿用 v1.0 红线）
- 合规：生成内容过滤（儿童安全），广告素材不夸大教育效果

## 三、Design Decisions（关键决策）

### D1. 定位：创作工具为主，分级为增强（见上）

### D2. 差异化公式：个性化 × 分级 × 出版

```
Epic!/Raz-Kids（正版库）  = 标准化 × 专业分级 × 无个性化
ReadKidz（创作工具）      = 可个性化 × 无分级 × 无照片转角色
BookBunny v2.0           = 照片级个性化 × 分级匹配 × KDP 出版双轮
```

### D3. 验证前置：Phase 0 关卡（六件套一致推荐，不可跳过）

**任何 Phase 1 开发之前，先过 2 周验证关：**

| 验证项 | 方法 | 通过线 | 不过怎么办 |
|--------|------|--------|-----------|
| 卖点验证 | Landing A/B：照片转角色 vs 分级阅读 vs AI 绘本 | 照片转角色转化 ≥ 2 倍其他 | 换卖点，不开发 |
| 付费意愿 | 5 个真实家长（3-8 岁）用 5 本书一周 | ≥3 个愿意付 $9.99 | 砍订阅，走 KDP 出版单轮 |
| 留存假设 | 家长周回访率 | 第 2 周 ≥30% | 不做家长面板（P2 砍掉） |

**Phase 0 不过 = 项目转向或暂停。这不是可选项。**

### D4. 图片一致性优先于一切新功能

ReadKidz 死在角色一致性（Trustpilot 1 星全是 character failed）。v2.0 把 F1/F2 排 P0，分级/Quiz/面板全部后置。**孩子长得不像 = 家长退款 = 产品死亡。**

### D5. 分级作为"增强"而非"卖点"

- 首页主卖点："Create stories starring YOUR child"
- 分级出现在生成流程第二步："Match your child's reading level (GRL A-E)"
- 不跟正版库比内容，只比"这本书是为你孩子量身定做的，而且难度刚好"

## 四、Technical Design（技术方案）

### 4.1 组件架构

```
app/create/
  ├── step1: 上传孩子照片（2-5 张）→ create-character（已有）
  ├── step2: 选择阅读级别（GRL A-E + 年龄映射）→ pickLevel（已有）
  ├── step3: 生成故事（DeepSeek + level 约束）→ create-story（已有）
  └── step4: 生成页面（FLUX）→ generate-pages
              └── 【新增】一致性评分：CLIP 相似度 ≥0.75，否则自动重试 1 次
              └── 【新增】角色名 allowlist 注入 validateVocabulary
app/book/ → 分级标注展示（已有）
app/export → KDP 一键出版引导（升级 F7）
```

### 4.2 关键实现（新增/修改）

```typescript
// lib/consistency.ts（新增，P0）
// 输入：参考图（角色）+ 生成图 → 输出：相似度分数
export async function scoreConsistency(reference: string[], generated: string): Promise<number>
// 阈值 0.75，低于则 regenerate（最多 1 次/页，计入成本上限）

// lib/reading-levels.ts（修改，P1）
// validateVocabulary 增加角色名参数：
export function validateVocabulary(text: string, level: ReadingLevel, allowlist: string[]): ...
// 角色名（Bunny/Dad/Mom）注入 allowlist，防误判超纲

// lib/quiz-generator.ts（修改，P2，条件性）
// 失败处理：LLM 返回非法 JSON → 重试 1 次 → 仍失败则隐藏 Quiz（不给坏体验）
// 绝不让 Quiz 错误阻断阅读页

// db/schema（修改）
// books 表：+ level, + consistency_score（P0 追踪）, + quiz jsonb（P2）
// 删除计划中的 reading-progress 表（词汇统计空壳，砍掉）
```

### 4.3 技术债修复（必须，P0）

| 债 | 修复 |
|----|------|
| drizzle-orm@0.38 vs better-auth 需 ^0.45 | 升级 drizzle 至 ^0.45+ 或锁 better-auth 1.6.25 精确版本，去掉 --legacy-peer-deps |
| 部署验证 | 修完后跑 npm ci && npm run build 干净通过 |

### 4.4 成本核算（单本 20 页）

| 项 | 单价 | 用量 | 成本 |
|----|------|------|------|
| FLUX 图 | $0.03/图 | 20 页 + 1 重试预算 | $0.60 |
| DeepSeek 故事+分级 | ~$0.005 | 1 | $0.005 |
| Quiz（P2） | +1 次 LLM | 1 | $0.01 |
| **合计** | | | **≤ $0.62/本** |

获客成本模型（新增，v1.0 缺失）：
- 家长场景 CPC $0.5-1.5（IG/TikTok 家长向内容）
- 目标 CAC 回收 < 60 天：付费率 ≥3% 时 CAC $1 → 回收 $9.99×0.7

## 五、Implementation Plan（实施计划）

```
Phase 0（第 1-2 周）验证关卡 —— 不过不开发
  D0: Landing A/B 三卖点（照片转角色 vs 分级 vs AI绘本）
  D3: 5 个真实家长试用 + 付费意愿访谈
  D7: 数据判决策：继续 / 转向 / 暂停

Phase 1（第 3-4 周）核心体验 —— 过了 Phase 0 才启动
  W1: 一致性评分管线（scoreConsistency + 自动重试）
  W2: 角色名 allowlist + 分级标注完善 + drizzle 技术债修复
  W3: 部署 + 4 指标埋点

Phase 2（第 5-6 周）双轮启动 —— 验证留存后
  W5: KDP 一键出版引导（尺寸/ISBN 校验）
  W6: 自出版 5 本书上 Amazon 实测（内容工厂路线）

Phase 3（待验证）增强功能
  Quiz（留存数据支持才做）+ 家长面板极简版
```

## 六、Testing（测试计划）

| 层 | 测试 | 通过标准 |
|----|------|---------|
| 一致性 | 同一角色 5 张参考图 × 10 次生成 | 相似度均值 ≥0.8，最差 ≥0.75 |
| 分级 | validateVocabulary 含角色名场景 | 角色名不误判超纲；原有 3 例回归通过 |
| Quiz（P2） | 非法 JSON 注入 | 隐藏 Quiz，阅读页不受影响 |
| 构建 | npm ci && npm run build | 干净通过（无 legacy-peer-deps） |
| 部署 | Vercel/Cloudflare 预发布 | 全路由 200 |

## 七、Observability（可观测性）

4 个生死指标（dashboard 常驻）：
1. 注册 → 生成转化率（≥30% 正常）
2. 免费 → Pro 付费率（≥3% 正常）
3. 7 日留存（≥20% 正常，<10% 警报）
4. KDP 单本月收入（双轮验证）

## 八、Future（未来方向）

- 多语言分级（词表扩展，西班牙语优先）
- 角色连续性系列书（孩子同一角色多本故事 → 真正的成长路径）
- 班级/老师场景（学校版，B2B）
- 全部以"验证留存"为前提，不做预建

## 九、Dependencies（依赖）

- FLUX via OpenRouter（现有）；DeepSeek（现有）；Neon（现有）
- CLIP 评分模型（新增：复用 /tmp/bb_test/ 已验证的 qwen3-vl 免费方案）
- Amazon KDP 上传（人工或 API，P2）

## 十、Security（安全）

- 儿童隐私红线（沿用）：不存姓名照片、只存 Level/阅读数
- 照片仅用于生成，不进入训练；生成图可删除（用户控制）
- 内容安全过滤（儿童友好词库 + 生成后审查）

## 十一、Rollout（发布）

1. Phase 0 验证 → 2. Phase 1 完成 → 3. 预发布（自家人 10 本书）→ 4. Product Hunt 发布（卖点：照片转角色 + 一致性）→ 5. KDP 内容工厂并行

## 十二、References

- 六件套审查报告（2026-08-10，Obsidian/GBrain 已存）
- v1.0 SPEC-分级阅读-功能锚定.md（已作废，保留为反面教材）
- ReadKidz 竞品拆解（2026-07-28）
- /tmp/bb_test/ 模型对比脚本（FLUX vs Nano Banana 一致性实测）
