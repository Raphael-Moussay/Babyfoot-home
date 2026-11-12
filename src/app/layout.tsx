import type { Metadata, Viewport } from 'next'
import { Chakra_Petch, Plus_Jakarta_Sans } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'

/** Display and scoreboard font matching the Cricket Cut-throat theme. */
const chakraPetch = Chakra_Petch({
  weight: ['500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-display',
})

/** Primary UI body font matching the Cricket Cut-throat theme. */
const plusJakartaSans = Plus_Jakarta_Sans({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-body',
})

/** Default application metadata configuration. */
export const metadata: Metadata = {
  title: 'Baby-Ménil — Pro Tracker',
  description: 'Suivez vos parties de baby-foot, classement ELO et statistiques en temps réel',
  icons: {
    icon: '/favicon.svg',
  },
}

/** Viewport configuration with the Cricket dark background theme color. */
export const viewport: Viewport = {
  themeColor: '#090b10',
}

/**
 * Root layout Props definition.
 */
interface RootLayoutProps {
  children: React.ReactNode
}

/**
 * Renders the top-level HTML shell, font variables, and toast notification provider.
 *
 * @param {RootLayoutProps} props - Component properties containing the child route nodes.
 * @returns {JSX.Element} The rendered root HTML structure.
 */
export default function RootLayout({ children }: RootLayoutProps): JSX.Element {
  return (
    <html lang="fr" className={`${chakraPetch.variable} ${plusJakartaSans.variable}`}>
      <body className="min-h-screen bg-[#090b10] text-slate-100 font-body antialiased selection:bg-emerald-500/30 selection:text-emerald-300">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgba(17, 20, 28, 0.95)',
              color: '#f8fafc',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              backdropFilter: 'blur(12px)',
              fontFamily: 'var(--font-display), "Chakra Petch", sans-serif',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#090b10' } },
            error: { iconTheme: { primary: '#f43f5e', secondary: '#090b10' } },
          }}
        />
      </body>
    </html>
  )
}
