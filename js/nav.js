const burger = document.getElementById('navBurger');
const links  = document.getElementById('navLinks');
burger.addEventListener('click', () => {
  burger.classList.toggle('open');
  links.classList.toggle('open');
});
links.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    burger.classList.remove('open');
    links.classList.remove('open');
  });
});
