// Generated from lib/hub-course.mjs by scripts/build-hub-helper.mjs.
"use strict";
var PromotionHubCourse = (() => {
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

  // lib/hub-course.mjs
  var hub_course_exports = {};
  __export(hub_course_exports, {
    COURSE_LABELS: () => COURSE_LABELS,
    coursePayload: () => coursePayload,
    courseRequest: () => courseRequest,
    parseCoursePage: () => parseCoursePage
  });

  // lib/hub-links.mjs
  function contractCode(value) {
    const ct = typeof value === "string" ? value.trim().toUpperCase() : "";
    return /^[A-Z0-9]+-CT-\d{4,20}$/.test(ct) ? ct : null;
  }
  function hubDocumentCode(value) {
    const code = typeof value === "string" ? value.trim().toUpperCase() : "";
    return /^[A-Z0-9]+-(?:CT|DEP)-\d{4,20}$/.test(code) ? code : null;
  }
  function hubContractUrl(value, expected) {
    if (typeof value !== "string" || value.length > 2048) return null;
    const text2 = value.trim();
    if (!text2 || /[\s\\\u0000-\u001f\u007f]/.test(text2)) return null;
    try {
      const url = new URL(text2);
      if (url.origin !== "https://hub24.apollo.vn:7777" || url.username || url.password) return null;
      const deposit = hubDocumentCode(expected)?.includes("-DEP-");
      if (expected && !hubDocumentCode(expected)) return null;
      if (deposit) {
        const numeric = /^\/deposit\/(?:detail|view)\/\d+\/?$/i.test(url.pathname) && !url.search;
        const entries = [...url.searchParams], query = /^\/deposit\/(?:detail|view)\/?$/i.test(url.pathname) && entries.length === 1 && ["id", "depositId"].includes(entries[0][0]) && /^\d+$/.test(entries[0][1]);
        if (!numeric && !query) return null;
      } else if (!/^\/contract(?:\/|$)/i.test(url.pathname) || /^\/contract\/(?:list|login|logout)\/?$/i.test(url.pathname)) return null;
      const sensitive = /(?:token|session|password|passwd|secret|credential|authorization|authcode|accesskey|apikey|redirect|returnurl|callback)/i;
      for (const key of url.searchParams.keys()) if (sensitive.test(key.replace(/[^a-z0-9]/gi, ""))) return null;
      if (url.hash) return null;
      return url.href;
    } catch {
      return null;
    }
  }

  // lib/hub-course.mjs
  var COURSE_LABELS = {
    "price name": "courseFee",
    "course fee koc": "courseFee",
    "hour/week": "hoursPerWeek",
    "hours/week": "hoursPerWeek",
    "hours per week": "hoursPerWeek",
    "package": "package",
    "student id": "student",
    "student code": "student"
  };
  var text = (v) => String(v ?? "").trim().replace(/\s+/g, " ");
  function courseRequest(v) {
    if (!v || typeof v !== "object") return null;
    const ct = contractCode(v.ct), url = hubContractUrl(v.url, ct), student = typeof v.student === "string" ? v.student.trim() : "";
    if (!ct || !url || !/^https:\/\/hub24\.apollo\.vn:7777\/contract\/detail\/[1-9]\d{0,14}\/?$/i.test(url) || !/^[A-Za-z0-9][A-Za-z0-9_.:/-]{0,149}$/.test(student) || Object.hasOwn(Object.prototype, student)) return null;
    return { ct, student, url };
  }
  function coursePayload(v, expected) {
    const request = courseRequest(expected);
    if (!request || !v || typeof v !== "object" || Object.keys(v).some((k) => !["ct", "student", "url", "courseFee", "hoursPerWeek", "package"].includes(k)) || v.ct !== request.ct || v.student !== request.student || v.url !== request.url) return null;
    const result = { ...request };
    for (const key of ["courseFee", "hoursPerWeek", "package"]) {
      if (v[key] !== null && (typeof v[key] !== "string" || !text(v[key]) || text(v[key]).length > 200)) return null;
      result[key] = v[key] === null ? null : text(v[key]);
    }
    if (!result.courseFee && !result.hoursPerWeek && !result.package) return null;
    if (result.hoursPerWeek && (!/^\d+(?:\.\d+)?\s*(?:hrs?|hours?)\s*\/\s*week$/i.test(result.hoursPerWeek) || !(parseFloat(result.hoursPerWeek) > 0 && parseFloat(result.hoursPerWeek) <= 168))) return null;
    return result;
  }
  function parseCoursePage(page, expected) {
    const request = courseRequest(expected);
    if (!request || page.url !== request.url) return { error: "identity" };
    const codes = [...new Set((page.titles ?? []).flatMap((t) => text(t).match(/[A-Z0-9]+-CT-\d{4,20}\b/gi) ?? []).map((v) => v.toUpperCase()))];
    if (codes.length !== 1 || codes[0] !== request.ct) return { error: "identity" };
    const values = {};
    for (const pair of page.pairs ?? []) {
      const key = COURSE_LABELS[text(pair.label).replace(/:$/, "").toLowerCase()], value = text(pair.value);
      if (!key || !value || /^[-—]+$/.test(value) || value === "0") continue;
      (values[key] ??= /* @__PURE__ */ new Set()).add(value);
    }
    if (Object.values(values).some((s) => s.size > 1)) return { error: "conflict" };
    if (values.student && [...values.student][0] !== request.student) return { error: "identity" };
    const payload = coursePayload({ ...request, ...Object.fromEntries(["courseFee", "hoursPerWeek", "package"].map((k) => [k, values[k] ? [...values[k]][0] : null])) }, request);
    return payload ? { payload } : { error: "empty" };
  }
  return __toCommonJS(hub_course_exports);
})();
