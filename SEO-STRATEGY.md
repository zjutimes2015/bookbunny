# SproutTales SEO & GEO 策略文档

生成时间：2026-10-26（v2.0 — 已落地技术项）
项目：sprouttales.com
目标：让核心关键词进入 Google 首页，被 AI 搜索引擎引用，3 个月内获得稳定有机流量

---

## 一、购买意图关键词矩阵

### 🔴 Tier 1：立即可战的高意图词（已落地）
| 关键词 | 月搜索量估计 | 难度 | 意图 | 对应页面 | 优先级 |
|---|---|---|---|---|---|
| AI picture book generator | 中-高 | 中-高 | 交易型 | /ai-picture-book-generator + 首页 | P0 |
| AI storybook generator | 中 | 中 | 交易型 | /ai-picture-book-generator | P0 |
| make a children's book | 低-中 | 低 | 行动型 | /blog/how-to-make-a-childrens-book | P0 |
| personalized children's book | 中 | 中-高 | 交易型 | /personalized-childrens-books | P0 |
| amazon kdp picture book | 中 | 中 | 商业调研 | /ai-picture-book-generator | P1 |
| AI picture book generator free | 低 | 中 | 交易型 | /pricing（新增 layout metadata） | P1 |
| ai children book generator | 低-中 | 低 | 交易型 | 首页 | P1 |
| printable book template | 低 | 低 | 交易型 | 待建 /templates | P1 |

### 🟡 Tier 2：兴趣词 → 引导转化
| 关键词 | 趋势 | 用途 |
|---|---|---|
| how to make a children's book | Top Related 100% | 博客教程，内链到 /create |
| best AI picture book generator | AI Overview 覆盖 | 对比页扩展 |
| ai kids book | 5月峰值 100 | 博客季节性强推 |
| custom children's book | 持续上升 | 与 personalized 合并策略 |
| AI children book generator free | 稳定上升 | 定价页 FAQ 已覆盖 |

### 🟢 季节性排期（根据 Google Trends 实时数据）
| 月份 | 高峰词 | 峰值 | 行动 |
|---|---|---|---|
| 2-3月 | personalized children's book | 24 | 提前 1 个月发布专题 |
| 4-5月 | ai kids book | 100（历史最高） | 博客 + 社媒推送 |
| 5月 | make a children's book | 13.7 | 母亲节礼物场景 |
| 11-12月 | make a children's book | 20+ | 圣诞节专题落地页 |

### 关键词落位对照表（当前状态）
| 页面 | 主关键词 | 次关键词 | 交易词 |
|---|---|---|---|
| / | AI picture book generator | AI children book generator, consistent character AI illustration | free plan, no credit card |
| /ai-picture-book-generator | AI picture book generator | AI storybook generator, AI storybook maker | free, KDP picture book AI |
| /personalized-childrens-books | personalized children's book | custom kids book, personalized book with photo | gift, birthday |
| /pricing | AI picture book generator pricing | AI storybook generator free, children book generator cost | $29/mo, $79/mo, $55 |
| /blog/how-to-make-a-childrens-book | how to make a children's book | make a picture book, AI storybook tutorial | printable, KDP guide |
| /vs/readkidz | SproutTales vs ReadKidz | AI picture book generator comparison | ReadKidz alternative |

---

## 二、竞争格局分析

### SERP 首页结构（美国区实测）
**"make a children's book"**：
- Canva（+450% 飙升）→ 工具站霸榜
- HowStuffWorks → 权威媒体
- Education.com → 教育类
- 家庭创意博客 → 长尾内容

**"ai picture book generator"**：
- ReadKidz → 直接竞品（$99/mo Max 档，100k 计划额度）
- KDP Builder → 直接竞品
- Doodara/Magical Hekaya → 测评站
- Story Spark（$9.99/mo 起）→ 低价竞争者
- Childbook（childbook.ai）→ 9月 22,135 月访问量

**"personalized children's book"**：
- The Personalized Book Co → 定制书品牌
- CustomKidsBooks → 垂直站
- Amazon KDP 文章 → 交易型

### AI Overview 机会点
- "how to make a children's book" → 有 AI Overview → **需要把 SproutTales 嵌入解答步骤**
- "best ai picture book generator" → 有 AI Overview + PAA → **对比页有机会被引用**
- 建议：在 FAQ 和对比表里加入结构化数据，让 AI 能直接引用

---

## 三、已落地的技术 SEO/GEO 基建

### ✅ 3.1 爬虫与收录
| 项目 | 状态 | 说明 |
|---|---|---|
| `app/robots.ts` | ✅ | 放行 Googlebot / Bingbot / GPTBot / ClaudeBot / PerplexityBot / Google-Extended / Applebot-Extended / CCBot 等 14 个 AI 爬虫 |
| `app/sitemap.ts` | ✅ | 11 个可索引页面，含 lastModified / changeFrequency / priority |
| `/llms.txt` | ✅ | 动态生成（SITE_URL 跟随部署域），含定价表、差异化、页面索引 |
| `/llms-full.txt` | ✅ | GEO 深度版：Quick answers 区块直接回答 AI 常见提问 |
| `X-Robots-Tag` | ✅ | middleware 对 /create /progress /book/* /admin 注入 `noindex, nofollow, noarchive` |
| OG / Logo / Favicon | ✅ | 原本 100% 404（og-image / twitter-image / logo / apple-touch-icon / favicon 全部缺失），已由 `scripts/generate-og-images.cjs` 生成 |

### ✅ 3.2 结构化数据
| 页面 | Schema 类型 |
|---|---|
| 全站 | WebSite, Organization, SoftwareApplication（含 Free/Creator/Studio 三档 Offer） |
| / | FAQPage（5 问） |
| /pricing | FAQPage（6 问） |
| /ai-picture-book-generator | FAQPage |
| /personalized-childrens-books | FAQPage |
| /blog/how-to-make-a-childrens-book | Article + FAQPage |
| /vs/readkidz | FAQPage |

### ✅ 3.3 元数据卫生
- 修复 title template 重复后缀（原 "… | SproutTales | SproutTales"）
- 所有 title 长度控制在 60 字符内，description 控制在 160 字符内
- 首页 H1 从 "Turn an idea into a real picture book" 改为含主词的 "AI picture book generator for real storybooks"
- `max-image-preview: large` / `max-snippet: -1` 全站放开，让 Google 抓取完整摘要

### ⚠️ 3.4 待处理
- [ ] `/worlds` 与 `/worlds/[id]` 目前 `noindex`（20 个世界全是 draft 状态），发布后需改为可索引 —— 这是长尾词金矿
- [ ] 对比表用 HTML `<table>`（/pricing 已用，需检查 /vs/readkidz）
- [ ] 加入 `BreadcrumbList` schema

---

## 四、Google 官方政策红线

### 规模化内容滥用政策（Scaled Content Abuse）
> 来源：[Google Search Central](https://developers.google.com/search/docs/fundamentals/using-gen-ai-content)

**禁止行为：**
- ❌ 批量生成无价值的模板内容页面
- ❌ AI 生成内容未添加任何人工价值
- ❌ 只为排名而创建的"薄内容"页面

**合规要求：**
- ✅ 每篇内容必须有真实体验/经验声明
- ✅ 必须有真实截图、数据或案例
- ✅ 必须有作者信息和可验证来源
- ✅ 必须为真实用户解决问题，不是堆砌关键词

### E-E-A-T 要求
| 维度 | SproutTales 现状 | 改进动作 |
|---|---|---|
| Experience（经验） | 博客有 8 步实操教程 | 加"我们实际测试了 X 个工具" |
| Expertise（专业） | About 页有价值观 | 补创始人的出版/教育背景 |
| Authoritativeness（权威） | 暂无外链 | 联系 KDP 博客做客座文章 |
| Trustworthiness（可信） | 隐私政策 + COPPA 页面已有 | 加 Trustpilot / 真实用户评价 |

---

## 五、Semrush 收录操作指引

Semrush 的 Domain Overview / Keyword Tracker 依赖它自己的爬虫库，**不会**因为 Google 收录了站点就自动出现。需要主动提交。

### 5.1 第一步：创建 Semrush 项目
1. 登录 semrush.com → 左侧 `SEO` → `Site Audit`
2. `+ Create project`，填 `sprouttales.com`，项目名 `SproutTales`
3. 设置页面建议：
   - **Website**（全站爬取，< 1000 页）
   - Crawl accessibility：follow `robots.txt`
   - **Sitemap**：`https://sprouttales.com/sitemap.xml`
4. `Start Site Audit` → 会输出 140+ 项技术问题报告

### 5.2 第二步：让 Semrush 抓取全站
- Site Audit 跑完后，进入 `Crawlability` 过滤项，修复所有阻断项
- 重点确认：`/robots.txt` 未屏蔽 Semrush bot、`/sitemap.xml` 200 且 URL 格式正确
- Semrush 机器人 UA：`SemrushBot`（默认放行，无需额外配置）

### 5.3 第三步：手动触发 Domain Overview 刷新
- `SEO` → `Domain Overview` → 输入 `sprouttales.com` → `Overview` 标签
- 若提示 "domain not in database"，点击 `Add to Database` / `Request Data`
- 首次入库需要 1-3 天爬取周期，Semrush 会发邮件通知

### 5.4 第四步：关键词跟踪
- `SEO` → `Keyword Tracker` → `Create project`
- 地区选 `United States`、数据库选 `Google US`
- 导入本文件的 Tier 1 关键词表（8 个主词）
- 把 `sprouttales.com` 加入追踪，勾选 "Track position changes"

### 5.5 第五步：同步到 Google Search Console
Semrush 的 Site Audit 与 GSC 是双向的：
- GSC → `Sitemaps` → 提交 `https://sprouttales.com/sitemap.xml`
- GSC → `URL Inspection` → 对 11 个关键页面逐个 `Request Indexing`
- 在 GSC 验证域名后，Semrush Site Audit 也能导入 GSC 数据（更准的排名数据）

### 5.6 收录检查清单
- [ ] `https://sprouttales.com/robots.txt` 返回 200
- [ ] `https://sprouttales.com/sitemap.xml` 返回 200，URL 数量 = 11
- [ ] `https://sprouttales.com/llms.txt` 返回 200
- [ ] `https://sprouttales.com/llms-full.txt` 返回 200
- [ ] `https://sprouttales.com/og-image.png` 返回 200（否则社交分享无缩略图）
- [ ] GSC 已验证域名
- [ ] Semrush Site Audit 项目已创建并完成首次爬取
- [ ] Semrush Domain Overview 已显示 sprouttales.com

---

## 六、Phase 执行计划

### Phase 1：基础优化 ✅ 已完成
- [x] title 关键词前置 + 修复 template 重复后缀
- [x] 定价页改交易型标题
- [x] 补 FAQ schema（首页 + 定价页）
- [x] 创建 robots.txt + sitemap.xml
- [x] 补齐全部 OG/Logo/Favicon 资源
- [x] 修复 llms.txt（删除覆盖路由的静态文件，价格信息同步）
- [x] 新增 llms-full.txt
- [x] 私有页加 X-Robots-Tag noindex
- [ ] 提交 sitemap.xml 到 Google Search Console（需账号操作）

### Phase 2：内容扩张（第 2-6 周）
| 页面 | URL | 目标词 | 内容类型 | 字数目标 |
|---|---|---|---|---|
| 教程博客 | /blog/how-to-make-a-childrens-book | how to make a children's book | 8 步图文教程 | 2,000 字 |
| 案例页 | /cases/kdp-author-success | amazon kdp picture book | KDP 卖家真实案例 + 截图 | 1,500 字 |
| 对比页 | /vs/kdp-builder | ai picture book generator comparison | 扩展 vs 系列 | 1,200 字 |
| 落地页 | /personalized-childrens-books | personalized children's book | 礼物场景专页（母亲节/圣诞） | 1,000 字 |
| 模板页 | /templates | printable book template | 5-10 种模板预览 + 下载 CTA | 800 字 |
| 博客季节帖 | /blog/best-ai-childrens-book-gifts-2026 | personalized children's book | 节日礼物指南 | 1,500 字 |
| 世界库 | /worlds | kids story worlds, story world for kids | 20 个世界发布后开放 | 1,500 字 |

### Phase 3：GEO 优化（第 7-12 周）
- [x] `/llms.txt` + `/llms-full.txt` 双版本
- [x] FAQPage schema 覆盖首页/定价/AI 落地页/博客/对比页
- [x] 对比表用 HTML `<table>`（/pricing）
- [ ] 对比表用 HTML `<table>`（/vs/readkidz 需检查）
- [ ] 加 `BreadcrumbList` schema
- [ ] 加 Trustpilot / 真实用户评价 widget
- [ ] 发布「7 个 AI 儿童图书工具角色一致性评分」原创数据

### Phase 4：权威建立（第 4-12 月）
- [ ] 在 Reddit r/selfpublish、r/kdp 社区分享经验（不软广）
- [ ] 联系 KDP 博客做客座文章（1-2 篇/月）
- [ ] 参加 Product Hunt 发布
- [ ] 推动 Affiliate Program 推广者创建内容

---

## 七、关键成功指标（KPIs）

| 指标 | 基线 | 3 个月目标 | 6 个月目标 | 12 个月目标 |
|---|---|---|---|---|
| 有机搜索流量 | 待观察 | +50% | +150% | +300% |
| "/create" 页面的自然转化 | 待观察 | 提升 20% | 提升 50% | 提升 100% |
| 核心关键词排名（Top 10） | 待观察 | 3-5 个 | 8-10 个 | 15+ 个 |
| AI Overview 被引用次数 | 0 | 1-2 次 | 5+ 次 | 10+ 次 |
| 外部高质量外链 | 待观察 | 5+ | 15+ | 30+ |
| 索引页面数 | 0（本次上线 11） | 20+ | 35+ | 50+ |
| Semrush 收录关键词数 | 0 | 50+ | 150+ | 300+ |

---

## 八、风险与注意事项

### 风险 1：规模化内容滥用（Scaled Content Abuse）
**症状：** 突然大量新增页面但无质量，Google 可能惩罚整个站点
**应对：**
- 新页面必须先有真实内容，不能只加关键词
- 每篇博客必须有作者第一手经验声明
- 保持内容频率稳定（每周 1-2 篇），不要一次性发布 20 篇

### 风险 2：AI Overview 劫持
**症状：** 用户提问后直接看到 AI 回答，不再点击你的链接
**应对：**
- 让 AI Overview **引用你的内容**（结构化数据 + 可引用事实）
- 把 FAQ 做成可见文本，AI 更容易引用
- 在内容中加入独特数据点，成为 AI 引用的"权威来源"

### 风险 3：季节性流量波动
**症状：** 3-5 月流量高，其他月份下滑
**应对：**
- 提前 1 个月发布季节内容
- 建立常青内容（教程类）平衡流量波动
- 用邮件列表在淡季激活老用户

---

## 九、资源需求

| 项目 | 时间投入 | 备注 |
|---|---|---|
| 博客文章撰写 | 4-6 小时/篇 | 需要真实测试 + 截图 |
| SEO 优化 | 2 小时/篇 | Meta 标签 + 结构化数据 |
| 外链建设 | 8-12 小时/月 | 客座文章 + 社区参与 |
| 数据分析 | 2 小时/周 | 追踪关键词排名和流量 |
| 月度总计 | 约 20-30 小时 | 可由创始人兼任 |

---

## 十、参考来源

- [Google Search Central — Scaled Content Abuse Policy](https://developers.google.com/search/docs/fundamentals/using-gen-ai-content)
- [Google Search Central — EEAT Guidelines](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- [Google Trends — Real-time 关键词趋势数据](https://trends.google.com)
- [Semrush — Domain Overview 工具说明](https://www.semrush.com/kb/254-domain-overview)
- [Semrush — 如何提交网站到搜索引擎](https://www.semrush.com/blog/submit-to-search-engines/)
- [Semrush — Keyword Difficulty & Volume Tool](https://www.semrush.com/free-tools/keyword-search-volume-checker/)
- [Rank.ai — GEO 2026 指南：AI 爬虫白名单与 llms.txt](https://www.rank.ai/blog/what-is-generative-engine-optimization)
- [ReadKidz — Best AI Storybook Generators 2026](https://www.readkidz.com/blog/best-ai-storybook-generators-2026)
- [ReadKidz — Pricing（竞品价格锚点）](https://www.readkidz.com/pricing)
- [Story Spark — Best AI Platforms for Personalized Children's Storybooks](https://storyspark.ai/blog/best-ai-platforms-personalized-storybooks-children)
- [Doodara — Best AI Storybook Generator 2026 测评](https://www.doodara.com/en/blog/best-ai-storybook-generator-2026)
- [Magical Hekaya — 8 Tools Tested & Compared 2026](https://magicalhekaya.com/blog/best-ai-storybook-makers-2026-tested-compared)

---

*文档版本：v2.0 | 下次更新：2026-11-26*
