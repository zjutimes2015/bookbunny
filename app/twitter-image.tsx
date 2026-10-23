import OpenGraphImage from './opengraph-image'

export const alt = 'SproutTales — turn an idea into a real picture book'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/** Twitter card image reuses the Open Graph artwork. */
export default function TwitterImage() {
  return OpenGraphImage()
}
