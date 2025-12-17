'use client'

import { Button } from '@/components/ui/button'
import { useUser } from '@clerk/nextjs'
import { LogIn, UserPlus } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'

export function SignInButton() {
  const { isSignedIn } = useUser()
  const locale = useLocale()
  const t = useTranslations('auth')

  if (isSignedIn) {
    return null
  }

  return (
    <div className="flex items-center space-x-2">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/${locale}/auth/sign-in`}>
          <LogIn className="h-4 w-4 mr-2" />
          {t('signIn.title')}
        </Link>
      </Button>
      <Button size="sm" asChild>
        <Link href={`/${locale}/auth/sign-up`}>
          <UserPlus className="h-4 w-4 mr-2" />
          {t('signUp.title')}
        </Link>
      </Button>
    </div>
  )
}
