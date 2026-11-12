'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { AlertTriangle } from 'lucide-react'

/** Icon size in pixels for the dispute warning icon. */
const DISPUTE_ICON_SIZE_PX = 13

/**
 * Props for the DisputeButton component.
 */
interface DisputeButtonProps {
  matchId: string
}

/**
 * Renders a button allowing an authenticated player to flag a match as disputed.
 *
 * @param {DisputeButtonProps} props - Component properties containing the target match ID.
 * @returns {JSX.Element} The rendered dispute button.
 */
export function DisputeButton({ matchId }: DisputeButtonProps): JSX.Element {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [isDisputeReported, setIsDisputeReported] = useState<boolean>(false)
  const supabase = createClient()

  /**
   * Prompts the user for an optional reason and records the match dispute in Supabase.
   *
   * @returns {Promise<void>}
   */
  async function handleDisputeReport(): Promise<void> {
    if (isDisputeReported) return
    const disputeReason: string | null = window.prompt('Raison du litige (optionnel) :')
    if (disputeReason === null) return

    setIsSubmitting(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Connectez-vous pour signaler un litige')
        return
      }

      const { data: playerRecord } = await supabase
        .from('players')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()
      if (!playerRecord) {
        toast.error('Joueur introuvable')
        return
      }

      const { error: insertError } = await supabase.from('match_disputes').insert({
        match_id: matchId,
        reported_by: playerRecord.id,
        reason: disputeReason || null,
      })

      await supabase.from('matches').update({ status: 'disputed' }).eq('id', matchId)

      if (insertError) throw insertError
      toast.success('Litige signalé !')
      setIsDisputeReported(true)
    } catch (disputeError: unknown) {
      const errorMessage: string =
        disputeError instanceof Error ? disputeError.message : 'Erreur lors du signalement'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleDisputeReport}
      disabled={isSubmitting || isDisputeReported}
      className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 px-3 py-1.5 font-display font-bold uppercase tracking-wider text-rose-300 transition-all disabled:opacity-50"
    >
      <AlertTriangle size={DISPUTE_ICON_SIZE_PX} />
      <span>{isDisputeReported ? 'Litige signalé' : 'Signaler un litige'}</span>
    </button>
  )
}
