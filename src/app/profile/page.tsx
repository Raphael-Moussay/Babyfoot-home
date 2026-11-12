import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Redirects the authenticated user to their personal player profile page,
 * or to the login/home page if unauthenticated or not yet registered.
 *
 * @returns {Promise<never>} Always redirects to the appropriate route.
 */
export default async function ProfilePage(): Promise<never> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: playerRecord } = await supabase
    .from('players')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (playerRecord) redirect(`/profile/${playerRecord.id}`)
  redirect('/')
}
