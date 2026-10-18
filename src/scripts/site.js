// Every page: the drop-down menu under the header below 1024px (CR-02). Without JavaScript the menu
// is a plain wrapped list under the logo (see main.css), so nothing here is required to navigate.
const toggle = document.querySelector('.menu-toggle');
const nav = document.getElementById('site-nav');

if (toggle && nav) {
  const label = toggle.querySelector('.menu-label');
  const focusables = () => [toggle, ...nav.querySelectorAll('a, button')];
  const setOpen = (open, { returnFocus = true } = {}) => {
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    if (label) label.textContent = open ? 'Close' : 'Menu';
    if (open) nav.querySelector('a')?.focus();
    else if (returnFocus) toggle.focus();
  };
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', (e) => {
    if (!nav.classList.contains('is-open')) return;
    if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
    if (e.key === 'Tab') { // keep focus inside the open menu
      const items = focusables();
      const i = items.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); items.at(-1).focus(); }
      else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); items[0].focus(); }
    }
  });
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false, { returnFocus: false }); });
  matchMedia('(min-width: 1024px)').addEventListener('change', (e) => { if (e.matches) setOpen(false, { returnFocus: false }); });
}
