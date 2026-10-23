'use client'

import Script from 'next/script'

/**
 * Crisp is a support widget, never needed for first paint, so it loads with
 * next/script's lazyOnload strategy (browser idle time) instead of on mount.
 * The inline bootstrap keeps the vendor's own injection snippet untouched.
 */
export default function CrispChat() {
  const websiteId = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID
  if (!websiteId) return null

  return (
    <Script
      id="crisp-chat"
      strategy="lazyOnload"
      dangerouslySetInnerHTML={{
        __html: `window.$crisp=[];window.CRISP_WEBSITE_ID="${websiteId}";(function(){var d=document;var s=d.createElement("script");s.src="https://client.crisp.chat/l.js";s.async=1;d.getElementsByTagName("head")[0].appendChild(s);})();`,
      }}
    />
  )
}
