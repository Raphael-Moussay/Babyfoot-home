import Link from 'next/link'

/** Default fallback error code when none is provided in the URL query string. */
const DEFAULT_ERROR_REASON = 'unknown'

/** Default fallback error description when none is provided in the URL query string. */
const DEFAULT_ERROR_MESSAGE = 'Erreur inconnue.'

/**
 * Props for the AuthErrorPage component.
 */
interface AuthErrorPageProps {
  searchParams?: {
    reason?: string
    message?: string
  }
}

/**
 * Renders the authentication error diagnostic screen styled after Cricket Cut-throat Pro.
 *
 * @param {AuthErrorPageProps} props - Route search parameters containing error details.
 * @returns {JSX.Element} The rendered authentication error page.
 */
export default function AuthErrorPage({ searchParams }: AuthErrorPageProps): JSX.Element {
  const errorReason: string = searchParams?.reason ?? DEFAULT_ERROR_REASON
  const errorMessage: string = searchParams?.message ?? DEFAULT_ERROR_MESSAGE

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="panel rounded-3xl p-7 sm:p-8 text-center max-w-md w-full shadow-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-300 text-xs uppercase font-display font-bold tracking-widest border border-rose-500/20 mb-4">
          ⚠️ Authentification
        </div>
        <h1 className="app-title text-2xl text-white mb-2">Erreur de Connexion</h1>
        <p className="text-slate-400 text-sm mb-5">
          Une erreur est survenue lors de la validation de votre session.
        </p>

        <div className="text-left text-xs text-slate-300 bg-[#0a0d12] border border-white/10 rounded-2xl p-4 mb-6 space-y-1.5 font-display">
          <div className="font-bold text-rose-400 uppercase tracking-wider mb-1">
            Détails Techniques
          </div>
          <div>
            Code : <span className="text-white">{errorReason}</span>
          </div>
          <div>
            Message : <span className="text-white">{errorMessage}</span>
          </div>
        </div>

        <Link href="/auth/login" className="btn-primary block w-full text-center">
          Réessayer la Connexion
        </Link>
      </div>
    </div>
  )
}
