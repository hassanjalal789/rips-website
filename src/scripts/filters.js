// List filters for Notices and Programs (IS-02; Doc 05 Q18, D-08). The choices live in the address,
// so refresh, sharing and Back keep them; the count is announced in a polite live region; Clear
// filters resets the list. Without JavaScript the full list shows and the form just reloads it.
const form = document.querySelector('[data-filters]');

if (form) {
  const selects = [...form.querySelectorAll('select')];
  const items = [...document.querySelectorAll('[data-filter-item]')];
  const groups = [...document.querySelectorAll('[data-filter-group]')];
  const count = document.querySelector('[data-filter-count]');
  const empty = document.querySelector('[data-filter-empty]');
  const pager = document.querySelector('[data-pagination]');
  const pageSize = Number(form.dataset.pageSize) || 0;
  const noun = form.dataset.filters; // "notice" or "program"
  let pageNo = 1;

  form.querySelector('[data-filter-submit]')?.setAttribute('hidden', '');

  const readAddress = () => {
    const params = new URLSearchParams(location.search);
    for (const s of selects) {
      const v = params.get(s.name) ?? '';
      s.value = [...s.options].some((o) => o.value === v) ? v : '';
    }
    pageNo = Math.max(1, Number(params.get('page')) || 1);
  };

  const writeAddress = () => {
    const params = new URLSearchParams();
    for (const s of selects) if (s.value) params.set(s.name, s.value);
    if (pageNo > 1) params.set('page', String(pageNo));
    const qs = params.toString();
    const url = location.pathname + (qs ? `?${qs}` : '');
    if (url !== location.pathname + location.search) history.pushState(null, '', url);
  };

  const matches = (el) =>
    selects.every((s) => {
      if (!s.value) return true;
      const v = el.dataset[s.name];
      // A notice for all programs belongs under every program.
      return v === s.value || (s.name === 'program' && v === 'all');
    });

  const renderPager = (pages) => {
    if (!pager) return;
    pager.hidden = pages < 2;
    pager.replaceChildren();
    if (pages < 2) return;
    const list = document.createElement('ul');
    list.className = 'pagination';
    for (let i = 1; i <= pages; i++) {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = String(i);
      b.setAttribute('aria-label', `Page ${i}`);
      if (i === pageNo) b.setAttribute('aria-current', 'page');
      b.addEventListener('click', () => {
        pageNo = i;
        writeAddress();
        render();
        document.querySelector('[data-filter-list]')?.scrollIntoView({ block: 'start' });
      });
      li.append(b);
      list.append(li);
    }
    pager.append(list);
  };

  const render = () => {
    const shown = items.filter(matches);
    const pages = pageSize ? Math.max(1, Math.ceil(shown.length / pageSize)) : 1;
    pageNo = Math.min(pageNo, pages);
    const from = pageSize ? (pageNo - 1) * pageSize : 0;
    const to = pageSize ? from + pageSize : shown.length;
    for (const el of items) el.hidden = true;
    shown.slice(from, to).forEach((el) => (el.hidden = false));
    for (const g of groups) g.hidden = !g.querySelector('[data-filter-item]:not([hidden])');
    if (empty) empty.hidden = shown.length > 0;
    if (count) count.textContent = `${shown.length} ${noun}${shown.length === 1 ? '' : 's'} shown`;
    renderPager(pages);
  };

  form.addEventListener('change', () => {
    pageNo = 1;
    writeAddress();
    render();
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    pageNo = 1;
    writeAddress();
    render();
  });
  document.querySelectorAll('[data-filter-clear]').forEach((b) =>
    b.addEventListener('click', () => {
      for (const s of selects) s.value = '';
      pageNo = 1;
      writeAddress();
      render();
      selects[0]?.focus();
    }),
  );
  addEventListener('popstate', () => {
    readAddress();
    render();
  });

  readAddress();
  render();
}
