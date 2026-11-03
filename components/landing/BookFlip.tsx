/**
 * Hero visual: a cinematic interior spread from a generated book,
 * showing the locked character (the Moon Bunny) in-scene.
 */
export default function BookFlip() {
  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl border border-[#E5E5EA] bg-white shadow-sm">
        <img
          src="/samples/hero-spread.webp"
          alt="The Moon Bunny sailing a paper boat under a full moon — a generated interior spread"
          className="aspect-[16/10] w-full object-cover"
        />
        <span className="absolute bottom-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#2D2D2D]/70 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
          The Moon Bunny · GRL B · 16 pages
        </span>
      </div>

      <p className="mt-3 text-center text-[13px] font-medium uppercase tracking-[0.14em] text-[#545558]">
        Same bunny, every page — character locked
      </p>
    </div>
  )
}
