/* Eseguito nel <head>, prima del disegno della pagina (file esterno: compatibile con la Content-Security-Policy) */
/* Animazioni solo con JS attivo e senza "riduci movimento"; il velo copre la pagina finché non è pronta */
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) document.documentElement.classList.add('js-anim', 'pt-enter');
