import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL, SITE_NAME } from '@/lib/site'
import { filterWorlds, listWorlds, worldThemes } from '@/lib/worlds'

const TITLE = 'Story Worlds — Illustrated Story Worlds for Kids'
const DESCRIPTION =
  'Pick a story world, then let your child star in it. Twenty illustrated worlds across ages 3–5 and 6–8, each with its own cast and lesson pool.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/worlds` },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/worlds`,
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
  },
  // Draft worlds are for internal review only — keep them out of search results
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

const AGE_BANDS = ['3-5', '6-8']

type PageProps = {
  searchParams: Promise<{ age?: string; theme?: string }>
}

export default async function WorldsPage({ searchParams }: PageProps) {
  const { age, theme } = await searchParams
  const all = await listWorlds()
  const themes = worldThemes(all)
  const ageFilter = AGE_BANDS.includes(age ?? '') ? age! : null
  const themeFilter = themes.includes(theme ?? '') ? theme! : null
  const worlds = filterWorlds(all, { ageRange: ageFilter, theme: themeFilter })

  const chipHref = (next: { age?: string | null; theme?: string | null }) => {
    const params = new URLSearchParams()
    const a = next.age !== undefined ? next.age : ageFilter
    const t = next.theme !== undefined ? next.theme : themeFilter
    if (a) params.set('age', a)
    if (t) params.set('theme', t)
    const qs = params.toString()
    return qs ? `/worlds?${qs}` : '/worlds'
  }

  const chipClass = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
      active
        ? 'border-[#FF6B8A] bg-[#FFF0F4] text-[#FF6B8A]'
        : 'border-[#E5E5EA] bg-white text-[#2D2D2D] hover:border-[#C8A2E8]'
    }`

  return (
    <div className="min-h-screen">
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#FF6B8A]">Story worlds</p>
        <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-[#2D2D2D]">
          Pick a world. Your child <span className="bunny-text-gradient">is the hero</span>.
        </h1>
        <p className="mt-4 text-lg text-[#8E8E93] max-w-2xl leading-relaxed">
          Every world comes with its own place, supporting cast and lesson pool. You pick the lesson for this
          episode — we handle the reading level.
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-[#8E8E93]">Age</span>
          <Link href={chipHref({ age: null })} className={chipClass(!ageFilter)}>
            All
          </Link>
          {AGE_BANDS.map((band) => (
            <Link key={band} href={chipHref({ age: band })} className={chipClass(ageFilter === band)}>
              {band}
            </Link>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-[#8E8E93]">Lesson</span>
          <Link href={chipHref({ theme: null })} className={chipClass(!themeFilter)}>
            All
          </Link>
          {themes.map((t) => (
            <Link key={t} href={chipHref({ theme: t })} className={chipClass(themeFilter === t)}>
              {t}
            </Link>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <p className="mb-4 text-xs text-[#8E8E93]">
          {worlds.length} {worlds.length === 1 ? 'world' : 'worlds'}
          {ageFilter ? ` · ages ${ageFilter}` : ''}
          {themeFilter ? ` · ${themeFilter}` : ''}
        </p>

        {worlds.length === 0 ? (
          <div className="apple-card p-8 text-center text-[#8E8E93]">
            No worlds match this filter. <Link href="/worlds" className="text-[#FF6B8A]">Clear filters</Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {worlds.map((world) => (
              <Link key={world.id} href={`/worlds/${world.id}`} className="apple-card p-6 block group">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-semibold text-[#2D2D2D] group-hover:text-[#FF6B8A] transition-colors">
                    {world.name}
                  </h2>
                  {world.status !== 'published' && (
                    <span className="shrink-0 rounded-full bg-[#F2F2F7] px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-[#8E8E93]">
                      {world.status}
                    </span>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#FFF0F4] px-2.5 py-1 text-xs font-medium text-[#FF6B8A]">
                    Ages {world.ageRange}
                  </span>
                  <span className="rounded-full bg-[#F2F2F7] px-2.5 py-1 text-xs font-medium text-[#2D2D2D]">
                    {world.theme}
                  </span>
                </div>
                <p className="mt-4 text-sm font-medium text-[#FF6B8A] group-hover:underline">
                  See the world →
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
