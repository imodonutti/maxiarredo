/* ==========================================================================
   MAXIARREDO — elementi comuni a tutte le pagine
   1. Transizione tra pagine: un velo color carta con la X del marchio sale
      quando la pagina si apre e scende prima di passare a un'altra pagina.
   2. Menu mobile a tutto schermo (il pulsante "burger" dell'header).
   Nessuna dipendenza: funziona anche prima che GSAP sia caricato.
   ========================================================================== */
(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const veil = document.querySelector('.pt');

  /* ---------- 1. Transizioni ---------- */
  const reveal = () => {
    if (!veil || !root.classList.contains('pt-enter')) return;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      veil.classList.add('is-out');
      root.classList.remove('pt-enter');
    }));
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', reveal); else reveal();

  // tornando indietro con il browser la pagina può arrivare dalla cache: niente velo
  window.addEventListener('pageshow', (e) => {
    if (e.persisted && veil) { veil.classList.remove('is-in'); veil.classList.add('is-out'); }
  });

  const isInternal = (a) => {
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return false;
    const href = a.getAttribute('href') || '';
    if (!href || href.startsWith('#') || /^(tel|mailto):/i.test(href)) return false;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return false;
    // stessa pagina con un'ancora: lascia lo scorrimento normale
    if (url.pathname === location.pathname && url.search === location.search && url.hash) return false;
    return true;
  };

  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a');
    if (!isInternal(a) || reduce || !veil) return;
    e.preventDefault();
    try { sessionStorage.setItem('mx-nav', '1'); } catch (err) { /* nessun problema */ }
    root.classList.remove('menu-open');
    veil.classList.remove('is-out');
    veil.style.transition = 'none';
    void veil.offsetWidth;                      // riparte da sotto lo schermo
    veil.style.transition = '';
    veil.classList.add('is-in');
    setTimeout(() => { location.href = a.href; }, 780);
  });

  // arrivando da un'altra pagina con un'ancora (es. index.html#contatti) si
  // riallinea la posizione quando le sezioni animate hanno preso la loro altezza
  window.addEventListener('load', () => {
    if (!location.hash) return;
    let t = null;
    try { t = document.querySelector(location.hash); } catch (err) { return; }
    if (t) setTimeout(() => window.scrollTo(0, t.getBoundingClientRect().top + window.scrollY), 700);
  });

  /* ---------- 2. Menu mobile ---------- */
  const burger = document.querySelector('.burger');
  const nav = document.querySelector('.nav');
  if (burger && nav) {
    const menu = document.createElement('div');
    menu.className = 'mmenu';
    menu.id = 'mmenu';
    const links = [...nav.querySelectorAll('a')].map((l, i) =>
      `<li><a href="${l.getAttribute('href')}"><span class="mmenu__n">${String(i + 1).padStart(2, '0')}</span><span class="mmenu__t">${l.textContent}</span></a></li>`).join('');
    menu.innerHTML = `<ul class="mmenu__list">${links}</ul>
      <div class="mmenu__foot">
        <a href="tel:+390523500596">+39 0523 500596</a>
        <a href="tel:+393205798500">+39 320 57 98 500</a>
        <span>Via Emilia Parmense, 27 — Roveleto di Cadeo (PC)</span>
      </div>`;
    document.body.appendChild(menu);
    burger.setAttribute('aria-controls', 'mmenu');
    burger.setAttribute('aria-expanded', 'false');
    const toggle = (open) => {
      root.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Chiudi menu' : 'Apri menu');
    };
    burger.addEventListener('click', () => toggle(!root.classList.contains('menu-open')));
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) toggle(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') toggle(false); });
  }
})();
