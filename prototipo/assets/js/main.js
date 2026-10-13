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
  const heroTl = gsap.timeline({ defaults: { ease: EASE }, delay: 0.15 });
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

  /* ------------------------------------------------------------------
     8. FASI DEL METODO — scorrimento orizzontale con sezione bloccata
        (solo desktop; su mobile restano in colonna)
     ------------------------------------------------------------------ */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 901px)', () => {
    const track = $('.phases__track');
    const phases = $('#phases');
    const distance = () => track.scrollWidth - phases.clientWidth;   // quanto deve scorrere il binario
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: phases, start: 'top 12%', end: () => '+=' + distance(),
        pin: true, scrub: 0.8, invalidateOnRefresh: true,
      },
    });
    tl.to(track, { x: () => -distance(), ease: 'none' }, 0)
      .to('.phases__progress i', { scaleX: 1, ease: 'none' }, 0);
    // i numeri di ogni fase entrano mentre scorrono
    $$('.phase__num').forEach((n) => {
      gsap.from(n, {
        yPercent: 40, opacity: 0, ease: 'none',
        scrollTrigger: { trigger: n, containerAnimation: tl, start: 'left 95%', end: 'left 60%', scrub: true },
      });
    });
  });

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

  /* ------------------------------------------------------------------
     9. NUMERI — contatori
     ------------------------------------------------------------------ */
  $$('[data-count]').forEach((el) => {
    const end = +el.dataset.count;
    const from = end > 1000 ? end - 60 : 0;
    const obj = { v: from };
    el.textContent = from;
    gsap.to(obj, {
      v: end, duration: 2.2, ease: 'power3.out',
      onUpdate: () => (el.textContent = Math.round(obj.v)),
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  });

  /* ------------------------------------------------------------------
     10. SERVIZI — linee che si disegnano + immagine che segue il mouse
     ------------------------------------------------------------------ */
  $$('.service').forEach((li, i) => {
    ScrollTrigger.create({ trigger: li, start: 'top 92%', once: true, onEnter: () => setTimeout(() => li.classList.add('is-in'), i * 60) });
    gsap.from(li.querySelector('a'), { y: 30, opacity: 0, duration: 1.2, ease: EASE, scrollTrigger: { trigger: li, start: 'top 92%', once: true } });
  });

  if (finePointer) {
    const follower = $('#follower');
    const fx = gsap.quickTo(follower, 'x', { duration: 0.7, ease: 'power3' });
    const fy = gsap.quickTo(follower, 'y', { duration: 0.7, ease: 'power3' });
    const services = $('#services');
    let lastX = 0;
    services.addEventListener('pointermove', (e) => {
      fx(e.clientX); fy(e.clientY);
      // inclinazione in base alla velocità orizzontale del mouse
      gsap.to(follower, { rotation: gsap.utils.clamp(-8, 8, (e.clientX - lastX) * 0.4), duration: 0.6, ease: 'power3' });
      lastX = e.clientX;
    });
    services.addEventListener('pointerenter', (e) => {
      gsap.set(follower, { x: e.clientX, y: e.clientY });
      gsap.to(follower, { opacity: 1, scale: 1, duration: 0.6, ease: EASE });
    });
    services.addEventListener('pointerleave', () => gsap.to(follower, { opacity: 0, scale: 0.85, duration: 0.5, ease: EASE }));
    $$('.service').forEach((li) => {
      li.addEventListener('pointerenter', () => {
        $$('img', follower).forEach((img) => img.classList.toggle('is-active', img.dataset.key === li.dataset.img));
      });
    });
  }

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
  initForm();

  // Ricalcola tutto quando i font sono pronti (cambiano le altezze)
  document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());

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
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      msg.textContent = 'Bozza: l\'invio non è attivo. In WordPress il modulo sarà collegato alla posta dello showroom.';
    });
  }
});
