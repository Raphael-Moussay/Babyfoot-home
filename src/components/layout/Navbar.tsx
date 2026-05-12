import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { NavbarClient } from './NavbarClient'

export async function Navbar() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let player = null
  if (user) {
    const { data } = await supabase.from('players').select('*').eq('auth_user_id', user.id).single()
    player = data
  }

  return <NavbarClient player={player} />
}
