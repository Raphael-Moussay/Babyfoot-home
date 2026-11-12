import { createClient } from '@/lib/supabase/server'
import type { Player } from '@/types'
import { NavbarClient } from './NavbarClient'

/**
 * Server component that fetches the authenticated player's profile and renders the top navigation bar.
 *
 * @returns {Promise<JSX.Element>} The rendered navigation bar client component.
 */
export async function Navbar(): Promise<JSX.Element> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let authenticatedPlayer: Player | null = null
  if (user) {
    const { data: playerRecord } = await supabase
      .from('players')
      .select('*')
      .eq('auth_user_id', user.id)
      .single()
    authenticatedPlayer = playerRecord as Player | null
  }

  return <NavbarClient player={authenticatedPlayer} />
}
