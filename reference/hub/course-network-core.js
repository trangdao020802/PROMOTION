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
      result[key] = v[key] == null ? null : text(v[key]);
    }
    if (!COURSE_FIELDS.some((k) => result[k] !== null)) return null;
    if (result.hoursPerWeek && !/^\d+(?:\.\d+)?\s*(?:hrs?|hours?)\s*\/\s*week$/i.test(result.hoursPerWeek)) return null;
    if (result.hoursPerWeek && !(parseFloat(result.hoursPerWeek) > 0 && parseFloat(result.hoursPerWeek) <= 168)) return null;
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
      discount: offer(obj, ["DiscountApply", "DiscountApplyName", "PromotionApply", "PromotionApplyName"], ["ListDiscountApply", "ListDiscount", "ListPromotion"], ["DiscountName", "PromotionName", "Name"]),
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
