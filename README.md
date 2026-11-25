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
  intervento, luogo, superficie (m²), durata (mesi), ambienti (facoltativo, sesta voce della scheda), servizi[{slug,nome}], copertina{src,alt,w,h},
  galleria[{src,alt,w,h,didascalia}], prima_dopo{prima,dopo,etichette} (facoltativo),
  racconto: elenco di capitoli [{titolo,testo}] (oppure, vecchio formato, {richiesta,progetto,cantiere,consegna}),
  occhiello (facoltativo, sopra il titolo), citazione{testo,autore} (facoltativa).
  Progetti 01-03 hanno testi e dati reali forniti dal cliente (18/11/2026); gli altri sono ancora simulati.
- Articolo: slug, titolo, titolo_html, categoria, data (AAAA-MM-GG), lettura (min), in_evidenza, estratto,
  autore, copertina, corpo[blocchi: p | h2 | lista | citazione | immagine | nota], progetti_correlati[slug].

## Favicon
La X del marchio (la stessa del cursore), bronzo #8A6E3B su carta #F4F4F0:
`favicon.svg`, `favicon.ico` (16/32/48), `apple-touch-icon.png` (180), `icon-192.png`, `icon-512.png`, `site.webmanifest`.

## Sicurezza, SEO e privacy (18/11/2026)
- Header di sicurezza in `nginx/sicurezza.conf` (CSP, HSTS, nosniff, Referrer-Policy, Permissions-Policy, X-Frame-Options), incluso in ogni location.
  Il sito non carica nulla da domini esterni: caratteri in `prototipo/assets/fonts/` (dichiarati in testa a `styles.css`), script del `<head>` in `assets/js/head-*.js`.
- Dati strutturati JSON-LD (FurnitureStore + HomeAndConstructionBusiness, WebSite) in `index.html`; Open Graph e canonical su tutte le pagine
  (progetto e articolo li aggiornano da JS). Dominio previsto: https://www.maxiarredo.com/.
- `privacy.html`: informativa privacy e cookie (nessun cookie, solo sessionStorage `mx-nav` e localStorage `mx-pj-view`).

### Checklist al lancio
1. Togliere `X-Robots-Tag` da `nginx/sicurezza.conf` e cambiare il robots.txt in `nginx/default.conf` (testo pronto nel commento).
2. Togliere `<meta name="robots" content="noindex, nofollow">` da tutte le pagine.
3. Togliere le variabili BASIC_AUTH_* in Coolify.
4. Inviare `sitemap.xml` a Google Search Console.
5. Se il modulo Dinamoweb usa servizi esterni (reCAPTCHA, invio a un altro dominio), aggiungerli alla CSP e all'informativa privacy.

## Approfondimenti: rinviati
Sezione tolta dal sito (18/11/2026), verrà sviluppata in seguito: pagine e dati in `bozze/approfondimenti/` (vedi LEGGIMI.md). La cartella `bozze/` non viene pubblicata (il Dockerfile copia solo `prototipo/`).

## Prestazioni (PageSpeed, 18/11/2026)
- Ogni foto ha varianti WebP `nome-640.webp`, `-1280`, `-1920` (solo se più piccole dell'originale) e `-<larghezza piena, max 2560>`;
  `pages.js` (imgTag) e `index.html` le usano con `srcset`. **Foto nuova = generare le varianti** con la stessa regola (Pillow, qualità 78).
- `progetti.json` precaricato; il footer resta sotto la piega finché i contenuti arrivano (niente salti di layout).
- Lighthouse mobile in locale: home ~90, Progetti 96, Progetto ~91, Privacy 96. Il limite della home è l'apertura animata: il testo compare a sipario alzato.

## Pagine generate, SEO e agenti AI (18/11/2026)
- Le pagine dei progetti sono **generate complete** da `prototipo/assets/data/progetti.json` con `node strumenti/genera.js`:
  `prototipo/progetti/index.html` (archivio) e `prototipo/progetti/<slug>/index.html`, più `sitemap.xml` e `llms.txt`.
  Il Dockerfile le rigenera a ogni deploy: per aggiornare un progetto basta modificare il JSON e pubblicare.
  I modelli delle pagine sono in `strumenti/modelli/` (header/footer) e `prototipo/assets/js/modelli.js` (contenuto, condiviso con il browser).
- Indirizzi puliti: `/progetti/` e `/progetti/<slug>/`; `progetti.html` e `progetto.html?p=<slug>` fanno redirect 301.
  Tutti i link interni partono dalla radice (`/assets/...`, `/#contatti`).
- Ogni progetto ha titolo, descrizione, canonical, Open Graph con la sua copertina e JSON-LD (CreativeWork + BreadcrumbList).
- `llms.txt`: scheda del sito per assistenti e agenti AI. Al lancio robots.txt ammette tutti i bot, AI comprese (scelta del cliente).
- Accessibilità (utile anche agli agenti): contrasti AA (`--c-muted` più scuro, `--c-accent-ink` per i testi piccoli in bronzo),
  aree di tocco di 24 px, titoli del footer in ordine, nessun link vuoto ("Scopri il servizio" -> "Chiedi una consulenza" verso #contatti).
