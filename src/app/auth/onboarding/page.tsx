'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/** Default redirect route after completing onboarding. */
const DEFAULT_NEXT_ROUTE = '/'

/**
 * Inner client component handling player display name onboarding.
 *
 * @returns {JSX.Element} The rendered onboarding form panel.
 */
function OnboardingClient(): JSX.Element {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextRoute: string = searchParams.get('next') ?? DEFAULT_NEXT_ROUTE
  const supabase = createClient()
  const [displayName, setDisplayName] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [validationError, setValidationError] = useState<string>('')

  useEffect(() => {
    let isMounted = true

    /**
     * Loads the current user's existing display name or initializes a fallback from metadata.
     *
     * @returns {Promise<void>}
     */
    async function loadExistingProfile(): Promise<void> {
      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user) {
        router.replace('/auth/login')
        return
      }

      const { data: playerRecord } = await supabase
        .from('players')
        .select('display_name')
        .eq('auth_user_id', authData.user.id)
        .maybeSingle()

      if (isMounted) {
        const fallbackDisplayName: string =
          authData.user.user_metadata?.full_name ??
          authData.user.email?.split('@')[0] ??
          ''
        setDisplayName(playerRecord?.display_name ?? fallbackDisplayName)
      }
    }

    loadExistingProfile()

    return () => {
      isMounted = false
    }
  }, [router, supabase])

  /**
   * Validates and saves the chosen player display name to Supabase.
   *
   * @param {React.FormEvent<HTMLFormElement>} formEvent - Form submission event.
   * @returns {Promise<void>}
   */
  async function handleFormSubmit(
    formEvent: React.FormEvent<HTMLFormElement>
  ): Promise<void> {
    formEvent.preventDefault()
    setValidationError('')

    const trimmedDisplayName: string = displayName.trim()
    if (!trimmedDisplayName) {
      setValidationError('Veuillez saisir un prénom ou pseudo.')
      return
    }

    setIsSubmitting(true)
    const { data: authData } = await supabase.auth.getUser()
    if (!authData.user) {
      setIsSubmitting(false)
      router.replace('/auth/login')
      return
    }

    const { error: updateError } = await supabase
      .from('players')
      .update({ display_name: trimmedDisplayName })
      .eq('auth_user_id', authData.user.id)

    if (updateError) {
      setIsSubmitting(false)
      setValidationError('Impossible de mettre à jour le pseudo.')
      return
    }

    router.push(nextRoute)
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="panel rounded-3xl p-7 sm:p-9 w-full max-w-md shadow-2xl animate-pop">
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
          <div>
            <h1 className="app-title text-xl sm:text-2xl text-white">Profil Joueur</h1>
            <p className="mt-1 text-xs text-slate-400">
              Identité affichée sur le tableau de score
            </p>
          </div>
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/25 px-3 py-1.5 text-xs font-display font-bold uppercase tracking-widest text-emerald-400">
            Nouveau
          </div>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-5">
          <div>
            <div className="step-tag">Pseudo / Prénom</div>
            <label className="mt-2 block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-2">
              Nom du participant
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="input text-lg tracking-wider"
              placeholder="Votre prénom ou pseudo"
              autoComplete="given-name"
            />
          </div>

          {validationError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs font-display font-bold uppercase tracking-wider">
              {validationError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 px-4 py-4 text-base font-display font-bold uppercase tracking-wider text-slate-950 shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Enregistrement...' : 'Valider et Continuer'}
          </button>
        </form>
      </div>
    </div>
  )
}

/**
 * Renders the onboarding page wrapped in a React Suspense boundary.
 *
 * @returns {JSX.Element} The rendered onboarding page.
 */
export default function OnboardingPage(): JSX.Element {
  return (
    <Suspense fallback={null}>
      <OnboardingClient />
    </Suspense>
  )
}
