import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { formatDate, eloDeltaColor, eloDeltaLabel } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

export default async function PlayerProfilePage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: player } = await supabase
    .from('players').select('*').eq('id', params.id).single()
  if (!player) notFound()

  const { data: stats } = await supabase
    .from('player_stats').select('*').eq('player_id', params.id).single()

  const { data: recentHistory } = await supabase
    .from('elo_history')
    .select('*, matches(created_at, team_a_score, team_b_score, match_type)')
    .eq('player_id', params.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const winRate = stats?.match_count
    ? Math.round((stats.wins / stats.match_count) * 100)
    : 0

  const goalAvg = (stats?.goals_for ?? 0) - (stats?.goals_against ?? 0)

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-10">
        {/* Profile header */}
        <div className="card p-8 mb-6 flex items-center gap-6">
          {player.avatar_url ? (
            <Image src={player.avatar_url} alt={player.display_name}
              width={80} height={80} className="rounded-full border-2 border-pitch-700" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-pitch-900 border-2 border-pitch-700 
                          flex items-center justify-center font-display text-4xl text-pitch-400">
              {player.display_name[0]}
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="font-display text-3xl tracking-wider">{player.display_name}</h1>
              {stats?.last_3_wins && <span className="text-2xl animate-flame">🔥</span>}
            </div>
            <div className="font-display text-5xl gradient-text">{stats?.elo ?? 1000}</div>
            <div className="text-gray-500 text-sm">ELO Rating</div>
          </div>
          <div className="text-right">
            <div className="text-gray-500 text-xs mb-1">Série actuelle</div>
            {(stats?.current_streak ?? 0) > 0 ? (
              <div className="flex items-center gap-1 text-green-400 justify-end">
                <TrendingUp size={16} />
                <span className="font-bold">{stats?.current_streak}W</span>
              </div>
            ) : (stats?.current_streak ?? 0) < 0 ? (
              <div className="flex items-center gap-1 text-red-400 justify-end">
                <TrendingDown size={16} />
                <span className="font-bold">{Math.abs(stats?.current_streak ?? 0)}L</span>
              </div>
            ) : <span className="text-gray-600">—</span>}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Victoires', value: stats?.wins ?? 0, color: 'text-green-400' },
            { label: 'Défaites', value: stats?.losses ?? 0, color: 'text-red-400' },
            { label: 'Win Rate', value: `${winRate}%`, color: 'text-blue-400' },
            { label: 'Goal Average', value: goalAvg > 0 ? `+${goalAvg}` : goalAvg, color: goalAvg >= 0 ? 'text-green-400' : 'text-red-400' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className={`font-display text-3xl ${s.color}`}>{s.value}</div>
              <div className="text-gray-500 text-xs uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Fanny badge */}
        {((stats?.fanny_given ?? 0) > 0 || (stats?.fanny_taken ?? 0) > 0) && (
          <div className="card p-5 mb-6 flex items-center gap-6">
            <div className="text-4xl">🏳️</div>
            <div className="flex gap-8">
              <div>
                <div className="font-display text-3xl text-amber-400">{stats?.fanny_given ?? 0}</div>
                <div className="text-gray-500 text-xs">Fanny données</div>
              </div>
              <div>
                <div className="font-display text-3xl text-red-400">{stats?.fanny_taken ?? 0}</div>
                <div className="text-gray-500 text-xs">Fanny subies</div>
              </div>
            </div>
          </div>
        )}

        {/* Recent ELO history */}
        {recentHistory && recentHistory.length > 0 && (
          <div className="card p-6">
            <h2 className="font-semibold text-gray-400 mb-4 text-sm uppercase tracking-wider">
              Historique ELO récent
            </h2>
            <div className="space-y-2">
              {recentHistory.map((h: any) => (
                <div key={h.id} className="flex items-center justify-between py-1">
                  <div className="text-xs text-gray-600">
                    {formatDate(h.matches?.created_at ?? h.created_at)}
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-gray-500 font-mono">{h.elo_before}</span>
                    <span className="text-gray-700">→</span>
                    <span className="font-semibold font-mono">{h.elo_after}</span>
                    <span className={`font-bold w-10 text-right ${eloDeltaColor(h.delta)}`}>
                      {eloDeltaLabel(h.delta)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
