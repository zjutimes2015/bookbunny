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

interface WelcomeEmailProps {
  userName?: string
  userEmail?: string
}

const baseUrl = process.env.SITE_URL || 'http://localhost:3000'

export default function WelcomeEmail({
  userName = 'there',
  userEmail = '',
}: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to BookBunny — start creating magical stories!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img
              src={`${baseUrl}/bookbunny-logo.png`}
              width="48"
              height="48"
              alt="BookBunny"
              style={logo}
            />
            <Text style={brandName}>BookBunny</Text>
          </Section>

          <Heading style={h1}>Welcome, {userName}! 🐰</Heading>

          <Text style={paragraph}>
            You&apos;ve joined BookBunny — the easiest way to create beautiful,
            character-consistent children&apos;s books with AI.
          </Text>

          <Section style={featureList}>
            <Text style={featureItem}>✨ Upload a photo → AI creates your character</Text>
            <Text style={featureItem}>📖 Write a theme → AI generates a 20-page story</Text>
            <Text style={featureItem}>🎨 Every page keeps your character looking the same</Text>
            <Text style={featureItem}>📚 Export KDP-ready PDF and publish on Amazon</Text>
          </Section>

          <Section style={ctaSection}>
            <Link href={`${baseUrl}/create`} style={ctaButton}>
              Create Your First Book
            </Link>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            If you did not create this account, please ignore this email.
            <br />
            © {new Date().getFullYear()} BookBunny. All rights reserved.
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

const logoSection = {
  textAlign: 'center' as const,
  marginBottom: '24px',
}

const logo = {
  margin: '0 auto',
  borderRadius: '12px',
}

const brandName = {
  fontSize: '20px',
  fontWeight: '700',
  color: '#2D2D2D',
  marginTop: '8px',
}

const h1 = {
  fontSize: '28px',
  fontWeight: '700',
  color: '#2D2D2D',
  textAlign: 'center' as const,
  marginBottom: '16px',
}

const paragraph = {
  fontSize: '15px',
  lineHeight: '1.5',
  color: '#8E8E93',
  textAlign: 'center' as const,
  marginBottom: '24px',
}

const featureList = {
  backgroundColor: '#FFFFFF',
  borderRadius: '14px',
  padding: '20px 24px',
  marginBottom: '24px',
  border: '1px solid #E5E5EA',
}

const featureItem = {
  fontSize: '14px',
  lineHeight: '2',
  color: '#2D2D2D',
  margin: '0',
}

const ctaSection = {
  textAlign: 'center' as const,
  marginBottom: '24px',
}

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

const hr = {
  border: 'none',
  borderTop: '1px solid #E5E5EA',
  margin: '24px 0',
}

const footer = {
  fontSize: '12px',
  color: '#C8A2E8',
  textAlign: 'center' as const,
  lineHeight: '1.5',
}
