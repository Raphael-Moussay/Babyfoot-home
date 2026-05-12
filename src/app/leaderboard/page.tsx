import { createClient } from '@/lib/supabase/server'
import { Trophy, Flame, TrendingUp, TrendingDown } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import type { LeaderboardEntry } from '@/types'
import { Navbar } from '@/components/layout/Navbar'

export const revalidate = 60

export default async function LeaderboardPage() {
  const supabase = createClient()

  const { data: entries } = await supabase
    .from('leaderboard')
    .select('*')
    .order('elo', { ascending: false })

  const players = (entries ?? []) as LeaderboardEntry[]

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Trophy className="text-gold-500" size={28} />
          <h1 className="font-display text-4xl tracking-wider">CLASSEMENT ELO</h1>
        </div>

        {/* Podium top 3 */}
        {players.length >= 3 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[players[1], players[0], players[2]].map((p, podiumPos) => {
              const rank = podiumPos === 1 ? 1 : podiumPos === 0 ? 2 : 3
              const heights = ['h-28', 'h-36', 'h-24']
              const colors = ['bg-gray-500/20', 'bg-gold-500/20', 'bg-amber-700/20']
              const medals = ['🥈', '🥇', '🥉']
              return (
                <Link
                  key={p.id}
                  href={`/profile/${p.id}`}
                  className={`card ${colors[podiumPos]} p-4 text-center flex flex-col items-center justify-end 
                             ${heights[podiumPos]} hover:border-pitch-700 transition-all`}
                >
                  <div className="text-2xl mb-1">{medals[podiumPos]}</div>
                  {p.avatar_url && (
                    <Image src={p.avatar_url} alt={p.display_name} width={40} height={40}
                      className="rounded-full border-2 border-[#2a2d3a] mb-1" />
                  )}
                  <div className="font-semibold text-sm truncate w-full text-center">{p.display_name}</div>
                  <div className="font-display text-xl gradient-text">{p.elo}</div>
                  {p.last_3_wins && <span className="text-lg animate-flame">🔥</span>}
                </Link>
              )
            })}
          </div>
        )}

        {/* Full table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2a2d3a]">
                  {['#', 'Joueur', 'ELO', 'V/D', 'Win%', 'GA', '🏳️ Données/Subies', 'Série'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {players.map((p, i) => (
                  <tr key={p.id}
                    className="border-b border-[#1a1d27] hover:bg-[#1a1d27]/50 transition-colors">
                    <td className="px-4 py-3 text-gray-500 font-mono text-sm">{i + 1}</td>
                    <td className="px-4 py-3">
                      <Link href={`/profile/${p.id}`} className="flex items-center gap-2 hover:text-pitch-400 transition-colors">
                        {p.avatar_url ? (
                          <Image src={p.avatar_url} alt={p.display_name} width={32} height={32}
                            className="rounded-full border border-[#2a2d3a]" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#2a2d3a] flex items-center justify-center text-sm font-semibold">
                            {p.display_name[0]}
                          </div>
                        )}
                        <span className="font-semibold">{p.display_name}</span>
                        {p.last_3_wins && <span className="animate-flame text-lg">🔥</span>}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-display text-xl gradient-text">{p.elo}</span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="text-green-400">{p.wins}V</span>
                      <span className="text-gray-600 mx-1">/</span>
                      <span className="text-red-400">{p.losses}D</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">{p.win_rate}%</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={p.goal_average >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {p.goal_average > 0 ? '+' : ''}{p.goal_average}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      <span title="Données">{p.fanny_given}🎯</span>
                      <span className="mx-1 text-gray-600">/</span>
                      <span title="Subies">{p.fanny_taken}😢</span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {p.current_streak > 0 ? (
                        <span className="flex items-center gap-1 text-green-400">
                          <TrendingUp size={14} />{p.current_streak}
                        </span>
                      ) : p.current_streak < 0 ? (
                        <span className="flex items-center gap-1 text-red-400">
                          <TrendingDown size={14} />{Math.abs(p.current_streak)}
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {players.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              <div className="text-4xl mb-3">🏆</div>
              <p>Aucun joueur pour l'instant.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
