import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getWorld } from '@/lib/worlds'
import WorldStartForm, { type StartWorld } from '@/components/WorldStartForm'
import { SITE_NAME } from '@/lib/site'

export const dynamic = 'force-dynamic'

type PageProps = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const world = await getWorld(id)
  return {
    title: world ? `Start an episode in ${world.name} — ${SITE_NAME}` : `World not found — ${SITE_NAME}`,
    // 生成流程页不参与收录
    robots: { index: false, follow: false },
  }
}

export default async function WorldStartPage({ params }: PageProps) {
  const { id } = await params
  const world = await getWorld(id)
  if (!world) notFound()

  const payload: StartWorld = {
    id: world.id,
    name: world.name,
    ageRange: world.ageRange,
    theme: world.theme,
    scene: world.scene,
    artStyle: world.artStyle,
    characters: world.characters.map((c) => ({
      name: c.name,
      role: c.role,
      personality: c.personality,
      catchphrase: c.catchphrase,
    })),
    moralPool: world.moralPool,
    forbiddenZones: world.forbiddenZonesSpecific,
    sampleTitle: world.sampleEpisode.title,
  }

  return <WorldStartForm world={payload} />
}
