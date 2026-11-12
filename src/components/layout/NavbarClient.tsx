'use client'

import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Player } from '@/types'

/** Dimension in pixels for the navbar player avatar image. */
const NAVBAR_AVATAR_SIZE_PX = 28

/** Maximum character length for player initials badge in the navbar. */
const NAVBAR_INITIALS_MAX_LENGTH = 3

/**
 * Props for the NavbarClient component.
 */
interface NavbarClientProps {
  player: Player | null
}

/**
 * Renders the sticky glassmorphic navigation bar styled after Cricket Cut-throat Pro.
 *
 * @param {NavbarClientProps} props - Component properties including the active player profile.
 * @returns {JSX.Element} Rendered sticky navigation header.
 */
export function NavbarClient({ player }: NavbarClientProps): JSX.Element {
  const router = useRouter()
  const supabase = createClient()

  /**
   * Signs out the current user and redirects to the home page.
   *
   * @returns {Promise<void>}
   */
  async function handleSignOut(): Promise<void> {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const playerInitials: string = player
    ? player.display_name.slice(0, NAVBAR_INITIALS_MAX_LENGTH).toUpperCase()
    : ''

  return (
    <nav className="border-b border-white/[0.08] bg-[#0e1118]/95 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="text-xl sm:text-2xl transition-transform group-hover:scale-110">⚽</span>
          <span className="app-title text-base sm:text-xl text-white tracking-wider">
            <span className="hidden sm:inline">Baby-Ménil</span>
            <span className="sm:hidden">Baby</span>
          </span>
          <span className="hidden md:inline-block rounded-lg bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 text-[10px] font-display font-bold uppercase tracking-widest text-emerald-400">
            Pro ELO
          </span>
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Link href="/leaderboard" className="btn-ghost px-2.5 sm:px-3.5 py-1.5 text-[11px] sm:text-xs">
            Classement
          </Link>
          <Link href="/matches" className="btn-ghost px-2.5 sm:px-3.5 py-1.5 text-[11px] sm:text-xs">
            Matchs
          </Link>
          <Link href="/head-to-head" className="btn-ghost px-2.5 sm:px-3.5 py-1.5 text-[11px] sm:text-xs">
            H2H
          </Link>

          {player ? (
            <>
              <Link
                href="/matches/new"
                className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-3 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-display font-bold uppercase tracking-wider text-slate-950 shadow-md shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition-all"
              >
                <span className="sm:hidden">+</span>
                <span className="hidden sm:inline">+ Match</span>
              </Link>
              <Link
                href={`/profile/${player.id}`}
                className="flex items-center gap-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 px-2 py-1 transition-all"
                title={player.display_name}
              >
                {player.avatar_url ? (
                  <Image
                    src={player.avatar_url}
                    alt={player.display_name}
                    width={NAVBAR_AVATAR_SIZE_PX}
                    height={NAVBAR_AVATAR_SIZE_PX}
                    className="rounded-lg border border-white/15"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-[11px] font-display font-bold text-emerald-300">
                    {player.display_name[0]}
                  </div>
                )}
                <span className="hidden sm:inline font-display font-bold text-xs tracking-wider text-slate-200">
                  {playerInitials}
                </span>
              </Link>
              <button
                onClick={handleSignOut}
                className="rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-[11px] font-display font-bold uppercase tracking-wider px-2.5 py-1.5 active:scale-95 transition-all"
              >
                Déco
              </button>
            </>
          ) : (
            <Link
              href="/auth/login"
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-3.5 py-1.5 text-xs font-display font-bold uppercase tracking-wider text-slate-950 shadow-md shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition-all"
            >
              Connexion
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
