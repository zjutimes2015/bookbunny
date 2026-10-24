import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL, SITE_NAME } from '@/lib/site'
import { listWorlds } from '@/lib/worlds'

const TITLE = `World Library — ${SITE_NAME}`
const DESCRIPTION =
  'Twenty draft story worlds for SproutTales picture books, each with its own cast, setting, art direction and moral pool.'

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

export default async function WorldsPage() {
  const worlds = await listWorlds()

  return (
    <div className="min-h-screen">
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#FF6B8A]">Content pipeline</p>
        <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-[#2D2D2D]">
          World <span className="bunny-text-gradient">Library</span>
        </h1>
        <p className="mt-4 text-lg text-[#8E8E93] max-w-2xl leading-relaxed">
          {worlds.length} worldview archives. Each one carries its own setting, cast, art direction and moral
          pool that a generated episode draws from.
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {worlds.length === 0 ? (
          <div className="apple-card p-8 text-center text-[#8E8E93]">
            No worlds yet. Run the seed script to import the archives.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {worlds.map((world) => (
              <Link
                key={world.id}
                href={`/worlds/${world.id}`}
                className="apple-card p-6 block group"
              >
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
                <p className="mt-4 text-xs text-[#C7C7CC] break-all">{world.id}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
