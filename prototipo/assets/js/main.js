/* ==========================================================================
   MAXIARREDO — Bozza Home · Animazioni
   Stack: GSAP 3 (+ ScrollTrigger, SplitText) + Lenis per lo smooth scroll.
   Tutto parte su DOMContentLoaded. Con "prefers-reduced-motion" niente
   Lenis e niente animazioni: il contenuto è subito visibile.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  gsap.registerPlugin(ScrollTrigger, SplitText);

  const EASE = 'expo.out';                 // = cubic-bezier(0.16, 1, 0.3, 1) del CSS
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* Linee che "si disegnano": si misura la lunghezza reale di ogni tratto SVG
     (niente pathLength, che Safari su iPhone non applica ai tratteggi).
     prepDraw imposta il tratteggio; LEN(el) è la lunghezza da usare come offset. */
  const prepDraw = (els) => [].concat(els).forEach((el) => {
    const L = el.getTotalLength ? el.getTotalLength() : 0;
    el._len = L || 1;
    el.style.strokeDasharray = el._len + ' ' + el._len;
  });
  const LEN = (i, el) => el._len;

  /* ------------------------------------------------------------------
     1. SMOOTH SCROLL — Lenis sincronizzato con il ticker di GSAP
     ------------------------------------------------------------------ */
  let lenis = null;
  if (!reduceMotion) {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9 });
    lenis.on('scroll', ScrollTrigger.update);          // ScrollTrigger legge la posizione di Lenis
    gsap.ticker.add((time) => lenis.raf(time * 1000));  // un solo loop di animazione
    gsap.ticker.lagSmoothing(0);
  }

  /* ------------------------------------------------------------------
     1b. APERTURA — il marchio MAXIARREDO
         Dalla X partono due linee incrociate; le lettere escono dalla X,
         prima solo il contorno (come a matita) poi piene; il sottotitolo
         si stringe. Il contatore segue il caricamento delle immagini dell'apertura.
         Poi il marchio vola nella sua posizione nel menu e il fondo si
         alza come un sipario: a quel punto parte l'animazione dell'hero.
         A ogni caricamento della pagina; clic, tasto o rotella la saltano.
     ------------------------------------------------------------------ */
  const root = document.documentElement;
  const introOn = root.classList.contains('intro') && !reduceMotion;
  const whenIntroDone = [];                              // funzioni da eseguire a sipario alzato
  if (!introOn) { root.classList.remove('intro'); const l = $('#loader'); if (l) l.remove(); }
  else {
    if (lenis) lenis.stop();
    const loader = $('#loader');
    const mark = $('.loader__mark', loader);
    const guides = $$('.ld-g', loader);
    const letters = $$('.ld-l', loader);
    const subs = $$('.ld-s', loader);
    const counter = $('.loader__count', loader);
    const X_CX = 317, SUB_CX = 412;

    // si aspettano solo le due immagini dell'apertura (non tutta la pagina),
    // e comunque non più di 3 secondi: su rete lenta il sito compare prima
    let loaded = false;
    const heroImgs = $$('.hero__layer img');
    Promise.all(heroImgs.map((im) => (im.complete ? Promise.resolve() : new Promise((r) => { im.addEventListener('load', r, { once: true }); im.addEventListener('error', r, { once: true }); }))))
      .then(() => { loaded = true; });
    setTimeout(() => { loaded = true; }, 3000);

    const count = { v: 0 };
    const showCount = () => (counter.textContent = String(Math.round(count.v)).padStart(3, '0'));

    const tl = gsap.timeline({ onComplete: waitAndExit });
    prepDraw([...guides, ...letters]);
    gsap.set([...guides, ...letters], { strokeDashoffset: LEN });
    tl.to(guides, { strokeDashoffset: 0, duration: 0.7, ease: 'power2.inOut', stagger: 0.12 }, 0);
    letters.forEach((l) => {
      const dx = X_CX - +l.dataset.cx;                    // le lettere partono dalla X
      const delay = Math.abs(dx) / 330 * 0.55;
      tl.fromTo(l, { x: dx * 0.55, opacity: 0 }, { x: 0, opacity: 1, duration: 1.1, ease: 'expo.out' }, 0.35 + delay)
        .to(l, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut' }, 0.35 + delay);
    });
    tl.to(letters, { fillOpacity: 1, strokeOpacity: 0, duration: 0.6, ease: 'power2.out', stagger: 0.02 }, 1.45)
      .to(guides, { opacity: 0, duration: 0.5 }, 1.55);
    subs.forEach((sp) => {
      const dx = +sp.dataset.cx - SUB_CX;                 // il sottotitolo parte largo e si stringe
      tl.fromTo(sp, { x: dx * 0.7, opacity: 0 }, { x: 0, opacity: 0.55, duration: 1.2, ease: 'expo.out' }, 1.5);
    });
    tl.to(count, { v: 96, duration: 2.4, ease: 'power1.inOut', onUpdate: showCount }, 0);

    function waitAndExit() {
      if (!loaded) { gsap.delayedCall(0.15, waitAndExit); return; }
      gsap.to(count, { v: 100, duration: 0.3, onUpdate: showCount, onComplete: exit });
    }
    function exit() {
      const logo = $('.header .logo__svg');
      const from = $('.loader__svg', loader).getBoundingClientRect();
      const to = logo.getBoundingClientRect();
      const scale = to.width / from.width;
      const dx = (to.left + to.width / 2) - (from.left + from.width / 2);
      const dy = (to.top + to.height / 2) - (from.top + from.height / 2);
      gsap.timeline({ onComplete: done })
        .to('.loader__foot', { opacity: 0, y: 10, duration: 0.4, ease: 'power2.in' }, 0)
        .to(mark, { x: dx, y: dy, scale, duration: 1.15, ease: 'expo.inOut' }, 0.05)
        .to('.loader__bg', { yPercent: -100, duration: 1.15, ease: 'expo.inOut' }, 0.2)
        .add(() => whenIntroDone.forEach((fn) => fn()), 0.75);
    }
    function done() {
      root.classList.remove('intro');
      loader.remove();
      if (lenis) lenis.start();          // la larghezza non cambia (scrollbar-gutter): nessun ricalcolo
    }
    // saltare l'apertura: tutto accelera
    const skip = () => { tl.timeScale(6); count.v = Math.max(count.v, 90); };
    ['click', 'keydown', 'wheel', 'touchstart'].forEach((ev) => window.addEventListener(ev, skip, { once: true, passive: true }));
  }

  // Link interni (#ancora) con scorrimento morbido
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) { e.preventDefault(); return; }
      const target = $(id);
      if (!target) return;
      e.preventDefault();
      lenis ? lenis.scrollTo(target, { offset: 0, duration: 1.6 }) : target.scrollIntoView();
    });
  });

  /* ------------------------------------------------------------------
     2. HEADER — si opacizza dopo l'hero, si nasconde scendendo,
        ricompare appena si risale
     ------------------------------------------------------------------ */
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

  /* ------------------------------------------------------------------
     3. BOX PRENOTAZIONE — compare dopo l'hero, sparisce sul form finale
     ------------------------------------------------------------------ */
  const booking = $('#booking');
  ScrollTrigger.create({
    trigger: '.hero', start: 'bottom 60%',
    endTrigger: '#contatti', end: 'top 70%',
    onToggle: (self) => booking.classList.toggle('is-visible', self.isActive),
  });

  if (reduceMotion) { initBeforeAfter(); initForm(); return; }

  /* ------------------------------------------------------------------
     4. HERO — titolo a righe, disegno che si traccia, foto che lo copre
     ------------------------------------------------------------------ */
  // con l'apertura attiva l'hero parte quando il sipario si alza
  const heroTl = gsap.timeline({ defaults: { ease: EASE }, delay: 0.15, paused: introOn });
  if (introOn) whenIntroDone.push(() => heroTl.play());
  SplitText.create('[data-split="hero"]', {
    type: 'lines', mask: 'lines', linesClass: 'split-line',
    onSplit(self) {
      // eseguito anche quando le righe si ricalcolano (resize / font caricati)
      heroTl.from(self.lines, { yPercent: 110, opacity: 0, duration: 1.5, stagger: 0.12 }, 0);
    },
  });
  heroTl
    .to('.hero__layer--sketch', { clipPath: 'inset(0 0% 0 0)', duration: 1.8, ease: 'power2.inOut' }, 0.2)
    .to('.hero__layer--photo', { clipPath: 'inset(0% 0 0 0)', duration: 1.6, ease: 'expo.inOut' }, 1.7)
    .to('.hero__layer--photo img', { scale: 1, duration: 2.2 }, 1.9)
    .to('.hero__tag-inner', { yPercent: -50, duration: 1, ease: 'expo.inOut' }, 2.1)
    .from('.hero [data-fade], .hero__top .meta', { y: 24, opacity: 0, duration: 1.2, stagger: 0.08 }, 0.6);

  // Leggero parallasse dell'hero quando si scende
  gsap.to('.hero__media', {
    yPercent: 10, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });

  /* ------------------------------------------------------------------
     PREPARAZIONE A BLOCCHI — apertura e hero sono pronti subito; le
     sezioni più in basso vengono preparate una alla volta, lasciando
     respirare il browser tra un blocco e l'altro (meno "Total Blocking
     Time"). Mentre gira l'apertura lo scroll è comunque fermo.
     ------------------------------------------------------------------ */
  const mm = gsap.matchMedia();
  const later = [];

  later.push(() => {
  /* ------------------------------------------------------------------
     5. TITOLI — divisi in righe, salgono dal basso con stagger
     ------------------------------------------------------------------ */
  $$('[data-split]:not([data-split="hero"])').forEach((el) => {
    SplitText.create(el, {
      type: 'lines', mask: 'lines', autoSplit: true,
      onSplit(self) {
        return gsap.from(self.lines, {
          yPercent: 110, opacity: 0, duration: 1.4, ease: EASE, stagger: 0.1,
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
        });
      },
    });
  });

  });

  later.push(() => {
  /* ------------------------------------------------------------------
     6. TESTI E BLOCCHI — fade dal basso
     ------------------------------------------------------------------ */
  $$('[data-fade]').forEach((el) => {
    if (el.closest('.hero')) return;
    gsap.from(el, {
      y: 32, opacity: 0, duration: 1.3, ease: EASE,
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  });

  /* ------------------------------------------------------------------
     7. IMAGE REVEAL — maschera clip-path che si apre + zoom-out interno
     ------------------------------------------------------------------ */
  $$('[data-reveal]').forEach((el) => {
    const imgs = $$('img', el);
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 82%', once: true } });
    tl.to(el, { clipPath: 'inset(0% 0 0 0)', duration: 1.6, ease: 'expo.inOut' })
      .to(imgs, { scale: 1, duration: 2, ease: EASE }, 0.15);
  });

  // Parallasse interno alle immagini (data-parallax = intensità in %)
  $$('[data-parallax]').forEach((el) => {
    const amt = parseFloat(el.dataset.parallax) || 8;
    gsap.set(el, { scale: 1 + amt / 50 });
    gsap.fromTo(el, { yPercent: -amt / 2 }, {
      yPercent: amt / 2, ease: 'none',
      scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
  });

  later.push(() => {
  /* ------------------------------------------------------------------
     7a. METODO — "Non siamo…": la negazione si vede
         Le righe entrano, poi un tratto a matita barra "negozio di
         arredamento" e "studio di architettura" (che si spengono), poi
         arriva l'affermazione. Sotto, la mappa al tratto: la strada si
         disegna da Milano a Parma e le città si accendono man mano;
         Maxiarredo (Roveleto di Cadeo) si accende con un alone che pulsa.
         Tutto segue lo scroll.
     ------------------------------------------------------------------ */
  const strikes = $$('.mq .strike');
  gsap.set(strikes, { '--s': 0 });
  gsap.timeline({ defaults: { ease: 'none' },
    scrollTrigger: { trigger: '.mq', start: 'top 82%', end: 'top 28%', scrub: 0.6 } })
    .fromTo('.mq__l', { y: 30, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.1, duration: 0.25, ease: 'power2.out' }, 0)
    .to(strikes[0], { '--s': 1, duration: 0.18, ease: 'power2.inOut' }, 0.38)
    .to(strikes[0], { color: 'rgba(26,26,26,.38)', duration: 0.1 }, 0.5)
    .to(strikes[1], { '--s': 1, duration: 0.18, ease: 'power2.inOut' }, 0.58)
    .to(strikes[1], { color: 'rgba(26,26,26,.38)', duration: 0.1 }, 0.7)
    .fromTo('.mq__yes', { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.22, ease: 'power2.out' }, 0.78);

  // Mappa: niente pathLength e niente scale su gruppi SVG (Safari iOS li gestisce
  // in modo diverso): la strada usa la sua lunghezza reale, città e punti
  // crescono cambiando il raggio dei cerchi.
  const road = $('.mappa__road');
  prepDraw(road);
  const roadLen = road._len;
  const mapTl = gsap.timeline({ defaults: { ease: 'none' },
    scrollTrigger: { trigger: '.mappa', start: 'top 88%', end: 'top 40%', scrub: 0.6 } });
  mapTl.fromTo(road, { strokeDashoffset: roadLen }, { strokeDashoffset: 0, duration: 0.9 }, 0);
  $$('.mappa__city, .mappa__home').forEach((g) => {
    const at = +g.dataset.at * 0.9;
    const dot = $('circle:not(.mappa__ring)', g);
    const r = +dot.getAttribute('r');
    mapTl.fromTo(dot, { attr: { r: 0 } }, { attr: { r }, duration: 0.12, ease: 'back.out(2.5)' }, at)
      .fromTo($('text', g), { opacity: 0 }, { opacity: 1, duration: 0.12 }, at + 0.03);
    if (g.classList.contains('mappa__home')) mapTl.fromTo(g, { opacity: 0 }, { opacity: 1, duration: 0.05 }, at);   // l'alone compare con il punto
  });
  mapTl.fromTo('.mappa__via', { opacity: 0 }, { opacity: 1, duration: 0.2 }, 0.7)
    .fromTo('.mappa figcaption > *', { y: 16, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.06, duration: 0.2, ease: 'power2.out' }, 0.75);
  // alone che pulsa attorno a Maxiarredo (solo raggio e trasparenza)
  gsap.fromTo('.mappa__ring', { attr: { r: 5 }, opacity: 0.6 }, { attr: { r: 18 }, opacity: 0, duration: 1.8, ease: 'power1.out', repeat: -1 });
  });

  later.push(() => {
  /* ------------------------------------------------------------------
     7b. PROGETTI — tutto guidato dallo scroll
         - [data-pr-reveal="up|left|right"]: la foto si apre a tenda nella
           direzione indicata mentre entra, e l'immagine passa da uno zoom
           ampio alla sua misura;
         - l'immagine scorre dentro la cornice (parallasse interno);
         - [data-pr-speed]: elementi che viaggiano più veloci dello scroll
           (numeri grandi, foto verticale del progetto 01);
         - il testo di ogni progetto entra a righe sfalsate.
     ------------------------------------------------------------------ */
  const prClip = { up: 'inset(100% 0% 0% 0%)', left: 'inset(0% 0% 0% 100%)', right: 'inset(0% 100% 0% 0%)' };
  // fascia d'ingresso: il testo grande scorre verso sinistra mentre si scende
  gsap.fromTo('.pr-band__track', { xPercent: 8 }, { xPercent: -14, ease: 'none',
    scrollTrigger: { trigger: '.pr-band', start: 'top bottom', end: 'bottom top', scrub: 0.5 } });

  $$('[data-pr-reveal]').forEach((fig) => {
    const box = $('.pr__img', fig), img = $('img', fig);
    const dir = fig.dataset.prReveal;
    // la foto si avvicina: parte più piccola e cresce dal lato da cui si apre
    gsap.set(box, { transformOrigin: dir === 'left' ? '100% 50%' : dir === 'right' ? '0% 50%' : '50% 100%' });
    gsap.timeline({ defaults: { ease: 'none' },
      scrollTrigger: { trigger: fig, start: 'top 98%', end: 'top 25%', scrub: 0.8 } })
      .fromTo(box, { clipPath: prClip[dir] || prClip.up }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'power2.inOut', duration: 0.7 }, 0)
      .fromTo(box, { scale: 0.82 }, { scale: 1, ease: 'power2.out', duration: 1 }, 0)
      .fromTo(img, { scale: 1.45 }, { scale: 1.12, ease: 'power1.out', duration: 1 }, 0);
    gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: 'none',
      scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  $$('[data-pr-speed]').forEach((el) => {
    const v = parseFloat(el.dataset.prSpeed) / 100;
    gsap.fromTo(el, { y: () => -v * window.innerHeight }, { y: () => v * window.innerHeight, ease: 'none',
      scrollTrigger: { trigger: el.closest('.pr'), start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true } });
  });
  // titoli dei progetti: le righe salgono da una maschera, seguendo lo scroll
  $$('.pr__title').forEach((h) => {
    SplitText.create(h, { type: 'lines', mask: 'lines', linesClass: 'split-line', autoSplit: true,
      onSplit(self) {
        return gsap.fromTo(self.lines, { yPercent: 110 }, { yPercent: 0, ease: 'power3.out', stagger: 0.15,
          scrollTrigger: { trigger: h, start: 'top 95%', end: 'top 65%', scrub: 0.6 } });
      } });
  });
  $$('.pr__info').forEach((info) => {
    gsap.fromTo([...info.children].filter((c) => !c.classList.contains('pr__title')), { y: 48, opacity: 0 }, { y: 0, opacity: 1, ease: 'power2.out', stagger: 0.12,
      scrollTrigger: { trigger: info, start: 'top 92%', end: 'top 58%', scrub: 0.6 } });
  });
  });

  later.push(() => {
  /* ------------------------------------------------------------------
     8. IL FILO — "Un solo team, dalla prima idea alla consegna"
        Una linea continua si disegna con lo scroll e attraversa le
        quattro fasi. Quando la punta raggiunge una fase, l'icona si
        disegna al tratto e il testo entra; il segno "Il tuo referente"
        viaggia sulla punta. Desktop: orizzontale con sezione bloccata.
        Mobile: verticale, lungo i nodi.
     ------------------------------------------------------------------ */
  const filo = $('#filo');
  const filoPhases = $$('.filo__phase', filo);
  const iconParts = (ph) => $$('.filo__icon *', ph);
  const phaseText = (ph) => $$('.filo__num, .filo__name, .filo__text, .filo__get', ph);

  mm.add('(min-width: 901px)', () => {
    const ink = $('.filo__path--ink', filo);
    const ref = $('.filo__ref', filo);
    const total = ink.getTotalLength();
    // a che frazione della linea si trova ciascun nodo (centri delle 4 colonne)
    const nodeAt = [125, 375, 625, 875].map((nx) => {
      let lo = 0, hi = total;
      for (let k = 0; k < 30; k++) { const mid = (lo + hi) / 2; if (ink.getPointAtLength(mid).x < nx) lo = mid; else hi = mid; }
      return lo / total;
    });
    const placeRef = (f) => {
      const pt = ink.getPointAtLength(Math.max(0.001, f) * total);
      ref.style.left = (pt.x / 10) + '%';
      ref.style.top = (pt.y / 120 * 100) + '%';
      ref.style.setProperty('--shift', gsap.utils.clamp(0, 1, f * 1.25 - 0.1));   // etichetta sempre dentro lo schermo
    };

    prepDraw(ink);
    gsap.set(ink, { strokeDashoffset: ink._len });
    filoPhases.forEach((ph) => {
      prepDraw(iconParts(ph));
      gsap.set(iconParts(ph), { strokeDashoffset: LEN });
      gsap.set(phaseText(ph), { y: 26, opacity: 0 });
      gsap.set($('.filo__node', ph), { scale: 0.7, borderColor: 'rgba(26,26,26,.14)' });
    });

    const LINE = 0.9;                                  // la linea occupa il 90% della timeline, poi pausa
    const draw = { f: 0 };
    const tl = gsap.timeline({ defaults: { ease: 'none' },
      scrollTrigger: { trigger: filo, start: 'center center', end: '+=230%', pin: true, scrub: 0.7, invalidateOnRefresh: true } });
    tl.to(draw, { f: 1, duration: LINE, onUpdate: () => { ink.style.strokeDashoffset = ink._len * (1 - draw.f); placeRef(draw.f); } }, 0);
    filoPhases.forEach((ph, i) => {
      const t = nodeAt[i] * LINE;
      tl.to($('.filo__node', ph), { scale: 1, borderColor: 'rgba(26,26,26,.9)', duration: 0.05, ease: 'back.out(2)' }, Math.max(0, t - 0.02))
        .to(iconParts(ph), { strokeDashoffset: 0, duration: 0.1, stagger: 0.025 }, Math.max(0, t - 0.01))
        .to(phaseText(ph), { y: 0, opacity: 1, duration: 0.1, stagger: 0.025, ease: 'power2.out' }, t + 0.01);
    });
    tl.to({}, { duration: 1 - LINE });
    placeRef(0);

    return () => {
      gsap.set([ink, ...filoPhases.flatMap(iconParts), ...filoPhases.flatMap(phaseText), ...$$('.filo__node', filo)], { clearProps: 'all' });
      ref.removeAttribute('style'); ink.removeAttribute('style');
    };
  });

  mm.add('(max-width: 900px)', () => {
    const vline = $('.filo__vline i', filo);
    const tls = [];
    tls.push(gsap.fromTo(vline, { height: '0%' }, { height: '100%', ease: 'none',
      scrollTrigger: { trigger: '.filo__phases', start: 'top 65%', end: 'bottom 65%', scrub: 0.5 } }));
    filoPhases.forEach((ph) => {
      const tl = gsap.timeline({ defaults: { ease: 'none' },
        scrollTrigger: { trigger: ph, start: 'top 80%', end: 'top 45%', scrub: 0.5 } });
      prepDraw(iconParts(ph));
      tl.fromTo(iconParts(ph), { strokeDashoffset: LEN }, { strokeDashoffset: 0, stagger: 0.1 }, 0)
        .fromTo(phaseText(ph), { y: 24, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.1, ease: 'power2.out' }, 0.1);
      tls.push(tl);
    });
    return () => {
      tls.forEach((tl) => { tl.scrollTrigger.kill(); tl.kill(); });
      gsap.set([vline, ...filoPhases.flatMap(iconParts), ...filoPhases.flatMap(phaseText)], { clearProps: 'all' });
    };
  });

  });

  later.push(() => {
  /* ------------------------------------------------------------------
     8a. SHOWROOM — ingresso delle foto, sempre guidato dallo scroll
         Ogni foto si apre come una tenda (clip-path: le verticali salgono
         dal basso, le quadrate scorrono dal lato esterno), l'immagine passa
         da uno zoom ampio alla sua misura, poi si disegna la linea ed entra
         la didascalia. revealInto() aggiunge questi passaggi a una timeline
         "scrubbata": avanti e indietro seguono la rotella.
     ------------------------------------------------------------------ */
  const svClip = (fig) => fig.classList.contains('sv--sq')
    ? (fig.dataset.col === 'r' ? 'inset(0% 0% 0% 100%)' : 'inset(0% 100% 0% 0%)')
    : 'inset(100% 0% 0% 0%)';
  // at = inizio, d = durata della fase di ingresso (in unità della timeline)
  const revealInto = (tl, fig, base, at, d) => {
    const caps = $$('figcaption > span', fig);
    tl.fromTo($('.sv__img', fig), { clipPath: svClip(fig) }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'power3.inOut', duration: d * 0.55 }, at)
      .fromTo($('img', fig), { scale: base * 1.35 }, { scale: base, ease: 'power2.out', duration: d }, at)
      .fromTo($('figcaption', fig), { '--line': 0 }, { '--line': 1, ease: 'power2.inOut', duration: d * 0.45 }, at + d * 0.35)
      .fromTo(caps, { yPercent: 120, opacity: 0 }, { yPercent: 0, opacity: 1, ease: 'power3.out', duration: d * 0.4, stagger: d * 0.08 }, at + d * 0.5);
  };

  // Mobile: ogni foto ha la sua piccola timeline legata allo scroll
  mm.add('(max-width: 900px)', () => {
    const figs = $$('#showroom .sv');
    const tls = figs.map((f) => {
      const tl = gsap.timeline({ defaults: { ease: 'none' },
        scrollTrigger: { trigger: f, start: 'top 95%', end: 'top 35%', scrub: 0.6 } });
      revealInto(tl, f, 1, 0, 1);
      return tl;
    });
    return () => {
      tls.forEach((tl) => { tl.scrollTrigger.kill(); tl.kill(); });
      gsap.set($$('#showroom .sv__img, #showroom .sv img, #showroom figcaption, #showroom figcaption > span'), { clearProps: 'all' });
    };
  });

  /* ------------------------------------------------------------------
     8b. SHOWROOM — sezione bloccata, due colonne a velocità diverse
         (solo desktop). Il testo resta fermo. Ogni piano ha una foto
         principale (data-main) grande e lenta; le altre sono piccole e
         più veloci, nella colonna opposta. Le quote di partenza sono
         calcolate qui in modo che due foto della stessa colonna non si
         tocchino mai, anche quando una veloce segue una lenta.
         L'ingresso a tenda, lo zoom e la didascalia seguono lo scroll.
     ------------------------------------------------------------------ */
  mm.add('(min-width: 901px)', () => {
    const section = $('#showroom');
    section.classList.add('is-pinned');                 // attiva il layout "a palcoscenico"
    const figs = $$('.sv', section);
    const items = $$('.floor-index li', section);
    const nums = $$('.showroom__num span', section);
    const vh = () => window.innerHeight;
    const BASE = 1.16;                                   // = scale del CSS (margine per il parallasse)
    const K_MAIN = 0.8, K_SMALL = 1.45;                  // velocità rispetto allo scroll
    const speed = (f) => (f.hasAttribute('data-main') ? K_MAIN : K_SMALL);
    let current = -1;

    /* Layout: per ogni foto la quota iniziale Y (px, a inizio blocco).
       Durante la sezione la foto sale di speed * S, con S = scroll totale
       del blocco. Una foto che segue nella stessa colonna deve restare
       sotto la precedente finché questa è visibile. */
    const L = new Map();
    let S = 1;
    const layout = () => {
      const h = vh(), gap = h * 0.08;
      const prev = { l: null, r: null };
      figs.forEach((f) => {
        const k = speed(f), H = f.offsetHeight, col = f.dataset.col;
        let Y;
        const p = prev[col];
        if (!p) Y = col === 'l' ? h * 0.3 : h * 0.75;   // partenza: la principale è già quasi in scena
        else {
          // quando la nuova foto entra dal basso, la precedente deve averle lasciato spazio…
          const atEnter = h + k * (p.Y + p.H - h + gap) / p.k;
          // …e quando la precedente esce in alto, la nuova deve essere ancora sotto di lei
          const atExit = gap + k * (p.Y + p.H) / p.k;
          Y = Math.max(atEnter, atExit);
          if (Y < h) Y = Math.max(Y, p.Y + p.H + gap);   // entrambe già in scena all'inizio
        }
        L.set(f, { Y, H, k });
        prev[col] = { Y, H, k };
      });
      // S: alla fine l'ultima foto principale si ferma al centro dello schermo
      const lastMain = figs.filter((f) => f.hasAttribute('data-main')).pop();
      const m = L.get(lastMain);
      S = (m.Y + m.H / 2 - h / 2) / m.k;
    };
    layout();
    ScrollTrigger.addEventListener('refreshInit', layout);

    const setFloor = (i) => {
      if (i === current) return;
      items.forEach((li, k) => li.classList.toggle('is-active', k === i));
      if (nums[current]) gsap.to(nums[current], { yPercent: -60, opacity: 0, duration: 0.8, ease: EASE, overwrite: true });
      gsap.fromTo(nums[i], { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1, ease: EASE, overwrite: true });
      current = i;
    };
    const floorAtCenter = () => {
      const mid = vh() / 2;
      let best = current < 0 ? 0 : current, dist = Infinity;
      figs.forEach((f) => {
        const r = f.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh()) return;
        const d = Math.abs(r.top + r.height / 2 - mid) / (f.hasAttribute('data-main') ? 2 : 1);   // la principale conta di più
        if (d < dist) { dist = d; best = +f.dataset.floor; }
      });
      return best;
    };
    gsap.set(nums, { yPercent: 60, opacity: 0 });
    setFloor(0);

    // leggera inclinazione legata alla velocità dello scroll (più marcata sulle piccole)
    const skews = figs.map((f) => gsap.quickTo($('.sv__img', f), 'skewY', { duration: 0.6, ease: 'power3.out' }));
    const clampSkew = gsap.utils.clamp(-3, 3);
    const straighten = gsap.delayedCall(0.12, () => skews.forEach((q) => q(0))).pause();   // quando lo scroll si ferma tornano dritte

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: section, start: 'top top', end: () => '+=' + Math.round(S),
        pin: true, scrub: 0.6, invalidateOnRefresh: true,
        onUpdate(self) {
          const sk = clampSkew(self.getVelocity() / -500);
          skews.forEach((q, i) => q(figs[i].hasAttribute('data-main') ? sk * 0.6 : sk));
          straighten.restart(true);
        },
        onLeave() { skews.forEach((q) => q(0)); },
        onLeaveBack() { skews.forEach((q) => q(0)); },
      },
    });

    figs.forEach((el) => {
      const g = () => L.get(el);
      tl.fromTo(el, { y: () => g().Y }, { y: () => g().Y - g().k * S, duration: 1 }, 0);
      tl.fromTo($('img', el), { yPercent: -7 }, { yPercent: 7, duration: 1 }, 0);   // parallasse interno
      // ingresso: da quando il bordo alto tocca il fondo dello schermo a quando è al 55%
      const { Y, k } = g(), h = vh();
      const pIn = Math.max(0, (Y - h) / (k * S));
      const pFull = Math.max(pIn + 0.02, (Y - h * 0.55) / (k * S));
      revealInto(tl, el, BASE, pIn, Math.min(pFull, 0.98) - pIn);
    });
    tl.to({}, { duration: 0.03 });   // piccola pausa finale prima di sbloccare
    // l'indice segue le foto mentre la timeline si muove (anche durante lo smorzamento dello scrub)
    tl.eventCallback('onUpdate', () => setFloor(floorAtCenter()));

    return () => {                   // uscendo dal desktop torna la colonna semplice
      ScrollTrigger.removeEventListener('refreshInit', layout);
      straighten.kill();
      section.classList.remove('is-pinned');
      gsap.set([...figs, ...$$('.sv__img, .sv img, .sv figcaption, .sv figcaption > span, .showroom__num span', section)], { clearProps: 'all' });
    };
  });
  });

  later.push(() => {
  /* ------------------------------------------------------------------
     9. NUMERI — contatore "a rulli" guidato dallo scroll
        Ogni cifra diventa una colonna 0-9 che scorre come in un vecchio
        contachilometri: le cifre di destra fanno più giri di quelle di
        sinistra. I numeri piccoli (in lettere) hanno un disegno al tratto
        che si disegna con lo scroll, come nel filo.
     ------------------------------------------------------------------ */
  const rolls = $$('.fact__roll');
  rolls.forEach((el) => {
    const txt = el.dataset.roll;
    const digits = [...txt].filter((ch) => /\d/.test(ch)).length;
    let pos = 0;
    el.setAttribute('aria-label', txt);
    el.innerHTML = '';
    const wrap = document.createElement('span');
    wrap.className = 'roll'; wrap.setAttribute('aria-hidden', 'true');
    [...txt].forEach((ch) => {
      if (!/\d/.test(ch)) { const sp = document.createElement('span'); sp.className = 'roll__sep'; sp.textContent = ch; wrap.appendChild(sp); return; }
      const turns = 1 + (digits - 1 - pos);           // giri completi prima di fermarsi
      pos++;
      const col = document.createElement('span');
      col.className = 'roll__col';
      const n = turns * 10 + +ch;
      for (let k = 0; k <= n; k++) { const d = document.createElement('span'); d.textContent = k % 10; col.appendChild(d); }
      col.dataset.items = n + 1; col.dataset.stop = n;
      wrap.appendChild(col);
    });
    el.appendChild(wrap);
  });
  const rollTl = gsap.timeline({ defaults: { ease: 'power2.out' },
    scrollTrigger: { trigger: '.facts__big', start: 'top 88%', end: 'top 35%', scrub: 0.8 } });
  $$('.facts__big .fact').forEach((fact, i) => {
    $$('.roll__col', fact).forEach((col) => {
      rollTl.fromTo(col, { yPercent: 0 }, { yPercent: -(+col.dataset.stop / +col.dataset.items) * 100, duration: 1 }, i * 0.18);
    });
    rollTl.fromTo($('.fact__label', fact), { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, i * 0.18 + 0.5);
  });

  const fsmTl = gsap.timeline({ defaults: { ease: 'none' },
    scrollTrigger: { trigger: '.facts__small', start: 'top 88%', end: 'top 50%', scrub: 0.6 } });
  $$('.fsm').forEach((li, i) => {
    prepDraw($$('.fsm__ico *', li));
    fsmTl.fromTo($$('.fsm__ico *', li), { strokeDashoffset: LEN }, { strokeDashoffset: 0, stagger: 0.12, duration: 0.5 }, i * 0.25)
      .fromTo($$('.fsm__word, .fsm__label', li), { y: 18, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.08, duration: 0.35, ease: 'power2.out' }, i * 0.25 + 0.2);
  });
  });

  later.push(() => {
  /* ------------------------------------------------------------------
     10. SERVIZI — tre famiglie, tutto guidato dallo scroll
         Desktop: a sinistra un pannello fermo (sticky) con la foto del
         servizio attivo. Mentre un servizio sale verso il centro, la sua
         foto si apre a tenda sopra la precedente, che scivola un po' in
         alto; il nome passa da contorno a pieno (--on da 0 a 1) e torna
         spento quando esce. Contatore, famiglia e barra seguono lo scroll.
         Mobile: ogni servizio ha la sua foto che si apre scorrendo.
     ------------------------------------------------------------------ */
  const sxItems = $$('.sx__item');
  const sxInner = (box) => box.firstElementChild;          // .ph oppure <img>

  mm.add('(min-width: 901px)', () => {
    const layers = $$('.sx__layer');
    const famSpans = $$('.sx__fam span');
    const cur = $('.sx__cur');
    let active = -1, fam = -1;
    const trig = [];

    gsap.set(famSpans, { yPercent: 110 });
    const setFam = (f) => {
      if (f === fam) return;
      if (famSpans[fam]) gsap.to(famSpans[fam], { yPercent: -110, duration: 0.7, ease: EASE, overwrite: true });
      gsap.fromTo(famSpans[f], { yPercent: 110 }, { yPercent: 0, duration: 0.8, ease: EASE, overwrite: true });
      fam = f;
    };
    const setActive = (i) => {
      if (i === active) return;
      active = i;
      cur.textContent = String(i + 1).padStart(2, '0');
      setFam(+sxItems[i].dataset.fam);
    };
    setActive(0);

    layers.forEach((layer, i) => {
      if (i === 0) return;
      gsap.set(layer, { clipPath: 'inset(100% 0% 0% 0%)' });
      const tl = gsap.timeline({ defaults: { ease: 'none' },
        scrollTrigger: { trigger: sxItems[i], start: 'top 92%', end: 'center 55%', scrub: 0.6 } });
      tl.fromTo(layer, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'power2.inOut' }, 0)
        .fromTo(sxInner(layer), { scale: 1.25, yPercent: 8 }, { scale: 1, yPercent: 0, ease: 'power1.out' }, 0)
        .fromTo(sxInner(layers[i - 1]), { yPercent: 0 }, { yPercent: -10 }, 0);
      trig.push(tl);
    });

    sxItems.forEach((item, i) => {
      const last = i === sxItems.length - 1;
      const tl = gsap.timeline({ defaults: { ease: 'none' },
        scrollTrigger: { trigger: item, start: 'top 85%', end: 'bottom 25%', scrub: 0.4} });
      tl.fromTo(item, { '--on': 0 }, { '--on': 1, duration: 0.35 }, 0)
        .to(item, { '--on': last ? 1 : 0, duration: 0.25 }, 0.75);
      trig.push(tl);
      // indice attivo: il servizio che attraversa il 55% dello schermo
      trig.push(ScrollTrigger.create({ trigger: item, start: 'top 55%', end: 'bottom 55%',
        onEnter: () => setActive(i), onEnterBack: () => setActive(i) }));
    });

    trig.push(gsap.fromTo('.sx__bar i', { scaleX: 1 / sxItems.length }, { scaleX: 1, ease: 'none',
      scrollTrigger: { trigger: '.sx__list', start: 'top 55%', end: 'bottom 80%', scrub: 0.4 } }));

    return () => {
      trig.forEach((t) => { if (t.scrollTrigger) t.scrollTrigger.kill(); if (t.kill) t.kill(); });
      gsap.set([...layers, ...layers.map(sxInner), ...sxItems, ...famSpans, '.sx__bar i'], { clearProps: 'all' });
    };
  });

  mm.add('(max-width: 900px)', () => {
    const tls = sxItems.map((item) => {
      const box = $('.sx__m', item);
      const tl = gsap.timeline({ defaults: { ease: 'none' },
        scrollTrigger: { trigger: item, start: 'top 92%', end: 'top 40%', scrub: 0.6 } });
      tl.fromTo(box, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'power2.inOut', duration: 0.6 }, 0)
        .fromTo(sxInner(box), { scale: 1.25 }, { scale: 1, ease: 'power1.out', duration: 0.8 }, 0)
        .fromTo($$('.sx__num, .sx__name, .sx__desc, .sx__more', item), { y: 30, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.08, duration: 0.4 }, 0.4);
      return tl;
    });
    return () => tls.forEach((tl) => { tl.scrollTrigger.kill(); tl.kill(); });
  });
  });

  later.push(() => {
  /* ------------------------------------------------------------------
     11. CURSORE — punto + badge che compare su [data-cursor]
     ------------------------------------------------------------------ */
  if (finePointer) {
    const dot = $('#cursor'), badge = $('#cursor-badge');
    const dx = gsap.quickTo(dot, 'x', { duration: 0.25, ease: 'power3' });
    const dy = gsap.quickTo(dot, 'y', { duration: 0.25, ease: 'power3' });
    const bx = gsap.quickTo(badge, 'x', { duration: 0.6, ease: 'power3' });
    const by = gsap.quickTo(badge, 'y', { duration: 0.6, ease: 'power3' });
    window.addEventListener('pointermove', (e) => {
      dx(e.clientX); dy(e.clientY); bx(e.clientX); by(e.clientY);
      gsap.to(dot, { opacity: 1, duration: 0.3, overwrite: 'auto' });
    }, { passive: true });
    $$('[data-cursor]').forEach((el) => {
      el.addEventListener('pointerenter', () => {
        badge.textContent = el.dataset.cursor;
        gsap.to(badge, { scale: 1, duration: 0.6, ease: EASE, overwrite: 'auto' });
        gsap.to(dot, { scale: 0, duration: 0.3, overwrite: 'auto' });
      });
      el.addEventListener('pointerleave', () => {
        gsap.to(badge, { scale: 0, duration: 0.5, ease: EASE, overwrite: 'auto' });
        gsap.to(dot, { scale: 1, duration: 0.3, overwrite: 'auto' });
      });
    });
    $$('a, button, input, select, textarea, label').forEach((el) => {
      if (el.closest('[data-cursor]')) return;
      el.addEventListener('pointerenter', () => gsap.to(dot, { scale: 3.2, opacity: 0.35, duration: 0.4, overwrite: 'auto' }));
      el.addEventListener('pointerleave', () => gsap.to(dot, { scale: 1, opacity: 1, duration: 0.4, overwrite: 'auto' }));
    });

    /* Pulsanti magnetici: si spostano leggermente verso il mouse */
    $$('.js-magnetic').forEach((btn) => {
      const mx = gsap.quickTo(btn, 'x', { duration: 0.6, ease: 'power3' });
      const my = gsap.quickTo(btn, 'y', { duration: 0.6, ease: 'power3' });
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        mx((e.clientX - r.left - r.width / 2) * 0.25);
        my((e.clientY - r.top - r.height / 2) * 0.35);
      });
      btn.addEventListener('pointerleave', () => { mx(0); my(0); });
    });
  }

  initBeforeAfter();
  });

  /* Finiti i blocchi: le sezioni bloccate (il filo, lo showroom) allungano la
     pagina, quindi i trigger si ordinano come compaiono e si ricalcolano UNA
     volta sola (anche quando arrivano i caratteri, se arrivano dopo). */
  let ready = false;
  const runLater = () => {
    const fn = later.shift();
    if (fn) { fn(); setTimeout(runLater, 0); return; }
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
    ready = true;
  };
  setTimeout(runLater, 0);
  initForm();
  if (document.fonts) document.fonts.ready.then(() => { if (ready) ScrollTrigger.refresh(); });

  /* ------------------------------------------------------------------
     12. PRIMA / DOPO — trascinabile con mouse e touch
     ------------------------------------------------------------------ */
  function initBeforeAfter() {
    const ba = $('#ba');
    if (!ba) return;
    const state = { pos: 50 };
    const apply = () => ba.style.setProperty('--pos', state.pos + '%');
    const setFromEvent = (e) => {
      const r = ba.getBoundingClientRect();
      state.pos = gsap.utils.clamp(0, 100, ((e.clientX - r.left) / r.width) * 100);
      apply();
    };
    let dragging = false;
    ba.addEventListener('pointerdown', (e) => { dragging = true; ba.setPointerCapture(e.pointerId); gsap.killTweensOf(state); setFromEvent(e); });
    ba.addEventListener('pointermove', (e) => dragging && setFromEvent(e));
    ba.addEventListener('pointerup', () => (dragging = false));
    ba.addEventListener('pointercancel', () => (dragging = false));
    apply();
    // Suggerimento: quando entra in vista la maniglia oscilla una volta
    if (!reduceMotion) {
      gsap.timeline({ scrollTrigger: { trigger: ba, start: 'top 60%', once: true }, delay: 1.2, onUpdate: apply })
        .to(state, { pos: 28, duration: 1.1, ease: 'power3.inOut', onUpdate: apply })
        .to(state, { pos: 68, duration: 1.3, ease: 'power3.inOut', onUpdate: apply })
        .to(state, { pos: 50, duration: 1, ease: EASE, onUpdate: apply });
    }
  }

  /* ------------------------------------------------------------------
     13. FORM — solo dimostrativo in questa bozza
     ------------------------------------------------------------------ */
  function initForm() {
    const form = $('#form'), msg = $('#form-msg');
    const rules = {
      'f-nome': (v) => v.trim().length >= 2,
      'f-tel': (v) => v.replace(/[^\d]/g, '').length >= 6,
      'f-mail': (v) => !v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
    };
    const check = (id) => {
      const input = $('#' + id), field = input.closest('.field');
      const ok = rules[id](input.value);
      field.classList.toggle('is-invalid', !ok);
      input.setAttribute('aria-invalid', String(!ok));
      return ok;
    };
    Object.keys(rules).forEach((id) => {
      const input = $('#' + id);
      input.setAttribute('aria-describedby', 'e-' + id.slice(2));
      // l'errore si toglie appena il campo è corretto; compare uscendo dal campo
      input.addEventListener('input', () => { if (input.closest('.field').classList.contains('is-invalid')) check(id); });
      input.addEventListener('blur', () => { if (input.value) check(id); });
    });
    const privacy = $('#f-privacy'), foot = $('.form__foot', form);
    privacy.addEventListener('change', () => foot.classList.toggle('is-invalid', foot.classList.contains('is-invalid') && !privacy.checked));
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const bad = Object.keys(rules).filter((id) => !check(id));
      foot.classList.toggle('is-invalid', !privacy.checked);
      if (!privacy.checked) bad.push('f-privacy');
      if (bad.length) { $('#' + bad[0]).focus(); msg.textContent = ''; return; }
      msg.textContent = 'Bozza: l\'invio non è attivo. In WordPress il modulo sarà collegato alla posta dello showroom.';
    });
  }

});
