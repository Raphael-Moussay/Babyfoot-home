import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProfilePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: player } = await supabase
    .from('players').select('id').eq('auth_user_id', user.id).single()

  if (player) redirect(`/profile/${player.id}`)
  redirect('/')
}
