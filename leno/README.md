# Léno Création — Site & studio de personnalisation

Site vitrine + **studio de broderie en direct** : le client tape un prénom / un mot
ou ajoute une image, et voit le rendu brodé (ou transféré/floqué) directement sur
l'article choisi, avec un effet de relief des fils et une vue volume (3D).

## Fichiers
- `index.html` — page d'accueil (hero, la cagoule 3 pièces, matières, créations, CTA)
- `personnaliser.html` — le studio de personnalisation
- `studio.js` — logique du studio (rendu live, glisser-déposer, vue 3D, export PNG, commande)
- `mockups.js` — formes des articles (SVG) + filtres broderie/fourrure/transfert
- `style.css` — design system (violet & écru)

## Voir le site en local
```bash
cd leno
python3 -m http.server 8080
# puis ouvrir http://localhost:8080
```

## À personnaliser avant mise en ligne
- **Numéro WhatsApp** : dans `studio.js` → constante `WHATSAPP` (et le lien dans `index.html`).
- **Email / Instagram** : pied de page de `index.html`.
- **Photos produit réelles** : les articles sont pour l'instant des illustrations SVG.
  On peut facilement remplacer chaque forme par une vraie photo détourée (PNG) et y
  poser la zone de broderie — dis-le moi et je le branche.

## Idées d'évolution
- Vrais modèles 3D (Three.js) des articles pour une rotation libre.
- Catalogue + panier + paiement en ligne (boutique).
- Sauvegarde/partage de la création par lien.
