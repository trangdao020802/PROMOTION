// Generated from lib/hub-report-core.mjs by scripts/build-hub-helper.mjs.
"use strict";
var PromotionHubReports = (() => {
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

  // lib/hub-report-core.mjs
  var hub_report_core_exports = {};
  __export(hub_report_core_exports, {
    HUB_REPORTS: () => HUB_REPORTS,
    HUB_REPORT_ORIGIN: () => HUB_REPORT_ORIGIN,
    MAX_REPORT_BYTES: () => MAX_REPORT_BYTES,
    MAX_REPORT_ROWS: () => MAX_REPORT_ROWS,
    REPORT_RENDER_MS: () => REPORT_RENDER_MS,
    detailHeaders: () => detailHeaders,
    flattenHeaders: () => flattenHeaders,
    reportDateStatus: () => reportDateStatus,
    reportDiagnostic: () => reportDiagnostic,
    reportPayload: () => reportPayload,
    reportPeriod: () => reportPeriod,
    reportRenderMs: () => reportRenderMs,
    reportURL: () => reportURL,
    reportURLMatches: () => reportURLMatches
  });
  var HUB_REPORT_ORIGIN = "https://hub24.apollo.vn:7777";
  var MAX_REPORT_ROWS = 1e4;
  var MAX_REPORT_BYTES = 12 * 1024 * 1024;
  var REPORT_RENDER_MS = 9e4;
  function reportRenderMs(report) {
    return report === "payment" ? 30 * 6e4 : REPORT_RENDER_MS;
  }
  var HUB_REPORTS = Object.freeze({
    transfer: { path: "/report/TransferPaymentList", regionKey: "region", label: "Transfer PaymentList", dateField: "Transfer date" },
    export: { path: "/report/PaymentByCourse", regionKey: "regionId", label: "Payment By Course", dateField: "Contract full date" },
    payment: { path: "/report/PaymentList", regionKey: "region", label: "PaymentList", dateField: "Invoice date", centers: "87_66_27_59_74_36_95_67_44_45_78" }
  });
  function reportPeriod(month) {
    if (typeof month !== "string" || !/^20\d{2}-(?:0[1-9]|1[0-2])$/.test(month)) return null;
    const [year, m] = month.split("-").map(Number), last = new Date(Date.UTC(year, m, 0)).getUTCDate();
    return { from: month + "-01", to: month + "-" + last };
  }
  function reportURL(report, month, pageSize = 1) {
    const spec = Object.hasOwn(HUB_REPORTS, report) ? HUB_REPORTS[report] : null, period = reportPeriod(month);
    if (!spec || !period || !Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > MAX_REPORT_ROWS) throw Error("B\xE1o c\xE1o, th\xE1ng ho\u1EB7c s\u1ED1 d\xF2ng Hub kh\xF4ng h\u1EE3p l\u1EC7.");
    const url = new URL(spec.path, HUB_REPORT_ORIGIN);
    for (const [k, v] of Object.entries({ fromDate: period.from, toDate: period.to, [spec.regionKey]: "1", ...spec.centers ? { centers: spec.centers } : {}, ps: String(pageSize) })) url.searchParams.set(k, v);
    return url.href;
  }
  function reportURLMatches(value, report, month, pageSize) {
    try {
      const url = new URL(value), expected = new URL(reportURL(report, month, pageSize));
      return !url.username && !url.password && !url.hash && url.origin === expected.origin && url.pathname === expected.pathname && [...url.searchParams].length === [...expected.searchParams].length && [...expected.searchParams].every(([k, v]) => url.searchParams.getAll(k).length === 1 && url.searchParams.get(k) === v);
    } catch {
      return false;
    }
  }
  var norm = (v) => String(v ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
  function detailHeaders(headers, report) {
    if (!Array.isArray(headers) || !headers.length || headers.length > 256 || headers.some((v) => typeof v !== "string" || v.length > 300)) return false;
    const h = headers.map(norm), has = (...names) => names.some((n) => h.includes(n));
    if (report === "payment") return has("paymentcode") && has("contractno", "contractcode") && has("studentid", "studentcode") && has("invoicedate") && has("vatinvoiceno");
    if (report === "export") return has("contractno", "contractcode") && has("studentcode", "studentid") && has("finalpayamountcontract", "finalpaymentamountcontract") && has("totalfinalpaymentamountinvoice", "totalinvoiceamount");
    if (report === "transfer") return has("transfertype") && has("transferdate") && has("fromstudentid") && has("tostudentid") && has("fromcontractdepositno", "fromcontractno") && has("tocontractno");
    return false;
  }
  function flattenHeaders(rows) {
    if (!Array.isArray(rows) || !rows.length || rows.length > 8) throw Error("Kh\xF4ng nh\u1EADn di\u1EC7n \u0111\u01B0\u1EE3c ti\xEAu \u0111\u1EC1 b\u1EA3ng chi ti\u1EBFt.");
    const grid = [];
    for (let r = 0; r < rows.length; r++) {
      grid[r] ??= [];
      let c = 0;
      for (const cell of rows[r]) {
        while (grid[r][c] !== void 0) c++;
        const cs = cell.colSpan ?? 1, rs = cell.rowSpan ?? 1;
        if (!Number.isInteger(cs) || !Number.isInteger(rs) || cs < 1 || rs < 1 || c + cs > 256 || r + rs > 8) throw Error("Ti\xEAu \u0111\u1EC1 g\u1ED9p \xF4 kh\xF4ng \u0111\u01B0\u1EE3c h\u1ED7 tr\u1EE3.");
        for (let y = r; y < r + rs; y++) {
          grid[y] ??= [];
          for (let x = c; x < c + cs; x++) grid[y][x] = String(cell.text ?? "").trim();
        }
        c += cs;
      }
    }
    const width = Math.max(...grid.map((r) => r.length));
    return Array.from({ length: width }, (_, c) => {
      const parts = [...new Set(grid.map((r) => r[c]).filter(Boolean))], leaf = parts.at(-1) ?? "", parent = parts.slice(0, -1).findLast((p) => /^(?:from|to)(?:\s|$)/i.test(p));
      return parent && /^(?:student|contract|deposit)/i.test(leaf) && !/^(?:from|to)\b/i.test(leaf) ? parent + " " + leaf : leaf;
    });
  }
  function reportDateStatus(headers, rows, report, month) {
    if (!reportPeriod(month) || !Array.isArray(headers) || !Array.isArray(rows)) return "mismatch";
    if (!rows.length) return "ok";
    const name = Object.hasOwn(HUB_REPORTS, report) ? norm(HUB_REPORTS[report].dateField) : "", columns = headers.map((h, i) => norm(h) === name ? i : -1).filter((i) => i >= 0);
    if (!columns.length && report === "export" && detailHeaders(headers, "export") && headers.filter((h) => norm(h) === "invoicedate").length === 1) return "not_rendered";
    if (!name || columns.length !== 1) return "missing";
    for (const row of rows) {
      const text = typeof row?.[columns[0]] === "string" ? row[columns[0]].trim() : "", iso = /^(20\d{2})-(\d{2})-(\d{2})(?:\b|T)/.exec(text), dmy = /^(\d{1,2})[-/](\d{1,2})[-/](20\d{2})\b/.exec(text);
      if (!iso && !dmy) return "mismatch";
      const [year, m, day] = iso ? iso.slice(1).map(Number) : [Number(dmy[3]), Number(dmy[2]), Number(dmy[1])], date = new Date(Date.UTC(year, m - 1, day));
      if (date.getUTCFullYear() !== year || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== day || `${year}-${String(m).padStart(2, "0")}` !== month) return "mismatch";
    }
    return "ok";
  }
  function reportPayload(value, report, month) {
    if (!value || typeof value !== "object" || Object.keys(value).some((k) => !["report", "month", "url", "headers", "rows", "total", "capturedAt"].includes(k)) || value.report !== report || value.month !== month || !Number.isSafeInteger(value.total) || value.total < 0 || value.total > MAX_REPORT_ROWS || !reportURLMatches(value.url, report, month, Math.max(1, value.total)) || !detailHeaders(value.headers, report) || !Array.isArray(value.rows) || value.rows.length !== value.total) return null;
    if (typeof value.capturedAt !== "string" || !Number.isFinite(Date.parse(value.capturedAt)) || new Date(value.capturedAt).toISOString() !== value.capturedAt) return null;
    let size = 0;
    for (const row of value.rows) {
      if (!Array.isArray(row) || row.length !== value.headers.length) return null;
      for (const cell of row) {
        if (typeof cell !== "string" || cell.length > 4e3) return null;
        size += cell.length;
        if (size > MAX_REPORT_BYTES) return null;
      }
    }
    if (!["ok", "not_rendered"].includes(reportDateStatus(value.headers, value.rows, report, month))) return null;
    if (new TextEncoder().encode(JSON.stringify(value)).length > MAX_REPORT_BYTES) return null;
    return value;
  }
  function reportDiagnostic(value) {
    if (!value || !Object.hasOwn(HUB_REPORTS, value.report) || !reportPeriod(value.month)) return null;
    const result = { report: value.report, month: value.month, path: HUB_REPORTS[value.report].path };
    if (["report-probe", "report-full"].includes(value.stage)) result.stage = value.stage;
    for (const k of ["tables", "tablesScanned", "tablesDetected", "frames", "grids", "elapsedSeconds", "columns", "actualRows", "expectedRows", "dateControls", "regionControls"]) if (Number.isSafeInteger(value[k]) && value[k] >= 0 && value[k] <= MAX_REPORT_ROWS) result[k] = value[k];
    if (["loading", "interactive", "complete"].includes(value.documentState)) result.documentState = value.documentState;
    if (["visible", "hidden", "prerender"].includes(value.visibility)) result.visibility = value.visibility;
    if (typeof value.loading === "boolean") result.loading = value.loading;
    if (["dates", "region", "page_size"].includes(value.filter)) result.filter = value.filter;
    if (["server", "footer", "none", "conflict"].includes(value.countSource)) result.countSource = value.countSource;
    if (Array.isArray(value.pageSizes)) result.pageSizes = [...new Set(value.pageSizes.filter((n) => Number.isSafeInteger(n) && n > 0 && n <= MAX_REPORT_ROWS))].slice(0, 32);
    return result;
  }
  return __toCommonJS(hub_report_core_exports);
})();
