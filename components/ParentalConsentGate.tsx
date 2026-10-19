'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { LEGAL_CONTACT_EMAIL } from '@/lib/site'

interface PurposeInfo {
  id: string
  label: string
  description: string
}

interface ConsentSnapshot {
  authenticated: boolean
  purposeGrantedAt?: string | null
  consent: { vpcMethod: string; grantedAt: string; policyVersion: string } | null
  photoAllowed: boolean
  purposes: PurposeInfo[]
}

interface ParentalConsentGateProps {
  /** Fires whenever the ability to upload a child's photo changes. */
  onConsentChange?: (allowed: boolean) => void
}

/**
 * Consent notice shown before any child's photograph can be uploaded.
 * The browser only ever reads and requests consent; the record itself is written
 * server-side, in /api/consent/vpc.
 */
export default function ParentalConsentGate({ onConsentChange }: ParentalConsentGateProps) {
  const { login } = useAuth()
  const [snapshot, setSnapshot] = useState<ConsentSnapshot | null>(null)
  const [checkFailed, setCheckFailed] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState('')
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [withdrawContent, setWithdrawContent] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/consent')
      const data = (await res.json()) as ConsentSnapshot
      setSnapshot(data)
      onConsentChange?.(!!data.photoAllowed)
    } catch {
      setCheckFailed(true)
      setSnapshot(null)
      onConsentChange?.(false)
    }
  }, [onConsentChange])

  useEffect(() => {
    void load()
  }, [load])

  const startVerification = async () => {
    setWorking(true)
    setError('')
    try {
      const res = await fetch('/api/consent/vpc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: 'card-charge' }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Verification could not be started. Please try again.')
        return
      }
      // Real provider: hand off to the hosted checkout, which writes the consent on return.
      if (data.url) {
        window.location.href = data.url
        return
      }
      await load()
    } catch {
      setError('Verification could not be started. Please try again.')
    } finally {
      setWorking(false)
    }
  }

  const withdrawConsent = async () => {
    setWorking(true)
    setError('')
    try {
      const res = await fetch(`/api/consent?include_content=${withdrawContent ? '1' : '0'}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        setError('Consent could not be withdrawn. Please contact us instead.')
        return
      }
      setShowWithdraw(false)
      setWithdrawContent(false)
      setAgreed(false)
      await load()
    } catch {
      setError('Consent could not be withdrawn. Please contact us instead.')
    } finally {
      setWorking(false)
    }
  }

  if (snapshot === null) {
    return (
      <div className="apple-card p-5 mb-6">
        <p className="text-sm text-[#8E8E93]">
          {checkFailed
            ? 'We could not check your consent status. Please reload the page, or contact us if it keeps happening.'
            : 'Checking parental consent…'}
        </p>
      </div>
    )
  }

  if (!snapshot.authenticated) {
    return (
      <div className="apple-card p-6 mb-6">
        <h3 className="text-base font-bold text-[#2D2D2D]">A parent or guardian must sign in</h3>
        <p className="text-sm text-[#8E8E93] mt-1.5">
          If you would like to use a photograph of your child, an adult account is required first —
          consent has to be tied to a named parent or guardian, not to an anonymous session.
        </p>
        <button type="button" onClick={login} className="apple-button text-sm px-5 py-2.5 mt-4">
          Sign in with Google
        </button>
      </div>
    )
  }

  if (!snapshot.photoAllowed) {
    return (
      <div className="apple-card p-6 mb-6 border-2 border-[#C8A2E8]/40">
        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#C8A2E8]/15 text-[#8E5FC0] text-[11px] font-semibold">
          Parental consent required
        </span>
        <h3 className="text-base font-bold text-[#2D2D2D] mt-2.5">
          Before you upload a photograph of your child
        </h3>
        <p className="text-sm text-[#8E8E93] mt-1.5">
          Photographs of children are treated as personal information. We cannot accept one until an
          adult has given verifiable parental consent.
        </p>

        <ul className="mt-4 space-y-3">
          {snapshot.purposes.map((p) => (
            <li key={p.id} className="flex gap-3">
              <span className="mt-0.5 text-[#4A9E8E]">•</span>
              <span>
                <span className="block text-sm font-semibold text-[#2D2D2D]">{p.label}</span>
                <span className="block text-xs text-[#8E8E93] mt-0.5">{p.description}</span>
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-5 rounded-2xl bg-[#F2F2F7] p-4">
          <p className="text-xs font-semibold text-[#2D2D2D]">Payment-card verification</p>
          <p className="text-xs text-[#8E8E93] mt-1">
            We place a small charge on your own card through our payment provider, then refund it. A
            card held in your name is one of the recognised ways to verify that you are the parent.
          </p>
        </div>

        <label className="flex items-start gap-3 mt-5 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 accent-[#FF6B8A]"
          />
          <span className="text-xs text-[#2D2D2D]">
            I am the parent or legal guardian of the child shown in the photograph, I have read the{' '}
            <Link href="/privacy" className="text-[#FF6B8A] underline">
              Privacy Policy
            </Link>{' '}
            and{' '}
            <Link href="/terms" className="text-[#FF6B8A] underline">
              Terms of Service
            </Link>
            , and I consent to the use of my child&apos;s photograph as described above.
          </span>
        </label>

        {error && <p className="text-xs text-red-500 mt-3">{error}</p>}

        <button
          type="button"
          onClick={startVerification}
          disabled={!agreed || working}
          className="apple-button text-sm px-5 py-2.5 mt-4 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {working ? 'Starting verification…' : 'Verify and continue'}
        </button>

        <p className="text-[11px] text-[#8E8E93] mt-3">
          You can withdraw consent at any time, and you can ask us to delete your child&apos;s data by
          writing to {LEGAL_CONTACT_EMAIL}.
        </p>
      </div>
    )
  }

  return (
    <div className="apple-card p-5 mb-6 border border-[#98D8C8]/50 bg-[#F4FBF9]">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-bold text-[#2D2D2D]">Parental consent on file</h3>
          <p className="text-xs text-[#8E8E93] mt-0.5">
            You may upload a photograph of your child. Granted{' '}
            {new Date(snapshot.consent!.grantedAt).toLocaleDateString()} · policy version{' '}
            {snapshot.consent!.policyVersion}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowWithdraw((v) => !v)}
          className="text-xs font-medium px-3 py-1.5 rounded-full border border-[#E5E5EA] bg-white text-[#2D2D2D]"
        >
          Withdraw consent
        </button>
      </div>

      {showWithdraw && (
        <div className="mt-4 pt-4 border-t border-[#E5E5EA]">
          <p className="text-xs text-[#8E8E93]">
            Withdrawing stops any further use of your child&apos;s photograph immediately. Books you
            already made stay in your library unless you ask us to delete them as well.
          </p>
          <label className="flex items-start gap-3 mt-3 cursor-pointer">
            <input
              type="checkbox"
              checked={withdrawContent}
              onChange={(e) => setWithdrawContent(e.target.checked)}
              className="mt-0.5 accent-[#FF6B8A]"
            />
            <span className="text-xs text-[#2D2D2D]">
              Also delete every book and story we generated for this account
            </span>
          </label>
          {error && <p className="text-xs text-red-500 mt-3">{error}</p>}
          <button
            type="button"
            onClick={withdrawConsent}
            disabled={working}
            className="apple-button-secondary text-xs px-4 py-2 mt-3 disabled:opacity-40"
          >
            {working ? 'Withdrawing…' : 'Confirm withdrawal'}
          </button>
        </div>
      )}
    </div>
  )
}
