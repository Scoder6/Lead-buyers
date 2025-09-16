import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ErrorBoundary from '@/components/error-boundary'
import { Providers } from '@/components/providers'
import Navbar from '@/components/layout/navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Buyer Lead Intake - Real Estate CRM',
  description: 'Manage and track buyer leads for real estate properties with advanced filtering, CSV import/export, and comprehensive lead management.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <ErrorBoundary>
            <ErrorBoundary>
              <Navbar />
              {children}
            </ErrorBoundary>
          </ErrorBoundary>
        </Providers>
      </body>
    </html>
  )
}
