var PromotionHubCourseNetwork = (() => {
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

  // src/core/hub-course-network.mjs
  var hub_course_network_exports = {};
  __export(hub_course_network_exports, {
    COURSE_NETWORK_CHANNEL: () => COURSE_NETWORK_CHANNEL,
    contractRoot: () => contractRoot,
    courseDetailEndpoint: () => courseDetailEndpoint,
    eInvoiceKey: () => eInvoiceKey,
    eInvoicePDFURL: () => eInvoicePDFURL,
    hubDisplayedTablesFromDocument: () => hubDisplayedTablesFromDocument,
    invoiceReadsComplete: () => invoiceReadsComplete,
    mergeDisplayedHubContract: () => mergeDisplayedHubContract,
    mergeHubContractDate: () => mergeHubContractDate,
    mergeHubFinanceFacts: () => mergeHubFinanceFacts,
    mergeLearnerFinance: () => mergeLearnerFinance,
    mergePaymentInvoice: () => mergePaymentInvoice,
    mergeUpgradeLinks: () => mergeUpgradeLinks,
    parseContractDetailProjection: () => parseContractDetailProjection,
    parseInvoiceText: () => parseInvoiceText,
    paymentInvoiceNumber: () => paymentInvoiceNumber,
    projectContractDetail: () => projectContractDetail,
    projectContractPayments: () => projectContractPayments,
    projectHubContract: () => projectHubContract,
    projectHubDisplayedTables: () => projectHubDisplayedTables,
    projectLearnerPaymentPage: () => projectLearnerPaymentPage,
    projectPaymentInvoice: () => projectPaymentInvoice,
    readDirectInvoices: () => readDirectInvoices,
    readHubPolicy: () => readHubPolicy,
    readUpgradeFinance: () => readUpgradeFinance,
    upgradeEdges: () => upgradeEdges,
    upgradeLinksFromDocument: () => upgradeLinksFromDocument,
    validateInvoice: () => validateInvoice
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
      const total = /^(\d+(?:[.,]\d+)?)\s*(?:(?:months?|thang)\s*)?(?:split\b|\(?chia\s*doi\b)/.exec(s)?.[1]?.replace(",", ".");
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
  var fold = (x) => priceText(x).replace(/[^a-z0-9]+/g, " ").trim();
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
  var single2 = (rows, fn) => {
    const found = rows?.filter(fn) ?? [];
    return found.length === 1 ? found[0] : null;
  };
  var fail = (code2) => {
    throw Object.assign(Error(code2), { policyCode: code2 });
  };
  function hubPolicyRequest(detail, info = null) {
    if (!plain(detail) || !id(detail.ContractId) || !name(detail.ContractNo)) return null;
    const courses = list(detail.ListCourseInfo, 20), course = courses?.length === 1 ? courses[0] : null;
    if (!course) return null;
    if (info && (!plain(info) || id(info.ContractId) !== id(detail.ContractId) || info.ContractNo && info.ContractNo !== detail.ContractNo || info.KidId && detail.KidId && info.KidId !== detail.KidId || info.CenterId && info.CenterId !== detail.CenterId)) return null;
    const products = list(info?.listProduct ?? info?.ListProduct, 20), product = single2(products, (p2) => id(p2.PriceId) === id(course.PriceId) && id(p2.ProductPackageId) === id(course.ProductPackageId) && id(p2.HourWeekId) === id(course.HourWeekId));
    if (products && !product) return null;
    const root = info ?? detail, p = product ?? course;
    const groupIds = [...new Set((list(detail.ListDiscount, 100) ?? []).map((d) => id(d.ProductGroupId)).filter(Boolean))];
    const groupId = id(p.ProductGroupId ?? root.ProductGroupId) ?? (groupIds.length === 1 ? groupIds[0] : null);
    const context = { centerId: id(root.CenterId), groupPeopleId: id(root.GroupPeopleId), productTypeId: id(root.ProductTypeId), contractTypeId: id(root.ContractTypeId), bundleId: root.BundleId == null ? null : id(root.BundleId), giftCodeTypeId: id(p.GiftCodeTypeId ?? root.GiftCodeTypeId), installment: root.IsInstallment, upgrade: !!(detail.IsUpgrade || detail.UpgradeFromContractId > 0 || detail.ParentContractId > 0) };
    const productInfo = { groupId, priceId: id(course.PriceId), typeId: id(course.PriceTypeId), packageId: id(course.ProductPackageId), hourWeekId: id(course.HourWeekId), priceName: name(course.PriceName), packageName: name(course.ProductPackageName), hourWeekName: name(course.HourWeekName ?? course.HowWeekName) };
    const createdDate = day(root.CreatedDate), centerCode = name(detail.CenterCode ?? root.CenterCode);
    if (!createdDate || !centerCode || Object.entries(context).some(([k, v]) => !["bundleId", "giftCodeTypeId", "installment", "upgrade"].includes(k) && !v) || typeof context.installment !== "boolean" || Object.values(productInfo).some((v) => v == null || v === "") || ![1, 2].includes(productInfo.typeId)) return null;
    const selected = list(p.discounts, 100) ?? list(detail.ListDiscount, 100) ?? [];
    return { ct: detail.ContractNo, contractId: id(detail.ContractId), centerCode, createdDate, dateValue: root.CreatedDate, context, product: productInfo, firstGroupId: id(selected[0]?.GroupDiscountId) };
  }
  function discountDetail(d, groupId) {
    const rate = (x) => num(x) && x >= 0 && x <= 100 ? x : null, money2 = (x) => num(x) && x >= 0 && x <= 1e13 ? x : null, months = (x) => num(x) && x >= 0 && x <= 120 ? x : null;
    return {
      groupId: id(d.ProductGroupId) ?? groupId,
      rule: ["default", "last"].includes(d.ApplyRule) ? d.ApplyRule : null,
      installment: typeof d.IsInstallment === "boolean" ? d.IsInstallment : null,
      percent: rate(d.PercentDiscount),
      amount: money2(d.AmountDiscount),
      months: months(d.GiftMonths),
      installmentPercent: rate(d.InstallmentPercentDiscount),
      installmentAmount: money2(d.InstallmentAmountDiscount),
      installmentMonths: months(d.InstallmentGiftMonths)
    };
  }
  function projectHubPolicy(request, prices, groups, capturedAt = (/* @__PURE__ */ new Date()).toISOString(), voucher = null) {
    if (!request) return null;
    const { product: p } = request, price = single2(list(prices), (r) => id(r.PriceId) === p.priceId && id(r.ProductGroupId) === p.groupId);
    const type = single2(list(price?.ListPriceType, 20), (r) => id(r.PriceTypeId) === p.typeId), pkg = single2(list(type?.ListPackage, 500), (r) => id(r.ProductPackageId) === p.packageId), hour = single2(list(pkg?.ListHourWeek, 100), (r) => id(r.HourWeekId) === p.hourWeekId);
    if (!price || !type || !pkg || !hour) return null;
    const sourceKey = pricingIdentity(p.priceName, p.hourWeekName, p.packageName), catalogKey = pricingIdentity(price.PriceName, hour.HourWeekName, pkg.ProductPackageName);
    if (sourceKey.conflicts.length || catalogKey.conflicts.length || sourceKey.key !== catalogKey.key || (!sourceKey.group || !sourceKey.year) && fold(price.PriceName) !== fold(p.priceName) || weeklyHours(hour.HourWeekName) !== weeklyHours(p.hourWeekName)) return null;
    const units = p.typeId === 1 ? pkg.CourseMonth : pkg.CourseWeek, unitPrice = hour.Price;
    if (!num(units) || units <= 0 || units > 520 || !num(unitPrice) || unitPrice <= 0 || unitPrice > 1e10) return null;
    const sourceGroups = list(groups, 100);
    if (!sourceGroups) return null;
    const normalized = [];
    for (const group of sourceGroups) {
      const discounts = list(group.ListDiscount, 200);
      if (!discounts || !id(group.GroupDiscountId) || !name(group.GroupDiscountName) || ![1, 2, 3].includes(group.GroupDiscountTypeId)) return null;
      const items = [];
      for (const d of discounts) {
        const details = list(d.ListDetail, 100);
        if (!id(d.DiscountId) || !name(d.DiscountName) || !details) return null;
        const detail = single2(details, (r) => id(r.ProductGroupId) === p.groupId);
        if (detail) items.push({ id: id(d.DiscountId), name: name(d.DiscountName), detail: discountDetail(detail, p.groupId) });
      }
      normalized.push({ id: id(group.GroupDiscountId), name: name(group.GroupDiscountName), type: group.GroupDiscountTypeId, priority: group.Priority, sort: group.SortOrder, max: group.MaxDiscount, with: group.ApplyGroupDiscountIds == null ? null : list(group.ApplyGroupDiscountIds, 100)?.map(id), discounts: items });
    }
    const result = {
      schema: HUB_POLICY_SCHEMA,
      ct: request.ct,
      contractId: request.contractId,
      centerCode: request.centerCode,
      createdDate: request.createdDate,
      capturedAt,
      context: { ...request.context, ...voucher?.typeId ? { giftCodeTypeId: voucher.typeId } : {} },
      firstGroupId: request.firstGroupId,
      voucher,
      product: { ...p, units, unitPrice, monthHours: num(hour.HourMonthDuration) && hour.HourMonthDuration > 0 ? hour.HourMonthDuration : null, weekHours: num(hour.HourWeekDuration) && hour.HourWeekDuration > 0 ? hour.HourWeekDuration : null },
      groups: normalized
    };
    return validateHubPolicy(result) ? result : null;
  }
  function validateHubPolicy(v) {
    if (!keys(v, ["schema", "ct", "contractId", "centerCode", "createdDate", "capturedAt", "context", "firstGroupId", "voucher", "product", "groups"]) || v.schema !== HUB_POLICY_SCHEMA || !/^\w+-CT-\d{4,20}$/.test(v.ct) || id(v.contractId) !== v.contractId || !name(v.centerCode) || v.centerCode.length > 200 || day(v.createdDate) !== v.createdDate || typeof v.capturedAt !== "string" || !Number.isFinite(Date.parse(v.capturedAt)) || v.firstGroupId !== null && !id(v.firstGroupId)) return false;
    if (v.voucher !== null && (!keys(v.voucher, ["code", "type", "amount", "rate", "maximum", "typeId"]) || !name(v.voucher.code) || v.voucher.code.length > 150 || !["amount", "percent"].includes(v.voucher.type) || !num(v.voucher.maximum) || v.voucher.maximum < 0 || v.voucher.maximum > 1e13 || v.voucher.typeId !== null && id(v.voucher.typeId) !== v.voucher.typeId || v.voucher.type === "amount" && (!num(v.voucher.amount) || v.voucher.amount <= 0 || v.voucher.amount > 1e13 || v.voucher.rate !== null) || v.voucher.type === "percent" && (!num(v.voucher.rate) || v.voucher.rate <= 0 || v.voucher.rate > 1 || v.voucher.amount !== null))) return false;
    const c = v.context, p = v.product;
    if (!keys(c, ["centerId", "groupPeopleId", "productTypeId", "contractTypeId", "bundleId", "giftCodeTypeId", "installment", "upgrade"]) || ["centerId", "groupPeopleId", "productTypeId", "contractTypeId"].some((k) => id(c[k]) !== c[k]) || ["bundleId", "giftCodeTypeId"].some((k) => c[k] !== null && id(c[k]) !== c[k]) || typeof c.installment !== "boolean" || typeof c.upgrade !== "boolean") return false;
    if (!keys(p, ["groupId", "priceId", "typeId", "packageId", "hourWeekId", "priceName", "packageName", "hourWeekName", "units", "unitPrice", "monthHours", "weekHours"]) || ["groupId", "priceId", "packageId", "hourWeekId"].some((k) => id(p[k]) !== p[k]) || ![1, 2].includes(p.typeId) || ["priceName", "packageName", "hourWeekName"].some((k) => !name(p[k]) || p[k].length > 200) || !num(p.units) || p.units <= 0 || p.units > 520 || !num(p.unitPrice) || p.unitPrice <= 0 || p.unitPrice > 1e10 || ["monthHours", "weekHours"].some((k) => p[k] !== null && (!num(p[k]) || p[k] <= 0 || p[k] > 1e3))) return false;
    if (!list(v.groups, 100) || new Set(v.groups.map((g) => g?.id)).size !== v.groups.length || JSON.stringify(v).length > 3e5) return false;
    return v.groups.every((g) => keys(g, ["id", "name", "type", "priority", "sort", "max", "with", "discounts"]) && id(g.id) === g.id && !!name(g.name) && [1, 2, 3].includes(g.type) && num(g.priority) && Math.abs(g.priority) < 1e6 && num(g.sort) && Math.abs(g.sort) < 1e6 && num(g.max) && g.max >= 0 && g.max <= 100 && (g.with === null || !!list(g.with, 100) && g.with.every((n) => id(n) === n)) && !!list(g.discounts, 200) && new Set(g.discounts.map((d) => d?.id)).size === g.discounts.length && g.discounts.every((d) => keys(d, ["id", "name", "detail"]) && id(d.id) === d.id && !!name(d.name) && keys(d.detail, ["groupId", "rule", "installment", "percent", "amount", "months", "installmentPercent", "installmentAmount", "installmentMonths"]) && d.detail.groupId === p.groupId && (d.detail.rule === null || ["default", "last"].includes(d.detail.rule)) && (d.detail.installment === null || typeof d.detail.installment === "boolean") && ["percent", "amount", "months", "installmentPercent", "installmentAmount", "installmentMonths"].every((k) => d.detail[k] === null || num(d.detail[k]) && d.detail[k] >= 0 && d.detail[k] <= (k.toLowerCase().includes("percent") ? 100 : k.toLowerCase().includes("months") ? 120 : 1e13))));
  }
  async function readHubPolicy(detail, client, { signal, budgetMs = 5e3, now = () => Date.now(), schedule = setTimeout, unschedule = clearTimeout } = {}) {
    const deadline = now() + Math.min(1e4, Math.max(100, budgetMs));
    const call = async (fn, args) => {
      if (signal?.aborted) fail("timeout");
      if (typeof fn !== "function") fail("unsupported");
      let timer, pending, onAbort;
      try {
        return await new Promise((resolve, reject) => {
          const rejectTimeout = () => {
            try {
              pending?.abort?.();
            } catch {
            }
            reject(Object.assign(Error("timeout"), { policyCode: "timeout" }));
          };
          timer = schedule(rejectTimeout, Math.max(0, deadline - now()));
          onAbort = rejectTimeout;
          signal?.addEventListener("abort", onAbort, { once: true });
          try {
            pending = fn(args);
            Promise.resolve(pending).then(resolve, reject);
          } catch (e) {
            reject(e);
          }
        });
      } finally {
        unschedule(timer);
        signal?.removeEventListener("abort", onAbort);
      }
    };
    try {
      let request = hubPolicyRequest(detail);
      if (!request) {
        const info = await call(client.info, { contractId: detail.ContractId });
        request = hubPolicyRequest(detail, info);
      }
      if (!request) fail("context");
      if (request.context.upgrade || request.context.productTypeId !== 1) fail("unsupported");
      const { context: c, product: p } = request, prices = { centerId: c.centerId, productGroupIds: String(p.groupId), groupPeopleId: c.groupPeopleId }, groups = { productTypeId: c.productTypeId, productGroupId: p.groupId, bundleId: c.bundleId, contractTypeId: c.contractTypeId, centerId: c.centerId, listProductGroup: JSON.stringify([{ productGroupId: p.groupId, hourWeekId: p.hourWeekId, packageId: p.packageId, priceTypeId: p.typeId }]), date: request.dateValue };
      const code2 = [detail.GiftCode, ...(list(detail.ListCourseInfo, 20) ?? []).map((c2) => c2.GiftCode)].map(text).filter((s) => s && s !== "0"), codes = [...new Set(code2.map((c2) => c2.toUpperCase()))];
      const checkVoucher = codes.length === 1 && id(detail.KidId) && typeof client.voucher === "function" ? call(client.voucher, { code: codes[0], centerId: c.centerId, kidId: id(detail.KidId) }) : Promise.resolve(null);
      const results = await Promise.allSettled([call(client.prices, prices), call(client.groups, groups), checkVoucher]);
      if (signal?.aborted) fail("timeout");
      if (results[0].status !== "fulfilled") fail(results[0].reason?.policyCode ?? "price");
      if (results[1].status !== "fulfilled") fail(results[1].reason?.policyCode ?? "groups");
      let voucher = null;
      const checked = results[2].status === "fulfilled" ? results[2].value : null;
      if (checked && codes.length === 1 && text(checked.GiftCode).toUpperCase() === codes[0] && typeof checked.GiftCodeIsFixed === "boolean" && num(checked.GiftCodeDiscountAmount) && num(checked.GiftCodeDiscountAmountMax)) voucher = { code: codes[0], type: checked.GiftCodeIsFixed ? "amount" : "percent", amount: checked.GiftCodeIsFixed ? checked.GiftCodeDiscountAmount : null, rate: checked.GiftCodeIsFixed ? null : checked.GiftCodeDiscountAmount / 100, maximum: checked.GiftCodeDiscountAmountMax, typeId: id(checked.GiftCodeTypeId) };
      const policy = projectHubPolicy(request, results[0].value, results[1].value, (/* @__PURE__ */ new Date()).toISOString(), voucher);
      if (!policy) fail("format");
      return { policy, policyError: null };
    } catch (e) {
      return { policy: null, policyError: HUB_POLICY_ERRORS.includes(e.policyCode) ? e.policyCode : "permission" };
    }
  }

  // src/core/hub-document.mjs
  var HUB = "https://hub24.apollo.vn:7777";
  var hubDocumentCode = (value) => {
    const code2 = String(value ?? "").trim().toUpperCase();
    return /^[A-Z0-9]+-(?:CT|DEP)-\d{4,20}$/.test(code2) ? code2 : null;
  };
  function hubDocumentId(value, code2) {
    try {
      const u = new URL(value), kind = hubDocumentCode(code2)?.includes("-DEP-") ? "deposit" : "contract";
      if (!hubDocumentCode(code2) || u.origin !== HUB || u.username || u.password || u.hash) return null;
      const match = new RegExp("^/" + kind + "/(?:" + (kind === "deposit" ? "detail|view" : "detail") + ")/([1-9]\\d{0,14})/?$", "i").exec(u.pathname);
      if (match && !u.search) return match[1];
      if (kind === "deposit" && /^\/deposit\/(?:detail|view)\/?$/i.test(u.pathname) && u.searchParams.size === 1) {
        const id5 = u.searchParams.get("id") ?? u.searchParams.get("depositId");
        if (/^[1-9]\d{0,14}$/.test(id5 ?? "")) return id5;
      }
      return null;
    } catch {
      return null;
    }
  }

  // src/core/hub-upgrade.mjs
  var HUB2 = "https://hub24.apollo.vn:7777";
  var text2 = (v) => typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "";
  var id2 = (v) => /^[1-9]\d{0,14}$/.test(String(v ?? "")) ? String(v) : null;
  var ct = (v) => hubDocumentCode(v)?.includes("-CT-") ? hubDocumentCode(v) : null;
  var upgradeDate = (v) => {
    const s = text2(v), m = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(s), day2 = m ? m[3] + "-" + m[2] + "-" + m[1] : /^\d{4}-\d\d-\d\d(?:$|T| )/.test(s) ? s.slice(0, 10) : null;
    return day2 && Number.isFinite(Date.parse(day2)) && (/* @__PURE__ */ new Date(day2 + "T00:00:00Z")).toISOString().slice(0, 10) === day2 ? day2 : null;
  };
  var upgradeDirection = (value) => ({ "upgrade from contract": "from", "upgraded from contract": "from", "upgrade to contract": "to", "upgraded to contract": "to" })[text2(value).toLowerCase().replace(/[\s:*]+$/, "")] ?? null;
  var urlFor = (value) => HUB2 + "/contract/detail/" + value;
  var linkId = (value) => {
    try {
      return hubDocumentId(new URL(value, HUB2).href, "QA-CT-000001");
    } catch {
      return null;
    }
  };
  function validUpgradeLinks(values) {
    return Array.isArray(values) && values.length <= 20 && values.every((v) => v && Object.keys(v).every((k) => ["direction", "ct", "id", "url", "date"].includes(k)) && ["from", "to"].includes(v.direction) && (v.ct === null || ct(v.ct) === v.ct) && id2(v.id) === v.id && v.url === urlFor(v.id) && (v.date === null || upgradeDate(v.date) === v.date));
  }
  function projectUpgradeLinks(root) {
    const rows = [];
    for (const [direction, prefixes] of [["from", ["UpgradeFromContract", "UpgradedFromContract"]], ["to", ["UpgradeToContract", "UpgradedToContract"]]]) {
      for (const prefix of prefixes) {
        const nested = root?.[prefix], object = nested && typeof nested === "object" ? nested : {};
        const value = id2(root?.[prefix + "Id"] ?? object.ContractId ?? object.Id);
        if (!value) continue;
        const code2 = ct(root?.[prefix + "No"] ?? root?.[prefix + "Code"] ?? object.ContractNo ?? object.ContractCode ?? nested);
        const date2 = upgradeDate(root.UpgradeDate ?? root.UpgradedDate ?? (direction === "from" ? root.CreatedDate ?? root.CreatedTime : null));
        rows.push({ direction, ct: code2, id: value, url: urlFor(value), date: date2 });
      }
    }
    return [...new Map(rows.map((r) => [r.direction + "|" + r.id, r])).values()];
  }
  function upgradeLinksFromDocument(root, { staticDocument = false } = {}) {
    const visible = (e) => !!e && !e.hidden && e.getAttribute?.("aria-hidden") !== "true" && !e.closest?.('[hidden],[aria-hidden="true"],.ng-hide,script,template') && (staticDocument || !e.getClientRects || e.getClientRects().length > 0);
    const query = (e, s) => [...e?.querySelectorAll?.(s) ?? []], rows = [];
    for (const label of query(root, 'label,dt,th,td,.control-label,.form-label,[class*="col-"]')) {
      const direction = upgradeDirection(label.textContent);
      if (!direction || !visible(label)) continue;
      let cursor = label;
      for (let depth = 0; cursor && depth < 4; depth++, cursor = cursor.parentElement) {
        const sibling = cursor.nextElementSibling;
        if (!sibling || !visible(sibling)) continue;
        const links = query(sibling, "a[href]");
        if (sibling.tagName === "A") links.push(sibling);
        const choices = links.filter(visible).map((a) => {
          const code2 = ct(a.innerText ?? a.textContent), value = linkId(a.getAttribute?.("href") ?? a.href);
          return code2 && value ? { direction, ct: code2, id: value, url: urlFor(value), date: null } : null;
        }).filter(Boolean);
        if (choices.length) {
          rows.push(...choices);
          break;
        }
        if (query(sibling, "label,dt,th,.control-label").length) break;
      }
    }
    return [...new Map(rows.map((r) => [r.direction + "|" + r.id, r])).values()].slice(0, 20);
  }
  function mergeUpgradeLinks(facts, links) {
    if (!facts || !validUpgradeLinks(links)) return facts;
    const rows = [...facts.upgrades ?? [], ...links], byKey = /* @__PURE__ */ new Map();
    for (const row of rows) {
      if (row.id === facts.contractId || row.ct === facts.ct) continue;
      const key = row.direction + "|" + row.id, prior = byKey.get(key);
      byKey.set(key, prior ? { ...prior, ct: prior.ct ?? row.ct, date: prior.date ?? row.date } : row);
    }
    return { ...facts, upgrades: [...byKey.values()] };
  }
  function upgradeEdges(facts) {
    const docs = (facts ?? []).filter(Boolean), byId = new Map(docs.map((f) => [f.contractId, f])), edges = [];
    for (const f of docs) for (const link of f.upgrades ?? []) {
      if (!validUpgradeLinks([link])) continue;
      const other = byId.get(link.id), otherCode = link.ct ?? other?.ct;
      if (!ct(otherCode) || other && other.ct !== otherCode || otherCode === f.ct) continue;
      const from = link.direction === "from" ? otherCode : f.ct, to = link.direction === "from" ? f.ct : otherCode;
      const fromId = link.direction === "from" ? link.id : f.contractId, toId = link.direction === "from" ? f.contractId : link.id;
      const date2 = link.date ?? (link.direction === "from" ? f.contractDate : other?.contractDate) ?? null;
      edges.push({ from, to, fromId, toId, date: date2, url: link.url });
    }
    return [...new Map(edges.map((e) => [JSON.stringify([e.from, e.to, e.date]), e])).values()];
  }
  function upgradeAncestors(facts) {
    const docs = [facts, ...facts?.relatedFinance ?? []], edges = upgradeEdges(docs), known = /* @__PURE__ */ new Set([facts?.ct]);
    for (let depth = 0; depth < 16; depth++) {
      const n = known.size;
      for (const e of edges) if (known.has(e.to)) known.add(e.from);
      if (known.size === n) break;
    }
    return known;
  }

  // src/core/hub-invoice.mjs
  var clean2 = (v) => typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "";
  var invoiceNumber = (v) => {
    const s = typeof v === "number" && Number.isSafeInteger(v) ? String(v) : clean2(v);
    return /^\d{1,20}$/.test(s) && /[1-9]/.test(s) ? s : null;
  };
  var eInvoiceKey = (v) => {
    const s = clean2(v);
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s) ? s : null;
  };
  var invoiceReference = (v) => invoiceNumber(v) ?? eInvoiceKey(v);
  var eInvoicePDFURL = (value) => {
    const key = eInvoiceKey(value);
    return key ? "https://hub24.apollo.vn:7777/Downloads/EInvoice/" + key + ".pdf" : null;
  };
  function invoiceKeyFromURL(value) {
    try {
      const u = new URL(value, "https://hub24.apollo.vn:7777");
      if (u.origin !== "https://hub24.apollo.vn:7777" || u.username || u.password || u.search || u.hash) return null;
      const m = /^\/Downloads\/EInvoice\/([^/]+)\.pdf$/i.exec(u.pathname);
      return eInvoiceKey(m?.[1]);
    } catch {
      return null;
    }
  }
  function invoiceDay(v) {
    const s = clean2(v);
    let day2 = /^(\d{4}-\d{2}-\d{2})(?:$|T| )/.exec(s)?.[1];
    const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
    if (!day2 && m) day2 = m[3] + "-" + m[2].padStart(2, "0") + "-" + m[1].padStart(2, "0");
    return day2 && Number.isFinite(Date.parse(day2)) && (/* @__PURE__ */ new Date(day2 + "T00:00:00Z")).toISOString().slice(0, 10) === day2 ? day2 : null;
  }
  var money = (v) => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1e13 ? v : null;
  function validateInvoice(v) {
    return !!v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).every((k) => ["number", "date", "amount", "source", "conflicts"].includes(k)) && invoiceNumber(v.number) === v.number && (v.date === null || invoiceDay(v.date) === v.date) && (v.amount === null || money(v.amount) === v.amount) && ["payment-api", "learner-payments", "e-invoice-pdf"].includes(v.source) && Array.isArray(v.conflicts) && v.conflicts.length <= 4 && v.conflicts.every((k) => ["number", "date", "amount", "key"].includes(k));
  }
  function projectPaymentInvoice(raw, source = "payment-api") {
    const key = eInvoiceKey(raw?.EInvoiceFKey ?? raw?.EInvoiceGuid ?? raw?.EInvoiceId ?? raw?.EInvoice);
    let number2 = invoiceNumber(raw?.InvoiceNo ?? raw?.InvoiceNumber);
    if (!number2 && key && typeof raw.EInvoiceCode === "string") {
      const suffix = raw.EInvoiceCode.split(key + "_");
      if (suffix.length === 2) number2 = invoiceNumber(suffix[1]);
    }
    const ref = number2 ?? key ?? invoiceReference(raw?.EInvoiceId ?? raw?.EInvoice);
    return {
      ...ref ? { invoiceRef: ref } : {},
      ...key ? { eInvoiceKey: key } : {},
      ...[1, 2].includes(raw?.EInvoiceVersion) ? { eInvoiceVersion: raw.EInvoiceVersion } : {},
      ...number2 ? { invoice: { number: number2, date: invoiceDay(raw.InvoiceDate ?? raw.EInvoiceDate ?? raw.IssueDate), amount: money(raw.InvoiceAmount ?? raw.InvoiceTotal), source, conflicts: [] } } : {}
    };
  }
  function mergePaymentInvoice(row, extra) {
    const a = row.invoice, b = extra?.invoice;
    let invoice = a ?? b;
    const conflicts = [...a?.conflicts ?? [], ...b?.conflicts ?? []];
    if (a && b) {
      if (a.number.replace(/^0+/, "") !== b.number.replace(/^0+/, "")) conflicts.push("number");
      if (a.date && b.date && a.date !== b.date) conflicts.push("date");
      if (a.amount !== null && b.amount !== null && Math.abs(a.amount - b.amount) > 1) conflicts.push("amount");
      invoice = { ...a, number: b.source === "e-invoice-pdf" ? b.number : a.number, date: a.date ?? b.date, amount: a.amount ?? b.amount, source: b.source === "e-invoice-pdf" ? b.source : a.source };
    }
    if (row.eInvoiceKey && extra?.eInvoiceKey && row.eInvoiceKey !== extra.eInvoiceKey) conflicts.push("key");
    if (invoice) invoice = { ...invoice, conflicts: [...new Set(conflicts)] };
    return {
      ...row,
      ...!row.invoiceRef && extra?.invoiceRef ? { invoiceRef: extra.invoiceRef } : {},
      ...!row.eInvoiceKey && extra?.eInvoiceKey ? { eInvoiceKey: extra.eInvoiceKey } : {},
      ...!row.eInvoiceVersion && extra?.eInvoiceVersion ? { eInvoiceVersion: extra.eInvoiceVersion } : {},
      ...invoice ? { invoice } : {}
    };
  }
  var paymentInvoiceNumber = (p) => validateInvoice(p?.invoice) ? p.invoice.number : invoiceNumber(p?.invoiceRef);
  var invoiceReadsComplete = (f) => f?.payments?.state === "read" && f.payments.rows.every((p) => p.complete !== true || p.amount <= 0 || /transfer|moving/i.test(p.method + " " + p.type) || !!paymentInvoiceNumber(p));
  var folded = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[Đđ]/g, "d").toLowerCase();
  function printedMoney(value) {
    const s = clean2(value).replace(/\s/g, "");
    if (!/^\d+(?:[.,]\d{3})*(?:[.,]\d{1,2})?$/.test(s)) return null;
    let x = s;
    const decimal = /^(.*)[.,](\d{1,2})$/.exec(x);
    if (decimal) x = decimal[1].replace(/[.,]/g, "") + "." + decimal[2];
    else x = x.replace(/[.,]/g, "");
    return money(Number(x));
  }
  function parseInvoiceText(value) {
    if (typeof value !== "string" || value.length > 15e4) return null;
    const text7 = folded(value).replace(/\s+/g, " ");
    if (!/hoa don gia tri gia tang|vat\s*invoice/.test(text7)) return null;
    const nos = [...text7.matchAll(/(?:so\s*\(\s*invoice\s*no\.?\s*\)|invoice\s*(?:no\.?|number)|so\s*hoa\s*don)\s*[:：]?\s*(\d{1,20})\b/g)].map((m) => m[1]);
    if (!nos.length || new Set(nos.map((n) => n.replace(/^0+/, ""))).size !== 1) return null;
    const number2 = nos.reduce((a, b) => a.length >= b.length ? a : b), dates = [];
    for (const m of text7.matchAll(/(?:ngay\s*\(\s*date\s*\)|invoice\s*date|ngay\s*(?:lap\s*)?hoa\s*don)\s*[:：]?\s*(\d{1,2}\/\d{1,2}\/\d{4})/g)) {
      const d = invoiceDay(m[1]);
      if (d) dates.push(d);
    }
    const parts = /(?:ngay\s*(?:\(date\))?\s*[:：]?\s*)(\d{1,2})\s*(?:thang|month)(?:\s*\(month\))?\s*(\d{1,2})\s*(?:nam|year)(?:\s*\(year\))?\s*(\d{4})/.exec(text7);
    if (parts) {
      const d = invoiceDay(parts[1] + "/" + parts[2] + "/" + parts[3]);
      if (d) dates.push(d);
    }
    const amounts = [...text7.matchAll(/(?:tong\s*cong\s*tien\s*thanh\s*toan\s*(?:\(grand\s*total\))?|grand\s*total)\s*(?:\(\s*\d\s*\))?\s*[:：]?\s*([\d][\d.,]*(?:\s*[.,]\s*\d{3})*)/g)].map((m) => printedMoney(m[1])).filter((v) => v !== null);
    const uniqueDate = [...new Set(dates)], uniqueAmount = [...new Set(amounts)];
    const result = { number: number2, date: uniqueDate.length === 1 ? uniqueDate[0] : null, amount: uniqueAmount.length === 1 ? uniqueAmount[0] : null, source: "e-invoice-pdf", conflicts: [...uniqueDate.length > 1 ? ["date"] : [], ...uniqueAmount.length > 1 ? ["amount"] : []] };
    return validateInvoice(result) ? result : null;
  }

  // src/core/hub-contract.mjs
  var HUB_CONTRACT_SCHEMA = "apollo-hub-contract/v1";
  var plain2 = (v) => !!v && typeof v === "object" && !Array.isArray(v);
  var text3 = (v) => typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "";
  var id3 = (v) => /^[1-9]\d{0,14}$/.test(String(v ?? "")) ? String(v) : null;
  var number = (v) => typeof v === "number" && Number.isFinite(v) && Math.abs(v) <= 1e13 ? v : null;
  var date = (v) => typeof v === "string" && v.length <= 50 && /^\d{4}-\d\d-\d\d(?:$|T| )/.test(v) && Number.isFinite(Date.parse(v)) ? v.slice(0, 10) : null;
  var exact = (v, names) => plain2(v) && Object.keys(v).every((k) => names.includes(k));
  function hubList(v, max = 500) {
    if (typeof v === "string" && v.length <= 1e6) {
      try {
        v = JSON.parse(v);
      } catch {
        return null;
      }
    }
    return Array.isArray(v) && v.length <= max ? v : null;
  }
  function contractRoot(value) {
    let level = [value];
    const seen = /* @__PURE__ */ new Set();
    for (let depth = 0; depth < 6 && level.length <= 40; depth++) {
      const matches = level.filter((v) => plain2(v) && !seen.has(v) && (hubList(v.ListCourseInfo, 20) || hubList(v.CourseInfos, 20) || id3(v.ContractId ?? v.DepositId ?? v.Id) && text3(v.ContractNo ?? v.ContractCode ?? v.DepositNo ?? v.DepositCode) && ["ListPayment", "ListMovingOut", "ListMovingIn"].some((k) => v[k] != null)));
      if (matches.length) return matches.length === 1 ? matches[0] : null;
      const next = [];
      for (const v of level) {
        if (!plain2(v) || seen.has(v)) continue;
        seen.add(v);
        for (const key of ["Data", "data", "Result", "result", "Model", "model", "Contract", "contractInfo", "item", "$vm", "vm"]) if (plain2(v[key])) next.push(v[key]);
      }
      level = next;
    }
    return null;
  }
  function contractDiscountFacts(root) {
    const values = ["ListDiscount", "Discounts"].map((k) => hubList(root?.[k], 100)).filter(Boolean);
    if (!values.length) return null;
    const rows = values.find((v) => v.length) ?? values[0], result = [];
    for (const r of rows) {
      if (!plain2(r)) return null;
      const group = text3(r.GroupDiscountName), name2 = normalizeHubDiscount(text3(r.DiscountName ?? r.Name)) ?? text3(r.DiscountName ?? r.Name);
      const full = normalizeHubDiscount(group && name2 && !name2.toLowerCase().startsWith(group.toLowerCase()) ? group + " - " + name2 : name2);
      if (!full || full === "0" || full.length > 2e3) return null;
      const type = [1, 2, 3].includes(r.GroupDiscountTypeId) ? r.GroupDiscountTypeId : null;
      result.push({ label: full, groupId: id3(r.GroupDiscountId), discountId: id3(r.DiscountId ?? r.ContractDiscountId), type, percent: number(r.PercentDiscount), amount: number(r.AmountDiscount), months: number(r.GiftMonths) });
    }
    return result;
  }
  var invoiceEvidence = invoiceReference;
  var outgoingPayment = (r) => Number(r?.PaymentTypeId) === 8 || /moving[ -]?out|transfer[ -]?out/i.test(text3(r?.PaymentTypeName));
  function projectContractPayments(value, contractId) {
    let list2 = hubList(value, 500);
    if (!list2 && plain2(value)) {
      if ((value.ContractId ?? value.DepositId) != null && id3(value.ContractId ?? value.DepositId) !== String(contractId)) return null;
      for (const key of ["ListPayment", "Data", "data", "Result", "result"]) {
        list2 = hubList(value[key], 500);
        if (list2) break;
      }
    }
    if (!list2) return null;
    const rows = [];
    for (const r of list2) {
      if (plain2(r) && outgoingPayment(r)) continue;
      if (!plain2(r) || (r.ContractId ?? r.DepositId) != null && id3(r.ContractId ?? r.DepositId) !== String(contractId) || !id3(r.PaymentId) || number(r.Amount) === null) return null;
      const code2 = text3(r.PaymentCode);
      if (code2.length > 150 || code2 && !/^[A-Za-z0-9][A-Za-z0-9_.:/-]*$/.test(code2)) return null;
      rows.push({ id: id3(r.PaymentId), code: code2, amount: number(r.Amount), totalAmount: number(r.TotalAmount), remaining: number(r.RemainAmount), typeId: id3(r.PaymentTypeId), type: text3(r.PaymentTypeName).slice(0, 200), method: text3(r.PaymentMethodTypeName ?? r.PaymentMethodName).slice(0, 200), scheduledDate: date(r.ScheduledDate), completeDate: date(r.CompleteDate), complete: typeof r.IsComplete === "boolean" ? r.IsComplete : null, ...projectPaymentInvoice(r) });
    }
    return new Set(rows.map((r) => r.id)).size === rows.length ? rows : null;
  }
  var contractCode = hubDocumentCode;
  var moveDay = (v) => {
    const iso = date(v);
    if (iso) return iso;
    const match = /^(\d{2})\/(\d{2})\/(\d{4})(?:\s|$)/.exec(text3(v));
    if (!match) return null;
    const candidate = match[3] + "-" + match[2] + "-" + match[1];
    return Number.isFinite(Date.parse(candidate)) && (/* @__PURE__ */ new Date(candidate + "T00:00:00Z")).toISOString().slice(0, 10) === candidate ? candidate : null;
  };
  function projectHubMovements(root) {
    if (!plain2(root)) return null;
    const ct2 = contractCode(root.ContractNo ?? root.ContractCode ?? root.DepositNo ?? root.DepositCode);
    if (!ct2) return null;
    const lists = [["out", ["ListMovingOut", "ListTransferOut", "MovingOut"]], ["in", ["ListMovingIn", "ListTransferIn", "MovingIn"]]];
    const rows = [];
    let hasList = false;
    for (const [direction, names] of lists) {
      const existing = names.find((name2) => root[name2] != null);
      if (!existing) continue;
      const list2 = hubList(root[existing], 200);
      if (!list2) return null;
      hasList = true;
      for (const item of list2) {
        if (!plain2(item)) return null;
        const from = contractCode(item.FromContractNo ?? item.FromContractCode ?? item.FromDepositNo ?? item.MovingInFrom ?? (direction === "out" ? ct2 : null));
        const to = contractCode(item.ToContractNo ?? item.ToContractCode ?? item.ToDepositNo ?? item.TransferTo ?? (direction === "in" ? ct2 : null));
        const amount2 = number(item.TransferAmount ?? item.MovingAmount ?? item.Amount);
        if (!from || !to || from === to || amount2 === null || amount2 <= 0) return null;
        if (direction === "out" && from !== ct2 || direction === "in" && to !== ct2) return null;
        const day2 = moveDay(item.TransferDate ?? item.MovingDate ?? item.MovingInDate ?? item.MovingOutDate ?? item.Date);
        const reference = text3(item.PaymentCode ?? item.TransferCode ?? "");
        if (!day2 || reference.length > 150 || reference && !/^[A-Za-z0-9][A-Za-z0-9_.:/-]*$/.test(reference)) return null;
        rows.push({ from, to, amount: amount2, date: day2, reference, direction });
      }
    }
    const explicitMoves = [...rows];
    for (const p of hubList(root.ListPayment, 500) ?? []) {
      const other = contractCode(p?.RelatedContractDepositNo), amount2 = number(p?.Amount), day2 = moveDay(p?.TransferDate ?? p?.CompleteDate), reference = text3(p?.PaymentCode), direction = outgoingPayment(p) ? "out" : "in";
      if (!other || other === ct2 || p.IsComplete !== true || !(amount2 > 0) || !day2 || /refund/i.test(text3(p.PaymentTypeName))) continue;
      if (direction === "in" && p.PaymentTypeId !== 10 && !/transfer|deposit to contract/i.test(text3(p.PaymentMethodTypeName) + " " + text3(p.PaymentTypeName))) continue;
      if (reference && !/^[A-Za-z0-9][A-Za-z0-9_.:/-]*$/.test(reference)) continue;
      const from = direction === "out" ? ct2 : other, to = direction === "out" ? other : ct2;
      if (!explicitMoves.some((m) => m.from === from && m.to === to && m.date === day2) && !rows.some((m) => m.direction === direction && m.reference === reference && m.from === from && m.to === to && m.amount === amount2 && m.date === day2)) rows.push({ from, to, amount: amount2, date: day2, reference, direction });
      hasList = true;
    }
    return hasList ? rows : null;
  }
  function projectHubLearner(root) {
    const leadId = id3(root?.LeadId), kidId = id3(root?.KidId);
    return leadId && kidId ? { leadId, kidId, url: "https://hub24.apollo.vn:7777/lead/detail/" + leadId + "?s=" + kidId } : null;
  }
  function mergeHubContractDate(facts, info) {
    if (!validateHubContract(facts) || facts.contractDate || !plain2(info) || id3(info.ContractId) !== facts.contractId || info.ContractNo != null && text3(info.ContractNo).toUpperCase() !== facts.ct) return facts;
    const contractDate = upgradeDate(info.CreatedDate);
    return contractDate ? { ...facts, contractDate } : facts;
  }
  function projectHubContract(root, { payments = null, paymentState = "pending", capturedAt = (/* @__PURE__ */ new Date()).toISOString() } = {}) {
    const result = { schema: HUB_CONTRACT_SCHEMA, ct: text3(root?.ContractNo ?? root?.ContractCode ?? root?.DepositNo ?? root?.DepositCode).toUpperCase(), contractId: id3(root?.ContractId ?? root?.DepositId ?? root?.Id), capturedAt, discounts: contractDiscountFacts(root), payments: { state: paymentState === "pending" && (projectContractPayments(root, id3(root?.ContractId ?? root?.DepositId ?? root?.Id))?.length ?? 0) > 0 ? "read" : paymentState, rows: payments ?? ((projectContractPayments(root, id3(root?.ContractId ?? root?.DepositId ?? root?.Id))?.length ?? 0) > 0 ? projectContractPayments(root, id3(root?.ContractId ?? root?.DepositId ?? root?.Id)) : []) }, ...projectHubMovements(root) !== null ? { movements: { state: "read", rows: projectHubMovements(root) } } : { movements: { state: "pending", rows: [] } } };
    result.financeRevision = 3;
    result.contractDate = upgradeDate(root?.CreatedDate ?? root?.CreatedTime);
    result.upgrades = projectUpgradeLinks(root);
    const learner = projectHubLearner(root);
    if (learner) result.learner = learner;
    result.payments = withoutOutgoingPayments(result.payments, result.movements);
    return validateHubContract(result) ? result : null;
  }
  function validateHubContract(v, depth = 0) {
    if (!exact(v, ["schema", "ct", "contractId", "capturedAt", "discounts", "payments", "movements", "learner", "relatedFinance", "financeRevision", "upgrades", "contractDate"]) || v.schema !== HUB_CONTRACT_SCHEMA || hubDocumentCode(v.ct) !== v.ct || id3(v.contractId) !== v.contractId || typeof v.capturedAt !== "string" || !Number.isFinite(Date.parse(v.capturedAt)) || v.financeRevision !== void 0 && ![2, 3].includes(v.financeRevision)) return false;
    if (v.upgrades !== void 0 && (!validUpgradeLinks(v.upgrades) || v.upgrades.some((r) => r.id === v.contractId || r.ct === v.ct))) return false;
    if (v.contractDate !== void 0 && v.contractDate !== null && upgradeDate(v.contractDate) !== v.contractDate) return false;
    if (v.learner !== void 0) {
      const l = v.learner;
      if (!exact(l, ["leadId", "kidId", "url"]) || id3(l.leadId) !== l.leadId || id3(l.kidId) !== l.kidId || l.url !== "https://hub24.apollo.vn:7777/lead/detail/" + l.leadId + "?s=" + l.kidId) return false;
    }
    if (v.relatedFinance !== void 0) {
      if (depth > 0 || !hubList(v.relatedFinance, 32) || new Set(v.relatedFinance.map((f) => f?.ct)).size !== v.relatedFinance.length || !v.relatedFinance.every((f) => f.ct !== v.ct && f.discounts === null && f.relatedFinance === void 0 && validateHubContract(f, depth + 1))) return false;
      const ancestors = upgradeAncestors(v);
      if (v.relatedFinance.some((f) => !(v.learner && f.learner?.kidId === v.learner.kidId) && !ancestors.has(f.ct))) return false;
    }
    if (v.discounts !== null && (!hubList(v.discounts, 100) || !v.discounts.every((d) => exact(d, ["label", "groupId", "discountId", "type", "percent", "amount", "months"]) && !!text3(d.label) && d.label.length <= 2e3 && ["groupId", "discountId"].every((k) => d[k] === null || id3(d[k]) === d[k]) && (d.type === null || [1, 2, 3].includes(d.type)) && ["percent", "amount", "months"].every((k) => d[k] === null || number(d[k]) === d[k] && d[k] >= 0 && d[k] <= (k === "percent" ? 100 : k === "months" ? 120 : 1e13))))) return false;
    if (v.movements !== void 0) {
      const m = v.movements;
      if (!exact(m, ["state", "rows"]) || !["read", "pending"].includes(m.state) || !hubList(m.rows, 400) || m.state === "pending" && m.rows.length) return false;
      if (!m.rows.every((x) => exact(x, ["from", "to", "amount", "date", "reference", "direction"]) && contractCode(x.from) === x.from && contractCode(x.to) === x.to && x.from !== x.to && number(x.amount) === x.amount && x.amount > 0 && moveDay(x.date) === x.date && typeof x.reference === "string" && x.reference.length <= 150 && (!x.reference || /^[A-Za-z0-9][A-Za-z0-9_.:/-]*$/.test(x.reference)) && ["out", "in"].includes(x.direction) && (x.direction === "out" && x.from === v.ct || x.direction === "in" && x.to === v.ct))) return false;
    }
    const p = v.payments;
    if (!exact(p, ["state", "rows"]) || !["read", "pending", "unavailable"].includes(p.state) || !hubList(p.rows, 500) || p.state !== "read" && p.rows.length || new Set(p.rows.map((r) => r.id ?? r.code)).size !== p.rows.length) return false;
    return p.rows.every((r) => exact(r, ["id", "code", "amount", "totalAmount", "remaining", "typeId", "type", "method", "scheduledDate", "completeDate", "complete", "invoiceRef", "eInvoiceKey", "eInvoiceVersion", "invoice"]) && (r.id === null && !!r.code || id3(r.id) === r.id) && typeof r.code === "string" && r.code.length <= 150 && (!r.code || /^[A-Za-z0-9][A-Za-z0-9_.:/-]*$/.test(r.code)) && number(r.amount) === r.amount && ["totalAmount", "remaining"].every((k) => r[k] === null || number(r[k]) === r[k]) && (r.typeId === null || id3(r.typeId) === r.typeId) && ["type", "method"].every((k) => typeof r[k] === "string" && r[k].length <= 200) && ["scheduledDate", "completeDate"].every((k) => r[k] === null || date(r[k]) === r[k]) && (r.complete === null || typeof r.complete === "boolean") && (r.invoiceRef === void 0 || invoiceEvidence(r.invoiceRef) === r.invoiceRef) && (r.eInvoiceKey === void 0 || eInvoiceKey(r.eInvoiceKey) === r.eInvoiceKey) && (r.eInvoiceVersion === void 0 || [1, 2].includes(r.eInvoiceVersion)) && (r.invoice === void 0 || validateInvoice(r.invoice))) && JSON.stringify(v).length <= 12e5;
  }
  var line = (v) => String(v ?? "").replace(/\s+/g, " ").trim();
  var vnd = (v) => {
    const x = line(v).replace(/\s*(?:VND|VNĐ|đ|₫)\s*$/i, "").replace(/\s/g, "");
    if (!/^-?\d{1,3}(?:\.\d{3})*(?:,\d+)?$|^-?\d+(?:,\d+)?$/.test(x)) return null;
    const n = Number(x.replace(/\./g, "").replace(",", "."));
    return Number.isFinite(n) && Math.abs(n) <= 1e13 ? n : null;
  };
  var ddmmyyyy = (v) => {
    const match = /(\d{2})\/(\d{2})\/(\d{4})/.exec(line(v));
    if (!match) return null;
    const result = match[3] + "-" + match[2] + "-" + match[1];
    return moveDay(result);
  };
  var indexed = (headers, names) => {
    for (const name2 of names) {
      const i = headers.findIndex((h) => line(h).toLowerCase() === name2);
      if (i >= 0) return i;
    }
    return -1;
  };
  function withoutOutgoingPayments(payments, movements) {
    if (payments?.state !== "read") return payments;
    const out = (movements?.rows ?? []).filter((m) => m.direction === "out" && m.reference);
    return { ...payments, rows: payments.rows.filter((p) => !out.some((m) => m.reference === p.code && m.date === p.completeDate && Math.abs(m.amount - p.amount) <= 1)) };
  }
  function projectHubDisplayedTables(tables, ct2) {
    const current = contractCode(ct2);
    if (!current || !Array.isArray(tables) || tables.length > 100) return null;
    let payments = null, movements = null;
    for (const table of tables) {
      if (!Array.isArray(table?.headers) || !Array.isArray(table.rows) || table.rows.length > 300) continue;
      const headers = table.headers.map((value) => line(value).toLowerCase().replace(/[?*]+$/, "").replace(/moving[ -]+(in|out)/g, "moving $1").trim()), rows = table.rows;
      const pcode = indexed(headers, ["payment code"]), paid = indexed(headers, ["paid amount"]), completed = indexed(headers, ["completed date"]);
      const pamount = indexed(headers, ["payment amount"]);
      if (pcode >= 0 && paid >= 0 && completed >= 0 && pamount >= 0) {
        const values = [];
        for (const [rowIndex, r] of rows.entries()) {
          if (!Array.isArray(r) || r.length < headers.length) continue;
          const code2 = line(r[pcode]), amount2 = vnd(r[paid]), total = vnd(r[pamount]), done = ddmmyyyy(r[completed]);
          const linked = Array.isArray(table.invoices) ? table.invoices.find((x) => x.row === rowIndex && eInvoiceKey(x.key)) : null;
          const invoiceRef = invoiceEvidence(r[indexed(headers, ["invoice no", "invoice number", "e-invoice", "e-invoice id"])]) ?? linked?.key;
          if (!/^[A-Z0-9]+-PAY-[A-Z0-9-]{3,30}$/i.test(code2) || amount2 === null || total === null || amount2 < 0 || total < 0 || amount2 > total) continue;
          values.push({ id: null, code: code2, amount: amount2, totalAmount: total, remaining: vnd(r[indexed(headers, ["remain amount"])]) ?? null, typeId: null, type: "Payment", method: line(r[indexed(headers, ["payment method"])]).slice(0, 200), scheduledDate: ddmmyyyy(r[indexed(headers, ["scheduled date"])]), completeDate: done, complete: !!done && amount2 > 0, ...invoiceRef ? { invoiceRef } : {}, ...eInvoiceKey(invoiceRef) ? { eInvoiceKey: invoiceRef } : {}, ...[1, 2].includes(linked?.version) ? { eInvoiceVersion: linked.version } : {} });
        }
        if (values.length && new Set(values.map((v) => v.code)).size === values.length) payments = values;
      }
      const out = indexed(headers, ["moving out amount"]), to = indexed(headers, ["transfer to", "moving out to"]), transferDate = indexed(headers, ["transfer date", "moving out date"]);
      const inAmount = indexed(headers, ["moving in amount"]), from = indexed(headers, ["moving in from", "transfer from"]), inDate = indexed(headers, ["moving in date", "transfer date"]);
      const direction = out >= 0 && to >= 0 && transferDate >= 0 ? "out" : inAmount >= 0 && from >= 0 && inDate >= 0 ? "in" : null;
      if (direction) {
        const list2 = [];
        for (const r of rows) {
          if (!Array.isArray(r) || r.length < headers.length) continue;
          const other = contractCode(r[direction === "out" ? to : from]), amt = vnd(r[direction === "out" ? out : inAmount]), day2 = ddmmyyyy(r[direction === "out" ? transferDate : inDate]);
          if (!other || other === current || amt === null || amt <= 0 || !day2) continue;
          const reference = line(r[indexed(headers, ["payment code", "transfer code"])]);
          if (reference && !/^[A-Za-z0-9][A-Za-z0-9_.:/-]*$/.test(reference)) continue;
          list2.push({ from: direction === "out" ? current : other, to: direction === "out" ? other : current, amount: amt, date: day2, reference, direction });
        }
        if (list2.length) movements = [...movements ?? [], ...list2];
      }
    }
    return { payments, movements };
  }
  function mergeDisplayedHubContract(facts, tables, ct2) {
    if (!validateHubContract(facts) || facts.ct !== ct2) return null;
    const extra = projectHubDisplayedTables(tables, ct2);
    if (!extra) return facts;
    const payments = facts.payments.state === "read" && facts.payments.rows.length ? {
      ...facts.payments,
      rows: facts.payments.rows.map((row) => {
        const match = extra.payments?.find((item) => item.code === row.code && Math.abs(item.amount - row.amount) <= 1);
        return match ? mergePaymentInvoice(row, match) : row;
      })
    } : extra.payments !== null ? { state: "read", rows: extra.payments } : facts.payments;
    const moves = [...facts.movements?.rows ?? [], ...extra.movements ?? []];
    const distinct = [...new Map(moves.map((m) => [JSON.stringify([m.from, m.to, m.amount, m.date, m.reference, m.direction]), m])).values()];
    const movements = facts.movements?.state === "read" || extra.movements !== null ? { state: "read", rows: distinct } : facts.movements ?? { state: "pending", rows: [] };
    const result = { ...facts, payments: withoutOutgoingPayments(payments, movements), movements };
    return validateHubContract(result) ? result : facts;
  }
  function mergeHubFinanceFacts(first, second) {
    if (!validateHubContract(first) || !validateHubContract(second) || first.ct !== second.ct || first.contractId !== second.contractId) return first;
    let payments = first.payments;
    if (payments.state !== "read" || !payments.rows.length) payments = second.payments.state === "read" ? second.payments : payments;
    else if (second.payments.state === "read") {
      const conflicts = second.payments.rows.some((p) => payments.rows.some((q) => p.code === q.code && Math.abs(p.amount - q.amount) > 1));
      payments = conflicts ? { state: "unavailable", rows: [] } : { ...payments, rows: payments.rows.map((p) => {
        const match = second.payments.rows.find((q) => q.code === p.code && Math.abs(q.amount - p.amount) <= 1);
        return match ? mergePaymentInvoice(p, match) : p;
      }) };
    }
    const values = [...first.movements?.rows ?? [], ...second.movements?.rows ?? []], rows = [...new Map(values.map((m) => [JSON.stringify(m), m])).values()];
    const movements = { state: first.movements?.state === "read" || second.movements?.state === "read" ? "read" : "pending", rows };
    let result = { ...first, payments: withoutOutgoingPayments(payments, movements), movements, contractDate: first.contractDate ?? second.contractDate ?? null };
    result = mergeUpgradeLinks(result, second.upgrades ?? []);
    if (second.relatedFinance?.length) result.relatedFinance = [...new Map([...first.relatedFinance ?? [], ...second.relatedFinance].map((f) => [f.ct, f])).values()];
    return validateHubContract(result) ? result : first;
  }
  function hubDisplayedTablesFromDocument(root, { staticDocument = false } = {}) {
    const result = [];
    const visible = (node) => !!node && !node.hidden && node.getAttribute?.("aria-hidden") !== "true" && !node.closest?.('[hidden],[aria-hidden="true"],.ng-hide') && (staticDocument || !node.getClientRects || node.getClientRects().length > 0);
    const value = (node) => line((staticDocument ? node.textContent : node.innerText ?? node.textContent) ?? "");
    const normalized = (v) => line(v).toLowerCase().replace(/moving[ -]+(in|out)/g, "moving $1").replace(/[?*]+$/, "").trim();
    for (const table of [...root.querySelectorAll("table")].slice(0, 100)) {
      if (!visible(table)) continue;
      let headers = null, rows = [], invoices = [];
      const flush = () => {
        if (headers) result.push({ headers, rows, ...invoices.length ? { invoices } : {} });
        headers = null;
        rows = [];
        invoices = [];
      };
      for (const tr of [...table.querySelectorAll("tr")].slice(0, 1e3)) {
        if (tr.closest("table") !== table || !visible(tr)) continue;
        const cells = [...tr.children].filter((n) => ["TH", "TD"].includes(n.tagName) && visible(n));
        const expanded = cells.flatMap((n) => Array.from({ length: Math.min(30, Math.max(1, Number(n.colSpan) || 1)) }, () => n)), values = expanded.map(value), folded2 = values.map(normalized);
        const hasHeader = cells.some((n) => n.tagName === "TH") || folded2.includes("payment code");
        if (hasHeader) {
          flush();
          if (folded2.includes("payment code") && folded2.some((v) => /amount/.test(v))) headers = values;
          continue;
        }
        if (cells.length === 1 && /^(?:payment|moving[ -]?(?:in|out))$/i.test(value(cells[0]))) {
          flush();
          continue;
        }
        if (!headers || values.length !== headers.length || rows.length >= 300) continue;
        const invoiceIndex = indexed(headers.map(normalized), ["e-invoice", "e-invoice id", "invoice no", "invoice number"]), cell = expanded[invoiceIndex];
        if (cell) {
          const keys2 = new Set((value(cell).match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi) ?? []).filter(eInvoiceKey));
          let version;
          for (const a of [...cell.querySelectorAll?.("a") ?? []]) if (visible(a)) {
            const key = invoiceKeyFromURL(a.getAttribute?.("href"));
            if (key) keys2.add(key);
            const click = a.getAttribute?.("ng-click") ?? a.getAttribute?.("data-ng-click") ?? "", literal = /printEInvoice\(\s*['"]([0-9a-f-]{36})['"]\s*,\s*([12])\s*\)/i.exec(click);
            if (literal && eInvoiceKey(literal[1])) {
              keys2.add(literal[1]);
              version = Number(literal[2]);
            }
          }
          if (keys2.size === 1) invoices.push({ row: rows.length, key: [...keys2][0], ...version ? { version } : {} });
        }
        rows.push(values);
      }
      flush();
    }
    return result;
  }

  // src/core/hub-course.mjs
  var HUB3 = "https://hub24.apollo.vn:7777";
  var text4 = (v) => String(v ?? "").trim().replace(/\s+/g, " ");
  var COURSE_FIELDS = ["courseFee", "hoursPerWeek", "package", "giftcode", "discount", "groupKoc", "contractType"];
  function courseRequest(v) {
    if (!v || typeof v !== "object" || typeof v.ct !== "string" || typeof v.student !== "string" || typeof v.url !== "string") return null;
    const ct2 = v.ct.trim().toUpperCase(), student = v.student.trim();
    if (!(v.readFinance === true ? hubDocumentCode(ct2) : /^[A-Z0-9]+-CT-\d{4,20}$/.test(ct2)) || !/^[A-Za-z0-9][A-Za-z0-9_.:/-]{0,149}$/.test(student) || Object.hasOwn(Object.prototype, student)) return null;
    try {
      const u = new URL(v.url);
      if (u.origin !== HUB3 || u.username || u.password || u.hash || !(v.readFinance === true ? hubDocumentId(u.href, ct2) : !u.search && /^\/contract\/detail\/[1-9]\d{0,14}\/?$/i.test(u.pathname)) || v.readPolicy !== void 0 && typeof v.readPolicy !== "boolean" || v.readFinance !== void 0 && typeof v.readFinance !== "boolean" || v.refreshFinance !== void 0 && typeof v.refreshFinance !== "boolean") return null;
      return { ct: ct2, student, url: u.href, ...v.readPolicy !== void 0 ? { readPolicy: v.readPolicy } : {}, ...v.readFinance !== void 0 ? { readFinance: v.readFinance } : {}, ...v.refreshFinance !== void 0 ? { refreshFinance: v.refreshFinance } : {} };
    } catch {
      return null;
    }
  }
  function coursePayload(v, expected) {
    const request = courseRequest(expected);
    if (!request || !v || typeof v !== "object" || Object.keys(v).some((k) => !["ct", "student", "url", "readPolicy", "readFinance", "refreshFinance", "courseState", "inheritedCourses", "hubContract", "hubPolicy", "hubPolicyError", ...COURSE_FIELDS].includes(k)) || v.ct !== request.ct || v.student !== request.student || v.url !== request.url) return null;
    const result = { ct: request.ct, student: request.student, url: request.url };
    if (request.readFinance === true) {
      if (!validateHubContract(v.hubContract) || v.hubContract.ct !== request.ct || v.hubContract.contractId !== hubDocumentId(request.url, request.ct)) return null;
      return { ...result, readFinance: true, courseState: "empty", ...Object.fromEntries(COURSE_FIELDS.map((k) => [k, null])), hubContract: { ...v.hubContract, discounts: null } };
    }
    for (const key of COURSE_FIELDS) {
      if (v[key] != null && (typeof v[key] !== "string" || !text4(v[key]) || text4(v[key]).length > (key === "discount" ? 2e3 : 200))) return null;
      result[key] = v[key] == null ? null : key === "discount" ? normalizeHubDiscount(v[key]) : text4(v[key]);
    }
    if (v.courseState !== void 0 && v.courseState !== "empty") return null;
    if (v.courseState === "empty") {
      if (!validateHubContract(v.hubContract) || v.hubContract.ct !== request.ct || v.hubContract.contractId !== request.url.replace(/\/$/, "").split("/").pop() || ["courseFee", "hoursPerWeek", "package"].some((k) => result[k] != null)) return null;
      result.courseState = "empty";
    }
    if (!COURSE_FIELDS.some((k) => result[k] !== null) && result.courseState !== "empty") return null;
    if (v.inheritedCourses !== void 0) {
      if (!Array.isArray(v.inheritedCourses) || v.inheritedCourses.length > 20 || new Set(v.inheritedCourses.map((s) => s?.ct)).size !== v.inheritedCourses.length) return null;
      const inherited = [];
      for (const source of v.inheritedCourses) {
        if (!source || source.inheritedCourses !== void 0 || source.ct === request.ct || source.student !== request.student) return null;
        const parsed = coursePayload(source, source);
        if (!parsed) return null;
        inherited.push(parsed);
      }
      result.inheritedCourses = inherited;
    }
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
    if (v.hubContract != null) {
      if (!validateHubContract(v.hubContract) || v.hubContract.ct !== request.ct || v.hubContract.contractId !== request.url.replace(/\/$/, "").split("/").pop()) return null;
      result.hubContract = v.hubContract;
    }
    return result;
  }

  // src/core/hub-direct-invoice.mjs
  async function readDirectInvoices(facts, { fetch: read, readPDF, signal, isCurrent = () => true, budgetMs = 5e3, timeoutMs = 3e3 } = {}) {
    if (!validateHubContract(facts) || typeof read !== "function" || typeof readPDF !== "function") return facts;
    const started = Date.now(), rows = facts.payments.rows.map((p) => ({ ...p }));
    let tried = 0;
    for (const row of rows) {
      const key = eInvoiceKey(row.eInvoiceKey ?? row.invoiceRef);
      if (!key || row.complete !== true || row.amount <= 0 || row.invoice?.date && row.invoice?.amount !== null) continue;
      if (signal?.aborted || !isCurrent() || tried >= 4 || Date.now() - started >= budgetMs) break;
      tried++;
      const ctrl = new AbortController(), stop = () => ctrl.abort(), timer = setTimeout(stop, Math.max(1, Math.min(timeoutMs, budgetMs - (Date.now() - started))));
      signal?.addEventListener("abort", stop, { once: true });
      try {
        const response = await read(eInvoicePDFURL(key), { method: "GET", credentials: "same-origin", cache: "no-store", redirect: "error", signal: ctrl.signal });
        if (!response.ok || Number(response.headers.get("content-length")) > 8 * 1024 * 1024) continue;
        const stream = response.body?.getReader();
        if (!stream) continue;
        let size = 0;
        const parts = [];
        for (; ; ) {
          const part = await stream.read();
          if (part.done) break;
          size += part.value.byteLength;
          if (size > 8 * 1024 * 1024 || ctrl.signal.aborted || !isCurrent()) {
            await stream.cancel();
            throw Error("PDF limit");
          }
          parts.push(part.value);
        }
        if (ctrl.signal.aborted || signal?.aborted || !isCurrent()) break;
        const bytes = new Uint8Array(size);
        let offset = 0;
        for (const part of parts) {
          bytes.set(part, offset);
          offset += part.length;
        }
        if (String.fromCharCode(...bytes.slice(0, 5)) !== "%PDF-") continue;
        const invoice = await readPDF(bytes, { timeoutMs: Math.min(2e3, Math.max(1, budgetMs - (Date.now() - started))) });
        if (ctrl.signal.aborted || signal?.aborted || !isCurrent() || !validateInvoice(invoice)) continue;
        const merged = mergePaymentInvoice(row, { invoice });
        if (invoice.amount !== null && Math.abs(invoice.amount - row.amount) > 1) merged.invoice.conflicts = [.../* @__PURE__ */ new Set([...merged.invoice.conflicts, "amount"])];
        Object.assign(row, merged);
      } catch {
      } finally {
        clearTimeout(timer);
        signal?.removeEventListener("abort", stop);
      }
    }
    const result = { ...facts, payments: { ...facts.payments, rows } };
    return validateHubContract(result) ? result : facts;
  }

  // src/core/hub-upgrade-reader.mjs
  async function readUpgradeFinance(facts, read, { signal, budgetMs = 7e3, maxDocuments = 6, refresh = false } = {}) {
    if (!validateHubContract(facts)) return facts;
    const copy = (v) => JSON.parse(JSON.stringify(v));
    const start = Date.now(), docs = new Map([[facts.contractId, copy(facts)], ...(facts.relatedFinance ?? []).map((f) => [f.contractId, copy(f)])]), queue = [facts.contractId], seen = /* @__PURE__ */ new Set();
    let reads = 0;
    for (let i = 0; i < queue.length && seen.size < maxDocuments; i++) {
      if (signal?.aborted || Date.now() - start >= budgetMs) break;
      const current = docs.get(queue[i]);
      if (!current || seen.has(current.contractId)) continue;
      seen.add(current.contractId);
      for (const link of current.upgrades ?? []) {
        if (link.direction !== "from" || !validUpgradeLinks([link]) || link.id === facts.contractId || signal?.aborted || Date.now() - start >= budgetMs) continue;
        let other = docs.get(link.id);
        if ((refresh || !other || other.payments?.state !== "read") && reads < maxDocuments) try {
          reads++;
          const value = await read({ ...link }, Math.max(1, budgetMs - (Date.now() - start)));
          if (!signal?.aborted && validateHubContract(value) && value.contractId === link.id && (!link.ct || value.ct === link.ct)) other = other ? mergeHubFinanceFacts(value, other) : value;
        } catch {
        }
        if (!other || other.contractId !== link.id || link.ct && other.ct !== link.ct || other.ct === current.ct) continue;
        link.ct = other.ct;
        const doc = { ...other, discounts: null };
        delete doc.relatedFinance;
        docs.set(link.id, doc);
        queue.push(link.id);
      }
    }
    const result = docs.get(facts.contractId), related = [...docs.values()].filter((f) => f.contractId !== facts.contractId).map((f) => {
      const d = { ...f, discounts: null };
      delete d.relatedFinance;
      return d;
    });
    if (related.length) result.relatedFinance = related.slice(0, 32);
    return validateHubContract(result) ? result : facts;
  }

  // src/core/hub-learner-payments.mjs
  var plain3 = (v) => v && typeof v === "object" && !Array.isArray(v);
  var id4 = (v) => /^[1-9]\d{0,14}$/.test(String(v ?? "")) ? String(v) : null;
  var text5 = (v) => typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "";
  var amount = (v) => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1e13 ? v : null;
  var code = hubDocumentCode;
  function projectLearnerPaymentPage(value, root) {
    const learner = projectHubLearner(root);
    if (!learner) return null;
    if (typeof value === "string" && value.length <= 2e6) {
      try {
        value = JSON.parse(value);
      } catch {
        return null;
      }
    }
    for (let i = 0; i < 3 && plain3(value) && !Array.isArray(value.ListData); i++) {
      const next = value.Data ?? value.data ?? value.Result;
      if (!plain3(next)) break;
      value = next;
    }
    if (!plain3(value) || value.KidId != null && id4(value.KidId) !== learner.kidId) return null;
    const groups = hubList(value.ListData, 200);
    if (!groups) return null;
    const documents = /* @__PURE__ */ new Map();
    for (const group of groups) {
      if (!plain3(group) || group.KidId != null && id4(group.KidId) !== learner.kidId) continue;
      const ct2 = code(group.ContractDepositNo ?? group.ContractNo ?? group.DepositNo), contractId = id4(group.ContractDepositId ?? group.ContractId ?? group.DepositId);
      if (!ct2 || !contractId) continue;
      if (ct2 === code(root.ContractNo ?? root.DepositNo) && contractId !== id4(root.ContractId ?? root.DepositId)) return null;
      const lists = ["ListPayment", "ListPayments", "PaymentDetails", "ListPaymentDetails", "Payments"].map((k) => hubList(group[k], 500)).filter(Boolean);
      const rows = lists.length ? lists.find((a) => a.length) ?? [] : group.PaymentCode ? [group] : [];
      const payments = [], moves = [];
      for (const raw of rows) {
        if (!plain3(raw) || raw.KidId != null && id4(raw.KidId) !== learner.kidId) continue;
        const explicit = code(raw.ContractDepositNo ?? raw.ContractNo ?? raw.DepositNo);
        if (explicit && explicit !== ct2) continue;
        const paymentCode = text5(raw.PaymentCode), paid = raw.IsComplete === true || raw.IsComplete !== false && /^paid$/i.test(text5(raw.StatusName ?? raw.Status ?? raw.PaymentStatusName));
        const paidAmount = amount(raw.PaidAmount ?? raw.Amount), completeDate = invoiceDay(raw.CompleteDate ?? raw.PaymentDate);
        if (!/^[A-Z0-9]+-PAY-[A-Z0-9-]{3,30}$/i.test(paymentCode) || paidAmount === null) continue;
        const method = text5(raw.PaymentMethodTypeName ?? raw.PaymentMethodName).slice(0, 200), type = text5(raw.PaymentTypeName ?? raw.PaymentType).slice(0, 200);
        const p = {
          id: id4(raw.PaymentId),
          code: paymentCode,
          amount: paidAmount,
          totalAmount: amount(raw.TotalAmount ?? raw.Amount),
          remaining: amount(raw.RemainAmount),
          typeId: id4(raw.PaymentTypeId),
          type,
          method,
          scheduledDate: invoiceDay(raw.ScheduledDate),
          completeDate,
          complete: paid,
          ...projectPaymentInvoice(raw, "learner-payments")
        };
        payments.push(p);
        const from = code(raw.RelatedContractDepositNo ?? raw.RelatedContractNo);
        if (from && from !== ct2 && paid && paidAmount > 0 && completeDate && !/refund|moving[ -]?out|transfer[ -]?out/i.test(type)) moves.push({ from, to: ct2, amount: paidAmount, date: completeDate, reference: paymentCode, direction: "in" });
      }
      if (!payments.length && !moves.length) continue;
      const facts = projectHubContract({ ContractNo: ct2, ContractId: contractId, LeadId: learner.leadId, KidId: learner.kidId, ListMovingIn: [], ListCourseInfo: [] }, { payments, paymentState: "read" });
      if (!facts) continue;
      facts.discounts = null;
      facts.movements = { state: "read", rows: moves };
      const prior = documents.get(ct2);
      if (prior) {
        if (prior.contractId !== facts.contractId) return null;
        for (const p of facts.payments.rows) {
          const old = prior.payments.rows.find((x) => x.code === p.code);
          if (old && Math.abs(old.amount - p.amount) > 1) return null;
          if (!old) prior.payments.rows.push(p);
        }
        prior.movements.rows.push(...moves);
      } else documents.set(ct2, facts);
    }
    return { documents: [...documents.values()], count: groups.length, total: Number.isSafeInteger(value.TotalCount) && value.TotalCount >= 0 ? value.TotalCount : null };
  }
  function mergeLearnerFinance(facts, pages) {
    if (!validateHubContract(facts) || !facts.learner || !Array.isArray(pages)) return facts;
    const docs = /* @__PURE__ */ new Map();
    for (const page of pages) for (const doc of page?.documents ?? []) {
      if (!validateHubContract(doc) || doc.learner?.kidId !== facts.learner.kidId) continue;
      const prior = docs.get(doc.ct);
      if (prior) {
        if (prior.contractId !== doc.contractId) return facts;
        const merged = mergeHubFinanceFacts(prior, doc);
        const rows = [...merged.payments.rows];
        for (const p of doc.payments.rows) if (!rows.some((q) => q.code === p.code)) rows.push(p);
        docs.set(doc.ct, { ...merged, payments: { ...merged.payments, rows } });
      } else docs.set(doc.ct, doc);
    }
    const own = docs.get(facts.ct);
    let result = own?.contractId === facts.contractId ? mergeHubFinanceFacts(facts, own) : facts;
    const known = /* @__PURE__ */ new Set([facts.ct]), related = [];
    for (let depth = 0; depth < 16 && known.size <= 32; depth++) {
      const before = known.size;
      for (const ct2 of [...known]) for (const m of (ct2 === facts.ct ? result : docs.get(ct2))?.movements?.rows ?? []) if (m.to === ct2) known.add(m.from);
      if (before === known.size) break;
    }
    for (const ct2 of known) if (ct2 !== facts.ct && docs.has(ct2) && related.length < 32) related.push({ ...docs.get(ct2), discounts: null });
    if (related.length) result = { ...result, relatedFinance: related };
    return validateHubContract(result) ? result : facts;
  }

  // src/core/hub-course-network.mjs
  var COURSE_NETWORK_CHANNEL = "promotion-hub/course-network/v1";
  var HUB4 = "https://hub24.apollo.vn:7777";
  var text6 = (v) => typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "";
  var numberId = (v) => /^[1-9]\d{0,14}$/.test(String(v ?? "")) ? String(v) : null;
  function courseDetailEndpoint(value, detailURL, method = "GET") {
    try {
      const detail = new URL(detailURL), deposit = /^\/deposit\//i.test(detail.pathname), documentId = hubDocumentId(detailURL, deposit ? "QA-DEP-000001" : "QA-CT-000001"), parameter = deposit ? "depositId" : "contractId", u = new URL(value, HUB4);
      if (!documentId || String(method).toUpperCase() !== "GET" || u.origin !== HUB4 || u.username || u.password || u.hash || !(deposit ? /\/GetDepositDetail\/?$/i : /\/GetContractDetail\/?$/i).test(u.pathname) || u.searchParams.getAll(parameter).length !== 1 || u.searchParams.get(parameter) !== documentId) return null;
      if ([...u.searchParams.keys()].some((k) => /token|session|password|secret|credential|authorization|api.?key/i.test(k))) return null;
      const roles = u.searchParams.getAll("userRoleId");
      if (roles.length > 1 || roles.length && !/^(?:0|[1-9]\d{0,14})$/.test(roles[0])) return null;
      u.search = "";
      u.searchParams.set(parameter, documentId);
      if (roles.length) u.searchParams.set("userRoleId", roles[0]);
      return u.href;
    } catch {
      return null;
    }
  }
  var pick = (obj, names) => {
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return void 0;
    for (const name2 of names) {
      const key = Object.keys(obj).find((k) => k.toLowerCase() === name2.toLowerCase());
      if (key !== void 0 && obj[key] != null && obj[key] !== "") return obj[key];
    }
    return void 0;
  };
  var scalar = (obj, names, max = 200) => {
    const value = pick(obj, names);
    return typeof value === "string" && text6(value).length <= max ? text6(value) || null : null;
  };
  function listValue(value, limit) {
    if (typeof value === "string" && value.length <= 128e3 && /^\s*\[/.test(value)) {
      try {
        value = JSON.parse(value);
      } catch {
        return null;
      }
    }
    return Array.isArray(value) && value.length <= limit ? value : null;
  }
  function offer(obj, names, arrays, itemNames, withGroup = false) {
    const values = [];
    let absent = false, invalid = false;
    for (const name2 of names) {
      const direct = scalar(obj, [name2], 2e3);
      if (!direct || /^\s*[\[{]/.test(direct)) continue;
      if (/^(?:0|none|n\/a|[-—]+)$/i.test(direct)) absent = true;
      else values.push(direct);
    }
    for (const name2 of arrays) {
      const raw = pick(obj, [name2]);
      if (raw == null) continue;
      const list2 = listValue(raw, 100);
      if (!list2) {
        invalid = true;
        continue;
      }
      if (!list2.length) absent = true;
      for (const entry of list2) {
        let value = typeof entry === "string" ? text6(entry) : scalar(entry, itemNames, 2e3);
        if (!value) {
          invalid = true;
          continue;
        }
        const group = withGroup && scalar(entry, ["GroupDiscountName"], 2e3);
        if (group) {
          const name3 = normalizeHubDiscount(value) ?? value, fold2 = (v) => text6(v).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
          value = fold2(name3).startsWith(fold2(group)) ? name3 : group + " - " + name3;
        }
        values.push(value);
      }
    }
    const result = [...new Set(values)].join(";");
    return invalid ? null : result.length > 2e3 ? null : result || (absent ? "0" : null);
  }
  function giftcodeValue(obj) {
    let result = offer(obj, ["GiftcodeNo", "GiftCodeNumber", "Giftcode"], ["ListGiftCode", "ListGiftcodes", "GiftCodes"], ["GiftcodeNo", "GiftCodeNumber", "GiftCode", "Code"]);
    const keys2 = Object.keys(obj ?? {}), key = (name2) => keys2.find((k) => k.toLowerCase() === name2.toLowerCase()), id5 = key("GiftCodeId"), code2 = key("GiftCode");
    const amounts = ["GiftCodeDiscount", "GiftCodeDiscountAmount", "GiftCodeDiscountAmountMax"].map(key).filter(Boolean);
    const hasAmount = amounts.some((k) => obj[k] != null && obj[k] !== "" && Number(obj[k]) !== 0);
    if (result === "0" && (id5 && obj[id5] != null && Number(obj[id5]) > 0 || hasAmount)) result = null;
    if (result == null && id5 && code2 && [null, 0, "0"].includes(obj[id5]) && [null, ""].includes(obj[code2]) && !hasAmount && ["ListGiftCode", "ListGiftcodes", "GiftCodes"].every((name2) => {
      const raw = pick(obj, [name2]);
      return raw == null || listValue(raw, 100)?.length === 0;
    })) result = "0";
    return result;
  }
  function fields(obj) {
    const namedDiscount = normalizeHubDiscount(offer(obj, ["DiscountApply", "DiscountApplyName", "PromotionApply", "PromotionApplyName"], ["ListDiscountApply", "ListDiscount", "Discounts", "ListPromotion", "ListPromotionApply", "PromotionApply"], ["DiscountName", "PromotionName", "Name"], true));
    const displayedDiscount = normalizeHubDiscount(scalar(obj, ["Discount"], 2e3), { wrappedOnly: true });
    let hours = pick(obj, ["HourWeekName", "HowweekName", "HowWeekName", "HoursPerWeek", "HourPerWeek", "HourWeek", "HoursWeek"]);
    if (typeof hours === "number" && hours > 0 && hours <= 168) hours = hours + " hrs/week";
    if (typeof hours === "string") {
      hours = text6(hours).replace(/^(\d+(?:[.,]\d+)?)\s*(?:giờ\s*\/\s*tuần|hours?\s*per\s*week)$/i, (_, n) => n.replace(",", ".") + " hrs/week");
      if (/^\d+(?:\.\d+)?$/.test(hours)) hours += " hrs/week";
    }
    if (typeof hours !== "string" || !/^\d+(?:\.\d+)?\s*(?:hrs?|hours?)\s*\/\s*week$/i.test(hours) || !(parseFloat(hours) > 0 && parseFloat(hours) <= 168)) hours = null;
    return {
      courseFee: scalar(obj, ["PriceName", "CourseFeeKOC"]),
      hoursPerWeek: hours,
      package: scalar(obj, ["PackageBeforeDiscountName", "PackageBeforeDiscount", "ProductPackageName", "PackageName", "ProductPackage"]),
      giftcode: giftcodeValue(obj),
      discount: namedDiscount && namedDiscount !== "0" ? namedDiscount : displayedDiscount ?? namedDiscount,
      groupKoc: scalar(obj, ["GroupKOC", "ProductGroupName"]),
      contractType: scalar(obj, ["ContractTypeName"])
    };
  }
  function projectContractDetail(value, sourceURL, detailURL) {
    const source = courseDetailEndpoint(sourceURL, detailURL);
    if (!source) return null;
    const root = contractRoot(value);
    if (root) {
      const lists = ["ListCourseInfo", "CourseInfos"].map((k) => listValue(pick(root, [k]), 20)).filter(Boolean), list2 = lists.find((l) => l.length) ?? lists[0] ?? [];
      const id5 = pick(root, ["ContractId", "DepositId", "Id"]), ct2 = scalar(root, ["ContractNo", "ContractCode", "ContractNumber", "DepositNo", "DepositCode"]), student = scalar(root, ["StudentCode", "StudentNo", "StudentNumber", "KidCode"]);
      if (id5 != null && !numberId(id5)) return null;
      const facts = projectHubContract(root), rootFields = fields(root), discountPending = ["ListDiscount", "Discounts"].some((k) => root[k] != null) && rootFields.discount == null;
      return { source, contractId: id5 == null ? null : numberId(id5), ct: ct2?.toUpperCase() ?? null, student, fields: rootFields, courses: list2.map((row) => fields(row)), ...discountPending ? { discountPending: true } : {}, ...facts ? { hubContract: facts } : {} };
    }
    return null;
  }
  function parseContractDetailProjection(projection, expected, domPayload = null) {
    const request = courseRequest(expected);
    if (!request || !projection || !courseDetailEndpoint(projection.source, request.url)) return { error: "identity" };
    const detailId = hubDocumentId(request.url, request.ct);
    if (projection.contractId != null && projection.contractId !== detailId || projection.ct && projection.ct !== request.ct) return { error: "identity" };
    if (request.readFinance === true) {
      if (projection.contractId !== detailId || projection.ct !== request.ct) return { error: "identity" };
      const payload2 = coursePayload({ ...request, hubContract: domPayload?.hubContract ? mergeHubFinanceFacts(projection.hubContract, domPayload.hubContract) : projection.hubContract }, request);
      return payload2 ? { payload: payload2, via: "finance" } : { error: "format" };
    }
    if (projection.student && projection.student !== request.student) return { error: "student" };
    if (!projection.ct && !coursePayload(domPayload, request)) return { error: "identity" };
    if (!Array.isArray(projection.courses) || projection.courses.length > 1) return { error: projection.courses?.length ? "conflict" : "empty", fields: ["courseFee", "hoursPerWeek", "package"] };
    const root = projection.fields ?? {}, course = projection.courses[0] ?? {}, values = {};
    for (const key of COURSE_FIELDS) {
      if (key === "discount") {
        const offers = [course[key], root[key], domPayload?.[key]].filter((v) => v && v !== "0");
        values[key] = offers.length ? normalizeHubDiscount(offers.join(";")) : projection.discountPending ? null : [course[key], root[key], domPayload?.[key]].includes("0") ? "0" : null;
      } else if (key === "giftcode") {
        const codes = [...new Set([course[key], root[key], domPayload?.[key]].filter((v) => v && v !== "0"))];
        if (codes.length > 1) return { error: "conflict", fields: ["giftcode"] };
        values[key] = codes[0] ?? ([course[key], root[key], domPayload?.[key]].includes("0") ? "0" : null);
      } else values[key] = course[key] ?? root[key] ?? domPayload?.[key] ?? null;
    }
    const empty = projection.courses.length === 0;
    if (empty) {
      for (const key of ["courseFee", "hoursPerWeek", "package"]) values[key] = null;
      for (const key of ["giftcode", "discount"]) if (values[key] === "0") values[key] = null;
    }
    const mergedFacts = domPayload?.hubContract ? mergeHubFinanceFacts(projection.hubContract, domPayload.hubContract) : projection.hubContract;
    const payload = coursePayload({ ...request, ...values, ...empty ? { courseState: "empty" } : {}, ...mergedFacts ? { hubContract: mergedFacts } : {}, ...projection.hubPolicy ? { hubPolicy: projection.hubPolicy } : {}, ...projection.hubPolicyError ? { hubPolicyError: projection.hubPolicyError } : {} }, request);
    return payload ? { payload, via: domPayload ? "network+dom" : "network" } : { error: "format" };
  }
  return __toCommonJS(hub_course_network_exports);
})();
