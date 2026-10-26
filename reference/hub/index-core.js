// Generated from lib/hub-index.mjs by scripts/build-hub-helper.mjs.
"use strict";
var PromotionHubIndex = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // lib/hub-index.mjs
  var hub_index_exports = {};
  __export(hub_index_exports, {
    INDEX_CHANNEL: () => INDEX_CHANNEL,
    INDEX_CODE_LIMIT: () => INDEX_CODE_LIMIT,
    INDEX_LIMIT: () => INDEX_LIMIT,
    INDEX_ORIGIN: () => INDEX_ORIGIN,
    contractPairURL: () => contractPairURL,
    indexGroups: () => indexGroups,
    indexLinkIdentity: () => indexLinkIdentity,
    indexLinks: () => indexLinks,
    indexURL: () => indexURL,
    indexURLMatches: () => indexURLMatches,
    numericId: () => numericId,
    projectContractPairs: () => projectContractPairs,
    selectIndexCandidate: () => selectIndexCandidate
  });

  // lib/hub-links.mjs
  function hubDocumentCode(value) {
    const code = typeof value === "string" ? value.trim().toUpperCase() : "";
    return /^[A-Z0-9]+-(?:CT|DEP)-\d{4,20}$/.test(code) ? code : null;
  }
  function hubDocumentPeriod(value) {
    const code = hubDocumentCode(value);
    if (!code) return null;
    const match = code.match(/(\d{2})(\d{2})-(?:CT|DEP)-/), month = Number(match?.[2]);
    if (!match || month < 1 || month > 12) return { from: "2000-01-01", to: "2099-12-31" };
    const prefix = "20" + match[1] + "-" + match[2];
    return { from: prefix + "-01", to: prefix + "-" + new Date(Date.UTC(Number("20" + match[1]), month, 0)).getUTCDate() };
  }
  function hubDocumentListUrl(value) {
    const code = hubDocumentCode(value), period = hubDocumentPeriod(code);
    if (!code || !period) return null;
    const url = new URL(code.includes("-DEP-") ? "/Deposit/manage" : "/contract/list", "https://hub24.apollo.vn:7777");
    url.searchParams.set("startDate", period.from);
    url.searchParams.set("endDate", period.to);
    url.searchParams.set("ps", "10000");
    return url.href;
  }

  // lib/hub-index.mjs
  var INDEX_ORIGIN = "https://hub24.apollo.vn:7777";
  var INDEX_LIMIT = 1e4;
  var INDEX_CODE_LIMIT = 2e3;
  var INDEX_CHANNEL = "promotion-hub-index/v1";
  function indexGroups(values) {
    if (!Array.isArray(values) || !values.length || values.length > INDEX_CODE_LIMIT) throw Error("Ch\u1ECDn t\u1EEB 1 \u0111\u1EBFn 2.000 m\xE3 CT / DEP.");
    const groups = /* @__PURE__ */ new Map();
    for (const value of values) {
      const ct = hubDocumentCode(value);
      if (!ct) throw Error("M\xE3 CT / DEP kh\xF4ng h\u1EE3p l\u1EC7.");
      const kind = ct.includes("-DEP-") ? "deposit" : "contract", { from, to } = hubDocumentPeriod(ct);
      const key = kind + from;
      if (!groups.has(key)) groups.set(key, { kind, from, to, codes: [] });
      const g = groups.get(key);
      if (!g.codes.includes(ct)) g.codes.push(ct);
    }
    return [...groups.values()];
  }
  function indexURL(codes, id, fields) {
    const groups = indexGroups(codes);
    if (groups.length !== 1 || typeof id !== "string" || !/^[\w-]{1,80}$/.test(id)) throw Error("L\u01B0\u1EE3t \u0111\u1ECDc danh s\xE1ch kh\xF4ng h\u1EE3p l\u1EC7.");
    const g = groups[0], url = new URL(hubDocumentListUrl(g.codes[0]));
    if (g.kind === "deposit" && fields) {
      url.searchParams.delete("startDate");
      url.searchParams.delete("endDate");
      const names = fields.dateRange ? [fields.dateRange] : [fields.start, fields.end];
      if (names.some((n) => typeof n !== "string" || !/^[a-zA-Z][\w.\[\]-]{0,79}$/.test(n) || /token|session|pass|auth|secret|credential/i.test(n)) || new Set(names).size !== names.length || names.includes("ps")) throw Error("Ch\u01B0a x\xE1c nh\u1EADn b\u1ED9 l\u1ECDc Deposit.");
      if (fields.dateRange) {
        if (!["-", "/"].includes(fields.separator) || ![" to ", " - "].includes(fields.join)) throw Error("Ng\xE0y Deposit kh\xF4ng h\u1EE3p l\u1EC7.");
        const fmt = (d) => d.split("-").reverse().join(fields.separator);
        url.searchParams.set(fields.dateRange, fmt(g.from) + fields.join + fmt(g.to));
      } else {
        url.searchParams.set(fields.start, g.from);
        url.searchParams.set(fields.end, g.to);
      }
    }
    url.searchParams.set("ps", String(INDEX_LIMIT));
    return url.href;
  }
  function indexURLMatches(value, codes, id, fields) {
    try {
      const url = new URL(value), target = new URL(indexURL(codes, id, fields));
      return !url.username && !url.password && url.origin === target.origin && url.pathname.toLowerCase() === target.pathname.toLowerCase() && !url.hash && [...url.searchParams].length === [...target.searchParams].length && [...target.searchParams].every(([k, v]) => url.searchParams.getAll(k).length === 1 && url.searchParams.get(k) === v);
    } catch {
      return false;
    }
  }
  function numericId(value) {
    const text = typeof value === "number" && Number.isSafeInteger(value) ? String(value) : typeof value === "string" ? value : "";
    return /^[1-9]\d{0,14}$/.test(text) && Number.isSafeInteger(Number(text)) ? text : null;
  }
  function projectContractPairs(records) {
    if (!Array.isArray(records) || records.length > INDEX_LIMIT) return null;
    const pairs = /* @__PURE__ */ new Map(), ids = /* @__PURE__ */ new Map(), conflicts = /* @__PURE__ */ new Set();
    for (const row of records) {
      if (!row || typeof row !== "object") continue;
      const ct = hubDocumentCode(row.ContractNo), id = numericId(row.ContractId);
      if (!ct?.includes("-CT-") || !id) continue;
      if (pairs.has(ct) && pairs.get(ct) !== id) conflicts.add(ct);
      if (ids.has(id) && ids.get(id) !== ct) {
        conflicts.add(ct);
        conflicts.add(ids.get(id));
      }
      pairs.set(ct, id);
      ids.set(id, ct);
    }
    return { pairs: [...pairs].filter(([ct]) => !conflicts.has(ct)).map(([ct, id]) => ({ ct, id })), conflicts: [...conflicts] };
  }
  function contractPairURL(pair) {
    const ct = hubDocumentCode(pair?.ct), id = numericId(pair?.id);
    return ct?.includes("-CT-") && id ? INDEX_ORIGIN + "/contract/detail/" + id : null;
  }
  function indexLinkIdentity(value, expected) {
    const ct = hubDocumentCode(expected);
    if (!ct || typeof value !== "string" || value.length > 2048 || /[\s\\\u0000-\u001f\u007f]/.test(value)) return null;
    try {
      const url = new URL(value), kind = ct.includes("-DEP-") ? "deposit" : "contract", entries = [...url.searchParams];
      const path = new RegExp("^/" + kind + "/(?:" + (kind === "contract" ? "detail" : "detail|view") + ")/([1-9]\\d{0,14})/?$", "i").exec(url.pathname);
      const query = kind === "deposit" && /^\/deposit\/(?:detail|view)\/?$/i.test(url.pathname) && entries.length === 1 && ["id", "depositId"].includes(entries[0][0]) && numericId(entries[0][1]);
      const id = path && !url.search ? numericId(path[1]) : query || null;
      if (url.origin !== INDEX_ORIGIN || url.username || url.password || url.hash || !id || url.href !== value) return null;
      return { kind, id, url: url.href };
    } catch {
      return null;
    }
  }
  function selectIndexCandidate(anchors, expected) {
    const ct = hubDocumentCode(expected), identities = /* @__PURE__ */ new Map();
    let unsupported = false, route;
    if (!ct || !Array.isArray(anchors) || anchors.length > INDEX_LIMIT * 3) return { status: "unsupported", candidates: 0 };
    for (const anchor of anchors) {
      const codes = [...new Set(String(anchor?.text ?? "").toUpperCase().match(/\b[A-Z0-9]+-(?:CT|DEP)-\d{4,20}\b/g) ?? [])];
      if (codes.length !== 1 || codes[0] !== ct) continue;
      const identity2 = indexLinkIdentity(anchor.href, ct);
      if (identity2) identities.set(identity2.kind + ":" + identity2.id, identities.get(identity2.kind + ":" + identity2.id) ?? identity2);
      else {
        unsupported = true;
        try {
          const u = new URL(anchor.href);
          if (u.origin === INDEX_ORIGIN) {
            const m = /^\/(?:contract|deposit)\/[a-zA-Z]{1,40}(?:\/|$)/i.exec(u.pathname);
            if (m) route = m[0].replace(/\/$/, "");
          }
        } catch {
        }
      }
    }
    const candidates = identities.size, identity = identities.values().next().value;
    if (candidates > 1) return { status: "conflict", candidates };
    if (unsupported) return { status: "unsupported", candidates, identity, route };
    return identity ? { status: "found", candidates, identity, url: identity.url } : { status: "unresolved", candidates: 0 };
  }
  function indexLinks(values, codes) {
    let wanted;
    try {
      wanted = new Set(indexGroups(codes).flatMap((g) => g.codes));
    } catch {
      return null;
    }
    if (!Array.isArray(values) || values.length > wanted.size) return null;
    const links = /* @__PURE__ */ new Map(), ids = /* @__PURE__ */ new Map();
    for (const row of values) {
      if (!row || Object.keys(row).some((k) => !["ct", "url"].includes(k))) return null;
      const ct = hubDocumentCode(row.ct);
      if (!ct || !wanted.has(ct) || typeof row.url !== "string") return null;
      const identity = indexLinkIdentity(row.url, ct);
      if (!identity) return null;
      const key = identity.kind + ":" + identity.id;
      if (links.has(ct) && indexLinkIdentity(links.get(ct), ct).id !== identity.id || ids.has(key) && ids.get(key) !== ct) return null;
      if (!links.has(ct)) links.set(ct, identity.url);
      ids.set(key, ct);
    }
    return [...links].map(([ct, url]) => ({ ct, url }));
  }
  return __toCommonJS(hub_index_exports);
})();
