'use client'

import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { usePathname, useRouter } from 'next/navigation'
import type { Player } from '@/types'

/** Dimension in pixels for the navbar player avatar image. */
const NAVBAR_AVATAR_SIZE_PX = 26

/** Maximum character length for player initials badge in the navbar. */
const NAVBAR_INITIALS_MAX_LENGTH = 3

/** Route path for the leaderboard page. */
const ROUTE_LEADERBOARD = '/leaderboard'

/** Route path for the matches history page. */
const ROUTE_MATCHES = '/matches'

/** Route path for the head-to-head comparison page. */
const ROUTE_HEAD_TO_HEAD = '/head-to-head'

/** Route path for the new match creation page. */
const ROUTE_NEW_MATCH = '/matches/new'

/**
 * Props for the NavbarClient component.
 */
interface NavbarClientProps {
  player: Player | null
}

/**
 * Renders the sticky responsive glassmorphic navigation bar, hiding the link of the active page.
 *
 * @param {NavbarClientProps} props - Component properties including the active player profile.
 * @returns {JSX.Element} Rendered sticky navigation header.
 */
export function NavbarClient({ player }: NavbarClientProps): JSX.Element {
  const router = useRouter()
  const currentPathname: string = usePathname()
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

  const isOnLeaderboardPage: boolean = currentPathname === ROUTE_LEADERBOARD
  const isOnMatchesPage: boolean = currentPathname === ROUTE_MATCHES
  const isOnHeadToHeadPage: boolean = currentPathname === ROUTE_HEAD_TO_HEAD
  const isOnNewMatchPage: boolean = currentPathname === ROUTE_NEW_MATCH

  return (
    <nav className="border-b border-white/[0.08] bg-[#0e1118]/95 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-2.5 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-2">
        <Link href="/" className="flex items-center gap-1.5 sm:gap-2.5 group shrink-0">
          <span className="text-lg sm:text-2xl transition-transform group-hover:scale-110">⚽</span>
          <span className="app-title text-sm sm:text-xl text-white tracking-wider">
            <span className="hidden sm:inline">Baby-Ménil</span>
            <span className="sm:hidden">Baby</span>
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-1">
          {!isOnLeaderboardPage && (
            <Link
              href={ROUTE_LEADERBOARD}
              className="btn-ghost px-2 sm:px-3.5 py-1.5 text-[11px] sm:text-xs shrink-0"
            >
              <span className="sm:hidden">Class.</span>
              <span className="hidden sm:inline">Classement</span>
            </Link>
          )}
          {!isOnMatchesPage && (
            <Link
              href={ROUTE_MATCHES}
              className="btn-ghost px-2 sm:px-3.5 py-1.5 text-[11px] sm:text-xs shrink-0"
            >
              Matchs
            </Link>
          )}
          {!isOnHeadToHeadPage && (
            <Link
              href={ROUTE_HEAD_TO_HEAD}
              className="btn-ghost px-2 sm:px-3.5 py-1.5 text-[11px] sm:text-xs shrink-0"
            >
              H2H
            </Link>
          )}

          {player ? (
            <>
              {!isOnNewMatchPage && (
                <Link
                  href={ROUTE_NEW_MATCH}
                  className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-2.5 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-display font-bold uppercase tracking-wider text-slate-950 shadow-md shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition-all shrink-0"
                >
                  <span className="sm:hidden">+</span>
                  <span className="hidden sm:inline">+ Match</span>
                </Link>
              )}
              <Link
                href={`/profile/${player.id}`}
                className="flex items-center gap-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 px-1.5 sm:px-2 py-1 transition-all shrink-0"
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
                <span className="hidden md:inline font-display font-bold text-xs tracking-wider text-slate-200">
                  {playerInitials}
                </span>
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-[10px] sm:text-[11px] font-display font-bold uppercase tracking-wider px-2 sm:px-2.5 py-1.5 active:scale-95 transition-all shrink-0"
              >
                Déco
              </button>
            </>
          ) : (
            <Link
              href="/auth/login"
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-2.5 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-display font-bold uppercase tracking-wider text-slate-950 shadow-md shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition-all shrink-0"
            >
              Connexion
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
