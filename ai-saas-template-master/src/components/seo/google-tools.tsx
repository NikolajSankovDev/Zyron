'use client'

import { env } from '@/env'
import { GoogleAnalytics } from '@next/third-parties/google'

export function GoogleTools() {
  const gaId = env.NEXT_PUBLIC_GA_MEASUREMENT_ID

  if (!gaId) {
    return null
  }

  return <GoogleAnalytics gaId={gaId} />
}
