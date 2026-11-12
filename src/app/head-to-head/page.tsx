import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { HeadToHeadClient } from '@/components/match/HeadToHeadClient'

/**
 * Renders the Head-to-Head comparison page styled after Cricket Cut-throat Pro.
 *
 * @returns {Promise<JSX.Element>} The rendered Head-to-Head page.
 */
export default async function HeadToHeadPage(): Promise<JSX.Element> {
  const supabase = createClient()

  const { data: playersRecords } = await supabase
    .from('players')
    .select('id, display_name, avatar_url')
    .order('display_name')

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto p-3 sm:p-6 space-y-5">
        <div className="panel rounded-3xl p-5 sm:p-6 shadow-2xl flex items-center justify-between">
          <div>
            <div className="step-tag">Duel Face-à-Face</div>
            <h1 className="app-title text-2xl sm:text-3xl text-white mt-1.5">
              Head-to-Head
            </h1>
          </div>
          <div className="hidden sm:block rounded-xl bg-teal-500/10 border border-teal-500/25 px-3 py-1.5 text-xs font-display font-bold uppercase tracking-widest text-teal-300">
            Versus Pro
          </div>
        </div>

        <HeadToHeadClient players={playersRecords ?? []} />
      </main>
    </div>
  )
}
