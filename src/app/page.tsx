import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Trophy, Plus, BarChart2, Users, Swords } from 'lucide-react'

/** Fallback count when no records are returned from the database. */
const DEFAULT_EMPTY_COUNT = 0

/** Standard ELO K-factor displayed in the quick stats panel. */
const DISPLAY_ELO_K_FACTOR = 'K=32'

/** Standard Fanny score rule displayed in the quick stats panel. */
const DISPLAY_FANNY_SCORE = '10-0'

/** Icon size in pixels for primary CTA buttons. */
const CTA_ICON_SIZE_PX = 18

/** Icon size in pixels for feature navigation cards. */
const FEATURE_CARD_ICON_SIZE_PX = 22

/**
 * Quick statistic item descriptor displayed on the home page.
 */
interface QuickStatItem {
  icon: string
  label: string
  value: string | number
  valueColorClass: string
}

/**
 * Renders the main landing page with responsive layout and dark glassmorphic panels.
 *
 * @returns {Promise<JSX.Element>} The rendered home page.
 */
export default async function HomePage(): Promise<JSX.Element> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { count: totalMatchCount } = await supabase
    .from('matches')
    .select('*', { count: 'exact', head: true })
  const { count: totalPlayerCount } = await supabase
    .from('players')
    .select('*', { count: 'exact', head: true })

  const quickStats: QuickStatItem[] = [
    {
      icon: '⚽',
      label: 'Matchs Joués',
      value: totalMatchCount ?? DEFAULT_EMPTY_COUNT,
      valueColorClass: 'text-amber-200',
    },
    {
      icon: '👥',
      label: 'Joueurs Inscrits',
      value: totalPlayerCount ?? DEFAULT_EMPTY_COUNT,
      valueColorClass: 'text-emerald-400',
    },
    {
      icon: '🏆',
      label: 'Système ELO',
      value: DISPLAY_ELO_K_FACTOR,
      valueColorClass: 'text-teal-300',
    },
    {
      icon: '🏳️',
      label: 'Règle Fanny',
      value: DISPLAY_FANNY_SCORE,
      valueColorClass: 'text-rose-300',
    },
  ]

  return (
    <main className="min-h-screen max-w-5xl mx-auto px-3 py-3 sm:p-6 space-y-4 sm:space-y-5">
      {/* Top Action Bar */}
      <nav className="flex items-center justify-between gap-2 panel rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg sm:text-xl shrink-0">⚽</span>
          <span className="app-title text-base sm:text-xl text-white truncate">Baby-Ménil</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Link href="/leaderboard" className="btn-ghost px-2.5 sm:px-3.5 py-1.5 text-[11px] sm:text-xs">
            Classement
          </Link>
          {user ? (
            <Link href="/profile" className="btn-amber px-2.5 sm:px-3.5 py-1.5 text-[11px] sm:text-xs">
              Mon Profil
            </Link>
          ) : (
            <Link
              href="/auth/login"
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-3 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-display font-bold uppercase tracking-wider text-slate-950 shadow-md shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition-all"
            >
              Connexion
            </Link>
          )}
        </div>
      </nav>

      {/* Main Hero Panel */}
      <section className="panel rounded-3xl p-4 sm:p-8 md:p-10 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10 pb-5 sm:pb-6">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-amber-400/10 text-amber-300 text-[10px] sm:text-xs uppercase font-display font-bold tracking-widest border border-amber-400/20 mb-2.5 sm:mb-3">
              🏆 Ligue Officielle Baby-Ménil
            </div>
            <h1 className="app-title text-2xl sm:text-4xl md:text-5xl text-white leading-tight">
              Baby-Foot <span className="gradient-text">Ménil</span>
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
              Compteur de matchs, classement ELO en temps réel, statistiques de Fanny et confrontations directes.
            </p>
          </div>
          <div className="hidden sm:block rounded-xl bg-emerald-500/10 border border-emerald-500/25 px-3.5 py-2 text-xs font-display font-bold uppercase tracking-widest text-emerald-400 shrink-0">
            Saison ELO
          </div>
        </div>

        {/* Scoreboard Quick Stats */}
        <div className="mt-5 sm:mt-6">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="step-tag">Tableau de Bord</div>
            <span className="text-[11px] sm:text-xs font-display uppercase tracking-wider text-slate-400">
              Statistiques Globales
            </span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            {quickStats.map((statItem: QuickStatItem) => (
              <div key={statItem.label} className="score-card text-center py-3 sm:py-4 px-2 sm:px-3 min-w-0">
                <div className="player-initials text-[11px] sm:text-xs text-slate-400 flex items-center justify-center gap-1">
                  <span className="shrink-0">{statItem.icon}</span>
                  <span className="truncate">{statItem.label}</span>
                </div>
                <div className={`mt-1.5 sm:mt-2 text-xl sm:text-3xl font-black score-value ${statItem.valueColorClass}`}>
                  {statItem.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-2.5 sm:gap-3">
          <Link
            href="/leaderboard"
            className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 px-4 py-3.5 sm:px-5 sm:py-4 text-sm sm:text-base font-display font-bold uppercase tracking-wider text-slate-950 shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-[0.99] transition-all"
          >
            <Trophy size={CTA_ICON_SIZE_PX} /> Voir le Classement
          </Link>
          {user ? (
            <Link
              href="/matches/new"
              className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-400 px-4 py-3.5 sm:px-5 sm:py-4 text-sm sm:text-base font-display font-bold uppercase tracking-wider text-slate-950 shadow-lg shadow-amber-400/20 hover:brightness-110 active:scale-[0.99] transition-all"
            >
              <Plus size={CTA_ICON_SIZE_PX} /> Nouveau Match
            </Link>
          ) : (
            <Link
              href="/auth/login"
              className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-3.5 sm:px-5 sm:py-4 text-sm sm:text-base font-display font-bold uppercase tracking-wider text-white active:scale-[0.99] transition-all"
            >
              <Users size={CTA_ICON_SIZE_PX} /> Rejoindre la Ligue
            </Link>
          )}
        </div>
      </section>

      {/* Navigation Modules Panel */}
      <section className="panel rounded-3xl p-4 sm:p-6 shadow-2xl space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="step-tag">Navigation</div>
            <h2 className="mt-1.5 text-xs uppercase tracking-wider font-semibold text-slate-400">
              Modes & Statistiques
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          <Link
            href="/leaderboard"
            className="p-4 sm:p-5 rounded-2xl bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/40 transition-all space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-display font-bold text-amber-300 text-sm sm:text-base uppercase tracking-wide">
                <Trophy size={FEATURE_CARD_ICON_SIZE_PX} className="text-amber-400 shrink-0" />
                <span>Classement ELO</span>
              </div>
              <span className="font-display text-xs text-amber-400/80 group-hover:translate-x-1 transition-transform">
                →
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Podium, séries de victoires <strong className="text-amber-300">🔥</strong>, Goal Average et bilan des Fanny.
            </p>
          </Link>

          <Link
            href="/matches"
            className="p-4 sm:p-5 rounded-2xl bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/40 transition-all space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-display font-bold text-emerald-300 text-sm sm:text-base uppercase tracking-wide">
                <BarChart2 size={FEATURE_CARD_ICON_SIZE_PX} className="text-emerald-400 shrink-0" />
                <span>Historique</span>
              </div>
              <span className="font-display text-xs text-emerald-400/80 group-hover:translate-x-1 transition-transform">
                →
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Journal complet des rencontres <strong className="text-white">1v1 & 2v2</strong> avec détail manche par manche.
            </p>
          </Link>

          <Link
            href="/head-to-head"
            className="p-4 sm:p-5 rounded-2xl bg-teal-500/5 hover:bg-teal-500/10 border border-teal-500/20 hover:border-teal-500/40 transition-all space-y-2 group sm:col-span-2 md:col-span-1"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-display font-bold text-teal-300 text-sm sm:text-base uppercase tracking-wide">
                <Swords size={FEATURE_CARD_ICON_SIZE_PX} className="text-teal-300 shrink-0" />
                <span>Head-to-Head</span>
              </div>
              <span className="font-display text-xs text-teal-300/80 group-hover:translate-x-1 transition-transform">
                →
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Confrontations directes, ratios de victoires et <strong className="text-teal-300">Fanny infligées</strong>.
            </p>
          </Link>
        </div>
      </section>
    </main>
  )
}
