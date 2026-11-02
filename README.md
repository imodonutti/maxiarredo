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

## Pagine interne (bozza statica, novembre 2026)
- `progetti.html` — archivio progetti: filtri per tipologia e intervento, vista griglia / elenco (GSAP Flip).
- `progetto.html?p=<slug>` — singolo progetto: scheda, racconto in 4 fasi, testimonianza, confronto disegno/realizzato, galleria, progetto successivo.
- `approfondimenti.html` — journal: articolo in evidenza, filtri per tema, elenco.
- `articolo.html?a=<slug>` — singolo articolo: indice, barra di lettura, progetti citati, correlati.
- Comuni a tutte le pagine (home compresa): `assets/js/sito.js` (velo di transizione tra pagine, menu mobile).

### Collegamento al CMS
I contenuti arrivano da `prototipo/assets/data/progetti.json` e `articoli.json` (dati SIMULATI).
`assets/js/pages.js` li legge con `fetch` e costruisce le pagine: per collegare il CMS basta che
restituisca gli stessi campi (stesso JSON, altra URL) oppure che generi l'HTML con le stesse classi.
- Progetto: slug, numero, titolo, titolo_html (con <em> per la parola in corsivo), estratto, tipologia,
  intervento, luogo, anno, superficie (m²), durata (mesi), servizi[{slug,nome}], copertina{src,alt,w,h},
  galleria[{src,alt,w,h,didascalia}], prima_dopo{prima,dopo,etichette} (facoltativo),
  racconto{richiesta,progetto,cantiere,consegna}, citazione{testo,autore}.
- Articolo: slug, titolo, titolo_html, categoria, data (AAAA-MM-GG), lettura (min), in_evidenza, estratto,
  autore, copertina, corpo[blocchi: p | h2 | lista | citazione | immagine | nota], progetti_correlati[slug].
