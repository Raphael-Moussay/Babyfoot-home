import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  let exchangeError: { message?: string; status?: number; code?: string | number } | null = null

  if (code) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    exchangeError = error

    if (!error && data.user) {
      const googleUser = data.user
      const defaultName = googleUser.user_metadata?.full_name
        ?? googleUser.email?.split('@')[0]
        ?? 'Joueur'

      const { data: existingPlayer } = await supabase
        .from('players')
        .select('id')
        .eq('auth_user_id', googleUser.id)
        .maybeSingle()

      const isNewPlayer = !existingPlayer

      // Upsert player record from Google profile
      const { error: upsertErr } = await supabase.from('players').upsert(
        {
          auth_user_id: googleUser.id,
          display_name: defaultName,
          email: googleUser.email!,
          avatar_url: googleUser.user_metadata?.avatar_url,
        },
        { onConflict: 'auth_user_id', ignoreDuplicates: false }
      )

      if (upsertErr) console.error('Player upsert error:', upsertErr)

      // Ensure player_stats row exists
      const { data: player } = await supabase
        .from('players')
        .select('id')
        .eq('auth_user_id', googleUser.id)
        .single()

      if (player) {
        await supabase.from('player_stats').upsert(
          { player_id: player.id },
          { onConflict: 'player_id', ignoreDuplicates: true }
        )
      }

      if (isNewPlayer) {
        const params = new URLSearchParams({ next })
        return NextResponse.redirect(`${origin}/auth/onboarding?${params.toString()}`)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  const errorReason = code ? 'exchange_failed' : 'missing_code'
  const errorMessage = code && exchangeError
    ? `${exchangeError.message ?? 'Echec echange code OAuth.'} (status ${exchangeError.status ?? 'n/a'})`
    : 'Code OAuth manquant.'
  const errorCode = code && exchangeError?.code ? String(exchangeError.code) : ''
  const errorParams = new URLSearchParams({
    reason: errorReason,
    message: errorMessage,
    code: errorCode,
  })
  return NextResponse.redirect(`${origin}/auth/error?${errorParams.toString()}`)
}
