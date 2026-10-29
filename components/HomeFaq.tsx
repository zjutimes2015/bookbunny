'use client'

import { useState } from 'react'

type FaqItem = {
  q: string
  a: string
}

export default function HomeFaq({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <div className="w-full">
      {items.map((item, index) => {
        const isOpen = openIndex === index
        return (
          <div key={item.q} className="mb-4 overflow-hidden rounded-lg bg-black">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 p-4 text-left"
              aria-expanded={isOpen}
              onClick={() => setOpenIndex(isOpen ? -1 : index)}
            >
              <span className="text-lg font-semibold text-white sm:text-xl">{item.q}</span>
              <svg
                viewBox="0 0 20 20"
                className={`h-5 w-5 shrink-0 text-white transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                aria-hidden="true"
              >
                <path
                  d="M5 7.5 L10 12.5 L15 7.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <div
              className={`overflow-hidden transition-[max-height] duration-300 ease-in-out ${isOpen ? 'max-h-96' : 'max-h-0'}`}
            >
              <p className="px-4 pb-4 font-light leading-relaxed text-white">{item.a}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
