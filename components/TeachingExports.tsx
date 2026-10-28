'use client'

import { useState } from 'react'

type ExportType = 'vocabulary' | 'worksheet' | 'report'

interface TeachingExportsProps {
  bookId: string
  /** 付费档才有词汇表 / 讲义；GRL 报告所有登录用户可见 */
  isPaid: boolean
}

/**
 * 教学资料导出面板。
 *
 * 交付教师真正能用的东西：
 *   - 词汇表：这本书专属的词表，按 GRL 分成「达标词」和「超纲词」
 *   - 课堂讲义：填空题 + 教师答案，可直接打印
 *   - GRL 报告：可解释的四维评分
 */
export default function TeachingExports({ bookId, isPaid }: TeachingExportsProps) {
  const [busy, setBusy] = useState<ExportType | null>(null)
  const [error, setError] = useState<string | null>(null)

  const download = async (exportType: ExportType) => {
    setBusy(exportType)
    setError(null)
    try {
      const res = await fetch('/api/export-teaching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId, exportType }),
      })

      if (res.status === 401) {
        window.location.href = `/api/auth/google?next=/book/${bookId}`
        return
      }
      if (res.status === 403) {
        setError('Teaching exports are available on paid plans.')
        return
      }
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        setError(body?.error || 'Export failed')
        return
      }

      if (exportType === 'report') {
        const report = await res.json()
        openReport(report.report)
        return
      }

      const text = await res.text()
      const slug = (bookId || 'book').slice(0, 8)
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${slug}-${exportType}.txt`
      a.click()
      URL.revokeObjectURL(a.href)
    } catch {
      setError('Export failed')
    } finally {
      setBusy(null)
    }
  }

  const buttons: { type: ExportType; label: string; hint: string; paid: boolean }[] = [
    {
      type: 'vocabulary',
      label: 'Vocabulary list',
      hint: 'This book’s words, split into at-level and above-level',
      paid: true,
    },
    {
      type: 'worksheet',
      label: 'Classroom worksheet',
      hint: 'Fill-in-the-blank plus a teacher answer key',
      paid: true,
    },
    {
      type: 'report',
      label: 'GRL score report',
      hint: 'How well the text hits its reading level',
      paid: false,
    },
  ]

  return (
    <div className="apple-card p-6 mb-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#2D2D2D]">Teaching materials</h2>
          <p className="mt-0.5 text-xs text-[#8E8E93]">
            Everything below is generated from this book&apos;s actual text and reading level.
          </p>
        </div>
        <span className="rounded-full bg-[#FFF5EE] px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-[#FF6B8A] shrink-0">
          Teacher
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {buttons.map((b) => {
          const locked = b.paid && !isPaid
          return (
            <button
              key={b.type}
              onClick={() => download(b.type)}
              disabled={busy !== null || locked}
              className={`rounded-xl border px-4 py-3 text-left transition-all ${
                locked
                  ? 'border-[#F2F2F7] bg-[#FAFAFB] opacity-50 cursor-not-allowed'
                  : 'border-[#E5E5EA] bg-white hover:border-[#FF6B8A] hover:bg-[#FFF5EE] disabled:opacity-60'
              }`}
            >
              <p className="text-sm font-semibold text-[#2D2D2D]">
                {busy === b.type ? 'Preparing…' : locked ? '🔒 ' + b.label : '⬇ ' + b.label}
              </p>
              <p className="mt-0.5 text-[11px] text-[#8E8E93]">{b.hint}</p>
            </button>
          )
        })}
      </div>

      {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
      {!isPaid && (
        <p className="mt-3 text-[11px] text-[#8E8E93]">
          Vocabulary lists and classroom worksheets are part of the Creator plan and above.
        </p>
      )}
    </div>
  )
}

/** GRL 报告在新窗口打开，方便打印或另存 */
function openReport(report: {
  grl: string
  levelLabel: string
  overallScore: number
  overallVerdict: string
  summary: string
  dimensions: { name: string; actual: string | number; target: string | number; score: number }[]
  overLevelWords: string[]
}) {
  if (!report) return
  const rows = report.dimensions
    .map(
      (d) =>
        `<tr><td style="padding:6px 12px 6px 0;">${escapeHtml(d.name)}</td>` +
        `<td style="padding:6px 12px 6px 0;">${escapeHtml(String(d.actual))}</td>` +
        `<td style="padding:6px 12px 6px 0;">${escapeHtml(String(d.target))}</td>` +
        `<td style="padding:6px 0;text-align:right;font-weight:600;">${d.score}</td></tr>`,
    )
    .join('')

  const over = report.overLevelWords.length
    ? report.overLevelWords.join(', ')
    : 'None'

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>GRL report</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;color:#2D2D2D;margin:40px;line-height:1.5}
  h1{font-size:22px;margin:0 0 4px}
  .meta{color:#8E8E93;font-size:13px;margin-bottom:20px}
  .score{font-size:42px;font-weight:700}
  table{border-collapse:collapse;margin:20px 0;font-size:14px;width:100%;max-width:640px}
  td{border-bottom:1px solid #F2F2F7}
  .summary{background:#FAFAFB;border-radius:12px;padding:16px;margin:20px 0;max-width:640px;font-size:14px}
  .words{font-size:13px;color:#8E8E93;max-width:640px}
</style></head><body>
<h1>Reading level report</h1>
<p class="meta">${escapeHtml(report.levelLabel)} · overall score ${report.overallScore}/100 · verdict ${escapeHtml(report.overallVerdict)}</p>
<div class="score">${report.overallScore}</div>
<table><thead><tr><td style="padding:6px 12px 6px 0;font-weight:600;">Dimension</td><td style="padding:6px 12px 6px 0;font-weight:600;">Actual</td><td style="padding:6px 12px 6px 0;font-weight:600;">Target</td><td style="padding:6px 0;font-weight:600;text-align:right;">Score</td></tr></thead>
<tbody>${rows}</tbody></table>
<div class="summary">${escapeHtml(report.summary)}</div>
<p class="words"><strong>Above-level words:</strong> ${escapeHtml(over)}</p>
</body></html>`

  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(html)
  win.document.close()
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
