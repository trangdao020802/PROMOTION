var PromotionHubVoucher = (() => {
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

  // src/core/hub-voucher.mjs
  var hub_voucher_exports = {};
  __export(hub_voucher_exports, {
    HUB_VOUCHERS: () => HUB_VOUCHERS,
    VOUCHER_LABELS: () => VOUCHER_LABELS,
    giftcodeKey: () => giftcodeKey,
    hubDate: () => hubDate,
    hubDiscountType: () => hubDiscountType,
    hubNumber: () => hubNumber,
    hubVoucherStatus: () => hubVoucherStatus,
    mergeHubVoucher: () => mergeHubVoucher,
    parseVoucherDetail: () => parseVoucherDetail,
    profileForVoucherCode: () => profileForVoucherCode,
    voucherCodesURL: () => voucherCodesURL,
    voucherDetailURL: () => voucherDetailURL,
    voucherLabel: () => voucherLabel,
    voucherListChoice: () => voucherListChoice,
    voucherPayload: () => voucherPayload,
    voucherRecordProfile: () => voucherRecordProfile,
    voucherRequest: () => voucherRequest,
    withVoucherProfile: () => withVoucherProfile
  });
  var HUB_VOUCHERS = "https://hub24.apollo.vn:7777/giftcode/manage";
  var HUB = "https://hub24.apollo.vn:7777";
  var text = (value) => String(value ?? "").trim().replace(/\s+/g, " ");
  var fold = (value) => text(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").toLowerCase();
  var giftcodeKey = (value) => text(value).toUpperCase();
  function voucherRequest(value) {
    if (!value || typeof value !== "object" || Object.keys(value).some((k) => k !== "code") || typeof value.code !== "string") return null;
    const code = giftcodeKey(value.code);
    return code && code !== "0" && code.length <= 150 && !/[\x00-\x1f\x7f]/.test(value.code) ? { code } : null;
  }
  function voucherDetailURL(value) {
    try {
      const url = new URL(value, HUB), pairs = [...url.searchParams];
      const path = /^\/giftcode\/(?:detail|view|edit|update)\/[1-9]\d{0,14}\/?$/i.test(url.pathname) && !url.search;
      const query = /^\/giftcode\/(?:detail|view|edit|update)\/?$/i.test(url.pathname) && pairs.length === 1 && /^(?:id|giftcodeId|voucherId)$/i.test(pairs[0][0]) && /^[1-9]\d{0,14}$/.test(pairs[0][1]);
      return url.origin === HUB && !url.username && !url.password && !url.hash && (path || query) ? url.href : null;
    } catch {
      return null;
    }
  }
  function voucherCodesURL(value, parent) {
    try {
      const detail = voucherDetailURL(parent);
      if (!detail) return null;
      const p = new URL(detail), parentId = p.pathname.match(/\/(\d+)\/?$/)?.[1] || [...p.searchParams.values()][0], url = new URL(value, HUB), pairs = [...url.searchParams];
      const path = url.pathname.match(/^\/giftcode\/(?:listgiftcodes?|giftcodelist|codelist|codes|list)\/([1-9]\d{0,14})\/?$/i);
      const query = /^\/giftcode\/(?:listgiftcodes?|giftcodelist|codelist|codes|list)\/?$/i.test(url.pathname) && pairs.length === 1 && /^(?:id|giftcodeId|voucherId|parentId)$/i.test(pairs[0][0]) && /^[1-9]\d{0,14}$/.test(pairs[0][1]);
      const id = path && !url.search ? path[1] : query ? pairs[0][1] : null;
      return url.origin === HUB && !url.username && !url.password && !url.hash && id === parentId ? url.href : null;
    } catch {
      return null;
    }
  }
  var VOUCHER_LABELS = Object.freeze({
    "voucher name": "label",
    "ten voucher": "label",
    "code prefix": "prefix",
    "giftcode no": "code",
    "giftcode no.": "code",
    "gift code": "code",
    "giftcode": "code",
    "discount amount": "discount",
    "discount type": "discountType",
    "minimum": "minimum",
    "maximum": "maximum",
    "start date": "startDate",
    "end date": "endDate",
    "center": "center",
    "center code": "centerCode",
    "region": "region",
    "status": "status",
    "description": "description",
    "created by": "creator",
    "student id": "studentId",
    "student code": "studentId",
    "student name": "studentName",
    "ten hoc vien": "studentName"
  });
  var voucherLabel = (value) => VOUCHER_LABELS[fold(value).replace(/\s*[:*]\s*$/, "").trim()] ?? null;
  var present = (value) => !!text(value) && !/^choose\b|^select\b|^chọn\b|^[-—]+$/i.test(text(value));
  function hubDate(value) {
    const s = text(value);
    let match = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T].*)?$/), ymd;
    if (match) ymd = match.slice(1, 4).join("-");
    else {
      match = s.match(/^(\d{2})[-/](\d{2})[-/](\d{4})(?:\s.*)?$/);
      if (match) ymd = [match[3], match[2], match[1]].join("-");
    }
    if (!ymd) return "";
    const date = /* @__PURE__ */ new Date(ymd + "T00:00:00Z");
    return Number.isFinite(+date) && date.toISOString().slice(0, 10) === ymd ? ymd : "";
  }
  function hubNumber(value) {
    let s = text(value).replace(/(?:VND|VNĐ|₫|đ|%)/gi, "").replace(/\s/g, "");
    if (!s || !/^\d[\d.,]*$/.test(s)) return null;
    if (/^\d{1,3}(?:[.,]\d{3})+$/.test(s)) s = s.replace(/[.,]/g, "");
    else if (s.includes(",") && !s.includes(".")) s = s.replace(",", ".");
    const n = Number(s);
    return Number.isFinite(n) && n >= 0 && n <= 1e13 ? n : null;
  }
  function hubDiscountType(value) {
    const s = text(value), normalized = fold(s);
    const percent = /%|\bpercent(?:age)?\b|\bphan tram\b/.test(normalized);
    const amount = /[₫đĐ]/.test(s) || /\bvnd\b|\bdong\b|\bfixed(?: amount)?\b|\bamount\b|\bso tien\b/.test(normalized) || /^(?:\(?\s*)d(?:\s*\)?)$/i.test(s);
    return percent && amount ? "conflict" : percent ? "percent" : amount ? "amount" : "";
  }
  function hubVoucherStatus(value) {
    const s = fold(value);
    if (/^(?:inactive|disabled|cancelled|canceled|rejected|not applied|khong ap dung)$/.test(s)) return "INACTIVE";
    if (/^(?:active|being applied|approved|dang ap dung)$/.test(s)) return "ACTIVE";
    if (/^(?:closed|used|da dong|da su dung)$/.test(s)) return "CLOSED";
    return "UNKNOWN";
  }
  function voucherListChoice(rows) {
    const candidates = (rows ?? []).filter((row) => voucherDetailURL(row.url));
    const urls = [...new Set(candidates.map((row) => voucherDetailURL(row.url)))];
    return urls.length === 1 ? { url: urls[0], record: candidates.find((row) => voucherDetailURL(row.url) === urls[0]) } : null;
  }
  var payloadFields = /* @__PURE__ */ new Set(["code", "url", "label", "center", "startDate", "endDate", "type", "amount", "rate", "minimum", "maximum", "status", "creator", "description", "studentId", "studentName", "checkedAt"]);
  function voucherPayload(value, expected, url) {
    const request = voucherRequest(expected), detail = voucherDetailURL(value?.url);
    if (!request || !value || typeof value !== "object" || Object.keys(value).some((k) => !payloadFields.has(k)) || giftcodeKey(value.code) !== request.code || !detail || url && detail !== voucherDetailURL(url)) return null;
    for (const key of ["label", "center", "startDate", "endDate", "creator", "description", "studentId", "studentName", "checkedAt"]) if (typeof value[key] !== "string" || value[key].length > (key === "center" ? 2e3 : key === "description" ? 1500 : 200)) return null;
    if (value.startDate && hubDate(value.startDate) !== value.startDate || value.endDate && hubDate(value.endDate) !== value.endDate || value.startDate && value.endDate && value.startDate > value.endDate) return null;
    if (!["", "amount", "percent"].includes(value.type) || !["ACTIVE", "CLOSED", "INACTIVE", "UNKNOWN"].includes(value.status)) return null;
    for (const key of ["amount", "rate", "minimum", "maximum"]) if (value[key] !== null && (typeof value[key] !== "number" || !Number.isFinite(value[key]) || value[key] < 0 || value[key] > (key === "rate" ? 1 : 1e13))) return null;
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value.checkedAt) || !Number.isFinite(Date.parse(value.checkedAt))) return null;
    return { ...value, code: request.code, url: detail };
  }
  function parseVoucherDetail(page, expected) {
    const request = voucherRequest(expected), url = voucherDetailURL(page?.url);
    if (!request || !url) return { error: "identity" };
    const pairs = page.pairs ?? [], values = {};
    for (const pair of pairs) {
      const key = voucherLabel(pair.label);
      if (key && present(pair.value)) (values[key] ??= []).push(text(pair.value));
    }
    const unique = (key) => [...new Set(values[key] ?? [])];
    if (["label", "discount", "discountType", "minimum", "maximum", "startDate", "endDate", "studentId", "studentName"].some((k) => unique(k).length > 1)) return { error: "conflict" };
    const exact = (page.giftcodes ?? []).filter((row2) => giftcodeKey(row2.code) === request.code), explicit = unique("code").includes(request.code);
    if (!explicit && !exact.length) return { error: "code_unconfirmed" };
    if (exact.some((row2) => exact.some((other) => ["studentId", "studentName", "status"].some((k) => present(row2[k]) && present(other[k]) && fold(row2[k]) !== fold(other[k]))))) return { error: "conflict" };
    const list = page.list ?? {}, row = exact[0] ?? {}, one = (key) => unique(key)[0] ?? "", conditions = text(list.conditions);
    const observed = conditions.match(/discount amount\s*:\s*([\d.,]+)\s*(%|VND|VNĐ|₫|đ)?/i);
    const discount = one("discount") || observed?.[1] || "", unit = pairs.filter((p) => voucherLabel(p.label) === "discount").map((p) => p.unit ?? "").join(" ");
    const types = [...new Set([one("discountType"), discount, unit, ...!one("discount") ? [observed?.[2]] : []].map(hubDiscountType).filter(Boolean))];
    const amount = hubNumber(discount);
    if (amount !== null && (types.length !== 1 || types[0] === "conflict")) return { error: "unit" };
    const type = amount === null ? "" : types[0];
    if (type === "percent" && amount > 100) return { error: "amount" };
    const rowCenters = [...new Set(exact.map((r) => text(r.centerCode)).filter(Boolean))];
    const scope = rowCenters.join(", ") || unique("centerCode").join(", ") || unique("center").join(", ") || unique("region").join(", ") || text(list.center);
    const payload = {
      code: request.code,
      url,
      label: one("label") || text(list.label),
      center: scope,
      startDate: hubDate(one("startDate") || list.startDate),
      endDate: hubDate(one("endDate") || list.endDate),
      type,
      amount: type === "amount" ? amount : null,
      rate: type === "percent" ? amount / 100 : null,
      minimum: hubNumber(one("minimum") || list.minimum),
      maximum: hubNumber(one("maximum") || list.maximum),
      status: hubVoucherStatus(row.status || one("status") || list.status),
      creator: one("creator") || text(list.creator),
      description: one("description"),
      studentId: text(row.studentId) || one("studentId"),
      studentName: text(row.studentName) || one("studentName"),
      checkedAt: page.checkedAt || (/* @__PURE__ */ new Date()).toISOString()
    };
    return voucherPayload(payload, request, url) ? { payload } : { error: "invalid" };
  }
  function withVoucherProfile(value, profile = {}) {
    const result = { ...value }, student = text(profile.studentId);
    if (student && text(result.studentId) && giftcodeKey(result.studentId) !== giftcodeKey(student)) return result;
    if (student && !text(result.studentId)) {
      result.studentId = student;
      if (!text(result.studentName)) result.studentName = text(profile.studentName);
    } else if (student && giftcodeKey(result.studentId) === giftcodeKey(student) && !text(result.studentName)) result.studentName = text(profile.studentName);
    if (!text(result.center)) result.center = text(profile.center);
    return result;
  }
  function mergeHubVoucher(value, source, profile = {}) {
    const payload = voucherPayload(source, { code: value.code });
    if (!payload) throw Error("K\u1EBFt qu\u1EA3 Hub kh\xF4ng x\xE1c nh\u1EADn \u0111\xFAng Giftcode \u0111\u1EA7y \u0111\u1EE7.");
    if (profile.studentId && text(value.studentId) && giftcodeKey(value.studentId) !== giftcodeKey(profile.studentId)) throw Error("Voucher \u0111ang l\u01B0u thu\u1ED9c h\u1ECDc vi\xEAn kh\xE1c v\u1EDBi CT \u0111ang m\u1EDF. C\u1EA7n \u0111\u1ED1i chi\u1EBFu tr\u01B0\u1EDBc khi \u0111i\u1EC1n.");
    const expected = text(profile.studentId) || text(value.studentId), name = text(profile.studentName) || text(value.studentName);
    if (payload.studentId && expected && giftcodeKey(payload.studentId) !== giftcodeKey(expected)) throw Error("Student ID tr\xEAn Hub kh\xE1c h\u1ECDc vi\xEAn c\u1EE7a h\u1ED3 s\u01A1 \u0111ang m\u1EDF. Ch\u01B0a \u0111i\u1EC1n d\u1EEF li\u1EC7u.");
    if (payload.studentName && name && fold(payload.studentName) !== fold(name)) throw Error("T\xEAn h\u1ECDc vi\xEAn tr\xEAn Hub kh\xE1c h\u1ED3 s\u01A1 \u0111ang m\u1EDF. C\u1EA7n \u0111\u1ED1i chi\u1EBFu tr\u01B0\u1EDBc khi \u0111i\u1EC1n.");
    let result = withVoucherProfile(value, profile);
    for (const key of ["label", "center", "startDate", "endDate", "type"]) if (payload[key]) result[key] = payload[key];
    for (const key of ["amount", "rate", "minimum", "maximum"]) if (payload[key] !== null) result[key] = payload[key];
    if (payload.studentId) result.studentId = payload.studentId;
    if (payload.studentName) result.studentName = payload.studentName;
    if (profile.centerName && fold(result.center) === fold(profile.centerName) && profile.center) result.center = profile.center;
    if (result.type === "percent") result.amount = null;
    else if (result.type === "amount") result.rate = null;
    const changed = ["code", "studentId", "studentName", "center", "startDate", "endDate", "type", "amount", "rate", "minimum", "maximum"].some((k) => JSON.stringify(value[k] ?? null) !== JSON.stringify(result[k] ?? null));
    result.status = payload.status === "INACTIVE" ? "INACTIVE" : changed || !["APPROVED", "CLOSED"].includes(value.status) ? "PENDING" : value.status;
    result.hubUrl = payload.url;
    result.hubCheckedAt = payload.checkedAt;
    result.hubStatus = payload.status;
    const note = text(value.approvalNote).replace(/\s*\[Hub voucher\][\s\S]*$/, "");
    const evidence = `[Hub voucher] ${payload.code} \xB7 ${payload.url} \xB7 ${payload.checkedAt} \xB7 tr\u1EA1ng th\xE1i: ${payload.status}${payload.creator ? " \xB7 t\u1EA1o b\u1EDFi: " + payload.creator : ""}${payload.description ? " \xB7 " + payload.description : ""}`;
    result.approvalNote = [note, evidence].filter(Boolean).join("\n").slice(0, 2e3);
    return result;
  }
  function voucherRecordProfile(row) {
    const c = row?.cells;
    if (!c) return {};
    return { ct: text(c.contractTotal || row.ct || c.C), studentId: text(c.F), studentName: text(c.G), center: text(c.B), centerName: text(c.A) };
  }
  function profileForVoucherCode(records, code) {
    const request = voucherRequest({ code });
    if (!request) return {};
    const matches = (records ?? []).filter((row) => giftcodeKey(row.cells?.K) === request.code);
    return matches.length === 1 ? voucherRecordProfile(matches[0]) : {};
  }
  return __toCommonJS(hub_voucher_exports);
})();
