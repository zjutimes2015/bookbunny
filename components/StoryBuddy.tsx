'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { emptyBrief, type BookBrief, type Proposal } from '@/lib/assistant/brief'
import { produceConfirmedBook, ProduceError } from '@/lib/assistant/produce'
import { personaById, PERSONAS, type PersonaId } from '@/lib/assistant/personas'
import { KaiPortrait, LilaPortrait } from '@/components/BuddyPortraits'
import TurnstileWidget from '@/components/TurnstileWidget'

interface ChatMessage {
  id: string
  role: 'buddy' | 'parent'
  text: string
}

interface AssistResponse {
  reply: string
  brief: BookBrief
  proposal: Proposal | null
  signedIn: boolean
}

function Portrait({ id, size }: { id: PersonaId; size: number }) {
  switch (id) {
    case 'lila':
      return <LilaPortrait size={size} />
    case 'kai':
      return <KaiPortrait size={size} />
    default: {
      const unknown: never = id
      return unknown
    }
  }
}

export default function StoryBuddy() {
  const { user, login } = useAuth()
  const [personaId, setPersonaId] = useState<PersonaId | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [brief, setBrief] = useState<BookBrief>(emptyBrief())
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [producing, setProducing] = useState(false)
  const [status, setStatus] = useState('')
  const [book, setBook] = useState<{ id: string; title: string } | null>(null)
  const [trouble, setTrouble] = useState<{ text: string; href?: string; hrefLabel?: string } | null>(null)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [humanError, setHumanError] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const persona = personaById(personaId)

  const scrollDown = () => {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
    })
  }

  const choose = (id: PersonaId) => {
    const next = personaById(id)
    if (!next) return
    setPersonaId(id)
    setBrief(emptyBrief())
    setProposal(null)
    setBook(null)
    setTrouble(null)
    setStatus('')
    setMessages([{ id: 'hello', role: 'buddy', text: next.greeting }])
  }

  const send = async () => {
    const text = draft.trim()
    if (!text || !personaId || sending || producing) return
    setDraft('')
    setTrouble(null)
    setBook(null)
    setMessages((prev) => [...prev, { id: `p-${Date.now()}`, role: 'parent', text }])
    setSending(true)
    scrollDown()
    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona: personaId, message: text, brief }),
      })
      const data = (await res.json()) as AssistResponse & { error?: string }
      if (!res.ok) throw new Error(data.error || 'The buddy could not answer.')
      setBrief(data.brief)
      setProposal(data.proposal)
      setMessages((prev) => [...prev, { id: `b-${Date.now()}`, role: 'buddy', text: data.reply }])
      scrollDown()
    } catch (err) {
      setTrouble({ text: err instanceof Error ? err.message : 'Something went wrong.' })
    } finally {
      setSending(false)
    }
  }

  const makeBook = async () => {
    if (!proposal || producing) return
    if (!user) {
      login()
      return
    }
    if (!turnstileToken) {
      setHumanError(true)
      return
    }
    setHumanError(false)
    setTrouble(null)
    setProducing(true)
    try {
      const made = await produceConfirmedBook({
        proposal,
        turnstileToken,
        onProgress: (progress) => setStatus(progress.detail),
      })
      setBook({ id: made.bookId, title: made.title })
      setStatus('')
      setProposal(null)
      setBrief(emptyBrief())
      setMessages((prev) => [
        ...prev,
        {
          id: `done-${made.bookId}`,
          role: 'buddy',
          text: `“${made.title}” is in your library. Open it whenever you want to read or export.`,
        },
      ])
      scrollDown()
    } catch (err) {
      if (err instanceof ProduceError && err.code === 'allowance') {
        setTrouble({ text: err.message, href: '/pricing', hrefLabel: 'See plans' })
      } else if (err instanceof ProduceError && err.code === 'auth') {
        setTrouble({ text: err.message })
      } else {
        setTrouble({ text: err instanceof Error ? err.message : 'The book could not be made.' })
      }
      setStatus('')
    } finally {
      setProducing(false)
    }
  }

  if (!persona || !personaId) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 md:py-14">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#8E8E93]">Story buddies</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#2D2D2D] sm:text-4xl">
          Tell Lila or Kai the book you want
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[#8E8E93]">
          Pick one buddy. They’ll ask for a name, an age, and an idea, then write the book,
          save it to your library, and illustrate every page. A photo is never required.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {PERSONAS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => choose(item.id)}
              className="apple-card flex items-center gap-4 p-4 text-left"
            >
              <Portrait id={item.id} size={112} />
              <span>
                <span className="block text-lg font-semibold text-[#2D2D2D]">{item.name}</span>
                <span className="mt-1 block text-sm capitalize text-[#8E8E93]">{item.role}</span>
                <span className="mt-2 block text-sm leading-relaxed text-[#2D2D2D]">{item.blurb}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-3xl flex-col px-4 py-6 sm:px-6">
      <div className="flex items-center gap-3 border-b border-[#E5E5EA] pb-4">
        <Portrait id={personaId} size={56} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[#2D2D2D]">{persona.name}</p>
          <p className="truncate text-sm text-[#8E8E93]">{persona.blurb}</p>
        </div>
        <button
          type="button"
          onClick={() => setPersonaId(null)}
          className="text-sm font-medium text-[#8E8E93] hover:text-[#2D2D2D]"
        >
          Switch
        </button>
      </div>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto py-5">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'parent' ? 'justify-end' : 'justify-start'}`}>
            <p
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                message.role === 'parent'
                  ? 'bg-[#2D2D2D] text-white'
                  : 'bg-[#F6F4EF] text-[#2D2D2D]'
              }`}
            >
              {message.text}
            </p>
          </div>
        ))}
        {sending && <p className="text-sm text-[#8E8E93]">{persona.name} is thinking…</p>}
        {status && <p className="text-sm text-[#2D2D2D]">{status}</p>}
      </div>

      {proposal && !book && (
        <div className="mb-3 rounded-2xl border border-[#E5E5EA] bg-[#FDFBF7] p-4">
          <p className="text-sm font-semibold text-[#2D2D2D]">{proposal.theme}</p>
          <p className="mt-1 text-sm text-[#8E8E93]">
            {proposal.childName} · {proposal.pages} pages · {proposal.levelLabel} · ages {proposal.ageGroup}
            {' · '}
            {proposal.costUnits === 1 ? '1 book credit' : `${proposal.costUnits} book credits`}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-[#8E8E93]">
            Illustrated character only. To use a real photo, finish parental consent on Create Book.
          </p>
          <div className="mt-3">
            <TurnstileWidget
              onVerify={(token) => {
                setTurnstileToken(token)
                setHumanError(false)
              }}
              onExpire={() => setTurnstileToken(null)}
              onError={() => setHumanError(true)}
            />
          </div>
          {humanError && (
            <p className="mt-2 text-sm text-[#FF6B8A]">Complete the check above, then make the book.</p>
          )}
          <button
            type="button"
            onClick={makeBook}
            disabled={producing}
            className="apple-button mt-3 px-5 py-2.5 text-sm disabled:opacity-60"
          >
            {producing ? 'Making the book…' : user ? 'Make this book' : 'Sign in to make this book'}
          </button>
        </div>
      )}

      {book && (
        <p className="mb-3 text-sm">
          <Link href={`/book/${book.id}`} className="font-medium text-[#2D2D2D] underline underline-offset-4">
            Open “{book.title}”
          </Link>
        </p>
      )}

      {trouble && (
        <p className="mb-3 text-sm text-[#2D2D2D]">
          {trouble.text}{' '}
          {trouble.href && (
            <Link href={trouble.href} className="font-medium underline underline-offset-4">
              {trouble.hrefLabel}
            </Link>
          )}
        </p>
      )}

      <form
        className="flex gap-2 border-t border-[#E5E5EA] pt-3"
        onSubmit={(event) => {
          event.preventDefault()
          void send()
        }}
      >
        <label className="sr-only" htmlFor="buddy-message">Message {persona.name}</label>
        <input
          id="buddy-message"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={`Message ${persona.name}`}
          disabled={sending || producing}
          className="apple-input flex-1"
        />
        <button
          type="submit"
          disabled={sending || producing || !draft.trim()}
          className="apple-button px-4 py-2.5 text-sm disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  )
}
