import type { Metadata } from 'next'
import { Lexend_Deca } from 'next/font/google'
import './globals.css'
// Client components moved to individual pages
import '@/lib/ssr-polyfills'
import { validateEnvironment } from '@/lib/env-check'

// Validate environment on startup
validateEnvironment()

const lexendDeca = Lexend_Deca({ 
  subsets: ['latin'],
  variable: '--font-lexend-deca'
})

export const metadata: Metadata = {
  title: {
    default: 'E-Ticaret Mağazası',
    template: '%s | E-Ticaret Mağazası'
  },
  description: 'Modern ve güvenilir e-ticaret deneyimi. Kaliteli ürünler, hızlı teslimat ve müşteri memnuniyeti garantisi.',
  keywords: ['e-ticaret', 'online alışveriş', 'elektronik', 'giyim', 'ev', 'bahçe', 'spor'],
  authors: [{ name: 'E-Ticaret Mağazası' }],
  creator: 'E-Ticaret Mağazası',
  publisher: 'E-Ticaret Mağazası',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://ecommerce-store.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: 'https://ecommerce-store.com',
    title: 'E-Ticaret Mağazası',
    description: 'Modern ve güvenilir e-ticaret deneyimi. Kaliteli ürünler, hızlı teslimat ve müşteri memnuniyeti garantisi.',
    siteName: 'E-Ticaret Mağazası',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'E-Ticaret Mağazası',
    description: 'Modern ve güvenilir e-ticaret deneyimi.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body className={`${lexendDeca.variable} font-lexend-deca`}>
        {children}
      </body>
    </html>
  )
}
