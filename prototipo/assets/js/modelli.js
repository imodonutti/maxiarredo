/* ==========================================================================
   MAXIARREDO — Modelli HTML dei progetti
   Usati in due posti, con lo stesso codice:
   - nel browser da pages.js (window.MX), come riserva se una pagina non è generata;
   - da strumenti/genera.js (Node), che a ogni deploy scrive le pagine complete
     /progetti/ e /progetti/<slug>/ partendo da assets/data/progetti.json.
   Così chi non esegue JavaScript (motori, bot AI, agenti) legge tutto il testo.
   ========================================================================== */
(function (root, factory) {
  const MX = factory();
  if (typeof module === 'object' && module.exports) module.exports = MX;
  else root.MX = MX;
})(typeof self !== 'undefined' ? self : this, function () {
  const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const strip = (s = '') => String(s).replace(/<[^>]+>/g, '');

  // Varianti WebP generate per ogni foto: 640/1280/1920 px (solo se più piccole dell'originale) + larghezza piena (max 2560)
  const srcset = (o) => {
    const base = o.src.replace(/\.(jpe?g|png)$/i, '');
    if (base === o.src) return '';
    const ws = [640, 1280, 1920].filter((x) => x < o.w).concat(Math.min(o.w, 2560));
    return ws.map((x) => `${esc(base)}-${x}.webp ${x}w`).join(', ');
  };
  // percorsi delle foto sempre dalla radice del sito (le pagine stanno anche in /progetti/<slug>/)
  const abs = (src) => (/^(https?:|\/)/.test(src) ? src : '/' + src);
  const imgTag = (o, extra = '') => {
    if (!o) return '';
    const q = { ...o, src: abs(o.src) };
    const ss = srcset(q);
    const sizes = /sizes=/.test(extra) ? '' : ' sizes="(min-width: 901px) 50vw, 100vw"';
    return `<img src="${esc(q.src)}"${ss ? ` srcset="${ss}"${sizes}` : ''} alt="${esc(o.alt)}" width="${o.w}" height="${o.h}" decoding="async" ${extra}>`;
  };

  const fmtNum = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); // 1200 -> 1.200
  // durata in mesi -> "18 mesi", "2 anni", "1 anno e mezzo"
  const fmtDurata = (m) => {
    if (m >= 12 && m % 12 === 0) return m === 12 ? '1 anno' : `${m / 12} anni`;
    if (m >= 12 && m % 12 === 6) { const a = (m - 6) / 12; return `${a} ann${a === 1 ? 'o' : 'i'} e mezzo`; }
    return `${m} ${m === 1 ? 'mese' : 'mesi'}`;
  };
  const arrow = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M1 9h16M10 2l7 7-7 7" stroke="currentColor"/></svg>';
  const projUrl = (p) => `/progetti/${encodeURIComponent(p.slug)}/`;
  const servUrl = () => '/#servizi';
  const pad = (n) => String(n).padStart(2, '0');

  /* ---------- Archivio: schede ---------- */
  const cards = (progetti) => progetti.map((p, k) => `
      <a href="${projUrl(p)}" class="pj" data-cursor="Scopri" data-tip="${esc(p.tipologia)}" data-int="${esc(p.intervento)}" data-slug="${esc(p.slug)}">
          <figure class="pj__media"><div class="pj__img">${imgTag(p.copertina, (k === 0 ? 'fetchpriority="high"' : 'loading="lazy"') + ' sizes="(min-width: 901px) 50vw, 100vw"')}</div></figure>
          <span class="pj__num">${p.numero}</span>
          <h2 class="pj__title">${p.titolo_html}</h2>
          <span class="pj__place">${esc(p.luogo)}</span>
          <span class="pj__type">${esc(p.tipologia)}</span>
          <span class="pj__arrow">${arrow}</span>
      </a>`).join('');

  /* ---------- Archivio: filtri (un gruppo con un solo valore non serve) ---------- */
  const GROUPS = { tip: 'Tipologia', int: 'Intervento' };
  const SHORT = { 'Ristrutturazione completa': 'Ristrutturazione', 'Arredamento su misura': 'Su misura' };
  const field = (k) => (k === 'tip' ? 'tipologia' : 'intervento');
  const values = (progetti, k) => [...new Set(progetti.map((p) => p[field(k)]))];
  const filtri = (progetti) => Object.entries(GROUPS).filter(([k]) => values(progetti, k).length > 1).map(([k, label]) => `
      <div class="filters__group" role="group" aria-label="${label}">
        <span class="filters__label">${label}</span>
        <button class="fbtn is-active" data-k="${k}" data-v="all" aria-pressed="true">Tutti</button>
        ${values(progetti, k).map((v) => `<button class="fbtn" data-k="${k}" data-v="${esc(v)}" aria-pressed="false">${esc(SHORT[v] || v)}<sup>${progetti.filter((p) => p[field(k)] === v).length}</sup></button>`).join('')}
      </div>`).join('');

  /* ---------- Singolo progetto: contenuto di <main> ---------- */
  const progetto = (p, progetti) => {
    const i = progetti.indexOf(p);
    const next = progetti[(i + 1) % progetti.length];
    // racconto: elenco di capitoli {titolo, testo} oppure le quattro fasi standard
    const chapters = Array.isArray(p.racconto)
      ? p.racconto.map((c) => [c.titolo, c.testo])
      : [['La richiesta', p.racconto.richiesta], ['Il progetto', p.racconto.progetto], ['Il cantiere', p.racconto.cantiere], ['La consegna', p.racconto.consegna]];
    const pd = p.prima_dopo;
    const gal = p.galleria || [];
    const galMode = gal.length >= 3 ? 'h' : 'g';
    return `
      <section class="pg-hero container" aria-labelledby="pp-title" data-statico>
        <div class="pp-hero__top">
          <a href="/progetti/" class="meta back-link"><svg width="16" height="10" viewBox="0 0 16 10" fill="none" aria-hidden="true"><path d="M16 5H1M5 1L1 5l4 4" stroke="currentColor"/></svg>Tutti i progetti</a>
          <span class="meta">Progetto <b>${p.numero}</b> / ${pad(progetti.length)}</span>
        </div>
        ${p.occhiello ? `<p class="pp-kicker meta" data-fade>${esc(p.occhiello)}</p>` : ''}
        <h1 class="pp-title" id="pp-title" data-split="hero">${p.titolo_html}</h1>
        <div class="pp-hero__grid">
          <p class="pp-hero__lead" data-fade>${esc(p.estratto)}</p>
          <dl class="spec" data-fade>
            <div><dt>Luogo</dt><dd>${esc(p.luogo)}</dd></div>
            <div><dt>Superficie</dt><dd>${fmtNum(p.superficie)} m²</dd></div>
            <div><dt>Durata</dt><dd>${fmtDurata(p.durata)}</dd></div>
            <div><dt>Tipologia</dt><dd>${esc(p.tipologia)}</dd></div>
            <div class="spec__wide"><dt>Intervento</dt><dd>${esc(p.intervento)}</dd></div>
          </dl>
        </div>
      </section>

      <figure class="pp-cover" data-cursor="${esc(p.luogo)}">${imgTag(p.copertina, 'fetchpriority="high" sizes="100vw"')}
        <figcaption class="pp-cover__cap meta">${esc(p.luogo)}</figcaption></figure>

      <section class="pp-story container" aria-label="Il racconto del progetto">
        <aside class="pp-aside">
          <p class="pp-aside__title">Il progetto<br>in breve</p>
          <div>
            <span class="meta" style="display:block;margin-bottom:.8rem">Servizi coinvolti</span>
            <ul class="pp-services">${p.servizi.map((s) => `<li><a href="${servUrl(s)}">${esc(s.nome)}${arrow}</a></li>`).join('')}</ul>
          </div>
          <a href="/#contatti" class="btn js-magnetic"><span class="btn__dot"></span>Parliamo del tuo progetto</a>
        </aside>
        <div class="pp-chapters">
          <div class="pp-line" aria-hidden="true"><i></i></div>
          ${chapters.map(([t, txt], k) => `
            <article class="ch">
              <span class="ch__n">${pad(k + 1)}</span>
              <h2 class="ch__t" data-split>${esc(t)}</h2>
              <p class="ch__p" data-fade>${esc(txt)}</p>
            </article>`).join('')}
        </div>
      </section>

      ${p.citazione ? `
      <figure class="pp-quote container">
        <blockquote class="js-words">${esc(p.citazione.testo)}</blockquote>
        <figcaption class="meta">— ${esc(p.citazione.autore)}</figcaption>
      </figure>` : ''}

      ${pd ? `
      <section class="pp-ba container" aria-labelledby="ba-title">
        <div class="pp-ba__head">
          <h2 class="title title--h2" id="ba-title" data-split>Dal disegno<br>al <em>realizzato</em>.</h2>
          <p class="text" data-fade style="max-width:34ch">Trascina per confrontare la tavola di progetto con lo spazio finito.</p>
        </div>
        <div class="cmp" id="cmp" role="slider" tabindex="0" aria-label="Confronta disegno e realizzato" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100" data-cursor="Trascina">
          ${imgTag(pd.dopo, 'loading="lazy"')}
          <div class="cmp__top">${imgTag(pd.prima, 'loading="lazy"')}</div>
          <span class="cmp__lab cmp__lab--l meta">${esc(pd.etichette[0])}</span>
          <span class="cmp__lab cmp__lab--r meta">${esc(pd.etichette[1])}</span>
          <span class="cmp__bar"></span>
          <span class="cmp__knob"><svg width="26" height="10" viewBox="0 0 26 10" fill="none" aria-hidden="true"><path d="M5 1L1 5l4 4M21 1l4 4-4 4M1 5h24" stroke="currentColor"/></svg></span>
        </div>
      </section>` : ''}

      ${gal.length ? `
      <section class="pp-gal pp-gal--${galMode}" aria-label="Galleria">
        <div class="pp-gal__stage">
          <div class="pp-gal__head container">
            <h2 class="title title--h3" data-split>Galleria</h2>
            <span class="pp-gal__count"><b class="js-gal-n">01</b> / ${pad(gal.length)}</span>
          </div>
          <div class="pp-gal__track ${galMode === 'g' ? 'container' : ''}">
            ${gal.map((g) => `<figure class="pp-gal__item"><div class="gimg">${imgTag(g, 'loading="lazy"')}</div>${g.didascalia ? `<figcaption class="meta">${esc(g.didascalia)}</figcaption>` : ''}</figure>`).join('')}
          </div>
        </div>
      </section>` : ''}

      <a href="${projUrl(next)}" class="pp-next" data-cursor="Avanti" aria-label="Progetto successivo: ${esc(next.titolo)}">
        <div class="pp-next__img">${imgTag({ ...next.copertina, alt: '' }, 'loading="lazy"')}</div>
        <div class="pp-next__in">
          <span class="meta">Progetto successivo — ${next.numero}</span>
          <div>
            <p class="pp-next__t">${next.titolo_html}</p>
            <span class="pp-next__go" style="margin-top:2rem"><i>${arrow}</i>${esc(next.luogo)}</span>
          </div>
        </div>
      </a>`;
  };

  return { esc, strip, abs, srcset, imgTag, fmtNum, fmtDurata, arrow, projUrl, servUrl, pad, cards, filtri, progetto, SHORT };
});
