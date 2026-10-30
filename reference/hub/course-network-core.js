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
    courseDetailEndpoint: () => courseDetailEndpoint,
    parseContractDetailProjection: () => parseContractDetailProjection,
    projectContractDetail: () => projectContractDetail,
    readHubPolicy: () => readHubPolicy
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
  var fail = (code) => {
    throw Object.assign(Error(code), { policyCode: code });
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
    const rate = (x) => num(x) && x >= 0 && x <= 100 ? x : null, money = (x) => num(x) && x >= 0 && x <= 1e13 ? x : null, months = (x) => num(x) && x >= 0 && x <= 120 ? x : null;
    return {
      groupId: id(d.ProductGroupId) ?? groupId,
      rule: ["default", "last"].includes(d.ApplyRule) ? d.ApplyRule : null,
      installment: typeof d.IsInstallment === "boolean" ? d.IsInstallment : null,
      percent: rate(d.PercentDiscount),
      amount: money(d.AmountDiscount),
      months: months(d.GiftMonths),
      installmentPercent: rate(d.InstallmentPercentDiscount),
      installmentAmount: money(d.InstallmentAmountDiscount),
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
      const code = [detail.GiftCode, ...(list(detail.ListCourseInfo, 20) ?? []).map((c2) => c2.GiftCode)].map(text).filter((s) => s && s !== "0"), codes = [...new Set(code.map((c2) => c2.toUpperCase()))];
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

  // src/core/hub-course.mjs
  var HUB = "https://hub24.apollo.vn:7777";
  var text2 = (v) => String(v ?? "").trim().replace(/\s+/g, " ");
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

  // src/core/hub-course-network.mjs
  var COURSE_NETWORK_CHANNEL = "promotion-hub/course-network/v1";
  var HUB2 = "https://hub24.apollo.vn:7777";
  var text3 = (v) => typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "";
  var numberId = (v) => /^[1-9]\d{0,14}$/.test(String(v ?? "")) ? String(v) : null;
  function courseDetailEndpoint(value, detailURL, method = "GET") {
    try {
      const detail = new URL(detailURL), match = /^\/contract\/detail\/([1-9]\d{0,14})\/?$/i.exec(detail.pathname), u = new URL(value, HUB2);
      if (detail.origin !== HUB2 || detail.search || detail.hash || !match || String(method).toUpperCase() !== "GET" || u.origin !== HUB2 || u.username || u.password || u.hash || !/\/GetContractDetail\/?$/i.test(u.pathname) || u.searchParams.getAll("contractId").length !== 1 || u.searchParams.get("contractId") !== match[1]) return null;
      if ([...u.searchParams.keys()].some((k) => /token|session|password|secret|credential|authorization|api.?key/i.test(k))) return null;
      const roles = u.searchParams.getAll("userRoleId");
      if (roles.length > 1 || roles.length && !/^(?:0|[1-9]\d{0,14})$/.test(roles[0])) return null;
      u.search = "";
      u.searchParams.set("contractId", match[1]);
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
    return typeof value === "string" && text3(value).length <= max ? text3(value) || null : null;
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
        let value = typeof entry === "string" ? text3(entry) : scalar(entry, itemNames, 2e3);
        if (!value) {
          invalid = true;
          continue;
        }
        const group = withGroup && scalar(entry, ["GroupDiscountName"], 2e3);
        if (group) {
          const name3 = normalizeHubDiscount(value) ?? value, fold2 = (v) => text3(v).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
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
    const keys2 = Object.keys(obj ?? {}), key = (name2) => keys2.find((k) => k.toLowerCase() === name2.toLowerCase()), id2 = key("GiftCodeId"), code = key("GiftCode");
    const amounts = ["GiftCodeDiscount", "GiftCodeDiscountAmount", "GiftCodeDiscountAmountMax"].map(key).filter(Boolean);
    const hasAmount = amounts.some((k) => obj[k] != null && obj[k] !== "" && Number(obj[k]) !== 0);
    if (result === "0" && (id2 && obj[id2] != null && Number(obj[id2]) > 0 || hasAmount)) result = null;
    if (result == null && id2 && code && [null, 0, "0"].includes(obj[id2]) && [null, ""].includes(obj[code]) && !hasAmount && ["ListGiftCode", "ListGiftcodes", "GiftCodes"].every((name2) => {
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
      hours = text3(hours).replace(/^(\d+(?:[.,]\d+)?)\s*(?:giờ\s*\/\s*tuần|hours?\s*per\s*week)$/i, (_, n) => n.replace(",", ".") + " hrs/week");
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
    let objects = [value];
    for (let depth = 0; depth < 4; depth++) {
      const matches = objects.filter((v) => v && typeof v === "object" && !Array.isArray(v) && listValue(pick(v, ["ListCourseInfo", "CourseInfos"]), 20));
      if (matches.length) {
        if (matches.length !== 1) return null;
        const root = matches[0], list2 = listValue(pick(root, ["ListCourseInfo", "CourseInfos"]), 20);
        const id2 = pick(root, ["ContractId", "Id"]), ct = scalar(root, ["ContractNo", "ContractCode", "ContractNumber"]), student = scalar(root, ["StudentCode", "StudentNo", "StudentNumber", "KidCode"]);
        if (id2 != null && !numberId(id2)) return null;
        return { source, contractId: id2 == null ? null : numberId(id2), ct: ct?.toUpperCase() ?? null, student, fields: fields(root), courses: list2.map((row) => fields(row)) };
      }
      objects = objects.flatMap((v) => v && typeof v === "object" && !Array.isArray(v) ? ["Data", "data", "Result", "result", "Model", "model", "Contract", "contractInfo"].filter((k) => Object.hasOwn(v, k)).map((k) => v[k]) : []);
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
    for (const key of COURSE_FIELDS) {
      if (key === "discount") {
        const offers = [course[key], root[key], domPayload?.[key]].filter((v) => v && v !== "0");
        values[key] = offers.length ? normalizeHubDiscount(offers.join(";")) : [course[key], root[key], domPayload?.[key]].includes("0") ? "0" : null;
      } else if (key === "giftcode") {
        const codes = [...new Set([course[key], root[key], domPayload?.[key]].filter((v) => v && v !== "0"))];
        if (codes.length > 1) return { error: "conflict", fields: ["giftcode"] };
        values[key] = codes[0] ?? ([course[key], root[key], domPayload?.[key]].includes("0") ? "0" : null);
      } else values[key] = course[key] ?? root[key] ?? domPayload?.[key] ?? null;
    }
    const payload = coursePayload({ ...request, ...values, ...projection.hubPolicy ? { hubPolicy: projection.hubPolicy } : {}, ...projection.hubPolicyError ? { hubPolicyError: projection.hubPolicyError } : {} }, request);
    return payload ? { payload, via: domPayload ? "network+dom" : "network" } : { error: "format" };
  }
  return __toCommonJS(hub_course_network_exports);
})();
