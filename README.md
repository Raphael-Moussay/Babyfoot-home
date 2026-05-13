# 🏆 Baby-foot Tracker

Application web de suivi de parties de baby-foot avec classement ELO et statistiques avancees.

## Stack technique

| Couche | Outil | Plan |
|--------|-------|------|
| Framework | Next.js 14 (App Router) | - |
| BDD + Auth | Supabase | Free |
| Hebergement | Vercel | Free |

---

## 🚀 Installation

### 1. Cloner et installer

```bash
git clone <your-repo>
cd Baby_menil
npm install
```

### 2. Configurer Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Aller dans **SQL Editor** et exécuter le script SQL fourni (schema.sql)
3. Exécuter également ce patch :

```sql
ALTER TABLE player_stats 
  ADD COLUMN IF NOT EXISTS match_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_match_at timestamptz;

CREATE OR REPLACE VIEW leaderboard AS
SELECT 
  p.id, p.display_name, p.avatar_url,
  ps.elo, ps.wins, ps.losses, ps.match_count,
  ps.goals_for, ps.goals_against,
  ps.goals_for - ps.goals_against AS goal_average,
  ps.fanny_given, ps.fanny_taken,
  ps.current_streak, ps.last_3_wins,
  CASE WHEN ps.match_count > 0 
    THEN round(ps.wins::numeric / ps.match_count * 100, 1) 
    ELSE 0 END AS win_rate
FROM players p
JOIN player_stats ps ON ps.player_id = p.id
ORDER BY ps.elo DESC;

GRANT SELECT ON leaderboard TO anon, authenticated;
```

4. Dans **Authentication > Providers**, activer **Google**
5. Dans **Authentication > URL Configuration** :
   - Site URL : `http://localhost:3000` (dev) ou votre URL Vercel
   - Redirect URLs : `http://localhost:3000/auth/callback`

### 3. Configurer Google OAuth

1. Aller sur [console.cloud.google.com](https://console.cloud.google.com)
2. Créer un projet > APIs & Services > Credentials > OAuth 2.0
3. Authorized redirect URIs : `https://<your-project>.supabase.co/auth/v1/callback`
4. Copier Client ID et Secret dans Supabase > Auth > Providers > Google

### 4. Variables d'environnement

Remplir `.env.local` :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Les clés se trouvent dans Supabase > Settings > API.

### 5. Lancer en développement

```bash
npm run dev
```

---

## 📦 Déploiement Vercel

```bash
npx vercel
```

Puis ajouter les variables d'environnement dans Vercel Dashboard > Settings > Environment Variables.

Ne pas oublier de mettre à jour :
- Supabase > Auth > URL Configuration avec l'URL Vercel
- Google OAuth > Authorized redirect URIs

---

## 🎮 Fonctionnalités

- **Auth Google** : Inscription/connexion via Google uniquement
- **Matchs 1v1 et 2v2** : Avec rôles attaquant/défenseur
- **Manches** : Score par manche, max 10 buts, calcul automatique du score final
- **Classement ELO** : Algorithme K=32, moyenne d'équipe pour le 2v2
- **Streaks** : 🔥 affiche des 3 victoires consecutives
- **Fanny** : Detection automatique des 10-0, badges sur les profils
- **Edition de match** : le createur peut modifier score, manches et equipes (recalcul auto)
- **Head-to-head** : Comparaison directe entre deux joueurs
- **Litiges** : Signalement possible, supprime automatiquement si le match est modifie

---

## 🏗️ Architecture

```
src/
├── app/
│   ├── api/
│   │   ├── matches/route.ts        # POST : cree un match + ELO
│   │   ├── matches/[id]/route.ts   # PUT : modifie un match + recalcul
│   │   └── head-to-head/route.ts   # GET : stats H2H
│   ├── auth/
│   │   ├── callback/route.ts       # OAuth callback + upsert player
│   │   ├── onboarding/page.tsx     # Choix du prenom
│   │   ├── login/page.tsx
│   │   └── error/page.tsx
│   ├── leaderboard/page.tsx
│   ├── matches/
│   │   ├── page.tsx               # Historique
│   │   ├── new/page.tsx           # Formulaire
│   │   ├── [id]/page.tsx          # Detail
│   │   └── [id]/edit/page.tsx     # Edition
│   ├── profile/
│   │   ├── page.tsx               # Redirect vers /profile/[id]
│   │   └── [id]/page.tsx
│   └── head-to-head/page.tsx
├── components/
│   ├── layout/Navbar.tsx
│   └── match/
│       ├── NewMatchForm.tsx        # Formulaire création match
│       ├── DisputeButton.tsx
│       └── HeadToHeadClient.tsx
├── lib/
│   ├── elo.ts                     # Algorithme ELO + logique jeu
│   ├── supabase/client.ts
│   ├── supabase/server.ts
│   └── utils.ts
└── types/index.ts
```
