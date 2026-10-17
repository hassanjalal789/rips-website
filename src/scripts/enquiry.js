// Enquiry form in the browser (IS-01; SRS F-04, F-06, F-07; Doc 06 Q16–Q19, Q25).
// Checks each field when the visitor leaves it, and again on submit; after a field has shown an
// error it re-checks while typing. The rules are the function's own (functions/lib/validate.js),
// and the function's answer is final (Doc 08 Q12). Values always stay filled in after an error.
import { validateEnquiry } from '../../functions/lib/validate.js';

const ENDPOINT = '/api/v1/enquiry';
const TIMEOUT_MS = 15_000; // IS-01: failure after 15 s

const form = document.querySelector('[data-enquiry]');
const configEl = document.getElementById('enquiry-config');

if (form && configEl) {
  const config = JSON.parse(configEl.textContent);
  const msg = config.messages;
  const fill = (text) => text.replace('{whatsapp}', config.whatsapp);

  const summary = form.querySelector('[data-error-summary]');
  const summaryList = form.querySelector('[data-error-list]');
  const failure = form.querySelector('[data-form-failure]');
  const failureText = form.querySelector('[data-failure-text]');
  const submit = form.querySelector('[data-submit]');
  const submitLabel = form.querySelector('[data-submit-label]');
  const spinner = submit.querySelector('.spinner');
  const status = form.querySelector('[data-status]');
  const touched = new Set();
  let sending = false;

  // One token per page view: a second click or a retry after a lost reply is ignored by the
  // function rather than stored twice (Doc 08 Q28).
  const token = (() => {
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  })();

  const control = (name) => form.elements.namedItem(name);
  const errorEl = (name) => control(name)?.closest('.field')?.querySelector('.field-error');
  const labelText = (name) => {
    const el = control(name);
    if (el?.dataset.label) return el.dataset.label;
    const label = el && form.querySelector(`label[for="${el.id}"]`);
    return label ? label.childNodes[0].textContent.trim() : name;
  };

  // Program pre-selected from the page the visitor came from (SRS F-02 default).
  const params = new URLSearchParams(location.search);
  const wanted = params.get('program');
  const program = control('program_code');
  if (wanted && [...program.options].some((o) => o.value === wanted)) program.value = wanted;

  // Conditional fields sit directly below the field that reveals them (SRS F-04, Doc 06 Q16).
  const conditionals = [...form.querySelectorAll('[data-show-when]')].map((wrap) => {
    const [name, value] = wrap.dataset.showWhen.split('=');
    return { wrap, name, value, input: wrap.querySelector('input, select, textarea') };
  });
  const updateConditionals = () => {
    for (const c of conditionals) {
      const current = control(c.name).value;
      const show = c.value ? current === c.value : current !== '';
      c.wrap.hidden = !show;
      c.input.disabled = !show;
      if (c.input.name === 'city_other') c.input.required = show;
    }
  };

  const message = control('message');
  const counter = form.querySelector('[data-counter-for="enq-message"]');
  const updateCounter = () => {
    const left = 500 - message.value.length;
    counter.textContent = left >= 0 ? `${left} characters left` : `${-left} characters over the limit`;
  };

  const values = () => ({
    full_name: control('full_name').value,
    mobile: control('mobile').value,
    email: control('email').value,
    program_code: control('program_code').value,
    city: control('city').value,
    city_other: control('city_other').disabled ? '' : control('city_other').value,
    qualification: control('qualification').value,
    marks_percent: control('marks_percent').disabled ? '' : control('marks_percent').value,
    message: control('message').value,
    consent: control('consent').checked,
    website: control('website').value,
    source_page: location.pathname,
    campaign: params.get('utm_campaign') || params.get('campaign') || '',
    submission_token: token,
  });

  const showError = (name, code) => {
    const el = errorEl(name);
    const input = control(name);
    if (!el || !input) return;
    if (code) {
      el.innerHTML = '<svg class="icon" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm.9 10.5H7.1V9.7h1.8v1.8Zm0-3.2H7.1V4.5h1.8v3.8Z"/></svg>';
      el.append(document.createTextNode(fill(msg[code] || msg.form_level)));
      el.hidden = false;
      input.setAttribute('aria-invalid', 'true');
    } else {
      el.hidden = true;
      el.textContent = '';
      input.removeAttribute('aria-invalid');
    }
  };

  const check = ({ only } = {}) => {
    const result = validateEnquiry(values(), { programCodes: config.programCodes, cities: config.cities });
    const byField = new Map();
    for (const e of result.errors) if (!byField.has(e.field)) byField.set(e.field, e.code);
    const names = ['full_name', 'mobile', 'email', 'program_code', 'city', 'city_other', 'qualification', 'marks_percent', 'message', 'consent'];
    for (const name of names) {
      if (only && !only.has(name)) continue;
      showError(name, byField.get(name));
    }
    return byField;
  };

  const showSummary = (byField) => {
    summaryList.replaceChildren();
    for (const [name, code] of byField) {
      const input = control(name);
      if (!input) continue;
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `#${input.id}`;
      a.textContent = `${labelText(name)}: ${fill(msg[code] || msg.form_level)}`;
      a.addEventListener('click', (e) => {
        e.preventDefault();
        input.focus();
      });
      li.append(a);
      summaryList.append(li);
    }
    summary.hidden = byField.size === 0;
    if (byField.size) summary.focus();
  };

  const setSending = (on) => {
    sending = on;
    submit.disabled = on;
    spinner.hidden = !on;
    submitLabel.textContent = on ? 'Sending…' : 'Send enquiry';
    status.textContent = on ? 'Sending your enquiry' : '';
  };

  const showFailure = (text) => {
    failureText.textContent = text;
    failure.hidden = false;
    failure.scrollIntoView({ block: 'center' });
  };

  form.addEventListener('focusout', (e) => {
    const name = e.target.name;
    if (!name || name === 'website') return;
    touched.add(name);
    check({ only: touched });
  });
  form.addEventListener('input', (e) => {
    if (e.target === message) updateCounter();
    const name = e.target.name;
    if (name && errorEl(name) && !errorEl(name).hidden) check({ only: new Set([name]) });
  });
  form.addEventListener('change', (e) => {
    if (e.target.name === 'city' || e.target.name === 'qualification') updateConditionals();
    if (e.target.type === 'checkbox' || e.target.tagName === 'SELECT') {
      touched.add(e.target.name);
      check({ only: touched });
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (sending) return; // a double click sends once
    failure.hidden = true;
    const byField = check();
    showSummary(byField);
    if (byField.size) return;

    setSending(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    let res;
    try {
      res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(values()),
        signal: controller.signal,
        credentials: 'same-origin',
      });
    } catch {
      res = null;
    } finally {
      clearTimeout(timer);
    }

    if (res && (res.status === 200 || res.status === 201)) {
      location.assign('/thank-you/');
      return;
    }
    setSending(false);
    if (res && res.status === 400) {
      const body = await res.json().catch(() => ({}));
      const errors = new Map((body.errors || []).filter((x) => control(x.field)).map((x) => [x.field, x.code]));
      if (errors.size) {
        for (const [name, code] of errors) showError(name, code);
        showSummary(errors);
        return;
      }
    }
    showFailure(fill(res && res.status === 429 ? msg.rate_limited : msg.failure));
  });

  updateConditionals();
  updateCounter();
}
