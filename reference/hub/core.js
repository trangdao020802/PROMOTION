// Shared, dependency-free validation; never reads cookies or sign-in values.
(() => {
  const HUB = 'https://hub24.apollo.vn:7777';
  const SITE = 'https://promotion-installment.trangdao2802.chatgpt.site';
  const CHANNEL = 'promotion-hub/v1';
  const VERSION = '1.6.0';
  function ct(value) {
    const code = typeof value === 'string' ? value.trim().toUpperCase() : '';
    return /^[A-Z0-9]+-CT-\d{4,20}$/.test(code) ? code : null;
  }
  function code(value) {
    const text = typeof value === 'string' ? value.trim().toUpperCase() : '';
    return /^[A-Z0-9]+-(?:CT|DEP)-\d{4,20}$/.test(text) ? text : null;
  }
  const kind = value => code(value)?.includes('-DEP-') ? 'deposit' : 'contract';
  const list = value => kind(value) === 'deposit' ? '/deposit/manage' : '/contract/list';
  function range(value, scope = 'month') {
    const match = code(value)?.match(/(\d{2})(\d{2})-(?:CT|DEP)-/), month = Number(match?.[2]);
    if (scope === 'wide' || !match || month < 1 || month > 12) return {scope: 'wide', from: '2000-01-01', to: '2099-12-31'};
    const year = 2000 + Number(match[1]), leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const last = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
    return {scope: 'month', from: `${year}-${match[2]}-01`, to: `${year}-${match[2]}-${last}`};
  }
  function detail(value, expected) {
    if (typeof value !== 'string' || value.length > 2048 || /[\s\\\u0000-\u001f\u007f]/.test(value)) return null;
    try {
      const url = new URL(value, HUB);
      const numericPath = /^\/(?:contract\/detail|deposit\/(?:detail|view))\/[1-9]\d{0,14}\/?$/i.test(url.pathname) && !url.search;
      const entries = [...url.searchParams];
      const depositQuery = /^\/deposit\/(?:detail|view)\/?$/i.test(url.pathname) && entries.length === 1 && ['id', 'depositId'].includes(entries[0][0]) && /^[1-9]\d{0,14}$/.test(entries[0][1]);
      return url.origin === HUB && !url.username && !url.password && !url.hash && (numericPath || depositQuery) && (!expected || url.pathname.toLowerCase().startsWith('/' + kind(expected) + '/')) ? url.href : null;
    } catch { return null; }
  }
  function depositFields(value) {
    if (!value || typeof value !== 'object' || Object.keys(value).some(k => !['keyword', 'start', 'end', 'dateRange', 'separator', 'join'].includes(k))) return null;
    const names = [value.keyword, ...(value.dateRange ? [value.dateRange] : [value.start, value.end])];
    if (names.some(n => typeof n !== 'string' || !/^[a-zA-Z][\w.\[\]-]{0,79}$/.test(n) || /token|session|pass|auth|secret|credential/i.test(n)) || new Set(names).size !== names.length) return null;
    if (value.dateRange && (!['-', '/'].includes(value.separator) || ![' to ', ' - '].includes(value.join))) return null;
    return value.dateRange ? {keyword: value.keyword, dateRange: value.dateRange, separator: value.separator, join: value.join} : {keyword: value.keyword, start: value.start, end: value.end};
  }
  function search(value, scope = 'month', fields) {
    const documentCode = code(value);
    if (!documentCode) throw new Error('Mã CT / DEP không hợp lệ.');
    const url = new URL(list(documentCode), HUB), dates = range(documentCode, scope);
    if (kind(documentCode) === 'deposit') {
      // Discover names from Hub's GET form; no Deposit query name is guessed.
      if (!fields) return url.href;
      const f = depositFields(fields); if (!f) throw new Error('Bộ lọc Deposit chưa được xác nhận.');
      url.searchParams.set(f.keyword, documentCode);
      if (f.dateRange) {
        const format = date => date.split('-').reverse().join(f.separator);
        url.searchParams.set(f.dateRange, format(dates.from) + f.join + format(dates.to));
      } else { url.searchParams.set(f.start, dates.from); url.searchParams.set(f.end, dates.to); }
    } else {
      // Contract query names are observed in the owner's supplied URL.
      url.searchParams.set('s', documentCode);
      url.searchParams.set('startDate', dates.from);
      url.searchParams.set('endDate', dates.to);
    }
    return url.href;
  }
  function searchMatches(value, expected, scope = 'month', fields) {
    try {
      const url = new URL(value), target = new URL(search(expected, scope, fields));
      if (kind(expected) === 'deposit' && !depositFields(fields)) return false;
      return url.origin === HUB && !url.username && !url.password && !url.hash && url.pathname.toLowerCase() === target.pathname && [...target.searchParams].every(([k,v]) => url.searchParams.getAll(k).length === 1 && url.searchParams.get(k) === v);
    } catch { return false; }
  }
  function select(links, expected) {
    if (!code(expected)) return {status: 'unsupported'};
    const exact = links.filter(link => {
      const codes = [...new Set(String(link.text ?? '').toUpperCase().match(/\b[A-Z0-9]+-(?:CT|DEP)-\d{4,20}\b/g) ?? [])];
      return codes.length === 1 && codes[0] === code(expected);
    });
    if (!exact.length) return {status: 'missing'};
    const urls = [...new Set(exact.map(link => detail(link.href, expected)))];
    if (urls.includes(null)) return {status: 'unsupported'};
    const ids = new Set(urls.map(value => { const u = new URL(value); return u.pathname.split('/').filter(Boolean).at(-1).match(/^\d+$/)?.[0] ?? [...u.searchParams.values()][0]; }));
    return ids.size === 1 ? {status: 'found', url: urls[0]} : {status: 'ambiguous'};
  }
  function confirms(texts, expected) {
    const codes = [...new Set((texts.join(' ').toUpperCase().match(/\b[A-Z0-9]+-(?:CT|DEP)-\d{4,20}\b/g) ?? []).filter(c => kind(c) === kind(expected)))];
    return codes.length === 1 && codes[0] === code(expected);
  }
  function source(url) { try { return new URL(url).origin === SITE; } catch { return false; } }
  function hub(url) { try { return new URL(url).origin === HUB; } catch { return false; } }
  globalThis.PromotionHub = Object.freeze({HUB, SITE, CHANNEL, VERSION, ct, code, kind, list, range, depositFields, detail, search, searchMatches, select, confirms, source, hub});
})();
