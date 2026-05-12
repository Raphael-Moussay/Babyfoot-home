import type { Metadata } from 'next'
import { Bebas_Neue, DM_Sans } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
})

export const metadata: Metadata = {
  title: 'Baby-foot Tracker',
  description: 'Suivez vos parties de baby-foot, classement ELO et statistiques',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${bebasNeue.variable} ${dmSans.variable}`}>
      <body className="bg-[#0c0e14] text-white font-body antialiased min-h-screen">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1a1d27', color: '#fff', border: '1px solid #2a2d3a' },
            success: { iconTheme: { primary: '#4ade80', secondary: '#0c0e14' } },
            error: { iconTheme: { primary: '#f87171', secondary: '#0c0e14' } },
          }}
        />
      </body>
    </html>
  )
}
