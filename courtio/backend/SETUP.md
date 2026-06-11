# 🚀 Courtio — Guide d'installation du backend

Ce guide transforme le site vitrine en **vrai produit fonctionnel** : comptes réels,
base de données, et paiements Stripe. Tout est gratuit pour démarrer (modes de test).

> ⏱️ Compter ~45 min. Aucune compétence de développeur requise, mais il faut suivre
> les étapes dans l'ordre. En cas de doute sur une étape, demande-moi de la détailler.

---

## 🧩 Vue d'ensemble

| Brique | Rôle | Service |
|---|---|---|
| Base de données + comptes | Stocke entreprises, apporteurs, missions, leads | **Supabase** (gratuit) |
| Paiements | Abonnements + versement des commissions | **Stripe** (gratuit en test) |
| Site web | La vitrine + l'espace (déjà fait) | GitHub Pages |

---

## Étape 1 — Créer la base de données (Supabase)

1. Va sur **https://supabase.com** → crée un compte → **New project**.
   - Choisis une région **européenne** (ex : *Frankfurt*).
   - Note bien le **mot de passe** de la base.
2. Dans le menu **SQL Editor** → **New query**.
3. Ouvre le fichier `backend/schema.sql`, copie **tout** son contenu, colle-le, puis **Run**.
   - ✅ Tu dois voir « Success ». Cela crée toutes les tables et la sécurité.

## Étape 2 — Connecter le site à Supabase

1. Dans Supabase : **Project Settings** → **API**.
2. Copie **Project URL** et la clé **anon public**.
3. Ouvre `assets/js/config.js` et colle-les :
   ```js
   supabaseUrl: "https://TONPROJET.supabase.co",
   supabaseAnonKey: "eyJhbGciOi...",
   ```
4. (Optionnel pour les tests) Dans Supabase **Authentication → Providers → Email**,
   désactive temporairement « Confirm email » pour pouvoir te connecter tout de suite.

➡️ À ce stade, **l'inscription et la connexion fonctionnent pour de vrai**. Teste-les !

## Étape 3 — Créer le compte Stripe

1. Va sur **https://stripe.com** → crée un compte. Reste en **mode Test** (interrupteur en haut).
2. **Developers → API keys** : note la **Secret key** (`sk_test_...`).
3. **Product catalog → + Add product** : crée *Courtio Pro*, prix **99 CHF / mois récurrent**.
   - Copie l'identifiant du prix (`price_...`).
4. **Connect** : active Stripe Connect (**Settings → Connect → Get started**), type *Express*.

## Étape 4 — Déployer les fonctions de paiement

Sur ton ordinateur (une seule fois) :

```bash
# 1. Installer le CLI Supabase  (https://supabase.com/docs/guides/cli)
npm install -g supabase

# 2. Se connecter et lier le projet
supabase login
supabase link --project-ref TON_PROJECT_REF   # visible dans l'URL du dashboard

# 3. Enregistrer les secrets (clés Stripe)
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxx
supabase secrets set STRIPE_PRICE_PRO=price_xxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx   # voir étape 5

# 4. Déployer les 4 fonctions (depuis le dossier courtio/backend)
supabase functions deploy create-subscription-checkout
supabase functions deploy connect-onboarding
supabase functions deploy pay-commission
supabase functions deploy stripe-webhook --no-verify-jwt
```

> `SUPABASE_URL`, `SUPABASE_ANON_KEY` et `SUPABASE_SERVICE_ROLE_KEY` sont fournis
> automatiquement par Supabase aux fonctions — pas besoin de les définir.

## Étape 5 — Brancher le webhook Stripe

1. Stripe **Developers → Webhooks → Add endpoint**.
2. URL : `https://TONPROJET.supabase.co/functions/v1/stripe-webhook`
3. Événements à écouter :
   - `checkout.session.completed`
   - `customer.subscription.created` / `.updated` / `.deleted`
   - `account.updated`
4. Copie le **Signing secret** (`whsec_...`) et relance :
   `supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx`

## Étape 6 — Tester de bout en bout (mode test)

- Inscris une **entreprise** → lance l'abonnement → paie avec la carte de test
  `4242 4242 4242 4242` (date future, CVC quelconque).
- Inscris un **apporteur** → fais l'onboarding Connect (Stripe te guide).
- L'apporteur apporte un lead → l'entreprise le marque « signé » → paie la commission.
- ✅ Vérifie le transfert dans Stripe et le statut « payé » dans l'espace.

---

## ✅ Passage en production (plus tard)

1. Bascule Stripe en **mode Live**, remplace les clés `sk_test`/`price` par les versions live.
2. Réactive la **confirmation d'e-mail** dans Supabase.
3. Restreins le CORS des fonctions à ton domaine (`Access-Control-Allow-Origin`).
4. Branche le domaine **courtio.ch** et déplace le site dans son dépôt dédié.
5. Fais valider les **CGU / confidentialité** par un juriste, et confirme le statut LBA
   selon le flux des fonds (voir README).

---

### 🔐 Sécurité — l'essentiel
- La clé **anon** dans `config.js` est faite pour être publique : la vraie protection
  vient des règles **RLS** (déjà dans `schema.sql`).
- La clé **service_role** et les clés **Stripe** ne sont **jamais** dans le site :
  elles vivent uniquement dans les secrets des fonctions Supabase.
- Stripe gère toutes les données de carte (certifié PCI-DSS niveau 1).
