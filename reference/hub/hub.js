(() => {
  const P = globalThis.PromotionHub;
  if (location.origin !== P.HUB || window.top !== window) return;
  const send = message => chrome.runtime.sendMessage(message);
  void send({type: 'context'}).then(job => {
    if (!job?.id || job.kind==='course' || !P.code(job.ct)) return;
    let done = false, inspecting = false, loginNotified = false, observer, timer;
    let uiAttempted = false, waitingForRows = false, rowsChanged = false, uiReady = false;
    const deadline = Date.now() + 25_000;
    const stop = () => { done = true; observer?.disconnect(); clearInterval(timer); };
    const complete = message => {
      stop();
      void send({id: job.id, scope: job.scope, ...message}).then(r => {
        if (r?.error) void send({type: 'failure', id: job.id, scope: job.scope, reason: 'filters'});
      }).catch(() => {});
    };
    const safeInputs = root => [...root.querySelectorAll('input')].filter(e => ['text', 'search', 'date', 'hidden'].includes(e.type) && !/token|session|pass|auth|secret|credential/i.test(e.name) && (e.type !== 'hidden' || /^(?:startDate|endDate)$/i.test(e.name)));
    const rangeFormat = input => input.value?.match(/^\s*\d{2}([-\/])\d{2}\1\d{4}( to | - )\d{2}\1\d{2}\1\d{4}\s*$/);
    const datePair = inputs => ({start: inputs.find(e => /^startDate$/i.test(e.name)), end: inputs.find(e => /^endDate$/i.test(e.name))});
    const discoverDeposit = () => {
      const candidates = [];
      for (const form of document.querySelectorAll('form')) {
        const action = new URL(form.getAttribute('action') || location.href, location.href);
        if ((form.getAttribute('method') || 'get').toLowerCase() !== 'get' || action.origin !== P.HUB || action.pathname.toLowerCase() !== '/deposit/manage') continue;
        const inputs = safeInputs(form), keywords = inputs.filter(e => /deposit\s*no\.?/i.test(e.getAttribute('placeholder') || ''));
        if (keywords.length !== 1) continue;
        const keyword = keywords[0].name, {start, end} = datePair(inputs);
        if (start && end && [start, end].every(e => !e.value || /^\d{4}-\d{2}-\d{2}$/.test(e.value))) {
          const f = P.depositFields({keyword, start: start.name, end: end.name}); if (f) candidates.push(f); continue;
        }
        for (const input of inputs) {
          const match = rangeFormat(input);
          if (match) { const f = P.depositFields({keyword, dateRange: input.name, separator: match[1], join: match[2]}); if (f) candidates.push(f); }
        }
      }
      return candidates.length === 1 ? candidates[0] : null;
    };
    const visible = element => !element.hidden && element.getAttribute('aria-hidden') !== 'true' && (!element.getClientRects || element.getClientRects().length > 0);
    const discoverSearchUI = () => {
      const inputs = safeInputs(document), keywords = inputs.filter(e => /deposit\s*no\.?/i.test(e.getAttribute('placeholder') || '') && visible(e));
      if (keywords.length !== 1) return null;
      const keyword = keywords[0], {start, end} = datePair(inputs), ranges = inputs.filter(e => e !== keyword && e.type !== 'hidden' && rangeFormat(e) && visible(e));
      const buttons = [...document.querySelectorAll('button,input[type="submit"],input[type="button"],a')].filter(e => /^(?:search|tìm kiếm)$/i.test((e.textContent || e.value || '').trim()) && visible(e) && (!keyword.form || e.form === keyword.form || keyword.form.contains(e)));
      if (buttons.length !== 1 || !(start && end) && ranges.length !== 1) return null;
      return {keyword, start, end, range: ranges[0], button: buttons[0]};
    };
    const uiValues = ui => {
      const dates = P.range(job.ct, job.scope), pairs = [[ui.keyword, job.ct]];
      if (ui.start && ui.end) {
        for (const [input, value] of [[ui.start, dates.from], [ui.end, dates.to]]) pairs.push([input, /^\d{2}[-\/]\d{2}[-\/]\d{4}$/.test(input.value) ? value.split('-').reverse().join(input.value.includes('/') ? '/' : '-') : value]);
      } else {
        const f = rangeFormat(ui.range); if (!f) return null;
        pairs.push([ui.range, dates.from.split('-').reverse().join(f[1]) + f[2] + dates.to.split('-').reverse().join(f[1])]);
      }
      return pairs;
    };
    const setInput = (input, value) => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      if (!setter) throw new Error('Input API unavailable');
      setter.call(input, value);
      input.dispatchEvent(new Event('input', {bubbles: true}));
      input.dispatchEvent(new Event('change', {bubbles: true}));
    };
    const identityFields = () => [...document.querySelectorAll('label,th,dt')].filter(e => (P.kind(job.ct) === 'deposit' ? /^deposit\s*(?:no\.?|code)$/i : /^contract\s*(?:no\.?|code)$/i).test(e.textContent.trim())).map(label => {
      const id = label.getAttribute('for'), field = id ? document.getElementById(id) : null;
      if (field && field.type !== 'password' && !/token|session|pass|auth|secret|credential/i.test(field.name)) return field.value ?? field.textContent;
      return label.nextElementSibling?.textContent ?? '';
    });
    const inspect = async () => {
      if (done || inspecting) return;
      inspecting = true;
      try {
        if ([...document.querySelectorAll('input[type="password"]')].some(visible) || /\/(?:login|signin|sign-in)(?:\/|$)/i.test(location.pathname)) {
          if (!loginNotified) { loginNotified = true; void send({type: 'login', id: job.id}); }
          return;
        }
        if (/upstream connect error|ERR_CONNECTION|connection (?:refused|reset)|không thể truy cập/i.test((document.body?.innerText ?? '').slice(0,600))) { complete({type: 'failure', reason: 'connection'}); return; }
        let searchReady = P.searchMatches(location.href, job.ct, job.scope, job.fields);
        const depositPage = location.pathname.toLowerCase() === '/deposit/manage' && job.stage === 'search' && P.kind(job.ct) === 'deposit';
        const observedUI = depositPage ? discoverSearchUI() : null, observedValues = observedUI && uiValues(observedUI);
        const ignoredQuery = job.fields && observedValues && !observedValues.every(([input,value]) => input.value.trim() === value);
        if (depositPage && (!job.fields || job.ui || ignoredQuery)) {
          const fields = !job.fields && !job.ui && !uiAttempted ? discoverDeposit() : null;
          if (fields) { complete({type: 'filters', fields}); return; }
          const ui = observedUI, values = observedValues;
          if (!ui || !values) { if (Date.now() >= deadline) complete({type: 'failure', reason: 'unsupported', diagnostic: {mode: 'ui'}}); return; }
          const matches = () => values.every(([input, value]) => input.value.trim() === value);
          if (!uiAttempted && (!job.ui || !matches())) {
            uiAttempted = true;
            const approval = await send({type: 'filters-ui', id: job.id, scope: job.scope});
            if (!approval?.apply) { complete({type: 'failure', reason: 'filters'}); return; }
            job.ui = true; waitingForRows = true;
            for (const [input, value] of values) setInput(input, value);
            if (!matches()) { complete({type: 'failure', reason: 'filters'}); return; }
            ui.button.click(); return;
          }
          const busy = document.querySelector('[aria-busy="true"],.dataTables_processing[style*="display: block"]');
          if (matches() && (!waitingForRows || rowsChanged) && !busy) {
            if (!uiReady) { const result = await send({type: 'ui-ready', id: job.id, scope: job.scope}); if (!result?.ready) return; uiReady = true; }
            searchReady = true;
          } else { if (Date.now() >= deadline) complete({type: 'failure', reason: 'filters'}); return; }
        }
        if (job.stage === 'search' && searchReady) {
          const header = P.kind(job.ct) === 'deposit' ? /Deposit\s*(?:no\.?|code)/i : /Contract\s*(?:no\.?|code)/i;
          const tables = [...document.querySelectorAll('table')].filter(t => header.test(t.querySelector('thead')?.textContent || [...t.querySelectorAll('th')].map(e => e.textContent).join(' ')));
          const links = tables.flatMap(t => [...t.querySelectorAll('tbody a[href]')].map(a => ({text: a.textContent.trim(), href: a.href})));
          const diagnostic = {tables: tables.length, anchors: links.length};
          const match = P.select(links, job.ct);
          if (match.status === 'found') { complete({type: 'detail', ct: job.ct, url: match.url}); return; }
          if (match.status !== 'missing') {
            const candidate = links.find(a => a.text.toUpperCase().includes(job.ct));
            try { const segments = new URL(candidate?.href).pathname.split('/'); if (/^[a-zA-Z]{1,40}$/.test(segments[2])) diagnostic.route = '/' + segments[1] + '/' + segments[2]; } catch {}
            complete({type: 'failure', reason: match.status, diagnostic}); return;
          }
          if (tables.some(t => /(?:no\s+(?:matching\s+)?(?:data|records?|results?|contracts?|deposits?)\b|không\s+(?:có|tìm thấy)\s+(?:dữ liệu|kết quả|hợp đồng|cọc))/i.test(t.querySelector('tbody')?.textContent ?? ''))) { complete({type: 'failure', reason: 'missing', diagnostic}); return; }
          if (Date.now() >= deadline) { complete({type: 'failure', reason: tables.length ? 'timeout' : 'unsupported', diagnostic}); return; }
        } else if (job.stage === 'detail' && P.detail(location.href, job.ct) === job.url) {
          const headings = [...document.querySelectorAll('h1,h2,h3,.breadcrumb,[data-contract-code],[data-deposit-code]')].map(e => e.getAttribute('data-contract-code') ?? e.getAttribute('data-deposit-code') ?? e.textContent);
          if (P.confirms([document.title, ...headings, ...identityFields()], job.ct)) { complete({type: 'complete', ct: job.ct, url: location.href}); return; }
          if (Date.now() >= deadline) { complete({type: 'failure', reason: 'mismatch'}); return; }
        } else if (document.querySelector('a[href*="/contract/list"],a[href*="/deposit/manage"]')) { complete({type: 'resume'}); return; }
        if (Date.now() >= deadline) complete({type: 'failure', reason: 'timeout'});
      } catch { complete({type: 'failure', reason: 'unsupported'}); }
      finally { inspecting = false; }
    };
    timer = setInterval(() => void inspect(), 750);
    observer = new MutationObserver(records => {
      if (waitingForRows && records.some(r => r.target.closest?.('table') || [...r.addedNodes].some(n => n.nodeName === 'TABLE' || n.querySelector?.('table')))) rowsChanged = true;
      void inspect();
    });
    observer.observe(document.documentElement, {childList: true, subtree: true});
    void inspect();
  }).catch(() => {});
})();
