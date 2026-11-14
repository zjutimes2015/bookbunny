// No-login demo presets (item A + E).
//
// The demo path accepts ONLY a preset id + an age group. Theme text lives
// here, server-side: the browser never sends free text, a name, or a photo,
// so no child data can reach the demo endpoint. Story-starter openings are
// fresh generic text written for this wall — they are not real users' books
// and must not be presented as such.

import type { CharacterCard } from '@/lib/types/book'

/** Free-plan book length: the demo generates one complete 8-page sample. */
export const DEMO_PAGE_COUNT = 8

/** Age groups, identical to the values /create sends (see lib/reading-levels). */
export const DEMO_AGE_GROUPS = [
  { id: '0-3', label: 'Baby (0–3)' },
  { id: '3-5', label: 'Preschool (3–5)' },
  { id: '5-7', label: 'Early reader (5–7)' },
  { id: '7-10', label: 'Chapter book (7–10)' },
] as const

export type DemoAgeGroup = (typeof DEMO_AGE_GROUPS)[number]['id']

export function isDemoAgeGroup(value: unknown): value is DemoAgeGroup {
  return (
    typeof value === 'string' &&
    (DEMO_AGE_GROUPS as readonly { id: string }[]).some((g) => g.id === value)
  )
}

export interface DemoPreset {
  id: string
  label: string
  /** Canonical theme text handed to generateStory. Never client-supplied. */
  theme: string
  defaultAgeGroup: DemoAgeGroup
  /** Complete story opening shown on the starter wall (2–4 sentences). */
  opening: string
}

export const DEMO_PRESETS: DemoPreset[] = [
  {
    id: 'moon-star',
    label: 'The lost star',
    theme: 'Pip the bunny carries a lost, tired little star home before bedtime',
    defaultAgeGroup: '3-5',
    opening:
      'Pip found a small star tangled in the garden fence. It was too tired to shine, so Pip tucked it into a pocket and promised to carry it home. The path was dark, but Pip knew the way by heart.',
  },
  {
    id: 'paper-boat',
    label: 'The paper boat',
    theme: 'Pip sails a paper boat down the stream to find where the rain goes',
    defaultAgeGroup: '5-7',
    opening:
      'Pip folded a paper boat from an old map and set it on the stream. “Where does the rain go?” Pip asked the water. The boat spun once, twice, and sailed off to find out.',
  },
  {
    id: 'quiet-garden',
    label: 'The quiet garden',
    theme: 'Pip plants a seed in a quiet garden and waits patiently for a surprise',
    defaultAgeGroup: '3-5',
    opening:
      'In the quiet garden behind the hill, Pip planted one tiny seed. Every morning Pip watered it and whispered, “Grow when you are ready.” One morning, something green was peeking out.',
  },
  {
    id: 'gentle-dinosaur',
    label: 'The gentle dinosaur',
    theme: 'Pip meets a gentle dinosaur who is afraid of the dark and helps him feel safe',
    defaultAgeGroup: '3-5',
    opening:
      'Bronto was the biggest dinosaur in the valley, but he was afraid of the dark. Pip brought a lantern and a story, and sat beside him until the stars came out. “The dark is just the sky getting ready to sleep,” Pip said.',
  },
  {
    id: 'lighthouse',
    label: 'The lighthouse light',
    theme: 'Pip helps the lighthouse keeper relight the light on a stormy night',
    defaultAgeGroup: '5-7',
    opening:
      'The lighthouse light went out on the stormiest night of the year. Pip climbed the winding stairs with a candle and a brave heart. “Ships need us,” Pip said, and lit the lamp just in time.',
  },
  {
    id: 'night-train',
    label: 'The night train',
    theme: 'Pip rides the little night train that delivers dreams to sleeping towns',
    defaultAgeGroup: '7-10',
    opening:
      'Every night, the little night train carries dreams to sleeping towns. Pip was the new conductor, with a ticket punch and a very loud whistle. “All aboard for Dream Valley!” Pip called, and the train rolled into the dark.',
  },
]

export const DEFAULT_DEMO_PRESET_ID = 'moon-star'

export function getDemoPreset(id: unknown): DemoPreset | undefined {
  return typeof id === 'string' ? DEMO_PRESETS.find((p) => p.id === id) : undefined
}

/**
 * The ONE demo character, hardcoded. Every demo book stars Pip; the visitor
 * cannot change the name, appearance, or photo (there is no photo input).
 * photoUsage stays 'illustrated': no real photograph is ever involved.
 */
export const DEMO_CHARACTER: CharacterCard = {
  name: 'Pip',
  roleType: 'protagonist — a small kind bunny',
  ageFeel: 'young child-like bunny, cute and friendly',
  appearance:
    'small round bunny with cream-colored fur, big friendly brown eyes, soft warm smile, long upright ears',
  hairOrFur: 'cream-colored soft fluffy fur with a pale pink inner ear',
  clothing: 'a coral-pink scarf and a small mustard-yellow backpack',
  signatureProp: 'a tiny brass lantern it always carries',
  personality: 'kind, curious, brave and warm-hearted',
  commonExpressions: 'happy smile, curious wide eyes, gentle surprise',
  commonActions: 'hopping, hugging, exploring, waving',
  storyProblem: 'faces a small, age-appropriate problem and helps a friend',
  noChangeItems:
    'face shape, eye color, cream fur colors, pink scarf, mustard backpack and brass lantern',
  photoUsage: 'illustrated',
}
