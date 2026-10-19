import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface MorningDigestEmailProps {
  userName?: string
  bookCount?: number
  tipTitle?: string
  tipBody?: string
}

const baseUrl = process.env.SITE_URL || 'http://localhost:3000'

const TIPS = [
  {
    title: '✨ Character Consistency Trick',
    body: 'Upload a front-facing photo with good lighting for the best character consistency across pages.',
  },
  {
    title: '📖 Age Matters',
    body: 'For ages 3-5, keep sentences under 12 words. For ages 5-7, you can use more descriptive language.',
  },
  {
    title: '🎨 Style Experiment',
    body: 'Try different art styles! Watercolor is great for gentle stories, while bold colors work well for adventures.',
  },
  {
    title: '📚 Series Build Readers',
    body: 'Kids love series! Create multiple books with the same character to build a loyal young readership.',
  },
  {
    title: '🚀 KDP Tip',
    body: 'Price your paperback at $12.99 and enroll in KDP Select for Kindle Unlimited revenue too.',
  },
]

export default function MorningDigestEmail({
  userName = 'there',
  bookCount = 0,
  tipTitle,
  tipBody,
}: MorningDigestEmailProps) {
  const tip = tipTitle && tipBody ? { title: tipTitle, body: tipBody } : TIPS[Math.floor(Math.random() * TIPS.length)]

  return (
    <Html>
      <Head />
      <Preview>Good morning, {userName}! ☀️ Time to create something magical.</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={headerSection}>
            <div style={{ fontSize: '32px', marginBottom: '4px' }}>☀️</div>
            <Text style={greeting}>Good morning, {userName}!</Text>
            <Text style={subGreeting}>Ready to create some magic today?</Text>
          </Section>

          {/* Stats card */}
          {bookCount > 0 && (
            <Section style={statsCard}>
              <Text style={statsNumber}>{bookCount}</Text>
              <Text style={statsLabel}>books created so far 🐰</Text>
            </Section>
          )}

          {/* Tip of the day */}
          <Section style={tipCard}>
            <Text style={tipLabel}>💡 Tip of the Day</Text>
            <Text style={tipTitleStyle}>{tip.title}</Text>
            <Text style={tipBodyStyle}>{tip.body}</Text>
          </Section>

          {/* Quick actions */}
          <Section style={actionsSection}>
            <Link href={`${baseUrl}/create`} style={actionButton}>
              ✨ Start a New Book
            </Link>
            <Link href={`${baseUrl}/pricing`} style={actionButtonSecondary}>
              Upgrade Plan
            </Link>
          </Section>

          {/* Footer */}
          <Hr style={hr} />
          <Section style={footerSection}>
            <Link href={`${baseUrl}/settings/notifications`} style={unsubscribeLink}>
              Unsubscribe from daily emails
            </Link>
            <Text style={footerText}>
              SproutTales — Creating smiles, one story at a time. 🐰
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#FFF5EE',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '32px 20px',
  maxWidth: '480px',
}

const headerSection = { textAlign: 'center' as const, marginBottom: '24px' }
const greeting = { fontSize: '22px', fontWeight: '700', color: '#2D2D2D', margin: '0' }
const subGreeting = { fontSize: '14px', color: '#8E8E93', marginTop: '4px' }

const statsCard = {
  backgroundColor: '#FFFFFF',
  borderRadius: '14px',
  padding: '20px',
  textAlign: 'center' as const,
  marginBottom: '16px',
  border: '1px solid #E5E5EA',
}
const statsNumber = { fontSize: '36px', fontWeight: '800', color: '#FF6B8A', margin: '0' }
const statsLabel = { fontSize: '13px', color: '#8E8E93', marginTop: '2px' }

const tipCard = {
  backgroundColor: '#FFFFFF',
  borderRadius: '14px',
  padding: '20px',
  marginBottom: '20px',
  border: '1px solid #E5E5EA',
  borderLeft: '4px solid #C8A2E8',
}
const tipLabel = { fontSize: '11px', fontWeight: '600', color: '#C8A2E8', textTransform: 'uppercase' as const, letterSpacing: '1px', margin: '0 0 8px 0' }
const tipTitleStyle = { fontSize: '16px', fontWeight: '600', color: '#2D2D2D', margin: '0 0 6px 0' }
const tipBodyStyle = { fontSize: '14px', color: '#8E8E93', lineHeight: '1.5', margin: '0' }

const actionsSection = { textAlign: 'center' as const, marginBottom: '24px' }
const actionButton = {
  display: 'inline-block',
  backgroundColor: '#2D2D2D',
  color: '#FFFFFF',
  fontSize: '14px',
  fontWeight: '600',
  padding: '12px 24px',
  borderRadius: '14px',
  textDecoration: 'none',
  marginRight: '8px',
  marginBottom: '8px',
}
const actionButtonSecondary = {
  display: 'inline-block',
  backgroundColor: '#FFFFFF',
  color: '#2D2D2D',
  fontSize: '14px',
  fontWeight: '600',
  padding: '12px 24px',
  borderRadius: '14px',
  textDecoration: 'none',
  border: '1px solid #E5E5EA',
  marginBottom: '8px',
}

const hr = { border: 'none', borderTop: '1px solid #E5E5EA', margin: '20px 0' }

const footerSection = { textAlign: 'center' as const }
const unsubscribeLink = { fontSize: '11px', color: '#C8A2E8', textDecoration: 'underline' }
const footerText = { fontSize: '11px', color: '#C8A2E8', marginTop: '8px' }
