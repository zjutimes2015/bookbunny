import { Resend } from 'resend'

const resendApiKey = process.env.RESEND_API_KEY
const fromEmail = process.env.EMAIL_FROM || 'noreply@bookbunny.app'

let resend: Resend | null = null
if (resendApiKey) {
  resend = new Resend(resendApiKey)
}

export type EmailTemplate = 'welcome' | 'book-published' | 'morning-digest'

export async function sendEmail(
  template: EmailTemplate,
  to: string,
  props: Record<string, unknown> = {},
) {
  // In dev mode, log instead of sending
  if (!resend) {
    console.log(`[DEV EMAIL] To: ${to} | Template: ${template}`, props)
    return { success: true, devMode: true }
  }

  try {
    // Dynamic import of template
    const { default: Template } = await import(`@/emails/${template}`)
    const element = React.createElement(Template, props)

    const { error } = await resend.emails.send({
      from: `BookBunny <${fromEmail}>`,
      to,
      subject: getSubject(template, props),
      react: element,
    })

    if (error) {
      console.error('Email send error:', error)
      return { success: false, error }
    }

    return { success: true }
  } catch (err) {
    console.error('Email send failed:', err)
    return { success: false, error: err }
  }
}

function getSubject(template: EmailTemplate, props: Record<string, unknown>): string {
  switch (template) {
    case 'welcome':
      return 'Welcome to BookBunny! 🐰'
    case 'book-published':
      return `Your book "${props.bookTitle || 'Untitled'}" is ready! 📖`
    case 'morning-digest':
      return `Good morning, ${props.userName || 'there'}! ☀️`
    default:
      return 'Message from BookBunny'
  }
}

// Need React for email rendering
import React from 'react'
