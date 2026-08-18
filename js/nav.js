const burger = document.getElementById('navBurger');
const links  = document.getElementById('navLinks');
burger.addEventListener('click', () => {
  const open = burger.classList.toggle('open');
  links.classList.toggle('open');
  burger.setAttribute('aria-expanded', open ? 'true' : 'false');
});
links.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    burger.classList.remove('open');
    links.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
  });
});
