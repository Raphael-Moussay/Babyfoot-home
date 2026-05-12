import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Trophy, Plus, BarChart2, Users, Swords } from 'lucide-react'

export default async function HomePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Quick stats
  const { count: matchCount } = await supabase.from('matches').select('*', { count: 'exact', head: true })
  const { count: playerCount } = await supabase.from('players').select('*', { count: 'exact', head: true })

  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 pitch-texture" />
        <div className="absolute inset-0 bg-gradient-to-b from-pitch-950/80 via-[#0c0e14]/60 to-[#0c0e14]" />
        
        {/* Nav */}
        <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <span className="text-3xl font-display tracking-wider gradient-text">BABYFOOT</span>
            <span className="text-xs text-pitch-500 bg-pitch-950 border border-pitch-800 px-2 py-0.5 rounded-full font-semibold">TRACKER</span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Link href="/profile" className="btn-ghost text-sm">Mon Profil</Link>
            ) : (
              <Link href="/auth/login" className="btn-primary text-sm">Connexion</Link>
            )}
          </div>
        </nav>

        {/* Hero content */}
        <div className="relative z-10 text-center px-6 py-20 max-w-4xl mx-auto">
          <div className="text-8xl mb-6">⚽</div>
          <h1 className="font-display text-6xl md:text-8xl tracking-wider mb-4">
            <span className="gradient-text">BABY-FOOT</span>
            <br />
            <span className="text-white">TRACKER</span>
          </h1>
          <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
            Classement ELO, statistiques avancées et historique complet de vos parties.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/leaderboard" className="btn-primary flex items-center gap-2">
              <Trophy size={18} /> Classement
            </Link>
            {user && (
              <Link href="/matches/new" className="btn-secondary flex items-center gap-2">
                <Plus size={18} /> Nouveau match
              </Link>
            )}
            <Link href="/auth/login" className="btn-ghost flex items-center gap-2">
              <Users size={18} /> Ajouter un joueur
            </Link>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="max-w-6xl mx-auto px-6 py-12 w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {[
            { icon: '⚽', label: 'Matchs joués', value: matchCount ?? 0 },
            { icon: '👥', label: 'Joueurs inscrits', value: playerCount ?? 0 },
            { icon: '🏆', label: 'Système ELO', value: 'K=32' },
            { icon: '🏳️', label: 'Règle Fanny', value: '10-0' },
          ].map((stat) => (
            <div key={stat.label} className="card p-5 text-center animate-fade-in">
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="font-display text-3xl gradient-text">{stat.value}</div>
              <div className="text-gray-500 text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Navigation cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <Link href="/leaderboard" className="card p-6 hover:border-pitch-700 transition-colors group">
            <Trophy className="text-gold-500 mb-3 group-hover:scale-110 transition-transform" size={32} />
            <h2 className="font-display text-2xl mb-2">CLASSEMENT</h2>
            <p className="text-gray-500 text-sm">Classement ELO, streaks 🔥 et statistiques globales</p>
          </Link>
          
          <Link href="/matches" className="card p-6 hover:border-pitch-700 transition-colors group">
            <BarChart2 className="text-pitch-400 mb-3 group-hover:scale-110 transition-transform" size={32} />
            <h2 className="font-display text-2xl mb-2">HISTORIQUE</h2>
            <p className="text-gray-500 text-sm">Tous les matchs joués avec détail des manches</p>
          </Link>

          <Link href="/head-to-head" className="card p-6 hover:border-pitch-700 transition-colors group">
            <Swords className="text-blue-400 mb-3 group-hover:scale-110 transition-transform" size={32} />
            <h2 className="font-display text-2xl mb-2">HEAD-TO-HEAD</h2>
            <p className="text-gray-500 text-sm">Comparez les stats directes entre deux joueurs</p>
          </Link>
        </div>
      </div>
    </main>
  )
}
