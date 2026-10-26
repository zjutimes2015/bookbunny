import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { GENERAL_FORBIDDEN_ZONES } from '@/data/worlds'
import { SITE_URL } from '@/lib/site'
import { getWorld } from '@/lib/worlds'
import { getWorldInsights } from '@/lib/analytics'

export const dynamic = 'force-dynamic'

type PageProps = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const world = await getWorld(id)
  if (!world) return { title: 'World not found' }

  const description = `${world.name} — ages ${world.ageRange}, theme: ${world.theme}. ${world.scene.slice(0, 120)}`
  return {
    title: `${world.name} — Illustrated Story World for Kids`,
    description,
    alternates: { canonical: `${SITE_URL}/worlds/${world.id}` },
    // Draft worlds are for internal review only — keep them out of search results
    robots: { index: false, follow: false },
  }
}

export default async function WorldDetailPage({ params }: PageProps) {
  const { id } = await params
  const world = await getWorld(id)
  if (!world) notFound()

  const insights = await getWorldInsights(world.id)
  const pct = (v: number | null) => (v === null ? '—' : `${Math.round(v * 100)}%`)
  const stats = [
    { label: 'Families', value: String(insights.families) },
    { label: 'Episodes read', value: String(insights.episodes) },
    { label: 'Finished', value: pct(insights.completionRate) },
    { label: 'Replays / episode', value: insights.replaysPerEpisode === null ? '—' : insights.replaysPerEpisode.toFixed(1) },
    { label: 'Quiz accuracy', value: pct(insights.quizAccuracy) },
    { label: 'Read-aloud', value: pct(insights.readAlongAccuracy) },
  ]

  return (
    <div className="min-h-screen">
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6">
        <Link href="/worlds" className="text-sm text-[#8E8E93] hover:text-[#FF6B8A]">
          ← All worlds
        </Link>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#FFF0F4] px-2.5 py-1 text-xs font-medium text-[#FF6B8A]">
            Ages {world.ageRange}
          </span>
          <span className="rounded-full bg-[#F2F2F7] px-2.5 py-1 text-xs font-medium text-[#2D2D2D]">
            {world.theme}
          </span>
          <span className="rounded-full bg-[#F2F2F7] px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-[#8E8E93]">
            {world.status}
          </span>
        </div>
        <h1 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-[#2D2D2D]">{world.name}</h1>
        <p className="mt-2 text-xs text-[#C7C7CC] break-all">{world.id}</p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link href={`/worlds/${world.id}/start`} className="apple-button text-sm px-6 py-3 text-center">
            Start an episode in this world →
          </Link>
          <p className="text-xs text-[#8E8E93] leading-relaxed">
            You pick the lesson for this episode. Your child is the hero — the reading level is matched
            automatically.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-8">
        {/* Setting */}
        <section className="apple-card p-6 sm:p-8">
          <h2 className="text-xl font-bold text-[#2D2D2D]">Setting</h2>

          <p className="mt-4 text-[#2D2D2D] leading-relaxed">{world.scene}</p>

          <dl className="mt-6 space-y-4 text-sm">
            <div>
              <dt className="font-semibold text-[#2D2D2D]">Reading difficulty</dt>
              <dd className="mt-1 text-[#8E8E93] leading-relaxed">{world.difficulty}</dd>
            </div>
            <div>
              <dt className="font-semibold text-[#2D2D2D]">Art direction</dt>
              <dd className="mt-1 text-[#8E8E93] leading-relaxed">{world.artStyle}</dd>
            </div>
          </dl>

          <h3 className="mt-8 text-sm font-semibold text-[#2D2D2D]">Cast</h3>
          <ul className="mt-3 space-y-3">
            {world.characters.map((character) => (
              <li key={character.name} className="rounded-xl bg-[#FAFAFB] p-4">
                <p className="text-sm font-semibold text-[#2D2D2D]">
                  {character.name}
                  <span className="ml-2 font-normal text-[#8E8E93]">{character.role}</span>
                </p>
                <p className="mt-1 text-sm text-[#8E8E93] leading-relaxed">{character.personality}</p>
                <p className="mt-2 text-sm text-[#FF6B8A]">“{character.catchphrase}”</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Moral pool */}
        <section className="apple-card p-6 sm:p-8">
          <h2 className="text-xl font-bold text-[#2D2D2D]">Moral pool</h2>
          <p className="mt-2 text-sm text-[#8E8E93]">
            One moral is picked per episode, then carried through all five pages.
          </p>
          <ol className="mt-4 grid gap-2 sm:grid-cols-2">
            {world.moralPool.map((moral, index) => (
              <li key={moral} className="flex gap-3 rounded-xl bg-[#FAFAFB] px-4 py-3 text-sm text-[#2D2D2D]">
                <span className="shrink-0 text-[#C7C7CC]">{index + 1}</span>
                <span className="leading-relaxed">{moral}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Forbidden zones */}
        <section className="apple-card p-6 sm:p-8">
          <h2 className="text-xl font-bold text-[#2D2D2D]">Forbidden zones</h2>
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-[#2D2D2D]">Platform-wide</h3>
              <ul className="mt-2 space-y-1.5 text-sm text-[#8E8E93]">
                {GENERAL_FORBIDDEN_ZONES.map((zone) => (
                  <li key={zone}>· {zone}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#2D2D2D]">This world</h3>
              <ul className="mt-2 space-y-1.5 text-sm text-[#8E8E93]">
                {world.forbiddenZonesSpecific.map((zone) => (
                  <li key={zone}>· {zone}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Sample episode — text outline only */}
        <section className="apple-card p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-bold text-[#2D2D2D]">Sample episode</h2>
            <span className="rounded-full bg-[#F2F2F7] px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-[#8E8E93]">
              Text outline · no images yet
            </span>
          </div>
          <p className="mt-3 text-lg font-semibold text-[#2D2D2D]">{world.sampleEpisode.title}</p>
          <ol className="mt-4 space-y-3">
            {world.sampleEpisode.pages.map((page, index) => (
              <li key={page.text} className="rounded-xl bg-[#FAFAFB] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#C7C7CC]">Page {index + 1}</p>
                <p className="mt-2 text-[#2D2D2D] leading-relaxed">{page.text}</p>
                <p className="mt-2 text-sm text-[#8E8E93] leading-relaxed">
                  <span className="font-medium">Visual:</span> {page.image}
                </p>
                <p className="mt-1 text-sm text-[#8E8E93] leading-relaxed">
                  <span className="font-medium">Beat:</span> {page.point}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* 世界级聚合：只有数字，没有任何家庭的阅读细节 */}
        <section className="apple-card p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-bold text-[#2D2D2D]">How this world is doing</h2>
            <span className="rounded-full bg-[#F2F2F7] px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-[#8E8E93]">
              Aggregated · no family data
            </span>
          </div>
          <p className="mt-2 text-sm text-[#8E8E93] leading-relaxed">
            Numbers across every family reading this world. No single child&apos;s reading is visible here.
          </p>

          <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl bg-[#FAFAFB] px-4 py-3">
                <p className="text-[11px] uppercase tracking-wide text-[#8E8E93]">{s.label}</p>
                <p className="mt-1 text-lg font-bold text-[#2D2D2D]">{s.value}</p>
              </div>
            ))}
          </div>

          <p className="mt-4 text-sm text-[#2D2D2D]">
            <span className="font-semibold">Most-picked lesson: </span>
            {insights.topMoral || 'not enough readings yet'}
          </p>
          {insights.episodes === 0 && (
            <p className="mt-1 text-xs text-[#8E8E93]">
              No episodes read in this world yet — these numbers start filling up after the first family reads one.
            </p>
          )}
        </section>
      </div>
    </div>
  )
}
