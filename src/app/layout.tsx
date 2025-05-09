import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { ToastContainer } from 'react-toastify'

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <link rel="icon" href="/images/favicon/knight.webp" />
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col flex-1 h-full`}>
        <ToastContainer position="top-right" autoClose={5000} hideProgressBar theme="light" closeOnClick />
        {children}
      </body>
    </html>
  )
}
