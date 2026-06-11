# Courtio 🤝

**La marketplace des apporteurs d'affaires.** Des vendeurs indépendants amènent des
clients aux entreprises, qui ne paient qu'au devis signé. Bâtiment, informatique,
services… tous les métiers qui fonctionnent au devis.

> ⚠️ **Projet indépendant**, sans aucun lien avec l'application TableLive située à la
> racine de ce dépôt. Tout Courtio vit dans ce dossier `/courtio/` et ne touche à
> rien d'autre.

## 🗂️ Contenu

Site **statique** (HTML/CSS/JS, aucune dépendance, aucun build) :

| Fichier | Rôle |
|---|---|
| `index.html` | Page d'accueil / présentation |
| `entreprises.html` | Argumentaire pour les entreprises |
| `apporteurs.html` | Argumentaire pour les apporteurs |
| `tarifs.html` | Tarifs + exemple chiffré |
| `inscription.html` / `connexion.html` | Création de compte / connexion (démo) |
| `espace.html` | **Démo interactive** du tableau de bord (2 rôles) |
| `faq.html`, `contact.html` | FAQ et contact |
| `mentions-legales.html`, `cgu.html`, `confidentialite.html` | Pages légales (modèles) |
| `assets/css/styles.css` | Design system complet |
| `assets/js/main.js` | Header/footer, navigation, FAQ, animations |
| `assets/js/app.js` | Logique de la démo (localStorage) |

## ▶️ Lancer en local

Aucune installation. Ouvrez `index.html` dans un navigateur, ou servez le dossier :

```bash
cd courtio
python3 -m http.server 8080
# puis http://localhost:8080
```

## 🧪 La démo interactive (`espace.html`)

Entièrement fonctionnelle côté navigateur (`localStorage`) :

- **Apporteur** : parcourt la marketplace, apporte un client, suit ses leads et ses gains.
- **Entreprise** : reçoit les leads, fait avancer leur statut (nouveau → devis envoyé →
  signé → payé), voit les commissions à régler.
- Bouton **« Changer de rôle »** pour basculer entre les deux vues.
- Calcul automatique des commissions (% du devis ou montant fixe).

## ⚙️ Backend (rendre le site fonctionnel)

Le dossier [`backend/`](backend/) contient tout le nécessaire pour transformer la
vitrine en vrai produit :

| Fichier | Rôle |
|---|---|
| `backend/schema.sql` | Base de données complète (tables, sécurité RLS, calcul auto des commissions) |
| `backend/functions/` | Fonctions serveur Stripe (abonnement, Connect, versement, webhook) |
| `backend/SETUP.md` | **Guide d'installation pas-à-pas** (Supabase + Stripe) |
| `assets/js/config.js` | Vos clés Supabase (vide = mode démo) |
| `assets/js/api.js` | Couche d'accès aux données (auth, missions, leads, paiements) |

👉 **Suivez [`backend/SETUP.md`](backend/SETUP.md)** pour activer comptes réels et paiements.
Tant que `config.js` est vide, le site reste en **mode démo** (rien à installer).

## 🚀 Reste à faire pour la production

1. **Domaine** : enregistrer `courtio.ch` (+ `.com`) et vérifier la marque (Swissreg/IPI).
2. Connecter l'**espace** (`app.js`) aux vraies données via `api.js` (actuellement en démo).
3. **Notifications** e-mail (nouveau lead, devis signé, commission versée).
4. **Juridique** : valider CGU / confidentialité, vérifier le statut LBA selon le flux des
   fonds, exclure les secteurs réglementés (assurance, finance, juridique).

## 🎨 Marque

- Nom : **Courtio** (de *courtage / courtier*).
- Couleurs : indigo `#4f46e5` (confiance) + émeraude `#10b981` (réussite/argent).
- Police : Inter.
