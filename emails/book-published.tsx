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

interface BookPublishedEmailProps {
  userName?: string
  bookTitle?: string
  bookUrl?: string
}

const baseUrl = process.env.SITE_URL || 'http://localhost:3000'

export default function BookPublishedEmail({
  userName = 'there',
  bookTitle = 'My Story',
  bookUrl = '',
}: BookPublishedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your book "{bookTitle}" is ready! Download your PDF now.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <div style={{ fontSize: '40px', textAlign: 'center' }}>📖</div>
            <Text style={brandName}>SproutTales</Text>
          </Section>

          <Heading style={h1}>Your Book is Ready! 🎉</Heading>

          <Text style={paragraph}>
            Hi {userName}, your story <strong>"{bookTitle}"</strong> has been created and is ready to download.
          </Text>

          <Section style={bookCard}>
            <div style={{ fontSize: '48px', marginBottom: '8px' }}>📚</div>
            <Text style={bookTitleStyle}>{bookTitle}</Text>
            <Text style={bookMeta}>Created with SproutTales</Text>
          </Section>

          <Section style={ctaSection}>
            <Link href={bookUrl || `${baseUrl}/create`} style={ctaButton}>
              View & Download Your Book
            </Link>
          </Section>

          <Text style={paragraph}>
            Next steps: Upload your PDF to Amazon KDP, publish as a paperback or Kindle eBook,
            and share your story with the world!
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            Happy storytelling!
            <br />
            🐰 The SproutTales Team
          </Text>
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
  padding: '40px 20px',
  maxWidth: '520px',
}

const logoSection = { textAlign: 'center' as const, marginBottom: '24px' }
const brandName = { fontSize: '20px', fontWeight: '700', color: '#2D2D2D', marginTop: '4px' }
const h1 = { fontSize: '28px', fontWeight: '700', color: '#2D2D2D', textAlign: 'center' as const, marginBottom: '16px' }
const paragraph = { fontSize: '15px', lineHeight: '1.5', color: '#8E8E93', textAlign: 'center' as const, marginBottom: '24px' }

const bookCard = {
  backgroundColor: '#FFFFFF',
  borderRadius: '14px',
  padding: '24px',
  textAlign: 'center' as const,
  marginBottom: '24px',
  border: '1px solid #E5E5EA',
}

const bookTitleStyle = { fontSize: '18px', fontWeight: '600', color: '#2D2D2D', margin: '0' }
const bookMeta = { fontSize: '13px', color: '#C8A2E8', marginTop: '4px' }

const ctaSection = { textAlign: 'center' as const, marginBottom: '24px' }
const ctaButton = {
  display: 'inline-block',
  backgroundColor: '#2D2D2D',
  color: '#FFFFFF',
  fontSize: '15px',
  fontWeight: '600',
  padding: '12px 28px',
  borderRadius: '14px',
  textDecoration: 'none',
}

const hr = { border: 'none', borderTop: '1px solid #E5E5EA', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#C8A2E8', textAlign: 'center' as const, lineHeight: '1.5' }
