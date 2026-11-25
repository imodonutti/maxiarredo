#!/usr/bin/env node
/* ==========================================================================
   MAXIARREDO — generazione delle pagine dai dati
   Legge prototipo/assets/data/progetti.json e scrive, già complete:
     prototipo/progetti/index.html            archivio progetti
     prototipo/progetti/<slug>/index.html     una pagina per progetto
     prototipo/sitemap.xml                    mappa del sito
     prototipo/llms.txt                       scheda del sito per le AI
   Gira da solo a ogni deploy (Dockerfile). In locale: `node strumenti/genera.js`.
   Nessuna dipendenza: solo Node.
   ========================================================================== */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITO = path.join(ROOT, 'prototipo');
const MX = require(path.join(SITO, 'assets/js/modelli.js'));
const BASE = 'https://www.maxiarredo.com/';            // su maxiarredo.dinamoai.it nginx lo riscrive
const OGGI = new Date().toISOString().slice(0, 10);

const { progetti, servizi } = JSON.parse(fs.readFileSync(path.join(SITO, 'assets/data/progetti.json'), 'utf8'));
const modello = (n) => fs.readFileSync(path.join(__dirname, 'modelli', n), 'utf8');
const scrivi = (rel, testo) => {
  const f = path.join(SITO, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, testo);
  console.log('  scritto', rel);
};
const { esc, strip } = MX;
const attr = (s) => esc(strip(s));

// sostituzioni nel <head>: titolo, descrizione, canonical e Open Graph
const testa = (html, { titolo, descrizione, url, immagine, alt, tipo = 'website' }) => {
  const set = (re, val) => { if (!re.test(html)) throw new Error('Segnaposto mancante: ' + re); html = html.replace(re, val); };
  set(/<title>[^<]*<\/title>/, `<title>${esc(titolo)}</title>`);
  set(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${attr(descrizione)}">`);
  set(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${attr(titolo)}">`);
  set(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${attr(descrizione)}">`);
  set(/<meta property="og:type" content="[^"]*">/, `<meta property="og:type" content="${tipo}">`);
  html = html.replace(/  <link rel="canonical" href="[^"]*">\n/, '').replace(/  <meta property="og:url" content="[^"]*">\n/, '');
  html = html.replace('  <meta property="og:type"', `  <link rel="canonical" href="${url}">\n  <meta property="og:url" content="${url}">\n  <meta property="og:type"`);
  if (immagine) {
    html = html.replace(/<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${immagine.src}">`)
      .replace(/<meta property="og:image:width" content="[^"]*">/, `<meta property="og:image:width" content="${immagine.w}">`)
      .replace(/<meta property="og:image:height" content="[^"]*">/, `<meta property="og:image:height" content="${immagine.h}">`)
      .replace(/<meta property="og:image:alt" content="[^"]*">/, `<meta property="og:image:alt" content="${attr(alt || '')}">`);
  }
  // il JSON ora è già dentro la pagina: niente precaricamento
  html = html.replace(/  <link rel="preload" href="\/assets\/data\/progetti.json"[^>]*>\n/, '');
  return html;
};
const jsonld = (obj) => `  <script type="application/ld+json">\n${JSON.stringify(obj, null, 1).replace(/</g, '\\u003c')}\n  </script>\n`;
const conLd = (html, obj) => html.replace('</head>', jsonld(obj) + '</head>');
const azienda = { '@id': BASE + '#azienda' };
const briciole = (voci) => ({
  '@type': 'BreadcrumbList',
  itemListElement: voci.map(([nome, url], i) => ({ '@type': 'ListItem', position: i + 1, name: nome, item: url })),
});
const immagineAbs = (o) => ({ src: BASE + o.src.replace(/^\//, ''), w: o.w, h: o.h });

console.log('Generazione pagine Maxiarredo —', progetti.length, 'progetti');

/* ---------- Archivio /progetti/ ---------- */
{
  let html = modello('progetti.html');
  const url = BASE + 'progetti/';
  html = testa(html, {
    titolo: "Progetti — Maxiarredo · Architettura d'interni",
    descrizione: `Progetti di Maxiarredo tra Piacenza e Parma: ${progetti.map((p) => p.titolo).join(', ')}. Raccontati dalla richiesta alla consegna delle chiavi.`,
    url,
  });
  html = html.replace(/<span id="pj-total">\d+<\/span>/, `<span id="pj-total">${MX.pad(progetti.length)}</span>`);
  // il segnaposto dei filtri (riga intera) diventa i filtri veri
  const fil = /<div id="pj-filters" style="display:contents">.*\n/;
  if (!fil.test(html)) throw new Error('Segnaposto #pj-filters mancante');
  html = html.replace(fil, () => `<div id="pj-filters" style="display:contents">${MX.filtri(progetti)}</div>\n`);
  html = html.replace(/<span class="filters__count" id="pj-count" aria-live="polite"><\/span>/,
    `<span class="filters__count" id="pj-count" aria-live="polite"><b>${MX.pad(progetti.length)}</b> ${progetti.length === 1 ? 'progetto' : 'progetti'}</span>`);
  if (!/<div class="pj-list"><\/div>/.test(html)) throw new Error('Segnaposto .pj-list mancante');
  html = html.replace('<div class="pj-list"></div>', `<div class="pj-list">${MX.cards(progetti)}\n      </div>`);
  html = conLd(html, {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'CollectionPage', '@id': url, url, name: 'Progetti', inLanguage: 'it-IT', isPartOf: { '@id': BASE + '#sito' }, publisher: azienda,
        mainEntity: { '@type': 'ItemList', itemListElement: progetti.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: BASE + MX.projUrl(p).slice(1), name: p.titolo })) } },
      briciole([['Home', BASE], ['Progetti', url]]),
    ],
  });
  scrivi('progetti/index.html', html);
}

/* ---------- Una pagina per progetto ---------- */
for (const p of progetti) {
  let html = modello('progetto.html');
  const url = BASE + MX.projUrl(p).slice(1);
  const img = immagineAbs(p.copertina);
  html = testa(html, {
    titolo: `${p.titolo} — Progetti · Maxiarredo`,
    descrizione: p.estratto,
    url, immagine: img, alt: p.copertina.alt, tipo: 'article',
  });
  html = html.replace('<body data-page="progetto">', `<body data-page="progetto" data-slug="${esc(p.slug)}">`);
  if (!/<main id="main">\s*<\/main>/.test(html)) throw new Error('Segnaposto <main> mancante');
  html = html.replace(/<main id="main">\s*<\/main>/, `<main id="main">${MX.progetto(p, progetti)}\n</main>`);
  const testi = Array.isArray(p.racconto) ? p.racconto.map((c) => `${c.titolo}. ${c.testo}`) : Object.values(p.racconto);
  html = conLd(html, {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'CreativeWork', '@id': url + '#progetto', url, name: p.titolo, alternativeHeadline: p.occhiello || undefined,
        description: p.estratto, abstract: testi.join(' '), inLanguage: 'it-IT',
        genre: `${p.tipologia} · ${p.intervento}`,
        image: [img.src, ...(p.galleria || []).map((g) => immagineAbs(g).src)],
        locationCreated: { '@type': 'Place', name: p.luogo, address: { '@type': 'PostalAddress', addressLocality: p.luogo, addressCountry: 'IT' } },
        size: `${MX.fmtNum(p.superficie)} m²`,
        about: p.servizi.map((s) => s.nome),
        creator: azienda, publisher: azienda },
      briciole([['Home', BASE], ['Progetti', BASE + 'progetti/'], [p.titolo, url]]),
    ],
  });
  scrivi(`progetti/${p.slug}/index.html`, html);
}

/* ---------- sitemap.xml ---------- */
{
  const urls = ['', 'progetti/', ...progetti.map((p) => MX.projUrl(p).slice(1)), 'privacy.html'];
  const xml = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((u) => `  <url><loc>${BASE}${u}</loc><lastmod>${OGGI}</lastmod></url>`), '</urlset>', ''].join('\n');
  scrivi('sitemap.xml', xml);
}

/* ---------- llms.txt: scheda del sito per assistenti e agenti AI (https://llmstxt.org) ---------- */
{
  const elenco = progetti.map((p) => `- [${p.titolo}](${BASE}${MX.projUrl(p).slice(1)}): ${p.occhiello ? p.occhiello + '. ' : ''}${p.estratto} (${p.luogo}, ${MX.fmtNum(p.superficie)} m², ${p.intervento.toLowerCase()}${p.ambienti ? '; ambienti: ' + p.ambienti.toLowerCase() : ''})`).join('\n');
  const nomiServizi = Object.values(servizi || {});
  const md = `# Maxiarredo

> Studio di architettura d'interni con showroom a Roveleto di Cadeo (Piacenza), attivo dal 1988. Segue case, negozi e uffici dal primo rilievo alla consegna delle chiavi, con un unico interlocutore: progettazione d'interni, arredamento su misura dalla propria falegnameria, ristrutturazioni chiavi in mano.

- Indirizzo: Via Emilia Parmense 27, 29010 Roveleto di Cadeo (PC), Italia
- Telefono: +39 0523 500596 — Mobile: +39 320 57 98 500 — Email: info@maxiarredo.com
- Orari showroom: martedì–sabato 9:00–12:30 e 15:00–19:30; lunedì 15:00–19:30; domenica chiuso. Su appuntamento per le consulenze.
- P. IVA 01108560333
- Lingua del sito: italiano

## Pagine principali

- [Home](${BASE}): metodo di lavoro in cinque fasi, servizi, progetti in evidenza, showroom su tre piani, contatti e richiesta di consulenza.
- [Progetti](${BASE}progetti/): archivio dei progetti realizzati, con luogo, superficie, tipo di intervento e racconto.
- [Contatti e consulenza](${BASE}#contatti): indirizzo, telefoni, orari e modulo per prenotare una consulenza in showroom.

## Servizi

${nomiServizi.map((s) => `- ${s}`).join('\n')}

## Progetti

${elenco}

## Altro

- [Privacy e cookie](${BASE}privacy.html): informativa; il sito non usa cookie di profilazione né strumenti di terze parti.
- Profili: [Instagram](https://www.instagram.com/maxiarredo/), [Facebook](https://www.facebook.com/maxiarredoarchitetturainterni)
`;
  scrivi('llms.txt', md);
}

console.log('Fatto.');
