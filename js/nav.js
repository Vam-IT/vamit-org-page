const nav    = document.querySelector('body > nav');
const burger = document.getElementById('navBurger');
const links  = document.getElementById('navLinks');
const menuLabels = document.documentElement.lang === 'en'
  ? { open: 'Open menu', close: 'Close menu' }
  : { open: 'Menü öffnen', close: 'Menü schließen' };

function setMenu(open) {
  burger.classList.toggle('open', open);
  links.classList.toggle('open', open);
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? menuLabels.close : menuLabels.open);
}
const menuIsOpen = () => links.classList.contains('open');

burger.addEventListener('click', () => setMenu(!menuIsOpen()));
links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));

document.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || !menuIsOpen()) return;
  setMenu(false);
  burger.focus();
});
document.addEventListener('pointerdown', event => {
  if (menuIsOpen() && !nav.contains(event.target)) setMenu(false);
});
nav.addEventListener('focusout', event => {
  if (menuIsOpen() && event.relatedTarget && !nav.contains(event.relatedTarget)) setMenu(false);
});
// Same breakpoint as the burger in styles.css
window.matchMedia('(min-width: 769px)').addEventListener('change', event => {
  if (event.matches) setMenu(false);
});
