import { defaultLocale } from '@/translate/i18n/config'
import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect(`/${defaultLocale}`)
}
