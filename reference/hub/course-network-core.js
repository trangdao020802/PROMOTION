var PromotionHubCourseNetwork = (() => {
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

  // src/core/hub-course-network.mjs
  var hub_course_network_exports = {};
  __export(hub_course_network_exports, {
    COURSE_NETWORK_CHANNEL: () => COURSE_NETWORK_CHANNEL,
    courseDetailEndpoint: () => courseDetailEndpoint,
    parseContractDetailProjection: () => parseContractDetailProjection,
    projectContractDetail: () => projectContractDetail
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
        const name = clean(rest.slice(open + 1, close - 1));
        if (!name) return null;
        names.push(name);
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

  // src/core/hub-course.mjs
  var HUB = "https://hub24.apollo.vn:7777";
  var text = (v) => String(v ?? "").trim().replace(/\s+/g, " ");
  var COURSE_FIELDS = ["courseFee", "hoursPerWeek", "package", "giftcode", "discount", "groupKoc", "contractType"];
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
    if (!request || !v || typeof v !== "object" || Object.keys(v).some((k) => !["ct", "student", "url", ...COURSE_FIELDS].includes(k)) || v.ct !== request.ct || v.student !== request.student || v.url !== request.url) return null;
    const result = { ...request };
    for (const key of COURSE_FIELDS) {
      if (v[key] != null && (typeof v[key] !== "string" || !text(v[key]) || text(v[key]).length > (key === "discount" ? 2e3 : 200))) return null;
      result[key] = v[key] == null ? null : key === "discount" ? normalizeHubDiscount(v[key]) : text(v[key]);
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
    return result;
  }

  // src/core/hub-course-network.mjs
  var COURSE_NETWORK_CHANNEL = "promotion-hub/course-network/v1";
  var HUB2 = "https://hub24.apollo.vn:7777";
  var text2 = (v) => typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "";
  var numberId = (v) => /^[1-9]\d{0,14}$/.test(String(v ?? "")) ? String(v) : null;
  function courseDetailEndpoint(value, detailURL, method = "GET") {
    try {
      const detail = new URL(detailURL), match = /^\/contract\/detail\/([1-9]\d{0,14})\/?$/i.exec(detail.pathname), u = new URL(value, HUB2);
      if (detail.origin !== HUB2 || detail.search || detail.hash || !match || String(method).toUpperCase() !== "GET" || u.origin !== HUB2 || u.username || u.password || u.hash || !/\/GetContractDetail\/?$/i.test(u.pathname) || u.searchParams.getAll("contractId").length !== 1 || u.searchParams.get("contractId") !== match[1]) return null;
      if ([...u.searchParams.keys()].some((k) => /token|session|password|secret|credential|authorization|api.?key/i.test(k))) return null;
      u.search = "";
      u.searchParams.set("contractId", match[1]);
      return u.href;
    } catch {
      return null;
    }
  }
  var pick = (obj, names) => {
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return void 0;
    for (const name of names) {
      const key = Object.keys(obj).find((k) => k.toLowerCase() === name.toLowerCase());
      if (key !== void 0 && obj[key] != null && obj[key] !== "") return obj[key];
    }
    return void 0;
  };
  var scalar = (obj, names, max = 200) => {
    const value = pick(obj, names);
    return typeof value === "string" && text2(value).length <= max ? text2(value) || null : null;
  };
  function offer(obj, names, arrays, itemNames) {
    const direct = scalar(obj, names, 2e3);
    if (direct) return /^(?:0|none|n\/a|[-—]+)$/i.test(direct) ? "0" : direct;
    const list = pick(obj, arrays);
    if (!Array.isArray(list) || list.length > 100) return null;
    if (!list.length) return "0";
    const values = list.map((v) => typeof v === "string" ? text2(v) : scalar(v, itemNames, 2e3));
    if (values.some((v) => !v)) return null;
    const result = [...new Set(values)].join(";");
    return result.length <= 2e3 ? result : null;
  }
  function fields(obj) {
    const namedDiscount = normalizeHubDiscount(offer(obj, ["DiscountApply", "DiscountApplyName", "PromotionApply", "PromotionApplyName"], ["ListDiscountApply", "ListDiscount", "ListPromotion"], ["DiscountName", "PromotionName", "Name"]));
    const displayedDiscount = normalizeHubDiscount(scalar(obj, ["Discount"], 2e3), { wrappedOnly: true });
    let hours = pick(obj, ["HourWeekName", "HowweekName", "HowWeekName", "HoursPerWeek", "HourPerWeek", "HourWeek", "HoursWeek"]);
    if (typeof hours === "number" && hours > 0 && hours <= 168) hours = hours + " hrs/week";
    if (typeof hours === "string") {
      hours = text2(hours).replace(/^(\d+(?:[.,]\d+)?)\s*(?:giờ\s*\/\s*tuần|hours?\s*per\s*week)$/i, (_, n) => n.replace(",", ".") + " hrs/week");
      if (/^\d+(?:\.\d+)?$/.test(hours)) hours += " hrs/week";
    }
    if (typeof hours !== "string" || !/^\d+(?:\.\d+)?\s*(?:hrs?|hours?)\s*\/\s*week$/i.test(hours) || !(parseFloat(hours) > 0 && parseFloat(hours) <= 168)) hours = null;
    return {
      courseFee: scalar(obj, ["PriceName", "CourseFeeKOC"]),
      hoursPerWeek: hours,
      package: scalar(obj, ["PackageBeforeDiscountName", "PackageBeforeDiscount", "ProductPackageName", "PackageName", "ProductPackage"]),
      giftcode: offer(obj, ["GiftcodeNo", "GiftCodeNumber", "Giftcode"], ["ListGiftCode", "ListGiftcodes"], ["GiftcodeNo", "GiftCodeNumber", "Code"]),
      discount: namedDiscount && namedDiscount !== "0" ? namedDiscount : displayedDiscount ?? namedDiscount,
      groupKoc: scalar(obj, ["GroupKOC", "ProductGroupName"]),
      contractType: scalar(obj, ["ContractTypeName"])
    };
  }
  function projectContractDetail(value, sourceURL, detailURL) {
    const source = courseDetailEndpoint(sourceURL, detailURL);
    if (!source) return null;
    let objects = [value];
    for (let depth = 0; depth < 4; depth++) {
      const matches = objects.filter((v) => v && typeof v === "object" && !Array.isArray(v) && Array.isArray(v.ListCourseInfo));
      if (matches.length) {
        if (matches.length !== 1) return null;
        const root = matches[0], list = root.ListCourseInfo;
        if (list.length > 20) return null;
        const id = pick(root, ["ContractId", "Id"]), ct = scalar(root, ["ContractNo", "ContractCode", "ContractNumber"]), student = scalar(root, ["StudentCode", "StudentNo", "StudentNumber"]);
        if (id != null && !numberId(id)) return null;
        return { source, contractId: id == null ? null : numberId(id), ct: ct?.toUpperCase() ?? null, student, fields: fields(root), courses: list.map((row) => fields(row)) };
      }
      objects = objects.flatMap((v) => v && typeof v === "object" && !Array.isArray(v) ? ["Data", "data", "Result", "result", "Model", "model", "Contract"].filter((k) => Object.hasOwn(v, k)).map((k) => v[k]) : []);
      if (!objects.length) return null;
    }
    return null;
  }
  function parseContractDetailProjection(projection, expected, domPayload = null) {
    const request = courseRequest(expected);
    if (!request || !projection || !courseDetailEndpoint(projection.source, request.url)) return { error: "identity" };
    const detailId = /\/([1-9]\d*)\/?$/.exec(request.url)[1];
    if (projection.contractId != null && projection.contractId !== detailId || projection.ct && projection.ct !== request.ct) return { error: "identity" };
    if (projection.student && projection.student !== request.student) return { error: "student" };
    if (!projection.ct && !coursePayload(domPayload, request)) return { error: "identity" };
    if (!Array.isArray(projection.courses) || projection.courses.length !== 1) return { error: projection.courses?.length ? "conflict" : "empty", fields: ["courseFee", "hoursPerWeek", "package"] };
    const root = projection.fields ?? {}, course = projection.courses[0] ?? {}, values = {};
    for (const key of COURSE_FIELDS) values[key] = course[key] ?? root[key] ?? domPayload?.[key] ?? null;
    const payload = coursePayload({ ...request, ...values }, request);
    return payload ? { payload, via: domPayload ? "network+dom" : "network" } : { error: "format" };
  }
  return __toCommonJS(hub_course_network_exports);
})();
