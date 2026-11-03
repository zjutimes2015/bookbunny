'use client'

import { useState } from 'react'
import { BookCover, Scene, SPREADS, type CoverVariant } from './book-art'

export type SampleBook = {
  variant: CoverVariant
  title: string
  meta: string
  ink: string
}

/**
 * Flippable sample-book preview: cover + three interior spreads,
 * with prev/next controls, dots and a page counter.
 * Interior art is illustrative of the style, as labeled.
 */
export default function SampleReader({ book }: { book: SampleBook }) {
  const total = SPREADS.length + 1
  const [page, setPage] = useState(0)

  const prev = () => setPage((p) => (p + total - 1) % total)
  const next = () => setPage((p) => (p + 1) % total)

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl border border-[#E5E5EA] bg-white shadow-sm">
        <div className="relative aspect-[3/4] w-full">
          {page === 0 ? (
            <BookCover
              variant={book.variant}
              title={book.title}
              ink={book.ink}
              className="absolute inset-0 h-full w-full"
            />
          ) : (
            <Scene
              variant={SPREADS[page - 1].variant}
              className="absolute inset-0 h-full w-full"
            />
          )}
        </div>

        <button
          type="button"
          onClick={prev}
          aria-label={`Previous page of ${book.title}`}
          className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-lg font-medium text-[#2D2D2D] shadow backdrop-blur transition hover:bg-white"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={next}
          aria-label={`Next page of ${book.title}`}
          className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-lg font-medium text-[#2D2D2D] shadow backdrop-blur transition hover:bg-white"
        >
          ›
        </button>

        <span className="absolute bottom-2.5 left-1/2 -translate-x-1/2 rounded-full bg-[#2D2D2D]/70 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur">
          {page === 0 ? 'Cover' : `Page ${page}`} · {page + 1} of {total}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-center gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setPage(i)}
            aria-label={`Go to page ${i + 1} of ${book.title}`}
            className={`h-1.5 rounded-full transition-all ${i === page ? 'w-5 bg-[#2D2D2D]' : 'w-1.5 bg-[#E5E5EA] hover:bg-[#C7C7CC]'}`}
          />
        ))}
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-3">
        <strong className="text-sm font-semibold text-[#2D2D2D]">{book.title}</strong>
        <span className="shrink-0 text-[11px] text-[#8E8E93]">{book.meta}</span>
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-[#8E8E93]">
        Interior preview is illustrative of the art style.
      </p>
    </div>
  )
}
