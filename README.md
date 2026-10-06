# Maxiarredo — architettura d'interni

Sito di Maxiarredo (Roveleto di Cadeo, PC). Anteprima: https://maxiarredo.dinamoai.it (protetta da password).

## Fase attuale: prototipo statico
- `prototipo/` — bozza della home (HTML + CSS + GSAP/ScrollTrigger/SplitText + Lenis).
  - `assets/css/styles.css` design system (Custom Properties) e layout
  - `assets/js/main.js` animazioni
  - `assets/img/` foto provvisorie (ritocco Gemini, da sostituire con le versioni ritoccate)
- `Dockerfile` + `nginx/` — servono il prototipo su Coolify con nginx.
  La password si imposta in Coolify con le variabili `BASIC_AUTH_USER` e `BASIC_AUTH_PASSWORD`
  (valori in `dinamoai/segreti/maxiarredo.env`, mai nel repo).

## Fase successiva
Tema WordPress classico custom + ACF, sullo stesso schema degli altri siti DinamoAI.
