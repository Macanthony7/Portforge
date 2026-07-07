import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'

export const metadata: Metadata = {
  title: 'Portforge Cyber — Document your security craft.',
  description: 'AI-generated, professional security documentation for penetration testers and CTF players.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased bg-forge-black text-white`}>
        {children}
      </body>
    </html>
  )
}
