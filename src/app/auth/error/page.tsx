import Link from 'next/link'

export default function AuthErrorPage({
  searchParams,
}: {
  searchParams?: { reason?: string; message?: string }
}) {
  const reason = searchParams?.reason ?? 'unknown'
  const message = searchParams?.message ?? 'Erreur inconnue.'

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="card p-10 text-center max-w-sm">
        <div className="text-4xl mb-4">❌</div>
        <h1 className="font-display text-2xl mb-2">Erreur d'authentification</h1>
        <p className="text-gray-500 mb-4">Une erreur est survenue lors de la connexion.</p>
        <div className="text-left text-sm text-gray-400 bg-[#10131b] border border-[#2a2d3a] rounded-lg p-3 mb-6">
          <div className="font-semibold text-gray-300 mb-1">Details</div>
          <div>Raison: <span className="text-gray-200">{reason}</span></div>
          <div>Message: <span className="text-gray-200">{message}</span></div>
        </div>
        <Link href="/auth/login" className="btn-primary">Réessayer</Link>
      </div>
    </div>
  )
}
