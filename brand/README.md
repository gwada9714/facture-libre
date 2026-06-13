# brand — Identité visuelle FactureLibre

Assets de marque (hors site déployé). Sources SVG + PNG rendus aux dimensions des plateformes.

| Fichier | Usage | Dimensions |
|---|---|---|
| `profile.svg` / `profile.png` | Photo de profil (LinkedIn, réseaux) — affichée en cercle | 1000×1000 |
| `cover.svg` / `cover.png` | Bannière de couverture LinkedIn | 1584×396 |

Charte : marine `#1c2b4a`, papier `#f6f1e6`, rouge tampon `#bf3b1f`.
Le texte de la bannière est volontairement maintenu dans la moitié haute : sur LinkedIn,
la photo de profil recouvre le coin **bas-gauche** de la couverture.

## Régénérer

```bash
npm install            # installe @resvg/resvg-js (devDependency)
npm run build:brand    # SVG -> PNG (brand/render.js)
```
