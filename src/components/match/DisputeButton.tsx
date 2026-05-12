'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { AlertTriangle } from 'lucide-react'

export function DisputeButton({ matchId }: { matchId: string }) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const supabase = createClient()

  async function handleDispute() {
    if (done) return
    const reason = window.prompt('Raison du litige (optionnel) :')
    if (reason === null) return // cancelled

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { toast.error('Connectez-vous pour signaler un litige'); return }

      const { data: player } = await supabase
        .from('players').select('id').eq('auth_user_id', user.id).single()
      if (!player) { toast.error('Joueur introuvable'); return }

      const { error } = await supabase.from('match_disputes').insert({
        match_id: matchId,
        reported_by: player.id,
        reason: reason || null,
      })

      // Also mark match as disputed
      await supabase.from('matches').update({ status: 'disputed' }).eq('id', matchId)

      if (error) throw error
      toast.success('Litige signalé !')
      setDone(true)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDispute}
      disabled={loading || done}
      className="flex items-center gap-1 text-gray-600 hover:text-red-400 transition-colors disabled:opacity-50"
    >
      <AlertTriangle size={12} />
      {done ? 'Litige signalé' : 'Signaler un litige'}
    </button>
  )
}
