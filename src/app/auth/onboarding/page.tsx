'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function OnboardingClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/'
  const supabase = createClient()
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    async function loadProfile() {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        router.replace('/auth/login')
        return
      }

      const { data: player } = await supabase
        .from('players')
        .select('display_name')
        .eq('auth_user_id', data.user.id)
        .maybeSingle()

      if (mounted) {
        const fallbackName = data.user.user_metadata?.full_name
          ?? data.user.email?.split('@')[0]
          ?? ''
        setDisplayName(player?.display_name ?? fallbackName)
      }
    }

    loadProfile()

    return () => {
      mounted = false
    }
  }, [router, supabase])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    const trimmed = displayName.trim()
    if (!trimmed) {
      setError('Veuillez saisir un prenom.')
      return
    }

    setLoading(true)
    const { data } = await supabase.auth.getUser()
    if (!data.user) {
      setLoading(false)
      router.replace('/auth/login')
      return
    }

    const { error: updateError } = await supabase
      .from('players')
      .update({ display_name: trimmed })
      .eq('auth_user_id', data.user.id)

    if (updateError) {
      setLoading(false)
      setError('Impossible de mettre a jour le prenom.')
      return
    }

    router.push(next)
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="fixed inset-0 pitch-texture opacity-30" />
      <div className="fixed inset-0 bg-gradient-radial from-pitch-950/30 via-transparent to-transparent" />

      <div className="relative z-10 card p-10 w-full max-w-sm text-center animate-pop">
        <div className="text-5xl mb-4">📝</div>
        <h1 className="font-display text-3xl gradient-text mb-2">Choisir un prenom</h1>
        <p className="text-gray-500 text-sm mb-8">
          Ce prenom sera affiche dans le classement et les matchs.
        </p>

        <form onSubmit={handleSubmit} className="text-left">
          <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">
            Prenom
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="input w-full"
            placeholder="Votre prenom"
            autoComplete="given-name"
          />

          {error && (
            <div className="text-red-400 text-xs mt-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-6"
          >
            {loading ? 'Enregistrement...' : 'Continuer'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingClient />
    </Suspense>
  )
}
