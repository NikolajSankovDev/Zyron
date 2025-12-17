import { useLocale, useTranslations } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'

interface LogoProps {
  withLink?: boolean
  className?: string
}

export const Logo = ({
  withLink = true,
  className = 'flex items-center gap-2',
}: LogoProps) => {
  const t = useTranslations('app')
  const locale = useLocale()

  const LogoContent = () => (
    <>
      <Image src="/logo.png" alt="logo" width={40} height={40} />
      <span className="text-lg font-semibold">{t('name')}</span>
    </>
  )

  if (withLink) {
    return (
      <Link href={`/${locale}/`} className={className}>
        <LogoContent />
      </Link>
    )
  }

  return (
    <div className={className}>
      <LogoContent />
    </div>
  )
}

export default Logo
