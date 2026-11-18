/* Eseguito nel <head>, prima del disegno della pagina (file esterno: compatibile con la Content-Security-Policy) */
/* Le animazioni partono solo se JS è attivo e l'utente non ha chiesto movimento ridotto.
   Senza questa classe tutto il contenuto resta visibile. */
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.documentElement.classList.add('js-anim');
  /* Apertura con il marchio: a ogni caricamento o ricarica della pagina.
     Arrivando da un'altra pagina del sito (o tornando indietro) basta il velo. */
  var nav = (performance.getEntriesByType && performance.getEntriesByType('navigation')[0]) || {};
  var interna = false;
  try { interna = sessionStorage.getItem('mx-nav') === '1'; sessionStorage.removeItem('mx-nav'); } catch (e) {}
  if (nav.type === 'reload' || (!interna && nav.type !== 'back_forward')) document.documentElement.classList.add('intro');
  else document.documentElement.classList.add('pt-enter');
}
