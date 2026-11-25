# Maxiarredo — note per la pubblicazione

Sito statico (HTML, CSS, JS) servito da nginx. Dominio definitivo: **https://www.maxiarredo.com/** (sostituisce il vecchio sito).
Anteprima attuale: https://maxiarredo.dinamoai.it (Coolify, deploy automatico da GitHub `imodonutti/maxiarredo`, ramo `main`).

## Struttura
```
prototipo/                 il sito (radice pubblica)
  index.html               home (contiene il modulo contatti)
  privacy.html             informativa privacy e cookie
  progetti/                GENERATO: archivio e una cartella per progetto
  sitemap.xml, llms.txt    GENERATI
  assets/data/progetti.json   contenuti dei progetti (fonte unica)
  assets/js/modelli.js     modelli HTML dei progetti (browser + generazione)
  assets/js/main.js        animazioni della home, validazione del modulo
strumenti/genera.js        genera progetti/, sitemap.xml, llms.txt dal JSON (Node, nessuna dipendenza)
strumenti/modelli/         header/footer delle pagine generate
nginx/default.conf         redirect 301 dal vecchio sito, cache, riscrittura URL in anteprima
nginx/sicurezza.conf       header di sicurezza (CSP ecc.) + blocco motori in anteprima
Dockerfile                 build: node genera.js -> nginx
bozze/                     sezione Approfondimenti rinviata (NON pubblicata)
```
Per pubblicare senza Docker: `node strumenti/genera.js`, poi servire la cartella `prototipo/` come radice.
Tutti i link interni partono dalla radice (`/assets/...`, `/progetti/...`): il sito deve stare alla radice del dominio.
Se non usate nginx, riportate sul vostro server i redirect e gli header di `nginx/`.

## Modulo contatti (da integrare)
- Markup: `prototipo/index.html`, `<form class="form" id="form" novalidate>` nella sezione `#contatti`.
- Campi (`name`): `nome`*, `telefono`, `email`*, `citta`*, `tipo` (radio: prima-casa, stanza, ristrutturazione, ufficio, altro),
  `messaggio`, checkbox privacy `#f-privacy`* (* obbligatori).
- La validazione lato browser e il messaggio di esito sono in `assets/js/main.js`, funzione `initForm()`:
  oggi, se i campi sono validi, mostra solo un avviso ("l'invio non è attivo"). Sostituite quella riga con l'invio vero
  e scrivete l'esito in `#form-msg` (ha già `role="status"`, letto dagli screen reader).
- **CSP**: il sito accetta solo richieste verso il proprio dominio. Se il modulo invia altrove o usa servizi esterni
  (es. reCAPTCHA, hCaptcha, Turnstile), aggiungeteli in `nginx/sicurezza.conf` (`form-action`, `connect-src`, `script-src`, `frame-src`).
- **Privacy**: se il modulo usa servizi di terze parti o cookie, aggiornate `privacy.html` (sezioni "Chi può vederli" e "Cookie").

## Al lancio (checklist)
1. `nginx/sicurezza.conf`: togliere la riga `X-Robots-Tag "noindex, nofollow"`.
2. `nginx/default.conf`: robots.txt -> testo di lancio già scritto nel commento (tutti i bot ammessi, AI comprese, + Sitemap).
3. Togliere `<meta name="robots" content="noindex, nofollow">` da `prototipo/index.html`, `prototipo/privacy.html`
   e `strumenti/modelli/*.html` (poi rigenerare).
4. Togliere la password dell'anteprima (variabili `BASIC_AUTH_*` in Coolify).
5. `maxiarredo.com` senza www -> redirect 301 a `https://www.maxiarredo.com/`.
6. Inviare `https://www.maxiarredo.com/sitemap.xml` a Google Search Console; dopo qualche settimana controllare
   le pagine "non trovate" del vecchio sito e aggiungere i redirect mancanti in `nginx/default.conf`.

## Aggiornare i contenuti
- Progetti: modificare `prototipo/assets/data/progetti.json` e rigenerare (o fare il deploy: il Dockerfile rigenera).
- Foto nuove: creare le varianti WebP `nome-640.webp`, `-1280`, `-1920` (solo se più piccole dell'originale) e
  `-<larghezza piena, max 2560>.webp`, qualità 78. La regola è in `modelli.js` (`srcset`).

Dettagli e storia delle scelte: `README.md`.
