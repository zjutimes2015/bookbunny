# 上线部署清单（SproutTales）

本文是上生产前的唯一检查表。代码本身已就绪的项会标注 ✅；需要人工在第三方后台完成的项标注 ⚠️。

---

## 1. 环境变量

完整清单与注释见根目录 [`.env.example`](../.env.example)。按重要性分三组：

### 必填（缺一即不可用）

| 变量 | 缺失后果 |
|---|---|
| `NEON_DATABASE_URL` | 所有页面/接口 500 |
| `SITE_URL` | OAuth 回调、邮件链接、canonical 全指向 localhost |
| `OPENROUTER_API_KEY` | 故事、角色、生图全部失败 |
| `ADMIN_EMAILS` | `/admin` 一律 404（fail-closed） |
| `TURNSTILE_SECRET_KEY` | 生产环境三个生成接口全部 403（fail-closed） |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | 无法登录 |
| `WAFFO_MERCHANT_ID` / `WAFFO_PRIVATE_KEY` | 无法收款 |
| `WAFFO_TEST_MODE=false` | 忘记设置会走**测试环境**收款（必须显式关闭） |

### 强烈建议

`RESEND_API_KEY`、`EMAIL_FROM`、`R2_*`（不配则图片以 base64 直传，PDF 与分享页会变慢）、`CRON_SECRET`、`NEXT_PUBLIC_TURNSTILE_SITE_KEY`、`NEXT_PUBLIC_GA_ID`。

### 可选

`CREEM_*`（旧支付通道）、`DISCORD_WEBHOOK_URL`、`NEXT_PUBLIC_CRISP_WEBSITE_ID`、`LEGAL_*`。

---

## 2. 数据库

新建库后，**按以下顺序**执行（每条都读 `.env.local` 里的 `NEON_DATABASE_URL`）：

```powershell
node scripts/setup-db.cjs                  # characters / stories / books
node scripts/setup-auth-tables.cjs         # bookbunny_users / auth_sessions
node scripts/migrate-story-outline.cjs     # stories.outline 等字段
node scripts/migrate-leveled-reading.cjs   # 分级阅读字段
node scripts/migrate-character-consistency.cjs
node scripts/migrate-parental-consent.cjs  # parental_consents
node scripts/migrate-payments.cjs          # payments
node scripts/migrate-generation-jobs.cjs   # generation_jobs / rate_limits
node scripts/migrate-billing-cycle.cjs     # billing_cycle（年付额度区分）
node scripts/migrate-allowance-rollover.cjs # allowance_rollover（50% 额度滚存）
```

⚠️ `rate_limits` 表缺失时限流会 fail-open（直接放行），务必确认第 8 条脚本执行成功。

⚠️ `allowance_rollover` 缺失会让所有创作请求 500（SELECT 报 column does not exist）。
`lib/allocation.ts` 里有一层运行时自愈兜底，但仍建议显式跑一次迁移脚本。

---

## 3. 第三方平台配置

- **Google OAuth**：授权回调地址填 `${SITE_URL}/api/auth/callback`，并把测试用户之外的域名加入已授权来源。
- **Cloudflare Turnstile**：站点 key → `NEXT_PUBLIC_TURNSTILE_SITE_KEY`，secret → `TURNSTILE_SECRET_KEY`；生产不要使用 `1x/2x/3x` 测试 key。
- **Waffo**：后台为 7 个套餐各建 Product，把 Product ID 填进 `WAFFO_*_PRODUCT_ID`；Webhook 地址填 `${SITE_URL}/api/payments/waffo-webhook`。
- **Cloudflare R2**：创建 bucket 并授予读写；若配置 `R2_PUBLIC_URL`，需给该域名配 CORS（否则客户端 PDF 导出取图失败）。
- **Resend**：验证发件域名，`EMAIL_FROM` 必须是已验证域下的地址。
- **定时任务**：用 cron-job.org 或 Vercel Cron 每天调用 `${SITE_URL}/api/cron/daily-digest?token=${CRON_SECRET}`。

---

## 4. 部署后冒烟（10 分钟）

0. **先查数据库**：`GET /api/health` → 必须返回 `{"ok":true}`。缺列时它会直接告诉你该跑哪个迁移脚本。
1. 打开 `/` → 首屏无 500，图片与字体正常加载。
2. 登录 → 右上角出现用户态；`/api/auth/me` 返回当前用户。
3. `/create`：加 1 个角色（不传照片）→ 生成大纲 → 试生成 4-5 页 → 保存 → 页面跳转 `/book/[id]`。
4. **人机校验**：新开无痕窗口，跳过前端直接 `POST /api/create-story`（不带 cookie、不带 token）→ 必须返回 `403 bot_check_required`。
5. **后台**：未登录访问 `/admin` → 404；用 `ADMIN_EMAILS` 里的邮箱登录后访问 → 能看到用户/书籍列表。
6. **支付**：用 Waffo 测试卡走一次 `creator_monthly` → `bookbunny_users` 的 `subscription_tier=creator`、`monthly_allowance_remaining=8`、`allowance_reset_at` 为下月 1 号。
7. **额度**：连续创建到 allowance 用尽 → 下一本返回 402（allowance 用尽）。
8. **导出**：`/create` 导出内页 PDF 与 KDP 封面，检查页数、书脊宽度、出血。
9. **删除链路**：调用 `DELETE /api/consent?include_content=1` → `books`/`stories` 与 R2 对象都被删除。
10. **套餐开关**：`GET /api/plans` → 每个套餐的 `purchasable` 必须与 Waffo 后台是否建好商品一致。

---

## 5. 已知边界（上线前请确认可接受）

- 后台是**邮箱白名单**，没有角色体系；人员在 `ADMIN_EMAILS` 里维护。
- 图片生成不直接扣额度，额度在「保存书籍」时扣减；成本由「人机校验 + 日限流」控制。
- 家长同意（COPPA）：`consent` 记录含时间戳/IP/UA，可按家长请求邮件提供；**没有自助导出审计报告**，safety 页文案已按此对齐。
- 账号注销尚未提供；删除链路只覆盖书籍、故事文本与已上传的插画对象。
- 限流表不可用时放行（fail-open），属可用性优先的取舍。
