var PromotionHubCourse = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name2 in all)
      __defProp(target, name2, { get: all[name2], enumerable: true });
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

  // src/core/hub-course.mjs
  var hub_course_exports = {};
  __export(hub_course_exports, {
    COURSE_FIELDS: () => COURSE_FIELDS,
    COURSE_LABELS: () => COURSE_LABELS,
    contractInputPlan: () => contractInputPlan,
    courseFailure: () => courseFailure,
    courseLabel: () => courseLabel,
    coursePageFromDocument: () => coursePageFromDocument,
    coursePayload: () => coursePayload,
    courseRequest: () => courseRequest,
    fillContractInputs: () => fillContractInputs,
    missingContractInputs: () => missingContractInputs,
    parseCoursePage: () => parseCoursePage
  });

  // src/core/hub-discount.mjs
  var clean = (value) => value.trim().replace(/\s+/g, " ");
  var benefit = /^\d[\d.,]*(?:[ \t]+\d{3})*\s*(?:%|months?|tháng|vnd|vnđ|đ|₫)\s*/iu;
  var amountOnly = /^\d[\d.,\s]*(?:%|months?|tháng|vnd|vnđ|đ|₫)?$/iu;
  var noOffer = /^(?:0|[-—]+|none|no discount|n\/a)$/i;
  function normalizeHubDiscount(value, { wrappedOnly = false } = {}) {
    if (typeof value !== "string" || value.length > 2e3) return null;
    const entries = [];
    let depth = 0, start = 0;
    for (let i = 0; i < value.length; i++) {
      if (value[i] === "(") depth++;
      else if (value[i] === ")") depth = Math.max(0, depth - 1);
      else if (depth === 0 && /[;\r\n]/.test(value[i])) {
        entries.push(value.slice(start, i));
        start = i + 1;
      }
    }
    entries.push(value.slice(start));
    const names = [];
    let zero = false;
    for (const entry of entries) {
      let rest = entry.trim();
      if (!rest) continue;
      if (noOffer.test(rest)) {
        zero = true;
        continue;
      }
      if (amountOnly.test(rest)) continue;
      if (!benefit.test(rest)) {
        if (!wrappedOnly) names.push(clean(rest));
        continue;
      }
      while (rest) {
        const prefix = benefit.exec(rest);
        if (!prefix || rest[prefix[0].length] !== "(") return null;
        const open = prefix[0].length;
        let nested = 1, close = open + 1;
        for (; close < rest.length && nested; close++) {
          if (rest[close] === "(") nested++;
          else if (rest[close] === ")") nested--;
        }
        if (nested) return null;
        const name2 = clean(rest.slice(open + 1, close - 1));
        if (!name2) return null;
        names.push(name2);
        rest = rest.slice(close).trim();
      }
    }
    const unique = [...new Set(names)];
    if (unique.length > 100) return null;
    return unique.length ? unique.join(";") : zero && !wrappedOnly ? "0" : null;
  }

  // src/core/pricing-key.mjs
  var priceText = (value) => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "d").toLowerCase().replace(/[–—_]/g, " ").replace(/\s+/g, " ").trim();
  var single = (values) => {
    const distinct = [...new Set(values)];
    return distinct.length === 1 ? distinct[0] : null;
  };
  var courseText = (value) => priceText(value).replace(/new\s*price\s*(?=20\d{2})/g, "new price ").replace(/(atls|agls|ielts|ahp|premium)(?=new|20\d{2}|layer)/g, "$1 ").replace(/(20\d{2})(?=layer|vtdh)/g, "$1 ").replace(/[.;,:|_()[\]{}]/g, " ").replace(/\s+/g, " ").trim();
  var isWeeklyCourse = (value) => /\b(?:goi\s*tuan|tuan|weekly|weeks)\b/.test(courseText(value));
  function weeklyHours(value) {
    const s = priceText(value);
    if (/^\d+(?:[.,]\d+)?$/.test(s)) return Number(s.replace(",", "."));
    return single([...s.matchAll(/\b(\d+(?:[.,]\d+)?)\s*(?:hrs?|hours?|gio|h)\s*(?:\/|per|moi|[.;,])\s*(?:weeks?|tuan|w)\b/g)].map((m) => Number(m[1].replace(",", "."))));
  }
  function packageIdentity(value, { weekly = false } = {}) {
    const s = priceText(value).replace(/^[\s;:,.]+/, "").replace(/(\d)[.;:,]\s*(?=[a-z])/g, "$1 "), n = /^(\d+(?:[.,]\d+)?)\s*(?:months?|thang|t)(?:\b|$)/.exec(s), months = n ? Number(n[1].replace(",", ".")) : /^\d+(?:[.,]\d+)?$/.test(s) ? Number(s.replace(",", ".")) : null;
    if (weekly || /\b(?:weeks?|tuan)\b/.test(s)) {
      const w = Number(/^(\d+(?:[.,]\d+)?)/.exec(s)?.[1]?.replace(",", "."));
      return { months: null, weeks: w > 0 ? w : null, unit: "weeks", key: w > 0 ? w + " WEEKS" : null, variant: "weekly" };
    }
    if (/\bsplit\b|chia doi|siblings?/.test(s)) {
      const total = /^(18|24|36)\s*(?:(?:months?|thang)\s*)?(?:split\b|\(?chia\s*doi\b)/.exec(s)?.[1];
      return { months: total ? Number(total) / 2 : months, key: total ? `${total} SPLIT` : months ? `${months * 2} SPLIT` : null, variant: "split" };
    }
    const summer = /\bs\d{2}(?:\s*[-/]\s*\d+)?\b/.exec(s)?.[0]?.replace(/[\s/]/g, (c) => c === "/" ? "-" : "").toUpperCase();
    if (summer || /summer|combo he/.test(s)) return { months, key: months ? `${summer ?? "SUMMER"}|${months}M` : null, variant: "summer" };
    return { months, key: months, variant: /upsell|upgrade|nang cap/.test(s) ? "upgrade" : /trai nghiem|trial/.test(s) ? "trial" : "standard" };
  }
  function pricingIdentity(course, hours, pkg, context = {}) {
    const s = courseText(course), p = packageIdentity(pkg, { weekly: isWeeklyCourse(course) }), years = [...new Set(s.match(/\b20\d{2}\b/g) ?? [])], layers = [...s.matchAll(/\b(?:layer|l)\s*[-:]?\s*([0123])\b/g)].map((m) => Number(m[1]));
    const families = [...s.matchAll(/\b(atls|agls|ielts|ahp|premium)\b/g)].map((m) => m[1].toUpperCase()), family = single(families) ?? (families.length && families.every((f) => ["ATLS", "AGLS"].includes(f)) ? "ATLS" : !families.length ? "ATLS" : null);
    const ahp = /\bahp\b|apollo\s*@\s*home/.test(s), vtdh = /\bvtdh\b|vung tin dong hanh/.test(s) || /\bvtdh\b|vung tin dong hanh/.test(priceText(pkg)) && !/vtdh[ -]*full/.test(priceText(pkg));
    const variant = p.variant === "weekly" ? "weekly" : ahp ? "ahp" : vtdh ? "vtdh" : family === "IELTS" ? "ielts" : family === "PREMIUM" ? "premium" : p.variant;
    if (variant === "premium") {
      const size = /\bgroup\s*:?\s*0?([125])(?:\s*[-–]\s*0?([48]))?\s*(?:persons?|people|hv)/.exec(s);
      if (size && p.months === 4.5) p.key = size[1] + (size[2] ? "-" + size[2] : "") + "|4.5M";
    }
    const year = years.length === 1 ? Number(years[0]) : null, layer = ahp ? 2 : single(layers), weekly = weeklyHours(hours);
    const conflicts = [];
    if (years.length > 1) conflicts.push("nhi\u1EC1u n\u0103m gi\xE1");
    if (new Set(layers).size > 1 && !ahp) conflicts.push("nhi\u1EC1u layer");
    if (new Set(families).size > 1 && !ahp && !families.every((f) => ["ATLS", "AGLS"].includes(f))) conflicts.push("nhi\u1EC1u ch\u01B0\u01A1ng tr\xECnh");
    const courseHours = weeklyHours(course), namedMonths = /(\d+)\s*(?:thang|months?)\s*dong\s*(?:1|mot)\s*lan/.exec(s), paymentMode = /dong\s*(?:1|mot)\s*lan/.test(s) ? "once" : vtdh ? "staged" : null;
    if (namedMonths && !String(pkg ?? "").trim() && variant === "standard") {
      p.months = Number(namedMonths[1]);
      p.key = p.months;
    }
    if (courseHours && weekly && courseHours !== weekly) conflicts.push("gi\u1EDD trong Course Fee kh\xE1c Hour/week");
    if (namedMonths && p.months && Number(namedMonths[1]) !== p.months) conflicts.push("s\u1ED1 th\xE1ng trong Course Fee kh\xE1c Package");
    return {
      group: ahp ? "AHP" : family,
      family: ahp ? "ATLS" : family,
      year,
      layer,
      hours: weekly,
      months: p.months,
      weeks: p.weeks ?? null,
      unit: p.unit ?? "months",
      courseMonths: namedMonths ? Number(namedMonths[1]) : null,
      paymentMode,
      packageKey: p.key,
      variant,
      conflicts,
      courseKey: [ahp ? "AHP" : family ?? "?", year ?? "?", `layer${layer ?? "?"}`, variant === "weekly" ? "goituan" : namedMonths ? namedMonths[1] + "thang" : variant, paymentMode === "once" ? "dong1lan" : ""].filter(Boolean).join("|"),
      key: [ahp ? "AHP" : family ?? "?", year ?? "?", layer ?? "?", weekly ?? "?", variant, p.key ?? "?"].join("|")
    };
  }

  // src/core/hub-policy.mjs
  var HUB_POLICY_SCHEMA = "apollo-hub-policy/v1";
  var HUB_POLICY_ERRORS = ["context", "price", "groups", "timeout", "permission", "unsupported", "format"];
  var num = (x) => typeof x === "number" && Number.isFinite(x);
  var id = (x) => Number.isSafeInteger(Number(x)) && Number(x) > 0 && Number(x) < 1e15 ? Number(x) : null;
  var text = (x) => typeof x === "string" ? x.trim().replace(/\s+/g, " ") : "";
  var name = (x) => text(x).length <= 2e3 ? text(x) : "";
  var plain = (x) => !!x && typeof x === "object" && !Array.isArray(x);
  var keys = (o, allowed) => plain(o) && Object.keys(o).every((k) => allowed.includes(k));
  var day = (x) => {
    if (typeof x !== "string" || x.length > 50 || !/^\d{4}-\d{2}-\d{2}(?:$|T| )/.test(x)) return null;
    const d = x.slice(0, 10), n = /* @__PURE__ */ new Date(d + "T00:00:00Z");
    return Number.isFinite(+n) && n.toISOString().slice(0, 10) === d ? d : null;
  };
  var list = (x, max = 500) => {
    if (typeof x === "string" && x.length <= 1e6) {
      try {
        x = JSON.parse(x);
      } catch {
        return null;
      }
    }
    return Array.isArray(x) && x.length <= max ? x : null;
  };
  function validateHubPolicy(v) {
    if (!keys(v, ["schema", "ct", "contractId", "centerCode", "createdDate", "capturedAt", "context", "firstGroupId", "voucher", "product", "groups"]) || v.schema !== HUB_POLICY_SCHEMA || !/^\w+-CT-\d{4,20}$/.test(v.ct) || id(v.contractId) !== v.contractId || !name(v.centerCode) || v.centerCode.length > 200 || day(v.createdDate) !== v.createdDate || typeof v.capturedAt !== "string" || !Number.isFinite(Date.parse(v.capturedAt)) || v.firstGroupId !== null && !id(v.firstGroupId)) return false;
    if (v.voucher !== null && (!keys(v.voucher, ["code", "type", "amount", "rate", "maximum", "typeId"]) || !name(v.voucher.code) || v.voucher.code.length > 150 || !["amount", "percent"].includes(v.voucher.type) || !num(v.voucher.maximum) || v.voucher.maximum < 0 || v.voucher.maximum > 1e13 || v.voucher.typeId !== null && id(v.voucher.typeId) !== v.voucher.typeId || v.voucher.type === "amount" && (!num(v.voucher.amount) || v.voucher.amount <= 0 || v.voucher.amount > 1e13 || v.voucher.rate !== null) || v.voucher.type === "percent" && (!num(v.voucher.rate) || v.voucher.rate <= 0 || v.voucher.rate > 1 || v.voucher.amount !== null))) return false;
    const c = v.context, p = v.product;
    if (!keys(c, ["centerId", "groupPeopleId", "productTypeId", "contractTypeId", "bundleId", "giftCodeTypeId", "installment", "upgrade"]) || ["centerId", "groupPeopleId", "productTypeId", "contractTypeId"].some((k) => id(c[k]) !== c[k]) || ["bundleId", "giftCodeTypeId"].some((k) => c[k] !== null && id(c[k]) !== c[k]) || typeof c.installment !== "boolean" || typeof c.upgrade !== "boolean") return false;
    if (!keys(p, ["groupId", "priceId", "typeId", "packageId", "hourWeekId", "priceName", "packageName", "hourWeekName", "units", "unitPrice", "monthHours", "weekHours"]) || ["groupId", "priceId", "packageId", "hourWeekId"].some((k) => id(p[k]) !== p[k]) || ![1, 2].includes(p.typeId) || ["priceName", "packageName", "hourWeekName"].some((k) => !name(p[k]) || p[k].length > 200) || !num(p.units) || p.units <= 0 || p.units > 520 || !num(p.unitPrice) || p.unitPrice <= 0 || p.unitPrice > 1e10 || ["monthHours", "weekHours"].some((k) => p[k] !== null && (!num(p[k]) || p[k] <= 0 || p[k] > 1e3))) return false;
    if (!list(v.groups, 100) || new Set(v.groups.map((g) => g?.id)).size !== v.groups.length || JSON.stringify(v).length > 3e5) return false;
    return v.groups.every((g) => keys(g, ["id", "name", "type", "priority", "sort", "max", "with", "discounts"]) && id(g.id) === g.id && !!name(g.name) && [1, 2, 3].includes(g.type) && num(g.priority) && Math.abs(g.priority) < 1e6 && num(g.sort) && Math.abs(g.sort) < 1e6 && num(g.max) && g.max >= 0 && g.max <= 100 && (g.with === null || !!list(g.with, 100) && g.with.every((n) => id(n) === n)) && !!list(g.discounts, 200) && new Set(g.discounts.map((d) => d?.id)).size === g.discounts.length && g.discounts.every((d) => keys(d, ["id", "name", "detail"]) && id(d.id) === d.id && !!name(d.name) && keys(d.detail, ["groupId", "rule", "installment", "percent", "amount", "months", "installmentPercent", "installmentAmount", "installmentMonths"]) && d.detail.groupId === p.groupId && (d.detail.rule === null || ["default", "last"].includes(d.detail.rule)) && (d.detail.installment === null || typeof d.detail.installment === "boolean") && ["percent", "amount", "months", "installmentPercent", "installmentAmount", "installmentMonths"].every((k) => d.detail[k] === null || num(d.detail[k]) && d.detail[k] >= 0 && d.detail[k] <= (k.toLowerCase().includes("percent") ? 100 : k.toLowerCase().includes("months") ? 120 : 1e13))));
  }

  // src/core/hub-course.mjs
  var HUB = "https://hub24.apollo.vn:7777";
  var text2 = (v) => String(v ?? "").trim().replace(/\s+/g, " ");
  var label = (v) => text2(v).replace(/[\s:*]+$/, "").replace(/\s*\/\s*/g, "/").toLowerCase();
  var courseLabel = (v) => COURSE_LABELS[label(v)] ?? null;
  var COURSE_FIELDS = ["courseFee", "hoursPerWeek", "package", "giftcode", "discount", "groupKoc", "contractType"];
  var COURSE_LABELS = {
    "price name": "courseFee",
    "course fee koc": "courseFee",
    "hour/week": "hoursPerWeek",
    "hours/week": "hoursPerWeek",
    "hours per week": "hoursPerWeek",
    "package": "package",
    "package before discount": "package",
    "package (before discount)": "package",
    "student id": "student",
    "student code": "student",
    "giftcode no": "giftcode",
    "giftcode no.": "giftcode",
    "giftcode": "giftcode",
    "gift code": "giftcode",
    "discount apply": "discount",
    "promotion apply": "discount",
    "discount": "discount",
    "group koc": "groupKoc",
    "contract type": "contractType",
    "contract no": "contract",
    "contract no.": "contract",
    "contract code": "contract",
    "contract number": "contract"
  };
  function coursePageFromDocument(root, { staticDocument = false } = {}) {
    const visible = (e) => !!e && !e.hidden && e.getAttribute?.("aria-hidden") !== "true" && (!staticDocument ? !e.getClientRects || e.getClientRects().length > 0 : !e.closest?.('[hidden],[aria-hidden="true"],script,template'));
    const query = (e, s) => [...e?.querySelectorAll?.(s) ?? []];
    const controls = 'input:not([type="hidden"]):not([type="password"]),select,textarea';
    const valueOf = (element, key) => {
      if (!visible(element) || courseLabel(element.textContent)) return null;
      const inputs = ["INPUT", "SELECT", "TEXTAREA"].includes(element.tagName) ? [element] : query(element, controls).filter(visible);
      if (inputs.length) {
        if (inputs.length !== 1) return null;
        const input = inputs[0];
        if (["password", "hidden"].includes(String(input.type).toLowerCase()) || /token|session|pass|auth|secret|credential/i.test(input.name ?? "")) return null;
        return input.tagName === "SELECT" ? [...input.selectedOptions ?? []].map((e) => e.textContent).join(";") : input.value;
      }
      if (query(element, "label,dt,th,.control-label").some((e) => visible(e) && courseLabel(e.textContent))) return null;
      const value = element.innerText ?? element.textContent;
      return value;
    };
    const pairs = [];
    for (const node of query(root, 'label,dt,th,td,.control-label,.form-label,[class*="col-"]')) {
      const key = courseLabel(node.textContent);
      if (!key || !visible(node)) continue;
      const id2 = node.getAttribute?.("for"), control = node.control || (id2 ? root.getElementById?.(id2) : null);
      let value = control ? valueOf(control, key) : null;
      if (value == null) {
        let current = node;
        for (let level = 0; current && level < 4; level++, current = current.parentElement) {
          if (["BODY", "FORM", "TABLE", "FIELDSET"].includes(current.tagName)) break;
          const sibling = current.nextElementSibling;
          if (sibling) {
            value = valueOf(sibling, key);
            if (text2(value)) break;
          }
          const parent = current.parentElement;
          if (!parent || query(parent, "label,dt,th,.control-label,.form-label").filter((e) => visible(e) && courseLabel(e.textContent)).length > 1) break;
        }
      }
      if (key === "discount" && !normalizeHubDiscount(value, { wrappedOnly: label(node.textContent) === "discount" })) continue;
      if (text2(value)) pairs.push({ label: node.textContent, value: key === "discount" ? String(value).trim() : text2(value) });
    }
    return { titles: query(root, 'h1,h2,h3,h4,h5,h6,[role="heading"],.page-title,.content-header,.breadcrumb').filter(visible).map((e) => e.textContent), pairs };
  }
  function courseFailure(reason, fields = []) {
    const messages = { identity: "Kh\xF4ng x\xE1c minh \u0111\u01B0\u1EE3c duy nh\u1EA5t m\xE3 CT tr\xEAn ti\xEAu \u0111\u1EC1 ho\u1EB7c tr\u01B0\u1EDDng Contract code / Contract No.", student: "Student ID tr\xEAn Hub kh\xF4ng kh\u1EDBp h\u1ECDc vi\xEAn \u0111ang \u0111\u1ED1i chi\u1EBFu.", conflict: "C\xF3 nhi\u1EC1u gi\xE1 tr\u1ECB kh\xE1c nhau cho c\xF9ng tr\u01B0\u1EDDng Course info.", empty: "Ch\u01B0a t\xECm th\u1EA5y tr\u01B0\u1EDDng Course info c\xF3 nh\xE3n \u0111\u1ECDc \u0111\u01B0\u1EE3c tr\xEAn Hub.", format: "\u0110\u1ECBnh d\u1EA1ng d\u1EEF li\u1EC7u Course info ch\u01B0a h\u1EE3p l\u1EC7.", loading: "Hub v\u1EABn \u0111ang t\u1EA3i Course info khi h\u1EBFt th\u1EDDi gian ch\u1EDD.", navigation: "Hub \u0111\xE3 chuy\u1EC3n kh\u1ECFi URL chi ti\u1EBFt CT \u0111\u01B0\u1EE3c y\xEAu c\u1EA7u." };
    const key = Object.hasOwn(messages, reason) ? reason : "empty", known = fields.filter((f) => COURSE_FIELDS.includes(f));
    return { type: "error", code: "course_unavailable", message: messages[key] + (known.length ? " Tr\u01B0\u1EDDng: " + known.join(", ") + "." : "") + " Ch\u01B0a l\u01B0u d\u1EEF li\u1EC7u CT n\xE0y.", diagnostic: { stage: "course", reason: key, fields: known } };
  }
  function courseRequest(v) {
    if (!v || typeof v !== "object" || typeof v.ct !== "string" || typeof v.student !== "string" || typeof v.url !== "string") return null;
    const ct = v.ct.trim().toUpperCase(), student = v.student.trim();
    if (!/^[A-Z0-9]+-CT-\d{4,20}$/.test(ct) || !/^[A-Za-z0-9][A-Za-z0-9_.:/-]{0,149}$/.test(student) || Object.hasOwn(Object.prototype, student)) return null;
    try {
      const u = new URL(v.url);
      if (u.origin !== HUB || u.username || u.password || u.hash || u.search || !/^\/contract\/detail\/[1-9]\d{0,14}\/?$/i.test(u.pathname)) return null;
      return { ct, student, url: u.href };
    } catch {
      return null;
    }
  }
  function coursePayload(v, expected) {
    const request = courseRequest(expected);
    if (!request || !v || typeof v !== "object" || Object.keys(v).some((k) => !["ct", "student", "url", "hubPolicy", "hubPolicyError", ...COURSE_FIELDS].includes(k)) || v.ct !== request.ct || v.student !== request.student || v.url !== request.url) return null;
    const result = { ...request };
    for (const key of COURSE_FIELDS) {
      if (v[key] != null && (typeof v[key] !== "string" || !text2(v[key]) || text2(v[key]).length > (key === "discount" ? 2e3 : 200))) return null;
      result[key] = v[key] == null ? null : key === "discount" ? normalizeHubDiscount(v[key]) : text2(v[key]);
    }
    if (!COURSE_FIELDS.some((k) => result[k] !== null)) return null;
    if (result.giftcode && /^\d[\d.,\s]*\s*(?:vnd|vnđ|đ|₫|%)$/i.test(result.giftcode)) result.giftcode = null;
    if (result.hoursPerWeek) {
      const hours = weeklyHours(result.hoursPerWeek);
      if (!(hours > 0 && hours <= 168)) return null;
      result.hoursPerWeek = hours + " hrs/week";
    }
    if (result.hoursPerWeek && !(parseFloat(result.hoursPerWeek) > 0 && parseFloat(result.hoursPerWeek) <= 168)) return null;
    const identity = pricingIdentity(result.courseFee, result.hoursPerWeek, result.package);
    if (identity.unit === "weeks" && identity.weeks) result.package = identity.weeks + " weeks";
    if (!result.package && identity.paymentMode === "once" && identity.courseMonths && identity.variant === "standard") result.package = identity.courseMonths + " months";
    if (v.hubPolicy != null) {
      if (!validateHubPolicy(v.hubPolicy) || v.hubPolicy.ct !== request.ct || String(v.hubPolicy.contractId) !== request.url.replace(/\/$/, "").split("/").pop()) return null;
      result.hubPolicy = v.hubPolicy;
    }
    if (v.hubPolicyError != null) {
      if (!HUB_POLICY_ERRORS.includes(v.hubPolicyError)) return null;
      result.hubPolicyError = v.hubPolicyError;
    }
    return result;
  }
  function parseCoursePage(page, expected) {
    const request = courseRequest(expected);
    if (!request || page.url !== request.url) return { error: "identity" };
    const identity = [...page.titles ?? [], ...(page.pairs ?? []).filter((p) => courseLabel(p.label) === "contract").map((p) => p.value)];
    const codes = [...new Set(identity.flatMap((t) => text2(t).match(/[A-Z0-9]+-CT-\d{4,20}\b/gi) ?? []).map((v) => v.toUpperCase()))];
    if (codes.length !== 1 || codes[0] !== request.ct) return { error: "identity" };
    const pairs = page.pairs ?? [], hasBefore = pairs.some((p) => /before discount/i.test(p.label) && COURSE_LABELS[label(p.label)] === "package"), values = {};
    for (const pair of pairs) {
      const key = COURSE_LABELS[label(pair.label)];
      if (!key || key === "contract" || hasBefore && key === "package" && !/before discount/i.test(pair.label)) continue;
      let value = key === "discount" ? normalizeHubDiscount(pair.value, { wrappedOnly: label(pair.label) === "discount" }) : text2(pair.value);
      if (!value) continue;
      if (["giftcode", "discount"].includes(key) && /^(?:0|[-—]+|none|no (?:giftcode|discount)|n\/a)$/i.test(value)) value = "0";
      else if (/^[-—]+$/.test(value) || value === "0") continue;
      (values[key] ??= /* @__PURE__ */ new Set()).add(value);
    }
    const conflicts = Object.entries(values).filter(([k, s]) => k !== "discount" && s.size > 1).map(([k]) => k);
    if (conflicts.length) return { error: "conflict", fields: conflicts };
    if (values.student && [...values.student][0] !== request.student) return { error: "student" };
    const payload = coursePayload({ ...request, ...Object.fromEntries(COURSE_FIELDS.map((k) => [k, values[k] ? [...values[k]].join(k === "discount" ? ";" : "") : null])) }, request);
    return payload ? { payload } : { error: COURSE_FIELDS.some((k) => values[k]) ? "format" : "empty", fields: COURSE_FIELDS.filter((k) => values[k]) };
  }
  function missingContractInputs(row) {
    if (row?.kind !== "contract" || !String(row.ct || row.cells?.contractTotal || "").includes("-CT-")) return [];
    const c = row.cells ?? {}, missing = ["H", "I", "J"].filter((k) => !text2(c[k]));
    if (!text2(c.K) || text2(c.K) === "0" && (Number(c.V) > 0 || text2(row.context?.voucherDescription) && text2(row.context.voucherDescription) !== "0")) missing.push("K");
    if (!text2(c.L) || text2(c.L) === "0" && Number(c.U) > 0) missing.push("L");
    return missing;
  }
  function contractInputPlan(rows, { refresh = false, completed = [], needsVoucher = () => false, needsPolicy = () => false } = {}) {
    const unique = /* @__PURE__ */ new Map(), students = /* @__PURE__ */ new Map();
    for (const row of rows ?? []) {
      const ct = text2(row.ct || row.cells?.contractTotal), student = text2(row.cells?.F);
      if (row.kind !== "contract" || !/^[A-Z0-9]+-CT-\d{4,20}$/.test(ct) || !/^[A-Za-z0-9][A-Za-z0-9_.:/-]{0,149}$/.test(student) || Object.hasOwn(Object.prototype, student)) continue;
      (students.get(ct) ?? (students.set(ct, /* @__PURE__ */ new Set()), students.get(ct))).add(student);
      unique.set(ct + "|" + student, row);
    }
    const done = new Set(completed);
    return [...unique.values()].filter((r) => (refresh || missingContractInputs(r).length > 0 || needsVoucher(r) || needsPolicy(r)) && students.get(text2(r.ct || r.cells.contractTotal)).size === 1 && !done.has(text2(r.ct || r.cells.contractTotal) + "|" + text2(r.cells.F)));
  }
  async function fillContractInputs(rows, io) {
    const results = [];
    for (const row of rows) {
      if (io.signal?.aborted) break;
      const ct = text2(row.ct || row.cells.contractTotal), student = text2(row.cells.F);
      let stage = "input";
      try {
        io.progress?.("\u0110ang l\u1EA5y Input theo " + ct + "\u2026");
        let link = await io.loadLink(ct);
        if (!courseRequest({ ct, student, url: link?.url ?? "" })) {
          const found = await io.lookup(ct);
          if (io.signal?.aborted) break;
          if (found.ct !== ct || !courseRequest({ ct, student, url: found.url })) throw Error("Link Hub kh\xF4ng kh\u1EDBp CT nh\u1EADn.");
          link = await io.saveLink({ ct, url: found.url, version: link?.version ?? 0 });
        }
        if (io.signal?.aborted) break;
        const expected = { ct, student, url: link.url }, payload = coursePayload(await io.read(expected), expected);
        if (!payload) throw Error("Th\xF4ng tin tr\u1EA3 v\u1EC1 kh\xF4ng kh\u1EDBp CT / Student ID.");
        if (io.signal?.aborted) break;
        const saved = await io.save(row, payload);
        stage = "voucher";
        const completion = await io.afterSave?.(row, payload, saved);
        stage = "checkpoint";
        const checkpoint = await io.checkpoint?.(row, payload, saved);
        results.push({ ct, status: checkpoint?.complete === false ? "partial" : "saved", fields: [...COURSE_FIELDS.filter((k) => payload[k] !== null), ...payload.hubPolicy ? ["hubPolicy"] : []], missing: checkpoint?.missing ?? [], hubPolicyError: payload.hubPolicyError ?? null, ...completion ? { voucher: completion } : {} });
        io.saved?.(row, payload);
      } catch (e) {
        if (io.signal?.aborted) break;
        const skippedVoucher = stage === "voucher" && (["timeout", "hub_timeout"].includes(e.code) || /^voucher_/.test(e.code ?? ""));
        results.push({ ct, status: "check", message: String(e.message ?? e) + (skippedVoucher ? " B\u1ECF qua Voucher c\u1EE7a CT n\xE0y trong l\u01B0\u1EE3t hi\u1EC7n t\u1EA1i; ti\u1EBFp t\u1EE5c CT kh\xE1c. CT c\xF2n thi\u1EBFu s\u1EBD \u0111\u01B0\u1EE3c th\u1EED l\u1EA1i khi l\u1EA5y ti\u1EBFp." : ""), ...skippedVoucher ? { voucher: { state: "unavailable" } } : {} });
        if (!skippedVoucher && !["index_unresolved", "not_found", "course_invalid", "course_empty", "course_unavailable"].includes(e.code)) break;
      }
      io.update?.([...results]);
    }
    return results;
  }
  return __toCommonJS(hub_course_exports);
})();
