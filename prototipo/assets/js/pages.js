/* ==========================================================================
   MAXIARREDO — Pagine interne (Progetti, Progetto, Approfondimenti, Articolo)
   I contenuti arrivano da assets/data/*.json: è il punto in cui il CMS
   prenderà il posto dei file di prova (stessi campi, altra fonte).
   Ogni pagina dichiara il suo tipo in <body data-page="...">.
   ========================================================================== */
document.addEventListener('DOMContentLoaded', async () => {
  gsap.registerPlugin(ScrollTrigger, SplitText, Flip);

  const EASE = 'expo.out';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const page = document.body.dataset.page;
  const mm = gsap.matchMedia();

  /* ---------- Utilità ---------- */
  const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const imgTag = (o, extra = '') => o ? `<img src="${esc(o.src)}" alt="${esc(o.alt)}" width="${o.w}" height="${o.h}" decoding="async" ${extra}>` : '';
  const fmtDate = (iso, opt = { day: 'numeric', month: 'long', year: 'numeric' }) => new Intl.DateTimeFormat('it-IT', opt).format(new Date(iso));
  const fmtNum = (n) => new Intl.NumberFormat('it-IT').format(n);
  const arrow = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M1 9h16M10 2l7 7-7 7" stroke="currentColor"/></svg>';
  const getJSON = async (url) => { const r = await fetch(url, { cache: 'no-cache' }); if (!r.ok) throw new Error(url); return r.json(); };
  const param = (k) => new URLSearchParams(location.search).get(k);
  const projUrl = (p) => `progetto.html?p=${encodeURIComponent(p.slug)}`;
  const artUrl = (a) => `articolo.html?a=${encodeURIComponent(a.slug)}`;
  const servUrl = () => 'index.html#servizi';

  /* ---------- Scorrimento morbido ---------- */
  let lenis = null;
  if (!reduce) {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------- Header: si opacizza, si nasconde scendendo ---------- */
  const header = $('#header');
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate(self) {
      const y = self.scroll();
      header.classList.toggle('is-solid', y > 40);
      if (y < 200) header.classList.remove('is-hidden');
      else header.classList.toggle('is-hidden', self.direction === 1);
    },
  });

  const pjReveals = [];
  const revealAllProjects = () => {
    pjReveals.splice(0).forEach((tw) => { tw.scrollTrigger && tw.scrollTrigger.kill(); tw.progress(1).kill(); });
    $$('.pj__img').forEach((b) => gsap.set(b, { clipPath: 'none' }));
  };

  /* ---------- Contenuti ---------- */
  const main = $('#main');
  try {
    if (page === 'progetti') await renderProgetti();
    if (page === 'progetto') await renderProgetto();
    if (page === 'approfondimenti') await renderApprofondimenti();
    if (page === 'articolo') await renderArticolo();
  } catch (err) {
    console.error(err);
    main.insertAdjacentHTML('beforeend', '<p class="empty container">Contenuti non disponibili. Apri la pagina dal sito (i dati arrivano da assets/data/).</p>');
  }

  /* ---------- Box prenotazione ---------- */
  const booking = $('#booking');
  if (booking) ScrollTrigger.create({
    trigger: main, start: 'top -55%', endTrigger: '.footer', end: 'top bottom',
    onToggle: (self) => booking.classList.toggle('is-visible', self.isActive),
  });

  initCursor();
  if (!reduce) initMotion();
  ScrollTrigger.refresh();
  if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());

  /* ======================================================================
     PROGETTI — elenco con filtri e due viste
     ====================================================================== */
  async function renderProgetti() {
    const { progetti } = await getJSON('assets/data/progetti.json');
    const wrap = $('#pj-wrap'), list = $('.pj-list', wrap);
    $('#pj-total').textContent = String(progetti.length).padStart(2, '0');

    list.innerHTML = progetti.map((p) => `
      <a href="${projUrl(p)}" class="pj" role="listitem" data-cursor="Scopri" data-tip="${esc(p.tipologia)}" data-int="${esc(p.intervento)}" data-slug="${esc(p.slug)}">
          <figure class="pj__media"><div class="pj__img">${imgTag(p.copertina, 'loading="lazy" sizes="(min-width: 901px) 50vw, 100vw"')}</div></figure>
          <span class="pj__num">${p.numero}</span>
          <h2 class="pj__title">${p.titolo_html}</h2>
          <span class="pj__place">${esc(p.luogo)}</span>
          <span class="pj__year">${p.anno}</span>
          <span class="pj__type">${esc(p.tipologia)}</span>
          <span class="pj__arrow">${arrow}</span>
      </a>`).join('');

    // Filtri: tipologia e intervento (si combinano)
    const groups = { tip: 'Tipologia', int: 'Intervento' };
    const SHORT = { 'Ristrutturazione completa': 'Ristrutturazione', 'Arredamento su misura': 'Su misura' };   // etichette brevi nei filtri
    const values = (k) => [...new Set(progetti.map((p) => (k === 'tip' ? p.tipologia : p.intervento)))];
    const state = { tip: 'all', int: 'all' };
    const fwrap = $('#pj-filters');
    fwrap.innerHTML = Object.entries(groups).map(([k, label]) => `
      <div class="filters__group" role="group" aria-label="${label}">
        <span class="filters__label">${label}</span>
        <button class="fbtn is-active" data-k="${k}" data-v="all" aria-pressed="true">Tutti</button>
        ${values(k).map((v) => `<button class="fbtn" data-k="${k}" data-v="${esc(v)}" aria-pressed="false">${esc(SHORT[v] || v)}<sup></sup></button>`).join('')}
      </div>`).join('');

    const items = $$('.pj', list);
    const match = (el, s = state) => (s.tip === 'all' || el.dataset.tip === s.tip) && (s.int === 'all' || el.dataset.int === s.int);
    const updateCounts = () => {
      $$('.fbtn', fwrap).forEach((b) => {
        if (b.dataset.v === 'all') return;
        const n = items.filter((el) => match(el, { ...state, [b.dataset.k]: b.dataset.v })).length;
        $('sup', b).textContent = n;
        b.disabled = n === 0 && !b.classList.contains('is-active');
      });
    };
    // impaginato asimmetrico: la forma dipende dalla posizione tra quelli visibili
    const layout = () => {
      let i = 0;
      items.forEach((el) => {
        el.classList.remove('pj--a', 'pj--b', 'pj--c', 'pj--d', 'pj--e', 'pj--f');
        if (!el.classList.contains('is-hidden')) el.classList.add('pj--' + 'abcdef'[i++ % 6]);
      });
      const n = items.filter((el) => !el.classList.contains('is-hidden')).length;
      $('#pj-count').innerHTML = `<b>${String(n).padStart(2, '0')}</b> ${n === 1 ? 'progetto' : 'progetti'}`;
      $('#pj-empty').classList.toggle('is-hidden', n > 0);
    };
    const applyFilters = (animate = true) => {
      if (animate) revealAllProjects();          // dopo il primo filtro le foto restano aperte
      const st = animate && !reduce ? Flip.getState(items, { props: 'opacity' }) : null;
      // l'altezza dell'elenco resta ferma durante l'animazione: il footer non "salta"
      if (st) list.style.minHeight = list.offsetHeight + 'px';
      items.forEach((el) => el.classList.toggle('is-hidden', !match(el)));
      layout();
      updateCounts();
      if (st) Flip.from(st, {
        duration: 0.9, ease: 'power3.inOut', absoluteOnLeave: true, stagger: 0.025, scale: false,
        onEnter: (els) => gsap.fromTo(els, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.8, ease: EASE, stagger: 0.05 }),
        onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.96, duration: 0.35 }),
        onComplete: () => { list.style.minHeight = ''; ScrollTrigger.refresh(); },
      });
      else ScrollTrigger.refresh();
    };
    fwrap.addEventListener('click', (e) => {
      const b = e.target.closest('.fbtn');
      if (!b || b.disabled) return;
      state[b.dataset.k] = b.dataset.v;
      $$(`.fbtn[data-k="${b.dataset.k}"]`, fwrap).forEach((x) => {
        x.classList.toggle('is-active', x === b); x.setAttribute('aria-pressed', String(x === b));
      });
      applyFilters();
    });

    // Vista griglia / elenco (ricordata per questo visitatore)
    const tog = $('#pj-view');
    const setView = (v, animate = true) => {
      if (wrap.dataset.view === v) return;
      const st = animate && !reduce ? Flip.getState($$('.pj, .pj__title, .pj__num, .pj__place', list)) : null;
      wrap.dataset.view = v;
      $$('button', tog).forEach((b) => { const on = b.dataset.view === v; b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', String(on)); });
      try { localStorage.setItem('mx-pj-view', v); } catch (e) { /* facoltativo */ }
      if (st) Flip.from(st, { duration: 0.9, ease: 'power3.inOut', absolute: false, nested: true, scale: false, onComplete: () => ScrollTrigger.refresh() });
      else ScrollTrigger.refresh();
    };
    tog.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) setView(b.dataset.view); });
    let saved = null;
    try { saved = localStorage.getItem('mx-pj-view'); } catch (e) { /* facoltativo */ }
    if (saved === 'list') setView('list', false);

    applyFilters(false);

    // Anteprima che segue il mouse (solo vista elenco, solo mouse)
    if (finePointer) {
      const peek = document.createElement('div');
      peek.className = 'pj-peek';
      peek.setAttribute('aria-hidden', 'true');
      peek.innerHTML = progetti.map((p) => `<img data-slug="${esc(p.slug)}" src="${esc(p.copertina.src)}" alt="" loading="lazy">`).join('');
      document.body.appendChild(peek);
      const px = gsap.quickTo(peek, 'x', { duration: 0.7, ease: 'power3' });
      const py = gsap.quickTo(peek, 'y', { duration: 0.7, ease: 'power3' });
      let lastX = 0;
      list.addEventListener('pointermove', (e) => {
        if (wrap.dataset.view !== 'list') return;
        px(e.clientX); py(e.clientY);
        gsap.to(peek, { rotation: gsap.utils.clamp(-7, 7, (e.clientX - lastX) * 0.35), duration: 0.6, ease: 'power3' });
        lastX = e.clientX;
      });
      list.addEventListener('pointerover', (e) => {
        if (wrap.dataset.view !== 'list') return;
        const li = e.target.closest('.pj'); if (!li) return;
        $$('img', peek).forEach((im) => im.classList.toggle('is-active', im.dataset.slug === li.dataset.slug));
        gsap.to(peek, { opacity: 1, scale: 1, duration: 0.6, ease: EASE, overwrite: 'auto' });
      });
      list.addEventListener('pointerleave', () => gsap.to(peek, { opacity: 0, scale: 0.85, duration: 0.5, ease: EASE, overwrite: 'auto' }));
      tog.addEventListener('click', () => gsap.set(peek, { opacity: 0 }));
    }
  }

  /* ======================================================================
     PROGETTO — pagina singola
     ====================================================================== */
  async function renderProgetto() {
    const { progetti } = await getJSON('assets/data/progetti.json');
    const i = Math.max(0, progetti.findIndex((p) => p.slug === param('p')));
    const p = progetti[i], next = progetti[(i + 1) % progetti.length];
    document.title = `${p.titolo} — Progetti · Maxiarredo`;
    const chapters = [['La richiesta', p.racconto.richiesta], ['Il progetto', p.racconto.progetto], ['Il cantiere', p.racconto.cantiere], ['La consegna', p.racconto.consegna]];
    const pd = p.prima_dopo;
    const gal = p.galleria || [];
    const galMode = gal.length >= 3 ? 'h' : 'g';

    main.innerHTML = `
      <section class="pg-hero container" aria-labelledby="pp-title">
        <div class="pp-hero__top">
          <a href="progetti.html" class="meta back-link"><svg width="16" height="10" viewBox="0 0 16 10" fill="none" aria-hidden="true"><path d="M16 5H1M5 1L1 5l4 4" stroke="currentColor"/></svg>Tutti i progetti</a>
          <span class="meta">Progetto <b>${p.numero}</b> / ${String(progetti.length).padStart(2, '0')}</span>
        </div>
        <h1 class="pp-title" id="pp-title" data-split="hero">${p.titolo_html}</h1>
        <div class="pp-hero__grid">
          <p class="pp-hero__lead" data-fade>${esc(p.estratto)}</p>
          <dl class="spec" data-fade>
            <div><dt>Luogo</dt><dd>${esc(p.luogo)}</dd></div>
            <div><dt>Anno</dt><dd>${p.anno}</dd></div>
            <div><dt>Superficie</dt><dd>${fmtNum(p.superficie)} m²</dd></div>
            <div><dt>Tipologia</dt><dd>${esc(p.tipologia)}</dd></div>
            <div><dt>Intervento</dt><dd>${esc(p.intervento)}</dd></div>
            <div><dt>Durata</dt><dd>${p.durata} ${p.durata === 1 ? 'mese' : 'mesi'}</dd></div>
          </dl>
        </div>
      </section>

      <figure class="pp-cover" data-cursor="${esc(p.luogo)}">${imgTag(p.copertina, 'fetchpriority="high" sizes="100vw"')}
        <figcaption class="pp-cover__cap meta">${esc(p.luogo)} — ${p.anno}</figcaption></figure>

      <section class="pp-story container" aria-label="Il racconto del progetto">
        <aside class="pp-aside">
          <p class="pp-aside__title">Il progetto<br>in breve</p>
          <div>
            <span class="meta" style="display:block;margin-bottom:.8rem">Servizi coinvolti</span>
            <ul class="pp-services">${p.servizi.map((s) => `<li><a href="${servUrl(s)}">${esc(s.nome)}${arrow}</a></li>`).join('')}</ul>
          </div>
          <a href="index.html#contatti" class="btn js-magnetic"><span class="btn__dot"></span>Parliamo del tuo progetto</a>
        </aside>
        <div class="pp-chapters">
          <div class="pp-line" aria-hidden="true"><i></i></div>
          ${chapters.map(([t, txt], k) => `
            <article class="ch">
              <span class="ch__n">0${k + 1}</span>
              <h2 class="ch__t" data-split>${t}</h2>
              <p class="ch__p" data-fade>${esc(txt)}</p>
            </article>`).join('')}
        </div>
      </section>

      ${p.citazione ? `
      <figure class="pp-quote container">
        <blockquote class="js-words">${esc(p.citazione.testo)}</blockquote>
        <figcaption class="meta">— ${esc(p.citazione.autore)} <span class="placeholder-note" style="margin-left:.6rem">Testimonianza simulata</span></figcaption>
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
          <span class="cmp__knob"><svg width="26" height="10" viewBox="0 0 26 10" fill="none"><path d="M5 1L1 5l4 4M21 1l4 4-4 4M1 5h24" stroke="currentColor"/></svg></span>
        </div>
      </section>` : ''}

      ${gal.length ? `
      <section class="pp-gal pp-gal--${galMode}" aria-label="Galleria">
        <div class="pp-gal__stage">
          <div class="pp-gal__head container">
            <h2 class="title title--h3" data-split>Galleria</h2>
            <span class="pp-gal__count"><b class="js-gal-n">01</b> / ${String(gal.length).padStart(2, '0')}</span>
          </div>
          <div class="pp-gal__track ${galMode === 'g' ? 'container' : ''}">
            ${gal.map((g) => `<figure class="pp-gal__item"><div class="gimg">${imgTag(g, 'loading="lazy"')}</div>${g.didascalia ? `<figcaption class="meta">${esc(g.didascalia)}</figcaption>` : ''}</figure>`).join('')}
          </div>
        </div>
      </section>` : ''}

      <a href="${projUrl(next)}" class="pp-next" data-cursor="Avanti">
        <div class="pp-next__img">${imgTag(next.copertina, 'loading="lazy"')}</div>
        <div class="pp-next__in">
          <span class="meta">Progetto successivo — ${next.numero}</span>
          <div>
            <p class="pp-next__t">${next.titolo_html}</p>
            <span class="pp-next__go" style="margin-top:2rem"><i>${arrow}</i>${esc(next.luogo)} · ${next.anno}</span>
          </div>
        </div>
      </a>`;

    // Confronto disegno / realizzato
    const cmp = $('#cmp');
    if (cmp) {
      const st = { pos: 100 }; let touched = false;
      const apply = () => { cmp.style.setProperty('--pos', st.pos + '%'); cmp.setAttribute('aria-valuenow', Math.round(st.pos)); };
      const fromEvent = (e) => { const r = cmp.getBoundingClientRect(); st.pos = gsap.utils.clamp(0, 100, ((e.clientX - r.left) / r.width) * 100); apply(); };
      let drag = false;
      cmp.addEventListener('pointerdown', (e) => { drag = true; touched = true; cmp.setPointerCapture(e.pointerId); gsap.killTweensOf(st); fromEvent(e); });
      cmp.addEventListener('pointermove', (e) => drag && fromEvent(e));
      cmp.addEventListener('pointerup', () => { drag = false; });
      cmp.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { touched = true; st.pos = gsap.utils.clamp(0, 100, st.pos + (e.key === 'ArrowLeft' ? -5 : 5)); apply(); e.preventDefault(); }
      });
      apply();
      // scorrendo, il realizzato "copre" il disegno fino a metà (finché non lo tocchi)
      if (!reduce) ScrollTrigger.create({
        trigger: cmp, start: 'top 80%', end: 'center 45%', scrub: 0.6,
        onUpdate: (self) => { if (!touched) { st.pos = 100 - self.progress * 50; apply(); } },
      });
      else { st.pos = 50; apply(); }
    }
  }

  /* ======================================================================
     APPROFONDIMENTI — elenco
     ====================================================================== */
  async function renderApprofondimenti() {
    const { articoli } = await getJSON('assets/data/articoli.json');
    articoli.sort((a, b) => b.data.localeCompare(a.data));
    const feat = articoli.find((a) => a.in_evidenza) || articoli[0];
    $('#ar-total').textContent = String(articoli.length).padStart(2, '0');

    $('#af').innerHTML = `
      <a href="${artUrl(feat)}" class="af" data-cursor="Leggi">
        <figure class="af__media" data-par>${imgTag(feat.copertina, 'fetchpriority="high" sizes="(min-width: 901px) 60vw, 100vw"')}</figure>
        <div class="af__info">
          <span class="tag"><b>In evidenza</b><i></i>${esc(feat.categoria)}</span>
          <h2 class="af__t">${feat.titolo_html}</h2>
          <p class="af__x">${esc(feat.estratto)}</p>
          <span class="tag">${fmtDate(feat.data)}<i></i>${feat.lettura} min di lettura</span>
          <span class="link-arrow">Leggi l'articolo ${arrow}</span>
        </div>
      </a>`;

    const list = $('.ar-list');
    list.innerHTML = articoli.map((a) => `
      <a href="${artUrl(a)}" class="ar" role="listitem" data-cursor="Leggi" data-cat="${esc(a.categoria)}" data-feat="${a === feat ? '1' : ''}">
          <time class="ar__date" datetime="${a.data}">${fmtDate(a.data, { day: '2-digit', month: 'short', year: 'numeric' })}</time>
          <span class="ar__cat tag"><b>${esc(a.categoria)}</b></span>
          <div class="ar__body">
            <h3 class="ar__t">${a.titolo_html}</h3>
            <p class="ar__x">${esc(a.estratto)}</p>
            <span class="tag ar__more">${a.lettura} min ${arrow}</span>
          </div>
          <figure class="ar__thumb">${imgTag(a.copertina, 'loading="lazy" sizes="260px"')}</figure>
      </a>`).join('');

    const cats = [...new Set(articoli.map((a) => a.categoria))];
    const fwrap = $('#ar-filters');
    fwrap.innerHTML = `<div class="filters__group" role="group" aria-label="Temi">
      <span class="filters__label">Temi</span>
      <button class="fbtn is-active" data-v="all" aria-pressed="true">Tutti<sup>${articoli.length}</sup></button>
      ${cats.map((c) => `<button class="fbtn" data-v="${esc(c)}" aria-pressed="false">${esc(c)}<sup>${articoli.filter((a) => a.categoria === c).length}</sup></button>`).join('')}
    </div>`;
    const rows = $$('.ar', list);
    let cur = 'all';
    const apply = (animate = true) => {
      const st = animate && !reduce ? Flip.getState([...rows, $('.af')]) : null;
      if (st) list.style.minHeight = list.offsetHeight + 'px';
      // con "Tutti" l'articolo in evidenza sta in apertura e non si ripete nell'elenco
      $('.af').classList.toggle('is-hidden', cur !== 'all');
      rows.forEach((r) => r.classList.toggle('is-hidden', cur === 'all' ? !!r.dataset.feat : r.dataset.cat !== cur));
      const n = rows.filter((r) => !r.classList.contains('is-hidden')).length + (cur === 'all' ? 1 : 0);
      $('#ar-count').innerHTML = `<b>${String(n).padStart(2, '0')}</b> ${n === 1 ? 'articolo' : 'articoli'}`;
      if (st) Flip.from(st, {
        duration: 0.8, ease: 'power3.inOut', absoluteOnLeave: true, stagger: 0.03, scale: false,
        onEnter: (els) => gsap.fromTo(els, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, ease: EASE, stagger: 0.05 }),
        onLeave: (els) => gsap.to(els, { opacity: 0, duration: 0.3 }),
        onComplete: () => { list.style.minHeight = ''; ScrollTrigger.refresh(); },
      });
    };
    fwrap.addEventListener('click', (e) => {
      const b = e.target.closest('.fbtn'); if (!b) return;
      cur = b.dataset.v;
      $$('.fbtn', fwrap).forEach((x) => { x.classList.toggle('is-active', x === b); x.setAttribute('aria-pressed', String(x === b)); });
      apply();
    });
    apply(false);
  }

  /* ======================================================================
     ARTICOLO
     ====================================================================== */
  async function renderArticolo() {
    const [{ articoli }, { progetti }] = await Promise.all([getJSON('assets/data/articoli.json'), getJSON('assets/data/progetti.json')]);
    const a = articoli.find((x) => x.slug === param('a')) || articoli[0];
    document.title = `${a.titolo} — Approfondimenti · Maxiarredo`;
    let h = 0;
    const toc = [];
    const body = a.corpo.map((b) => {
      if (b.tipo === 'p') return `<p>${esc(b.testo)}</p>`;
      if (b.tipo === 'h2') { const id = 's' + (++h); toc.push([id, b.testo]); return `<h2 id="${id}">${esc(b.testo)}</h2>`; }
      if (b.tipo === 'lista') return `<ul>${b.voci.map((v) => `<li>${esc(v)}</li>`).join('')}</ul>`;
      if (b.tipo === 'citazione') return `<blockquote>${esc(b.testo)}</blockquote>`;
      if (b.tipo === 'immagine') return `<figure><div class="fimg">${imgTag(b.img, 'loading="lazy"')}</div>${b.img.didascalia ? `<figcaption>${esc(b.img.didascalia)}</figcaption>` : ''}</figure>`;
      if (b.tipo === 'nota') return `<aside class="nota"><strong>${esc(b.titolo)}</strong>${esc(b.testo)}</aside>`;
      return '';
    }).join('');
    const others = articoli.filter((x) => x !== a).sort((x, y) => (y.categoria === a.categoria) - (x.categoria === a.categoria) || y.data.localeCompare(x.data)).slice(0, 3);
    const linked = (a.progetti_correlati || []).map((s) => progetti.find((p) => p.slug === s)).filter(Boolean);
    const X = '<svg viewBox="292 130 50 62" aria-hidden="true"><path fill="currentColor" d="M 318.18 158.32 L 336.16 132.70 L 329.92 132.70 L 314.95 153.78 L 300.47 132.70 L 294.16 132.70 L 311.79 158.32 L 298.77 177.09 L 295.10 182.35 L 297.58 187.89 L 303.92 178.79 L 314.95 162.92 L 333.28 188.89 L 339.60 188.89 Z"/></svg>';

    main.innerHTML = `
      <article>
        <header class="art-hero container">
          <div class="art-hero__top">
            <a href="approfondimenti.html" class="meta back-link"><svg width="16" height="10" viewBox="0 0 16 10" fill="none" aria-hidden="true"><path d="M16 5H1M5 1L1 5l4 4" stroke="currentColor"/></svg>Approfondimenti</a>
            <span class="tag"><b>${esc(a.categoria)}</b><i></i><time datetime="${a.data}">${fmtDate(a.data)}</time><i></i>${a.lettura} min</span>
          </div>
          <h1 class="art-title" data-split="hero">${a.titolo_html}</h1>
          <div class="art-hero__grid">
            <p class="art-lead" data-fade>${esc(a.estratto)}</p>
            <div class="art-by" data-fade><span class="art-by__x">${X}</span><span class="art-by__n">${esc(a.autore)}<small>Roveleto di Cadeo</small></span></div>
          </div>
          <figure class="art-cover" data-par>${imgTag(a.copertina, 'fetchpriority="high" sizes="100vw"')}</figure>
        </header>

        <div class="art container">
          <nav class="toc" aria-label="Indice dell'articolo">
            <span class="meta">Indice</span>
            <ol>${toc.map(([id, t]) => `<li><a href="#${id}">${esc(t)}</a></li>`).join('')}</ol>
            <button class="toc__share meta link-arrow" type="button" id="share">Copia il link</button>
          </nav>
          <div class="prose">${body}</div>
          <aside class="art-end">
            <p class="art-end__t">Hai uno spazio da <em>ripensare</em>?</p>
            <p class="text">Raccontacelo in showroom: partiamo da come vivi la casa, non da un catalogo.</p>
            <a href="index.html#contatti" class="btn btn--light js-magnetic"><span class="btn__dot"></span>Prenota una consulenza</a>
          </aside>
        </div>
      </article>

      ${linked.length ? `
      <section class="rel container" aria-labelledby="rel-p">
        <div class="rel__head"><h2 class="title title--h3" id="rel-p" data-split>Progetti citati</h2><a href="progetti.html" class="link-arrow">Tutti i progetti ${arrow}</a></div>
        <div class="rel__grid">${linked.map((p) => `
          <a href="${projUrl(p)}" class="rel__card" data-cursor="Scopri">
            <figure class="rel__media">${imgTag(p.copertina, 'loading="lazy"')}</figure>
            <span class="tag"><b>${p.numero}</b><i></i>${esc(p.luogo)}</span>
            <h3 class="rel__t">${p.titolo_html}</h3>
          </a>`).join('')}</div>
      </section>` : ''}

      <section class="rel container" aria-labelledby="rel-a">
        <div class="rel__head"><h2 class="title title--h3" id="rel-a" data-split>Continua a leggere</h2><a href="approfondimenti.html" class="link-arrow">Tutti gli approfondimenti ${arrow}</a></div>
        <div class="rel__grid">${others.map((x) => `
          <a href="${artUrl(x)}" class="rel__card" data-cursor="Leggi">
            <figure class="rel__media">${imgTag(x.copertina, 'loading="lazy"')}</figure>
            <span class="tag"><b>${esc(x.categoria)}</b><i></i>${x.lettura} min</span>
            <h3 class="rel__t">${x.titolo_html}</h3>
          </a>`).join('')}</div>
      </section>`;

    // Indice: voce attiva + salto morbido
    const links = $$('.toc a');
    $$('.prose h2').forEach((h2, k) => ScrollTrigger.create({
      trigger: h2, start: 'top 45%', endTrigger: $$('.prose h2')[k + 1] || '.prose', end: k + 1 < links.length ? 'top 45%' : 'bottom 45%',
      onToggle: (self) => { if (self.isActive) links.forEach((l, j) => l.classList.toggle('is-active', j === k)); },
    }));
    links.forEach((l) => l.addEventListener('click', (e) => {
      e.preventDefault();
      const t = $(l.getAttribute('href'));
      if (lenis) lenis.scrollTo(t, { offset: -110, duration: 1.4 }); else t.scrollIntoView();
    }));
    // Barra di lettura
    gsap.to('.rp', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.prose', start: 'top 70%', end: 'bottom 60%', scrub: 0.3 } });
    // Copia link
    $('#share').addEventListener('click', async (e) => {
      try { await navigator.clipboard.writeText(location.href); e.currentTarget.textContent = 'Link copiato'; }
      catch (err) { e.currentTarget.textContent = location.href; }
    });
  }

  /* ======================================================================
     MOVIMENTO — tutto legato allo scroll, come in home
     ====================================================================== */
  function initMotion() {
    // Titoli della testata: entrano subito (dopo il velo)
    $$('[data-split="hero"]').forEach((el) => SplitText.create(el, {
      type: 'lines', mask: 'lines', autoSplit: true,
      onSplit: (self) => gsap.from(self.lines, { yPercent: 110, duration: 1.4, ease: EASE, stagger: 0.1, delay: 0.35 }),
    }));
    $$('.pg-hero [data-fade], .pp-hero__grid [data-fade], .art-hero__grid [data-fade], .pg-hero__top, .pp-hero__top, .art-hero__top').forEach((el, k) =>
      gsap.from(el, { y: 24, opacity: 0, duration: 1.2, ease: EASE, delay: 0.55 + k * 0.06 }));
    // Altri titoli: righe che salgono quando entrano
    $$('[data-split]:not([data-split="hero"])').forEach((el) => SplitText.create(el, {
      type: 'lines', mask: 'lines', autoSplit: true,
      onSplit: (self) => gsap.from(self.lines, { yPercent: 110, duration: 1.3, ease: EASE, stagger: 0.1, scrollTrigger: { trigger: el, start: 'top 88%', once: true } }),
    }));
    $$('[data-fade]').forEach((el) => {
      if (el.closest('.pg-hero, .pp-hero__grid, .art-hero__grid')) return;
      gsap.from(el, { y: 30, opacity: 0, duration: 1.2, ease: EASE, scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    });

    // Progetti (elenco): ogni foto si apre a tenda e scorre nella cornice, seguendo lo scroll
    $$('.pj').forEach((li) => {
      const box = $('.pj__img', li), img = $('img', li);
      pjReveals.push(gsap.fromTo(box, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'power2.inOut',
        scrollTrigger: { trigger: li, start: 'top 96%', end: 'top 55%', scrub: 0.6 } }));
      gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: li, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    // Immagini con parallasse interno (in evidenza, copertina articolo)
    $$('[data-par]').forEach((f) => {
      const img = $('img', f);
      gsap.fromTo(f, { clipPath: 'inset(12% 8% 12% 8%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'power2.out', scrollTrigger: { trigger: f, start: 'top 95%', end: 'top 30%', scrub: 0.6 } });
      gsap.fromTo(img, { yPercent: -5, scale: 1.18 }, { yPercent: 5, scale: 1.08, ease: 'none', scrollTrigger: { trigger: f, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    // Approfondimenti: linee tra gli articoli che si disegnano
    $$('.ar').forEach((r) => gsap.fromTo(r, { '--line': 0 }, { '--line': 1, ease: 'power2.out', scrollTrigger: { trigger: r, start: 'top 95%', end: 'top 70%', scrub: 0.5 } }));

    // Progetto: copertina che si allarga a tutto schermo scorrendo
    const cover = $('.pp-cover');
    if (cover) {
      gsap.fromTo(cover, { clipPath: () => `inset(0% ${getComputedStyle(document.documentElement).getPropertyValue('--gutter')} 0% ${getComputedStyle(document.documentElement).getPropertyValue('--gutter')})` },
        { clipPath: 'inset(0% 0px 0% 0px)', ease: 'none', scrollTrigger: { trigger: cover, start: 'top 85%', end: 'top 10%', scrub: 0.5, invalidateOnRefresh: true } });
      gsap.fromTo($('img', cover), { scale: 1.2, yPercent: -4 }, { scale: 1, yPercent: 6, ease: 'none', scrollTrigger: { trigger: cover, start: 'top bottom', end: 'bottom top', scrub: true } });
    }
    // Progetto: il filo dei capitoli si disegna
    const line = $('.pp-line i');
    if (line) gsap.to(line, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.pp-chapters', start: 'top 70%', end: 'bottom 70%', scrub: 0.5 } });
    // Progetto: citazione che si accende parola per parola
    $$('.js-words').forEach((q) => SplitText.create(q, {
      type: 'words', onSplit: (self) => gsap.fromTo(self.words, { opacity: 0.12 }, { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: q, start: 'top 80%', end: 'bottom 45%', scrub: 0.5 } }),
    }));
    // Progetto: galleria orizzontale bloccata (desktop) o a due colonne
    const gal = $('.pp-gal--h');
    if (gal) {
      mm.add('(min-width: 901px)', () => {
        const track = $('.pp-gal__track', gal), items = $$('.pp-gal__item', gal), n = $('.js-gal-n', gal);
        const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
        const tl = gsap.timeline({ scrollTrigger: { trigger: gal, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 0.7, invalidateOnRefresh: true,
          onUpdate: (self) => { n.textContent = String(Math.min(items.length, Math.floor(self.progress * (items.length - 0.01)) + 1)).padStart(2, '0'); } } });
        tl.to(track, { x: () => -dist(), ease: 'none' }, 0);
        items.forEach((it) => tl.fromTo($('img', it), { xPercent: -4 }, { xPercent: 4, ease: 'none' }, 0));
        return () => gsap.set([track, ...items.map((it) => $('img', it))], { clearProps: 'all' });
      });
    }
    $$('.pp-gal--g .pp-gal__item, .pp-gal--h .pp-gal__item').forEach((it) => {
      if (window.innerWidth > 900 && it.closest('.pp-gal--h')) return;
      gsap.fromTo($('.gimg', it), { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'power2.inOut', scrollTrigger: { trigger: it, start: 'top 95%', end: 'top 55%', scrub: 0.6 } });
    });
    // Progetto successivo: il riquadro si apre entrando
    const nx = $('.pp-next');
    if (nx) gsap.fromTo(nx, { clipPath: 'inset(12% 6% 0% 6%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: { trigger: nx, start: 'top bottom', end: 'top 25%', scrub: 0.5 } });

    // Articolo: immagini nel testo
    $$('.prose figure').forEach((f) => {
      gsap.fromTo($('.fimg', f), { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'power2.inOut', scrollTrigger: { trigger: f, start: 'top 90%', end: 'top 45%', scrub: 0.6 } });
      gsap.fromTo($('img', f), { scale: 1.2 }, { scale: 1.02, ease: 'none', scrollTrigger: { trigger: f, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    // Correlati
    $$('.rel__card').forEach((c) => gsap.fromTo($('.rel__media', c), { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'power2.inOut', scrollTrigger: { trigger: c, start: 'top 95%', end: 'top 60%', scrub: 0.6 } }));
  }

  /* ======================================================================
     CURSORE (X del marchio + badge) e pulsanti magnetici
     Con eventi "delegati": funziona anche sugli elementi creati dai dati.
     ====================================================================== */
  function initCursor() {
    if (!finePointer) return;
    const dot = $('#cursor'), badge = $('#cursor-badge');
    if (!dot || !badge) return;
    const dx = gsap.quickTo(dot, 'x', { duration: 0.22, ease: 'power3' });
    const dy = gsap.quickTo(dot, 'y', { duration: 0.22, ease: 'power3' });
    const bx = gsap.quickTo(badge, 'x', { duration: 0.6, ease: 'power3' });
    const by = gsap.quickTo(badge, 'y', { duration: 0.6, ease: 'power3' });
    const cur = { base: 1, press: 1, speed: 0, s: 1 };
    let px = null, py = null, lx = null, ly = null, area = null;
    window.addEventListener('pointermove', (e) => {
      px = e.clientX; py = e.clientY; dx(px); dy(py); bx(px); by(py);
      gsap.to(dot, { opacity: 1, duration: 0.3, overwrite: 'auto' });
    }, { passive: true });
    gsap.ticker.add(() => {
      if (px === null) return;
      const v = lx === null ? 0 : Math.hypot(px - lx, py - ly); lx = px; ly = py;
      cur.speed += (gsap.utils.clamp(0, 1, v / 45) - cur.speed) * 0.12;
      cur.s += (cur.base * cur.press * (1 - 0.32 * cur.speed) - cur.s) * 0.18;
      gsap.set(dot, { scale: cur.s });
    });
    const setBase = (b) => gsap.to(cur, { base: b, duration: 0.35, ease: 'power2.out', overwrite: 'auto' });
    window.addEventListener('pointerdown', () => { cur.press = 0.82; });
    window.addEventListener('pointerup', () => { cur.press = 1; });
    document.addEventListener('pointerover', (e) => {
      const el = e.target.closest('[data-cursor]');
      if (el !== area) {
        area = el;
        if (el) { badge.textContent = el.dataset.cursor; gsap.to(badge, { scale: 1, duration: 0.6, ease: EASE, overwrite: 'auto' }); }
        else gsap.to(badge, { scale: 0, duration: 0.5, ease: EASE, overwrite: 'auto' });
      }
      if (el) setBase(0);
      else setBase(e.target.closest('a, button, input, select, textarea, label') ? 1.8 : 1);
    });
    document.addEventListener('pointerover', (e) => {
      const btn = e.target.closest('.js-magnetic');
      if (!btn || btn._mag) return;
      btn._mag = true;
      const mx = gsap.quickTo(btn, 'x', { duration: 0.6, ease: 'power3' });
      const my = gsap.quickTo(btn, 'y', { duration: 0.6, ease: 'power3' });
      btn.addEventListener('pointermove', (ev) => { const r = btn.getBoundingClientRect(); mx((ev.clientX - r.left - r.width / 2) * 0.25); my((ev.clientY - r.top - r.height / 2) * 0.35); });
      btn.addEventListener('pointerleave', () => { mx(0); my(0); });
    });
  }
});
