import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import '@/app/globals.css'
import { ToastContainer } from 'react-toastify'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { BoardSettingsProvider } from '@/contexts/BoardSettingsContext'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Learn Chess',
  description: 'Learn chess with Jose Raul Capablanca',
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  // Validate that the incoming `locale` parameter is valid
  if (!['en'].includes(locale)) {
    notFound()
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <link rel="icon" href="/images/favicon/knight.webp" />
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col flex-1 h-full`}>
        <NextIntlClientProvider messages={messages}>
          <BoardSettingsProvider>
            <ToastContainer position="top-right" autoClose={5000} hideProgressBar theme="light" closeOnClick />
            {children}
          </BoardSettingsProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
