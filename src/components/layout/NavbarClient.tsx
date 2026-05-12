'use client'

import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Player } from '@/types'

interface Props {
  player: Player | null
}

export function NavbarClient({ player }: Props) {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="border-b border-[#2a2d3a] bg-[#0c0e14]/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 h-12 sm:h-14 flex items-center justify-between">
        <Link href="/" className="font-display text-base sm:text-xl gradient-text tracking-wider">
          <span className="hidden sm:inline">BABYFOOT TRACKER</span>
          <span className="sm:hidden">BABYFOOT</span>
        </Link>

        <div className="flex items-center gap-1 text-xs sm:text-sm">
          <Link href="/leaderboard" className="btn-ghost px-2 py-1">Class.</Link>
          <Link href="/matches" className="btn-ghost px-2 py-1">Matchs</Link>
          <Link href="/head-to-head" className="btn-ghost px-2 py-1">H2H</Link>

          {player ? (
            <>
              <Link href="/matches/new" className="btn-primary text-xs sm:text-sm ml-1 sm:ml-2 px-2 py-1">
                <span className="sm:hidden">+</span>
                <span className="hidden sm:inline">+ Match</span>
              </Link>
              <Link href={`/profile/${player.id}`} className="ml-1 sm:ml-2 flex items-center gap-2 hover:opacity-80 transition-opacity">
                {player.avatar_url ? (
                  <Image src={player.avatar_url} alt={player.display_name} width={28} height={28}
                    className="rounded-full border border-[#2a2d3a]" />
                ) : (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-pitch-800 flex items-center justify-center text-xs sm:text-sm font-bold">
                    {player.display_name[0]}
                  </div>
                )}
              </Link>
              <button onClick={handleSignOut} className="btn-ghost text-gray-500 text-[11px] sm:text-xs px-2 py-1">
                Déco
              </button>
            </>
          ) : (
            <Link href="/auth/login" className="btn-primary text-xs sm:text-sm ml-1 sm:ml-2 px-2 py-1">Connexion</Link>
          )}
        </div>
      </div>
    </nav>
  )
}
