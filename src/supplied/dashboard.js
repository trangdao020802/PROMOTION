import {newCompletionRequest} from '../core/hub-completion.mjs';
import AuditSearch from '../local/AuditSearch.tsx';
import FilterSelectAll from '../local/FilterSelectAll.tsx';
import DiscountApplyInfo from '../local/DiscountApplyInfo.tsx';
import wt from '../local/VoucherEditor.tsx';
import {voucherRecordProfile,profileForVoucherCode} from '../core/hub-voucher.mjs';
import {referenceRows,updateVoucherCatalogue} from '../core/reference-data.mjs';
import ReferenceTable from '../local/ReferenceTable.tsx';
import HubInputAutofill from '../local/HubInputAutofill.tsx';
import {courseRequest as validateHubCourseRequest,coursePayload as validateHubCoursePayload,missingContractInputs} from '../core/hub-course.mjs';
import PolicyCoverage from '../local/PolicyCoverage.tsx';
import ReviewApprovalCell from '../local/ReviewApprovalCell.tsx';
import DetailApprovals from '../local/DetailApprovals.tsx';
import {reviewTableColumns,updateReview} from '../core/reviews.mjs';
import PaymentInfo from '../local/PaymentInfo.tsx';
import PolicyUpdateGuide from '../local/PolicyUpdateGuide.tsx';
import LocalFileLink from '../local/LocalFileLink.tsx';
import RegistrationFields from '../local/RegistrationFields.tsx';
import {localFetch as fetch} from '../local/api.mjs';
import { r as e } from "./rolldown-runtime-C60lm6uB.js";
import { i as t, r as n } from "./react-shim.mjs";
var r = (...e2) => e2.filter((e3, t2, n2) => !!e3 && e3.trim() !== `` && n2.indexOf(e3) === t2).join(` `).trim(), i = (e2) => e2.replace(/([a-z0-9])([A-Z])/g, `$1-$2`).toLowerCase(), a = (e2) => e2.replace(/^([A-Z])|[\s-_]+(\w)/g, (e3, t2, n2) => n2 ? n2.toUpperCase() : t2.toLowerCase()), o = (e2) => {
  let t2 = a(e2);
  return t2.charAt(0).toUpperCase() + t2.slice(1);
}, s = { xmlns: `http://www.w3.org/2000/svg`, width: 24, height: 24, viewBox: `0 0 24 24`, fill: `none`, stroke: `currentColor`, strokeWidth: 2, strokeLinecap: `round`, strokeLinejoin: `round` }, c = (e2) => {
  for (let t2 in e2) if (t2.startsWith(`aria-`) || t2 === `role` || t2 === `title`) return true;
  return false;
}, l = e(t(), 1), u = (0, l.createContext)({}), d = () => (0, l.useContext)(u), f = (0, l.forwardRef)(({ color: e2, size: t2, strokeWidth: n2, absoluteStrokeWidth: i2, className: a2 = ``, children: o2, iconNode: u2, ...f2 }, p2) => {
  let { size: m2 = 24, strokeWidth: h2 = 2, absoluteStrokeWidth: g2 = false, color: _2 = `currentColor`, className: v2 = `` } = d() ?? {}, y2 = i2 ?? g2 ? Number(n2 ?? h2) * 24 / Number(t2 ?? m2) : n2 ?? h2;
  return (0, l.createElement)(`svg`, { ref: p2, ...s, width: t2 ?? m2 ?? s.width, height: t2 ?? m2 ?? s.height, stroke: e2 ?? _2, strokeWidth: y2, className: r(`lucide`, v2, a2), ...!o2 && !c(f2) && { "aria-hidden": `true` }, ...f2 }, [...u2.map(([e3, t3]) => (0, l.createElement)(e3, t3)), ...Array.isArray(o2) ? o2 : [o2]]);
}), p = (e2, t2) => {
  let n2 = (0, l.forwardRef)(({ className: n3, ...a2 }, s2) => (0, l.createElement)(f, { ref: s2, iconNode: t2, className: r(`lucide-${i(o(e2))}`, `lucide-${e2}`, n3), ...a2 }));
  return n2.displayName = o(e2), n2;
}, m = p(`arrow-down-right`, [[`path`, { d: `m7 7 10 10`, key: `1fmybs` }], [`path`, { d: `M17 7v10H7`, key: `6fjiku` }]]), h = p(`arrow-down-to-line`, [[`path`, { d: `M12 17V3`, key: `1cwfxf` }], [`path`, { d: `m6 11 6 6 6-6`, key: `12ii2o` }], [`path`, { d: `M19 21H5`, key: `150jfl` }]]), g = p(`arrow-up-down`, [[`path`, { d: `m21 16-4 4-4-4`, key: `f6ql7i` }], [`path`, { d: `M17 20V4`, key: `1ejh1v` }], [`path`, { d: `m3 8 4-4 4 4`, key: `11wl7u` }], [`path`, { d: `M7 4v16`, key: `1glfcx` }]]), _ = p(`arrow-up-right`, [[`path`, { d: `M7 7h10v10`, key: `1tivn9` }], [`path`, { d: `M7 17 17 7`, key: `1vkiza` }]]), v = p(`book-open`, [[`path`, { d: `M12 5v16`, key: `1f6ucr` }], [`path`, { d: `M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z`, key: `1fyvmf` }]]), y = p(`check-check`, [[`path`, { d: `M18 6 7 17l-5-5`, key: `116fxf` }], [`path`, { d: `m22 10-7.5 7.5L13 16`, key: `ke71qq` }]]), b = p(`check`, [[`path`, { d: `M20 6 9 17l-5-5`, key: `1gmf2c` }]]), x = p(`chevron-down`, [[`path`, { d: `m6 9 6 6 6-6`, key: `qrunsl` }]]), S = p(`chevron-left`, [[`path`, { d: `m15 18-6-6 6-6`, key: `1wnfg3` }]]), C = p(`chevron-right`, [[`path`, { d: `m9 18 6-6-6-6`, key: `mthhwq` }]]), w = p(`circle-alert`, [[`circle`, { cx: `12`, cy: `12`, r: `10`, key: `1mglay` }], [`line`, { x1: `12`, x2: `12`, y1: `8`, y2: `12`, key: `1pkeuh` }], [`line`, { x1: `12`, x2: `12.01`, y1: `16`, y2: `16`, key: `4dfq90` }]]), T = p(`circle-question-mark`, [[`circle`, { cx: `12`, cy: `12`, r: `10`, key: `1mglay` }], [`path`, { d: `M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3`, key: `1u773s` }], [`path`, { d: `M12 17h.01`, key: `p32p05` }]]), E = p(`clipboard-check`, [[`rect`, { width: `8`, height: `4`, x: `8`, y: `2`, rx: `1`, ry: `1`, key: `tgr4d6` }], [`path`, { d: `M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2`, key: `116196` }], [`path`, { d: `m9 14 2 2 4-4`, key: `df797q` }]]), D = p(`copy`, [[`rect`, { width: `14`, height: `14`, x: `8`, y: `8`, rx: `2`, ry: `2`, key: `17jyea` }], [`path`, { d: `M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2`, key: `zix9uf` }]]), O = p(`download`, [[`path`, { d: `M12 15V3`, key: `m9g1x1` }], [`path`, { d: `M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4`, key: `ih7n3h` }], [`path`, { d: `m7 10 5 5 5-5`, key: `brsn70` }]]), k = p(`file-spreadsheet`, [[`path`, { d: `M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z`, key: `1oefj6` }], [`path`, { d: `M14 2v5a1 1 0 0 0 1 1h5`, key: `wfsgrz` }], [`path`, { d: `M8 13h2`, key: `yr2amv` }], [`path`, { d: `M14 13h2`, key: `un5t4a` }], [`path`, { d: `M8 17h2`, key: `2yhykz` }], [`path`, { d: `M14 17h2`, key: `10kma7` }]]), A = p(`files`, [[`path`, { d: `M15 2h-4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8`, key: `14sh0y` }], [`path`, { d: `M16.706 2.706A2.4 2.4 0 0 0 15 2v5a1 1 0 0 0 1 1h5a2.4 2.4 0 0 0-.706-1.706z`, key: `1970lx` }], [`path`, { d: `M5 7a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h8a2 2 0 0 0 1.732-1`, key: `l4dndm` }]]), j = p(`flower-2`, [[`path`, { d: `M12 5a3 3 0 1 1 3 3m-3-3a3 3 0 1 0-3 3m3-3v1M9 8a3 3 0 1 0 3 3M9 8h1m5 0a3 3 0 1 1-3 3m3-3h-1m-2 3v-1`, key: `3pnvol` }], [`circle`, { cx: `12`, cy: `8`, r: `2`, key: `1822b1` }], [`path`, { d: `M12 10v12`, key: `6ubwww` }], [`path`, { d: `M12 22c4.2 0 7-1.667 7-5-4.2 0-7 1.667-7 5Z`, key: `9hd38g` }], [`path`, { d: `M12 22c-4.2 0-7-1.667-7-5 4.2 0 7 1.667 7 5Z`, key: `ufn41s` }]]), M = p(`globe`, [[`circle`, { cx: `12`, cy: `12`, r: `10`, key: `1mglay` }], [`path`, { d: `M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20`, key: `13o1zl` }], [`path`, { d: `M2 12h20`, key: `9i4pu4` }]]), N = p(`layers`, [[`path`, { d: `M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z`, key: `zw3jo` }], [`path`, { d: `M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12`, key: `1wduqc` }], [`path`, { d: `M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17`, key: `kqbvx6` }]]), P = p(`layout-grid`, [[`rect`, { width: `7`, height: `7`, x: `3`, y: `3`, rx: `1`, key: `1g98yp` }], [`rect`, { width: `7`, height: `7`, x: `14`, y: `3`, rx: `1`, key: `6d4xhi` }], [`rect`, { width: `7`, height: `7`, x: `14`, y: `14`, rx: `1`, key: `nxv5o0` }], [`rect`, { width: `7`, height: `7`, x: `3`, y: `14`, rx: `1`, key: `1bb6yr` }]]), F = p(`link-2`, [[`path`, { d: `M9 17H7A5 5 0 0 1 7 7h2`, key: `8i5ue5` }], [`path`, { d: `M15 7h2a5 5 0 1 1 0 10h-2`, key: `1b9ql8` }], [`line`, { x1: `8`, x2: `16`, y1: `12`, y2: `12`, key: `1jonct` }]]), I = p(`loader-circle`, [[`path`, { d: `M21 12a9 9 0 1 1-6.219-8.56`, key: `13zald` }]]), ee = p(`lock-keyhole`, [[`circle`, { cx: `12`, cy: `16`, r: `1`, key: `1au0dj` }], [`rect`, { x: `3`, y: `10`, width: `18`, height: `12`, rx: `2`, key: `6s8ecr` }], [`path`, { d: `M7 10V7a5 5 0 0 1 10 0v3`, key: `1pqi11` }]]), te = p(`maximize-2`, [[`path`, { d: `M15 3h6v6`, key: `1q9fwt` }], [`path`, { d: `m21 3-7 7`, key: `1l2asr` }], [`path`, { d: `m3 21 7-7`, key: `tjx5ai` }], [`path`, { d: `M9 21H3v-6`, key: `wtvkvv` }]]), ne = p(`minimize-2`, [[`path`, { d: `m14 10 7-7`, key: `oa77jy` }], [`path`, { d: `M20 10h-6V4`, key: `mjg0md` }], [`path`, { d: `m3 21 7-7`, key: `tjx5ai` }], [`path`, { d: `M4 14h6v6`, key: `rmj7iw` }]]), L = p(`pencil`, [[`path`, { d: `M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z`, key: `1a8usu` }], [`path`, { d: `m15 5 4 4`, key: `1mk7zo` }]]), R = p(`plus`, [[`path`, { d: `M5 12h14`, key: `1ays0h` }], [`path`, { d: `M12 5v14`, key: `s699le` }]]), z = p(`refresh-cw`, [[`path`, { d: `M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8`, key: `v9h5vc` }], [`path`, { d: `M21 3v5h-5`, key: `1q7to0` }], [`path`, { d: `M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16`, key: `3uifl3` }], [`path`, { d: `M8 16H3v5`, key: `1cv678` }]]), re = p(`rotate-ccw`, [[`path`, { d: `M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8`, key: `1357e3` }], [`path`, { d: `M3 3v5h5`, key: `1xhq8a` }]]), ie = p(`save`, [[`path`, { d: `M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z`, key: `1c8476` }], [`path`, { d: `M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7`, key: `1ydtos` }], [`path`, { d: `M7 3v4a1 1 0 0 0 1 1h7`, key: `t51u73` }]]), B = p(`search`, [[`path`, { d: `m21 21-4.34-4.34`, key: `14j7rj` }], [`circle`, { cx: `11`, cy: `11`, r: `8`, key: `4ej97u` }]]), ae = p(`settings`, [[`path`, { d: `M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915`, key: `1i5ecw` }], [`circle`, { cx: `12`, cy: `12`, r: `3`, key: `1v7zrd` }]]), V = p(`shield-check`, [[`path`, { d: `M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z`, key: `oel41y` }], [`path`, { d: `m9 12 2 2 4-4`, key: `dzmm74` }]]), oe = p(`sparkles`, [[`path`, { d: `M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z`, key: `1s2grr` }], [`path`, { d: `M20 2v4`, key: `1rf3ol` }], [`path`, { d: `M22 4h-4`, key: `gwowj6` }], [`circle`, { cx: `4`, cy: `20`, r: `2`, key: `6kqj1y` }]]), H = p(`square`, [[`rect`, { width: `18`, height: `18`, x: `3`, y: `3`, rx: `2`, key: `afitv7` }]]), se = p(`table-2`, [[`path`, { d: `M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18`, key: `gugj83` }]]), U = p(`ticket-check`, [[`path`, { d: `M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z`, key: `qn84l0` }], [`path`, { d: `m9 12 2 2 4-4`, key: `dzmm74` }]]), ce = p(`upload`, [[`path`, { d: `M12 3v12`, key: `1x0j5s` }], [`path`, { d: `m17 8-5-5-5 5`, key: `7q97r8` }], [`path`, { d: `M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4`, key: `ih7n3h` }]]), le = p(`x`, [[`path`, { d: `M18 6 6 18`, key: `1bl5f8` }], [`path`, { d: `m6 6 12 12`, key: `d8bk6v` }]]), ue = { siblingRelationship: ``, partnerContract: ``, partnerStudentId: ``, partnerCourse: ``, ownFullDate: ``, partnerFullDate: ``, registrationDate: ``, placementDate: ``, priorFees: null, stoppedDays: null, courseConfirmed: ``, evidenceIds: [], note: `` };
function W(e2) {
  if (typeof e2 != `string` || !/^\d{4}-\d{2}-\d{2}$/.test(e2)) return null;
  let t2 = /* @__PURE__ */ new Date(e2 + `T00:00:00Z`);
  return Number.isFinite(+t2) && t2.toISOString().slice(0, 10) === e2 ? (+t2 - Date.UTC(1899, 11, 30)) / 864e5 : null;
}
function G(e2) {
  let t2 = e2?.paid?.target > 0 ? e2.paid.target : e2?.snapshot?.target;
  if (!(t2 > 0) || e2.warnings?.length) return null;
  let n2 = /* @__PURE__ */ new Map();
  for (let t3 of e2.events ?? []) {
    let e3 = Math.floor(t3.date);
    n2.set(e3, (n2.get(e3) ?? 0) + t3.amount);
  }
  let r2 = 0, i2 = null;
  for (let [e3, a2] of [...n2].sort((e4, t3) => e4[0] - t3[0])) {
    let n3 = r2;
    r2 += a2, r2 < t2 - 1 ? i2 = null : n3 < t2 - 1 && (i2 = e3);
  }
  return r2 >= t2 - 1 ? i2 : null;
}
function de(e2) {
  return { ...ue, ...e2, evidenceIds: [...e2?.evidenceIds ?? []] };
}
var fe = (e2) => String(e2 ?? ``).trim().toUpperCase(), pe = { code: ``, label: ``, studentId: ``, studentName: ``, center: ``, startDate: ``, endDate: ``, type: ``, amount: null, rate: null, minimum: null, maximum: null, status: `PENDING`, approvalNote: `` }, me = new Set(Object.keys(pe));
function he(e2) {
  return Object.fromEntries(Object.entries({ ...pe, ...e2 }).filter(([e3]) => me.has(e3)));
}
function _e() {
  let [e2] = (0, l.useState)(() => new URL(window.location.href).searchParams.get(`dataset`)), [t2, n2] = (0, l.useState)(e2), [r2, i2] = (0, l.useState)(null), [a2, o2] = (0, l.useState)(null), [s2, c2] = (0, l.useState)([]), [u2, d2] = (0, l.useState)(true), [f2, p2] = (0, l.useState)(``), [m2, h2] = (0, l.useState)(/* @__PURE__ */ new Set()), [g2, _2] = (0, l.useState)({}), [v2, y2] = (0, l.useState)(``), [b2, x2] = (0, l.useState)(0), [S2, C2] = (0, l.useState)(false), w2 = (0, l.useRef)({}), T2 = (0, l.useRef)(false), E2 = (0, l.useRef)(/* @__PURE__ */ new Map()), D2 = (0, l.useRef)(null), O2 = (0, l.useRef)(/* @__PURE__ */ new Map()), k2 = (0, l.useRef)(0), A2 = (0, l.useRef)({}), j2 = (0, l.useRef)({}), M2 = (0, l.useRef)(/* @__PURE__ */ new Set()), N2 = (0, l.useCallback)((e3, t3) => new Promise((n3, r3) => {
    let i3 = ++k2.current;
    if (O2.current.set(i3, { resolve: n3, reject: r3 }), !D2.current) {
      O2.current.delete(i3), r3(Error(`Bộ tính chưa sẵn sàng.`));
      return;
    }
    D2.current.postMessage({ type: `calculate`, record: e3, patch: t3, requestId: i3 });
  }), []), P2 = (0, l.useCallback)((e3) => o2((t3) => t3 && updateVoucherCatalogue(t3,e3)), []);
  (0, l.useEffect)(() => {
    let t3 = true, r3 = new AbortController(), a3 = new Worker(`/calculator.worker.mjs`, { type: `module` });
    D2.current = a3;
    let s3, l2, u3 = new Promise((e3, t4) => {
      s3 = e3, l2 = t4;
    });
    return a3.onmessage = ({ data: e3 }) => {
      if (e3.type === `ready`) {
        s3();
        return;
      }
      let t4 = E2.current.get(e3.requestId);
      if (t4) {
        E2.current.delete(e3.requestId), e3.type === `error` ? t4.reject(Error(e3.message)) : t4.resolve(e3);
        return;
      }
      if (e3.type === `error` && !e3.requestId) {
        l2(Error(e3.message));
        return;
      }
      let n3 = O2.current.get(e3.requestId);
      n3 && (O2.current.delete(e3.requestId), e3.type === `error` ? n3.reject(Error(e3.message)) : n3.resolve({ row: e3.row, relatedRows: e3.relatedRows ?? [] }));
    }, a3.onerror = () => {
      let e3 = Error(`Không mở được bộ tính. Vui lòng tải lại trang.`);
      l2(e3), O2.current.forEach((t4) => t4.reject(e3)), O2.current.clear(), E2.current.forEach((t4) => t4.reject(e3)), E2.current.clear();
    }, fetch(`/api/bootstrap` + (e2 ? `?dataset=` + encodeURIComponent(e2) : ``), { cache: `no-store`, signal: r3.signal }).then(async (e3) => {
      let t4 = await e3.json();
      if (!e3.ok) throw Error(t4.error ?? `Không tải được dữ liệu.`);
      return t4;
    }).then(async (e3) => {
      if (!t3) return;
      let r4 = e3.dataset?.id ?? null;
      if (n2(r4), r4) {
        let e4 = new URL(window.location.href);
        e4.searchParams.set(`dataset`, r4), window.history.replaceState(null, ``, e4.href);
      }
      if (a3.postMessage({ type: `init`, datasetId: r4 }), await u3, !t3) return;
      A2.current = e3.edits, w2.current = e3.courseSources ?? {}, j2.current = Object.fromEntries(Object.entries(e3.edits).map(([e4, t4]) => [e4, t4.patch])), a3.postMessage({ type: `patches`, patches: j2.current });
      let s4 = [], l3 = 0;
      e3.needsCalculation && i2({ done: 0, total: e3.records.length, name: e3.source });
      for (let n3 of e3.records) {
        if (!t3) return;
        let r5 = e3.edits[n3.id]?.patch ?? {};
        s4.push(e3.needsCalculation || Object.keys(r5).length || e3.records.some((t4) => e3.edits[t4.id]?.patch.verification?.partnerContract === n3.cells.contractTotal) ? (await N2(n3, r5)).row : n3), l3++, e3.needsCalculation && (l3 % 5 == 0 || l3 === e3.records.length) && i2({ done: l3, total: e3.records.length, name: e3.source });
      }
      t3 && (o2(e3), c2(s4), x2(Object.values(j2.current).filter((e4) => Object.keys(e4).length).length), y2(Object.values(e3.edits).map((e4) => e4.updatedAt).sort().at(-1) ?? ``), d2(false));
    }).catch((e3) => {
      t3 && (p2(e3.message), d2(false));
    }), () => {
      t3 = false, r3.abort(), a3.terminate(), D2.current = null, O2.current.forEach((e3) => e3.reject(Error(`Đã đóng bộ tính.`))), O2.current.clear(), E2.current.forEach((e3) => e3.reject(Error(`Đã đóng bộ tính.`))), E2.current.clear();
    };
  }, [N2, e2]);
  let F2 = (0, l.useCallback)(async (e3, n3) => {
    let r3 = await fetch(`/api/edits`, { method: `PATCH`, headers: { "Content-Type": `application/json` }, body: JSON.stringify({ id: e3.id, version: A2.current[e3.id]?.version ?? 0, patch: n3, datasetId: t2 }) }), i3 = await r3.json();
    if (!r3.ok) {
      let e4 = Error(i3.error ?? `Chưa lưu được thay đổi.`);
      throw e4.conflict = !!i3.conflict, e4;
    }
    i3.vouchers && P2(i3.vouchers), A2.current[e3.id] = { ...i3, ...A2.current[e3.id]?.sourceHistory ? { sourceHistory: A2.current[e3.id].sourceHistory } : {} }, y2(i3.updatedAt), _2((t3) => {
      let n4 = { ...t3 };
      return delete n4[e3.id], n4;
    });
  }, [t2, P2]), I2 = (0, l.useCallback)(async (e3, t3) => {
    if (!(M2.current.has(e3.id) || T2.current)) {
      M2.current.add(e3.id), h2(new Set(M2.current));
      try {
        let n3 = await N2(e3, t3);
        j2.current[e3.id] = t3;
        let r3 = new Map([n3.row, ...n3.relatedRows].map((e4) => [e4.id, e4]));
        c2((e4) => e4.map((e5) => r3.get(e5.id) ?? e5)), x2(Object.values(j2.current).filter((e4) => Object.keys(e4).length).length), await F2(e3, t3);
      } catch (t4) {
        let n3 = t4;
        _2((t5) => ({ ...t5, [e3.id]: { message: n3.message, conflict: !!n3.conflict } }));
      } finally {
        M2.current.delete(e3.id), h2(new Set(M2.current));
      }
    }
  }, [N2, F2]), ee2 = (0, l.useCallback)((e3, t3, n3) => {
    let r3 = { ...j2.current[e3.id] }, i3 = a2?.records.find((t4) => t4.id === e3.id);
    t3 === `reviews` ? r3.reviews = n3 : n3 === (t3 === `approved` ? String(i3?.cells.AG ?? ``).toUpperCase() === `APPROVED` : String(i3?.cells[t3] ?? ``)) ? delete r3[t3] : t3 === `approved` ? r3.approved = !!n3 : r3[t3] = String(n3); I2(e3, r3);
  }, [I2, a2]), te2 = (0, l.useCallback)((e3, t3) => {
    let n3 = { ...j2.current[e3.id] };
    t3 === null ? delete n3.verification : n3.verification = t3, I2(e3, n3);
  }, [I2]), ne2 = (0, l.useCallback)((e3) => void I2(e3, {}), [I2]), L2 = (0, l.useCallback)(async (e3, n3) => {
    if (M2.current.has(e3.id) || T2.current) throw Error(`Chờ lưu hồ sơ đang sửa rồi đọc lại Course info.`);
    let r3 = await fetch(`/api/course-sources`, { method: `PATCH`, headers: { "Content-Type": `application/json` }, body: JSON.stringify({ payload: n3, datasetId: t2, hash: a2?.hash, version: w2.current[n3.ct]?.version ?? 0 }) }), i3 = await r3.json();
    if (!r3.ok) throw Error(i3.error ?? `Chưa lưu được nguồn khóa học.`);
    w2.current = { ...w2.current, [n3.ct]: i3.source };const l2 = await new Promise((e4, t3) => {
      let n4 = ++k2.current;
      if (!D2.current) {
        t3(Error(`Nguồn đã lưu. Tải lại để mở bộ tính.`));
        return;
      }
      E2.current.set(n4, { resolve: e4, reject: t3 }), D2.current.postMessage({ type: `course-source`, requestId: n4, source:i3.source, vouchers:i3.vouchers, record:e3 });
    });
    let s3 = l2.baseline;
    o2((t3) => t3 && { ...updateVoucherCatalogue(t3,i3.vouchers??t3.customVouchers??[]), courseSources: w2.current, groupKocByRecord:{...t3.groupKocByRecord,[e3.id]:t3.groupKocByRecord?.[e3.id]||n3.groupKoc||``}, records: t3.records.map((t4) => t4.id === e3.id ? s3 : t4) });
    let u3 = new Map([l2.row, ...l2.relatedRows].map((e4) => [e4.id, e4]));
    c2((e4) => e4.map((e5) => u3.get(e5.id) ?? e5)), y2(i3.source.updatedAt);return {row:l2.row,source:i3.source};
  }, [N2, t2, a2?.hash]), R2 = (0, l.useCallback)(async (e3, t3) => {
    if (T2.current || M2.current.size) throw Error(`Chờ lưu hồ sơ đang sửa trước khi cập nhật voucher.`);
    T2.current = true, C2(true);
    let n3 = false;
    try {
      let r3 = await fetch(`/api/vouchers`, { method: `PATCH`, headers: { "Content-Type": `application/json` }, body: JSON.stringify({ voucher: e3, version: t3 }) }), i3 = await r3.json();
      if (!r3.ok) {
        let e4 = Error(i3.error ?? `Chưa lưu được voucher.`);
        throw e4.conflict = !!i3.conflict, e4;
      }
      n3 = true, P2(i3.vouchers), y2(i3.voucher.updatedAt), await new Promise((e4, t4) => {
        let n4 = ++k2.current;
        if (!D2.current) {
          t4(Error(`Bộ tính chưa sẵn sàng.`));
          return;
        }
        E2.current.set(n4, { resolve: e4, reject: t4 }), D2.current.postMessage({ type: `vouchers`, requestId: n4, vouchers: i3.vouchers });
      });
      let a3 = /* @__PURE__ */ new Map();
      for (let e4 of s2) if (fe(e4.cells.K) === i3.voucher.code || fe(w2.current[e4.ct||e4.cells.contractTotal]?.giftcode) === i3.voucher.code) {
        let t4 = await N2(e4, j2.current[e4.id] ?? {});
        for (let e5 of [t4.row, ...t4.relatedRows]) a3.set(e5.id, e5);
      }
      return c2((e4) => e4.map((e5) => a3.get(e5.id) ?? e5)), i3.voucher;
    } catch (e4) {
      throw n3 && p2(`Voucher đã lưu. Tải lại trang để đồng bộ bộ tính trước khi tiếp tục.`), e4;
    } finally {
      T2.current = false, C2(false);
    }
  }, [N2, P2, s2]), z2 = (0, l.useCallback)(async () => {
    for (let [e3, t3] of Object.entries(g2)) {
      if (t3.conflict) continue;
      let n3 = s2.find((t4) => t4.id === e3);
      n3 && await I2(n3, j2.current[e3] ?? {});
    }
  }, [g2, s2, I2]);
  return (0, l.useEffect)(() => {
    if (!(m2.size > 0 || S2 || Object.keys(g2).length > 0)) return;
    let e3 = (e4) => {
      e4.preventDefault(), e4.returnValue = ``;
    };
    return window.addEventListener(`beforeunload`, e3), () => window.removeEventListener(`beforeunload`, e3);
  }, [m2, S2, g2]), { datasetId: t2, progress: r2, edits: A2.current, data: a2, rows: s2, loading: u2, fatal: f2, busy: m2, voucherBusy: S2, saveVoucher: R2, saveCourseSource: L2, failures: g2, lastSaved: v2, editCount: b2, change: ee2, verify: te2, restore: ne2, retry: z2, patches: j2.current };
}
var ve = [{ id: 1, name: `01 · INPUT FROM RAW_REPORT`, short: `Input` }, { id: 2, name: `02 · CALCULATED – INDEPENDENT`, short: `Calculated` }, { id: 3, name: `03 · ACTUAL / CONTRACT TỔNG`, short: `Actual` }, { id: 4, name: `04 · DIFF / RESULT`, short: `Diff / Result` }], ye = [{ key: `A`, label: `Center name`, group: 1, width: 155 }, { key: `B`, label: `Center code`, group: 1, width: 130 }, { key: `paymentCode`, label: `Payment code đại diện`, group: 1, width: 210 }, { key: `C`, label: `Contract code`, group: 1, width: 210 }, { key: `contractTotal`, label: `Contract tổng (CT)`, group: 1, width: 230 }, { key: `D`, label: `Invoice date`, group: 1, width: 130, kind: `date` }, { key: `E`, label: `VAT Invoice No.`, group: 1, width: 130 }, { key: `F`, label: `Student ID`, group: 1, width: 160 }, { key: `H`, label: `Course fee KOC`, group: 1, width: 295, kind: `edit` }, { key: `I`, label: `Hour/week`, group: 1, width: 145, kind: `edit` }, { key: `J`, label: `Package`, group: 1, width: 190, kind: `edit` }, { key: `K`, label: `Giftcode No`, group: 1, width: 255, kind: `edit` }, { key: `L`, label: `Discount apply`, group: 1, width: 340, kind: `edit` }, { key: `receiptCount`, label: `Chứng từ thu`, group: 1, width: 130, kind: `number` }, { key: `M`, label: `Amount before discount`, group: 2, width: 180, kind: `money` }, { key: `N`, label: `Discount amount`, group: 2, width: 165, kind: `money` }, { key: `O`, label: `Giftcode amount`, group: 2, width: 165, kind: `money` }, { key: `P`, label: `Khoản bù thêm (P)`, group: 2, width: 165, kind: `money` }, { key: `Q`, label: `Phải đóng theo CT (CALC)`, group: 2, width: 200, kind: `money` }, { key: `R`, label: `Total hour of contract`, group: 2, width: 165, kind: `number` }, { key: `S`, label: `Kỳ trả góp tối đa`, group: 2, width: 155, kind: `number` }, { key: `T`, label: `Amount before discount`, group: 3, width: 180, kind: `money` }, { key: `U`, label: `Discount amount`, group: 3, width: 165, kind: `money` }, { key: `V`, label: `Giftcode amount`, group: 3, width: 165, kind: `money` }, { key: `W`, label: `Tổng thu / phân bổ CT`, group: 3, width: 200, kind: `money` }, { key: `X`, label: `Total hour of contract`, group: 3, width: 165, kind: `number` }, { key: `Y`, label: `Kỳ trả góp lớn nhất đã thu`, group: 3, width: 190 }, { key: `Z`, label: `Amount DIFF`, group: 4, width: 155, kind: `money` }, { key: `AA`, label: `Discount DIFF`, group: 4, width: 155, kind: `money` }, { key: `AB`, label: `Giftcode DIFF`, group: 4, width: 155, kind: `money` }, { key: `AC`, label: `Final payment DIFF`, group: 4, width: 170, kind: `money` }, { key: `AD`, label: `Hour of contract DIFF`, group: 4, width: 160, kind: `number` }, { key: `AE`, label: `Installment CHECK`, group: 4, width: 230, kind: `status` }, { key: `ctCheck`, label: `Đối chiếu tiền theo CT`, group: 4, width: 325, kind: `status` }, { key: `promoCheck`, label: `Điều kiện promotion`, group: 4, width: 285, kind: `status` }, { key: `verificationCheck`, label: `Duyệt điều kiện`, group: 4, width: 225 }, { key: `calcNote`, label: `Chỉ tiêu cần bổ sung`, group: 4, width: 380 }, { key: `verificationNote`, label: `Căn cứ còn thiếu`, group: 4, width: 380 }, { key: `resultNote`, label: `Lý do CHECK còn lại`, group: 4, width: 380 }, { key: `AF`, label: `KẾT QUẢ`, group: 4, width: 115, kind: `status` }, { key: `AG`, label: `Trả góp · Duyệt`, group: 4, width: 165, kind: `approved` }], be = [`B`, `C`, `contractTotal`, `receiptCount`, `H`, `I`, `J`, `K`, `L`, `Q`, `W`, `AC`, `AE`, `ctCheck`, `promoCheck`, `verificationCheck`, `AG`, `AF`], xe = [{ key: `groupKoc`, label: `Group KOC`, group: 1, width: 160 }, { key: `method`, label: `Method`, group: 1, width: 180 }, ...ye.flatMap((e2) => e2.key === `F` ? [e2, { key: `G`, label: `Student name`, group: 1, width: 190 }] : [e2])].map((e2) => ({ ...e2, label: ye.filter((t2) => t2.label === e2.label).length > 1 ? `${e2.label} (${ve.find((t2) => t2.id === e2.group)?.short})` : e2.label })), Se = { H: `Course fee KOC`, I: `Hour/week`, J: `Package`, K: `Giftcode No`, L: `Discount apply` }, K = (e2) => typeof e2 == `number` ? new Intl.NumberFormat(`vi-VN`, { maximumFractionDigits: 2 }).format(e2) : e2 == null || e2 === `` ? `—` : String(e2), q = (e2) => typeof e2 == `number` ? new Date(Date.UTC(1899, 11, 30) + Math.round(e2 * 864e5)).toLocaleDateString(`vi-VN`, { timeZone: `UTC`, day: `2-digit`, month: `2-digit`, year: `numeric` }) : `—`, Ce = (e2) => String(e2.cells.AG ?? ``).trim().toUpperCase() === `APPROVED`, we = `https://hub24.apollo.vn:7777/contract/list`;
function Te(e2) {
  let t2 = typeof e2 == `string` ? e2.trim().toUpperCase() : ``;
  return /^[A-Z0-9]+-CT-\d{4,20}$/.test(t2) ? t2 : null;
}
function J(e2) {
  let t2 = typeof e2 == `string` ? e2.trim().toUpperCase() : ``;
  return /^[A-Z0-9]+-(?:CT|DEP)-\d{4,20}$/.test(t2) ? t2 : null;
}
function Ee(e2) {
  let t2 = J(e2);
  if (!t2) return null;
  let n2 = t2.match(/(\d{2})(\d{2})-(?:CT|DEP)-/), r2 = Number(n2?.[2]);
  if (!n2 || r2 < 1 || r2 > 12) return { from: `2000-01-01`, to: `2099-12-31` };
  let i2 = `20` + n2[1] + `-` + n2[2];
  return { from: i2 + `-01`, to: i2 + `-` + new Date(Date.UTC(Number(`20` + n2[1]), r2, 0)).getUTCDate() };
}
function De(e2) {
  let t2 = J(e2), n2 = Ee(t2);
  if (!t2 || !n2) return null;
  let r2 = new URL(t2.includes(`-DEP-`) ? `/Deposit/manage` : `/contract/list`, `https://hub24.apollo.vn:7777`);
  return r2.searchParams.set(`startDate`, n2.from), r2.searchParams.set(`endDate`, n2.to), r2.searchParams.set(`ps`, `10000`), r2.href;
}
function Oe(e2) {
  let t2 = [], n2 = e2.kind === `contract` ? Te(e2.ct ?? e2.cells?.contractTotal) : null;
  n2 && t2.push(n2);
  for (let n3 of e2.sourceContracts ?? []) {
    let e3 = Te(n3);
    e3 && t2.push(e3);
  }
  for (let n3 of [e2.cells?.C, ...(e2.receipts ?? []).map((e3) => e3.contract)]) {
    let e3 = J(n3);
    e3?.includes(`-DEP-`) && t2.push(e3);
  }
  let r2 = e2.reconciliation ?? e2.account;
  for (let e3 of [...r2?.events ?? [], ...r2?.movementHistory ?? []]) for (let n3 of [e3.from, e3.to]) {
    let e4 = J(n3);
    e4 && t2.push(e4);
  }
  return [...new Set(t2)];
}
function ke(e2, t2) {
  if (typeof e2 != `string` || e2.length > 2048) return null;
  let n2 = e2.trim();
  if (!n2 || /[\s\\\u0000-\u001f\u007f]/.test(n2)) return null;
  try {
    let e3 = new URL(n2);
    if (e3.origin !== `https://hub24.apollo.vn:7777` || e3.username || e3.password) return null;
    let r2 = J(t2)?.includes(`-DEP-`);
    if (t2 && !J(t2)) return null;
    if (r2) {
      let t3 = /^\/deposit\/(?:detail|view)\/\d+\/?$/i.test(e3.pathname) && !e3.search, n3 = [...e3.searchParams], r3 = /^\/deposit\/(?:detail|view)\/?$/i.test(e3.pathname) && n3.length === 1 && [`id`, `depositId`].includes(n3[0][0]) && /^\d+$/.test(n3[0][1]);
      if (!t3 && !r3) return null;
    } else if (!/^\/contract(?:\/|$)/i.test(e3.pathname) || /^\/contract\/(?:list|login|logout)\/?$/i.test(e3.pathname)) return null;
    let i2 = /(?:token|session|password|passwd|secret|credential|authorization|authcode|accesskey|apikey|redirect|returnurl|callback)/i;
    for (let t3 of e3.searchParams.keys()) if (i2.test(t3.replace(/[^a-z0-9]/gi, ``))) return null;
    return e3.hash ? null : e3.href;
  } catch {
    return null;
  }
}
var Ae = `https://hub24.apollo.vn:7777`, je = 9e4;
function Me(e2) {
  return e2 === `payment` ? 30 * 6e4 : je;
}
var Y = Object.freeze({ transfer: { path: `/report/TransferPaymentList`, regionKey: `region`, label: `Transfer PaymentList`, dateField: `Transfer date` }, export: { path: `/report/PaymentByCourse`, regionKey: `regionId`, label: `Payment By Course`, dateField: `Contract full date` }, payment: { path: `/report/PaymentList`, regionKey: `region`, label: `PaymentList`, dateField: `Invoice date`, centers: `87_66_27_59_74_36_95_67_44_45_78` } });
function Ne(e2) {
  if (typeof e2 != `string` || !/^20\d{2}-(?:0[1-9]|1[0-2])$/.test(e2)) return null;
  let [t2, n2] = e2.split(`-`).map(Number), r2 = new Date(Date.UTC(t2, n2, 0)).getUTCDate();
  return { from: e2 + `-01`, to: e2 + `-` + r2 };
}
function Pe(e2, t2, n2 = 1) {
  let r2 = Object.hasOwn(Y, e2) ? Y[e2] : null, i2 = Ne(t2);
  if (!r2 || !i2 || !Number.isSafeInteger(n2) || n2 < 1 || n2 > 1e4) throw Error(`Báo cáo, tháng hoặc số dòng Hub không hợp lệ.`);
  let a2 = new URL(r2.path, Ae);
  for (let [e3, t3] of Object.entries({ fromDate: i2.from, toDate: i2.to, [r2.regionKey]: `1`, ...r2.centers ? { centers: r2.centers } : {}, ps: String(n2) })) a2.searchParams.set(e3, t3);
  return a2.href;
}
function Fe(e2, t2, n2, r2) {
  try {
    let i2 = new URL(e2), a2 = new URL(Pe(t2, n2, r2));
    return !i2.username && !i2.password && !i2.hash && i2.origin === a2.origin && i2.pathname === a2.pathname && [...i2.searchParams].length === [...a2.searchParams].length && [...a2.searchParams].every(([e3, t3]) => i2.searchParams.getAll(e3).length === 1 && i2.searchParams.get(e3) === t3);
  } catch {
    return false;
  }
}
var Ie = (e2) => String(e2 ?? ``).normalize(`NFD`).replace(/[\u0300-\u036f]/g, ``).toLowerCase().replace(/[^a-z0-9]/g, ``);
function Le(e2, t2) {
  if (!Array.isArray(e2) || !e2.length || e2.length > 256 || e2.some((e3) => typeof e3 != `string` || e3.length > 300)) return false;
  let n2 = e2.map(Ie), r2 = (...e3) => e3.some((e4) => n2.includes(e4));
  return t2 === `payment` ? r2(`paymentcode`) && r2(`contractno`, `contractcode`) && r2(`studentid`, `studentcode`) && r2(`invoicedate`) && r2(`vatinvoiceno`) : t2 === `export` ? r2(`contractno`, `contractcode`) && r2(`studentcode`, `studentid`) && r2(`finalpayamountcontract`, `finalpaymentamountcontract`) && r2(`totalfinalpaymentamountinvoice`, `totalinvoiceamount`) : t2 === `transfer` ? r2(`transfertype`) && r2(`transferdate`) && r2(`fromstudentid`) && r2(`tostudentid`) && r2(`fromcontractdepositno`, `fromcontractno`) && r2(`tocontractno`) : false;
}
function Re(e2, t2, n2, r2) {
  if (!Ne(r2) || !Array.isArray(e2) || !Array.isArray(t2)) return `mismatch`;
  if (!t2.length) return `ok`;
  let i2 = Object.hasOwn(Y, n2) ? Ie(Y[n2].dateField) : ``, a2 = e2.map((e3, t3) => Ie(e3) === i2 ? t3 : -1).filter((e3) => e3 >= 0);
  if (!a2.length && n2 === `export` && Le(e2, `export`) && e2.filter((e3) => Ie(e3) === `invoicedate`).length === 1) return `not_rendered`;
  if (!i2 || a2.length !== 1) return `missing`;
  for (let e3 of t2) {
    let t3 = typeof e3?.[a2[0]] == `string` ? e3[a2[0]].trim() : ``, n3 = /^(20\d{2})-(\d{2})-(\d{2})(?:\b|T)/.exec(t3), i3 = /^(\d{1,2})[-/](\d{1,2})[-/](20\d{2})\b/.exec(t3);
    if (!n3 && !i3) return `mismatch`;
    let [o2, s2, c2] = n3 ? n3.slice(1).map(Number) : [Number(i3[3]), Number(i3[2]), Number(i3[1])], l2 = new Date(Date.UTC(o2, s2 - 1, c2));
    if (l2.getUTCFullYear() !== o2 || l2.getUTCMonth() !== s2 - 1 || l2.getUTCDate() !== c2 || `${o2}-${String(s2).padStart(2, `0`)}` !== r2) return `mismatch`;
  }
  return `ok`;
}
function ze(e2, t2, n2) {
  if (!e2 || typeof e2 != `object` || Object.keys(e2).some((e3) => ![`report`, `month`, `url`, `headers`, `rows`, `total`, `capturedAt`].includes(e3)) || e2.report !== t2 || e2.month !== n2 || !Number.isSafeInteger(e2.total) || e2.total < 0 || e2.total > 1e4 || !Fe(e2.url, t2, n2, Math.max(1, e2.total)) || !Le(e2.headers, t2) || !Array.isArray(e2.rows) || e2.rows.length !== e2.total || typeof e2.capturedAt != `string` || !Number.isFinite(Date.parse(e2.capturedAt)) || new Date(e2.capturedAt).toISOString() !== e2.capturedAt) return null;
  let r2 = 0;
  for (let t3 of e2.rows) {
    if (!Array.isArray(t3) || t3.length !== e2.headers.length) return null;
    for (let e3 of t3) if (typeof e3 != `string` || e3.length > 4e3 || (r2 += e3.length, r2 > 12582912)) return null;
  }
  return ![`ok`, `not_rendered`].includes(Re(e2.headers, e2.rows, t2, n2)) || new TextEncoder().encode(JSON.stringify(e2)).length > 12582912 ? null : e2;
}
function Be(e2) {
  if (!e2 || !Object.hasOwn(Y, e2.report) || !Ne(e2.month)) return null;
  let t2 = { report: e2.report, month: e2.month, path: Y[e2.report].path };
  [`report-probe`, `report-full`].includes(e2.stage) && (t2.stage = e2.stage);
  for (let n2 of [`tables`, `tablesScanned`, `tablesDetected`, `frames`, `grids`, `elapsedSeconds`, `columns`, `actualRows`, `expectedRows`, `dateControls`, `regionControls`]) Number.isSafeInteger(e2[n2]) && e2[n2] >= 0 && e2[n2] <= 1e4 && (t2[n2] = e2[n2]);
  return [`loading`, `interactive`, `complete`].includes(e2.documentState) && (t2.documentState = e2.documentState), [`visible`, `hidden`, `prerender`].includes(e2.visibility) && (t2.visibility = e2.visibility), typeof e2.loading == `boolean` && (t2.loading = e2.loading), [`dates`, `region`, `page_size`].includes(e2.filter) && (t2.filter = e2.filter), [`server`, `footer`, `none`, `conflict`].includes(e2.countSource) && (t2.countSource = e2.countSource), Array.isArray(e2.pageSizes) && (t2.pageSizes = [...new Set(e2.pageSizes.filter((e3) => Number.isSafeInteger(e3) && e3 > 0 && e3 <= 1e4))].slice(0, 32)), t2;
}
function Ve(e2) {
  if (!Array.isArray(e2) || !e2.length || e2.length > 2e3) throw Error(`Chọn từ 1 đến 2.000 mã CT / DEP.`);
  let t2 = /* @__PURE__ */ new Map();
  for (let n2 of e2) {
    let e3 = J(n2);
    if (!e3) throw Error(`Mã CT / DEP không hợp lệ.`);
    let r2 = e3.includes(`-DEP-`) ? `deposit` : `contract`, { from: i2, to: a2 } = Ee(e3), o2 = r2 + i2;
    t2.has(o2) || t2.set(o2, { kind: r2, from: i2, to: a2, codes: [] });
    let s2 = t2.get(o2);
    s2.codes.includes(e3) || s2.codes.push(e3);
  }
  return [...t2.values()];
}
function He(e2) {
  let t2 = typeof e2 == `number` && Number.isSafeInteger(e2) ? String(e2) : typeof e2 == `string` ? e2 : ``;
  return /^[1-9]\d{0,14}$/.test(t2) && Number.isSafeInteger(Number(t2)) ? t2 : null;
}
function Ue(e2, t2) {
  let n2 = J(t2);
  if (!n2 || typeof e2 != `string` || e2.length > 2048 || /[\s\\\u0000-\u001f\u007f]/.test(e2)) return null;
  try {
    let t3 = new URL(e2), r2 = n2.includes(`-DEP-`) ? `deposit` : `contract`, i2 = [...t3.searchParams], a2 = RegExp(`^/` + r2 + `/(?:` + (r2 === `contract` ? `detail` : `detail|view`) + `)/([1-9]\\d{0,14})/?$`, `i`).exec(t3.pathname), o2 = r2 === `deposit` && /^\/deposit\/(?:detail|view)\/?$/i.test(t3.pathname) && i2.length === 1 && [`id`, `depositId`].includes(i2[0][0]) && He(i2[0][1]), s2 = a2 && !t3.search ? He(a2[1]) : o2 || null;
    return t3.origin !== `https://hub24.apollo.vn:7777` || t3.username || t3.password || t3.hash || !s2 || t3.href !== e2 ? null : { kind: r2, id: s2, url: t3.href };
  } catch {
    return null;
  }
}
function We(e2, t2) {
  let n2;
  try {
    n2 = new Set(Ve(t2).flatMap((e3) => e3.codes));
  } catch {
    return null;
  }
  if (!Array.isArray(e2) || e2.length > n2.size) return null;
  let r2 = /* @__PURE__ */ new Map(), i2 = /* @__PURE__ */ new Map();
  for (let t3 of e2) {
    if (!t3 || Object.keys(t3).some((e4) => ![`ct`, `url`].includes(e4))) return null;
    let e3 = J(t3.ct);
    if (!e3 || !n2.has(e3) || typeof t3.url != `string`) return null;
    let a2 = Ue(t3.url, e3);
    if (!a2) return null;
    let o2 = a2.kind + `:` + a2.id;
    if (r2.has(e3) && Ue(r2.get(e3), e3).id !== a2.id || i2.has(o2) && i2.get(o2) !== e3) return null;
    r2.has(e3) || r2.set(e3, a2.url), i2.set(o2, e3);
  }
  return [...r2].map(([e3, t3]) => ({ ct: e3, url: t3 }));
}
var Ge = (e2) => String(e2 ?? ``).trim().replace(/\s+/g, ` `);
function Ke(e2) { return validateHubCourseRequest(e2); }
function qe(e2,t2) { return validateHubCoursePayload(e2,t2); }
var Je = `promotion-hub/v1`, Ye = `1.6.13`, X = (e2, t2 = `bridge`, n2) => Object.assign(Error(e2), { code: t2, diagnostic: n2 });
function Xe(e2, t2, n2, r2, i2 = {}) {
  let a2 = i2.window ?? window;
  return new Promise((o2, s2) => {
    let c2 = Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join(''), l2 = () => a2.postMessage({ channel: Je, direction: `request`, action: `cancel`, id: c2 }, a2.location.origin), u2 = () => {
      clearTimeout(m2), a2.removeEventListener(`message`, f2), r2?.removeEventListener(`abort`, d2);
    }, d2 = () => {
      l2(), u2(), s2(X(`Đã dừng tìm Hub.`, `cancelled`));
    }, f2 = (r3) => {
      let l3 = r3.data;
      if (!(r3.source !== a2 || r3.origin !== a2.location.origin || !l3 || l3.channel !== Je || l3.direction !== `response` || l3.id !== c2)) {
        if (l3.type === `progress`) {
          e2 !== `ping` && [`login`, `search`, `detail`, `index`, `report-probe`, `report-full`].includes(l3.phase) && (clearTimeout(m2), m2 = setTimeout(p2, i2.timeoutMs ?? (l3.phase === `login` ? 10 * 6e4 : e2 === `report` ? Me(t2?.report) + 3e4 : e2 === `index` ? 6e4 : 4e4))), n2?.(l3.message ?? `Đang tìm trên Hub…`);
          return;
        }
        l3.type !== `error` && l3.type !== { ping: `ready`, lookup: `result`, report: `report-result`, index: `index-result`, course: `course-result` }[e2] || (u2(), l3.type === `error` ? s2(X(l3.message ?? `Chưa tìm được link Hub.`, l3.code, l3.diagnostic)) : o2(l3));
      }
    }, p2 = () => {
      e2 !== `ping` && l2(), u2(), s2(X(e2 === `ping` ? `Chưa kết nối cầu nối. Cài tiện ích rồi tải lại Promotion.` : `Lượt Hub đã hết hạn. Kiểm tra Hub và thử lại.`, e2 === `ping` ? `bridge` : `timeout`));
    }, m2 = setTimeout(p2, i2.timeoutMs ?? (e2 === `ping` ? 1600 : e2 === `course` ? 12e4 : e2 === `report` ? Me(t2?.report) + 3e4 : e2 === `index` ? 6e4 : 4e4));
    if (a2.addEventListener(`message`, f2), r2?.addEventListener(`abort`, d2, { once: true }), r2?.aborted) {
      d2();
      return;
    }
    a2.postMessage({ channel: Je, direction: `request`, action: e2, id: c2, ...e2 === `course` ? { course: t2 } : e2 === `index` ? { codes: t2 } : e2 === `report` ? { report: t2 } : { ct: t2 } }, a2.location.origin);
  });
}
async function Ze(e2, t2, n2, r2) {
  if (!Ke(e2)) throw X(`Cần link chi tiết CT nhận hợp lệ để đọc Course info.`, `course_invalid`);
  let i2 = qe((await Xe(`course`, e2, t2, n2, r2)).payload, e2);
  if (!i2) throw X(`Thông tin khóa học không khớp CT / học viên đang mở. Chưa lưu.`, `course_invalid`);
  return i2;
}
async function Qe(e2, t2, n2, r2, i2) {
  let a2 = ze((await Xe(`report`, { report: e2, month: t2 }, n2, r2, i2)).payload, e2, t2);
  if (!a2) throw X(`Báo cáo trả về sai loại, tháng, North hoặc thiếu dòng. Chưa nhập bộ nguồn.`, `report_invalid`);
  return a2;
}
async function $e(e2, t2, n2, r2) {
  let i2 = /* @__PURE__ */ new Map();
  for (let a2 of Ve(e2)) {
    let e3 = We((await Xe(`index`, a2.codes, t2, n2, r2)).links, a2.codes);
    if (!e3) throw X(`Danh sách trả về có mã, ID hoặc link không hợp lệ; chưa lưu.`, `index_invalid`);
    for (let t3 of e3) i2.set(t3.ct, t3.url);
  }
  return i2;
}
function et(e2, t2, n2, r2) {
  let i2 = new Set(Ve(e2).flatMap((e3) => e3.codes)), a2;
  return async (o2) => {
    if (!i2.has(o2)) throw X(`Mã không thuộc lượt đọc danh sách; chưa lưu.`, `mismatch`);
    if (n2?.aborted) throw X(`Đã dừng tìm Hub.`, `cancelled`);
    let s2 = (await (a2 ??= $e(e2, t2, n2, r2))).get(o2);
    if (n2?.aborted) throw X(`Đã dừng tìm Hub.`, `cancelled`);
    if (!s2) throw X(`Chưa có trong danh sách đã đọc. Chưa gắn link; có thể kiểm tra hoặc gắn thủ công.`, `index_unresolved`, { stage: `index`, path: o2.includes(`-DEP-`) ? `/deposit/manage` : `/contract/list` });
    return t2?.(`Đã khớp ${o2} trong danh sách Hub; đang lưu link…`), { type: `result`, id: `index`, ct: o2, url: s2 };
  };
}
async function tt(e2, t2) {
  let n2 = [...new Set(e2.map(J).filter(Boolean))].map((e3) => ({ ct: e3, status: `queued` })), r2 = () => t2.update(n2.map((e3) => ({ ...e3 })));
  r2();
  let i2 = null;
  for (let e3 of n2) {
    if (t2.stopped()) break;
    e3.status = `checking`, r2();
    let n3 = null;
    try {
      let i3 = await t2.load(e3.ct);
      if (t2.stopped()) {
        e3.status = `queued`, r2();
        break;
      }
      if (i3 && ke(i3.url, e3.ct)) {
        t2.saved(i3), e3.status = `existing`, r2();
        continue;
      }
      e3.status = `searching`, r2();
      let a2 = await t2.lookup(e3.ct), o2 = ke(a2.url, e3.ct);
      if (a2.type !== `result` || a2.ct !== e3.ct || !o2) throw Object.assign(Error(`Kết quả không khớp mã đang tìm; chưa lưu.`), { code: `mismatch` });
      n3 = { ct: e3.ct, url: o2, version: i3?.version ?? 0 }, t2.pending(n3), e3.status = `saving`, r2();
      let s2 = await t2.save(n3);
      t2.saved(s2), t2.pending(null), e3.status = `saved`, r2();
    } catch (t3) {
      let a2 = t3?.code ?? (n3 ? `save` : `bridge`);
      if (e3.status = a2 === `index_unresolved` ? `unresolved` : a2 === `not_found` ? `missing` : a2 === `cancelled` ? `stopped` : `failed`, e3.message = String(t3?.message ?? `Chưa hoàn tất tìm link Hub.`).slice(0, 2e3), e3.code = a2, t3?.diagnostic && (e3.diagnostic = t3.diagnostic), r2(), a2 === `index_unresolved` || a2 === `not_found`) continue;
      i2 = t3;
      break;
    }
  }
  return { rows: n2, error: i2 };
}
var Z = n(), nt = (0, l.createContext)(null);
async function rt(e2, t2) {
  let n2 = new URLSearchParams({ ct: e2 });
  t2 && n2.set(`dataset`, t2);
  let r2 = await fetch(`/api/hub-links?` + n2, { cache: `no-store`, signal: AbortSignal.timeout(2e4) }), i2 = await r2.json();
  if (!r2.ok) throw Error(i2.error ?? `Chưa tải được phiên bản liên kết.`);
  return i2.link ?? null;
}
async function it(e2) {
  let t2 = await fetch(`/api/hub-links`, { method: `PATCH`, headers: { "Content-Type": `application/json` }, body: JSON.stringify(e2) }), n2 = await t2.json();
  if (!t2.ok || !n2.link) throw Error(n2.error ?? `Chưa lưu được link vừa tìm. Bấm Thử lưu lại.`);
  return n2.link;
}
function at(e2, t2, onLinked) {
  let [n2, r2] = (0, l.useState)(``), [i2, a2] = (0, l.useState)(false), [o2, s2] = (0, l.useState)(false), [c2, u2] = (0, l.useState)(false), [d2, f2] = (0, l.useState)(``), [p2, m2] = (0, l.useState)(``), [h2, g2] = (0, l.useState)([]), [_2, v2] = (0, l.useState)(null), y2 = (0, l.useRef)(false), b2 = (0, l.useRef)(false), x2 = (0, l.useRef)(null), S2 = (0, l.useRef)(null), C2 = (0, l.useCallback)(async () => {
    s2(true);
    try {
      let e3 = await Xe(`ping`);
      r2(e3.version ?? ``);
      let t3 = e3.type === `ready` && e3.version === `1.6.13`;
      return a2(t3), t3;
    } catch {
      return r2(``), a2(false), false;
    } finally {
      s2(false);
    }
  }, []);
  (0, l.useEffect)(() => (C2(), () => {
    b2.current = true, x2.current?.abort();
  }), [C2]), (0, l.useEffect)(() => {
    if (!c2 && !_2) return;
    let e3 = (e4) => {
      e4.preventDefault(), e4.returnValue = ``;
    };
    return window.addEventListener(`beforeunload`, e3), () => window.removeEventListener(`beforeunload`, e3);
  }, [c2, _2]);
  let w2 = (e3) => {
    S2.current = e3, v2(e3);
  };
  return { available: i2, version: n2, checking: o2, busy: c2, message: d2, error: p2, progress: { done: h2.filter((e3) => [`saved`, `existing`, `unresolved`, `missing`, `failed`, `stopped`].includes(e3.status)).length, total: h2.length }, results: h2, pending: _2, connect: C2, run: async (n3) => {
    if (y2.current || S2.current) return;
    let r3 = [...new Set(n3.map(J).filter((e3) => !!e3))];
    if (!r3.length) {
      f2(`Các CT / DEP đang chọn đã có link hoặc chưa xác định được mã CT / DEP.`);
      return;
    }
    y2.current = true, b2.current = false, u2(true), m2(``), g2(r3.map((e3) => ({ ct: e3, status: `queued` })));
    try {
      if (!await C2()) throw Error(`Cài cầu nối theo hướng dẫn bên dưới, rồi tải lại Promotion và kiểm tra kết nối.`);
      x2.current = new AbortController();
      let n4 = await tt(r3, { stopped: () => b2.current, update: g2, load: (t3) => rt(t3, e2), lookup: et(r3, f2, x2.current.signal), pending: (t3) => w2(t3 ? { ...t3, datasetId: e2 } : null), save: (t3) => it({ ...t3, datasetId: e2 }), saved: t2 });
      if (n4.error) throw n4.error;
      if(!b2.current)onLinked?.(r3);
      let i3 = n4.rows.filter((e3) => e3.status === `unresolved`).length;
      f2(b2.current ? `Đã dừng; các mã chưa thử vẫn chờ.` : i3 ? `Đã gắn các mã khớp; ${i3} mã chưa có trong danh sách đã đọc, mở danh sách đúng tháng để kiểm tra hoặc gắn thủ công.` : `Đã hoàn tất gắn link cho các mã trong lượt này.`);
    } catch (e3) {
      m2(e3 instanceof Error ? e3.message : `Chưa hoàn tất tìm link Hub.`), f2(`Lượt tìm đã dừng. Xem từng mã đã thử bên dưới; các mã còn chờ chưa được kết luận.`);
    } finally {
      x2.current = null, y2.current = false, u2(false);
    }
  }, stop: () => {
    b2.current = true, x2.current?.abort();
  }, retrySave: async () => {
    let e3 = S2.current;
    if (!(!e3 || y2.current)) {
      y2.current = true, u2(true), m2(``);
      try {
        let n3 = await rt(e3.ct, e3.datasetId);
        if (n3?.url === e3.url) {
          t2(n3), w2(null), g2((t3) => t3.map((t4) => t4.ct === e3.ct ? { ct: t4.ct, status: `saved` } : t4)), f2(`Link đã được lưu.`);
          return;
        }
        if ((n3?.version ?? 0) !== e3.version) throw Error(`Link đã được thay đổi ở phiên khác. Mở hồ sơ để kiểm tra bản mới; không ghi đè tự động.`);
        t2(await it(e3)), w2(null), g2((t3) => t3.map((t4) => t4.ct === e3.ct ? { ct: t4.ct, status: `saved` } : t4)), f2(`Đã lưu link vừa tìm.`);
      } catch (e4) {
        m2(e4 instanceof Error ? e4.message : `Chưa lưu được link.`);
      } finally {
        y2.current = false, u2(false);
      }
    }
  }, discard: () => {
    y2.current || (w2(null), m2(``), f2(`Đã bỏ kết quả chưa lưu.`));
  } };
}
function ot({ auto: e2, count: t2, onStart: n2, onClose: r2 }) {
  return (0, Z.jsxs)(`section`, { className: `hub-auto-panel`, "aria-label": `Tự gắn link CT / DEP Hub`, children: [(0, Z.jsxs)(`div`, { className: `hub-panel-heading`, children: [(0, Z.jsxs)(`div`, { children: [(0, Z.jsxs)(`h2`, { children: [(0, Z.jsx)(F, { size: 18 }), `Tự gắn link Hub`] }), (0, Z.jsx)(`p`, { children: `Dùng tab Hub đã mở, đọc danh sách theo tháng và gắn cặp mã–ID hoặc link đúng dòng; không tạo hay chuyển tab. Không mở từng hồ sơ để kiểm tra ID tồn tại; bạn không cần tự mở F12.` })] }), (0, Z.jsx)(`button`, { className: `icon-button`, "aria-label": `Đóng phần tự gắn link Hub`, onClick: r2, disabled: e2.busy, children: (0, Z.jsx)(le, { size: 16 }) })] }), (0, Z.jsxs)(`div`, { className: `hub-contract-actions`, children: [(0, Z.jsx)(`span`, { className: `hub-bridge-status ${e2.available ? `ready` : ``}`, children: e2.checking ? `Đang kiểm tra…` : e2.available ? `Cầu nối ${Ye} đã kết nối` : e2.version ? `Cần cập nhật cầu nối ${e2.version}` : `Chưa kết nối cầu nối` }), (0, Z.jsxs)(`button`, { className: `secondary-button`, onClick: () => void e2.connect(), disabled: e2.checking || e2.busy, children: [(0, Z.jsx)(z, { size: 14 }), `Kiểm tra kết nối`] }), (0, Z.jsxs)(`button`, { className: `primary-button`, onClick: n2, disabled: e2.busy || e2.checking || !e2.available || !t2 || !!e2.pending, children: [e2.busy ? (0, Z.jsx)(I, { size: 14, className: `spin` }) : (0, Z.jsx)(F, { size: 14 }), `Tự gắn `, t2, ` mã CT / DEP đang lọc chưa có link`] }), e2.busy ? (0, Z.jsxs)(`button`, { className: `secondary-button`, onClick: e2.stop, children: [(0, Z.jsx)(H, { size: 13 }), `Dừng lượt tìm`] }) : null] }), e2.available ? null : (0, Z.jsxs)(`div`, { className: `hub-setup`, children: [(0, Z.jsx)(`h3`, { children: e2.version ? `Cập nhật cầu nối lên ${Ye}` : `Cài cầu nối một lần trên Chrome / Edge` }), (0, Z.jsx)(`p`, { children: `Cài trên trình duyệt bạn dùng mở Hub. Cầu nối dùng phiên Hub đang đăng nhập; khi Hub hết phiên, bạn đăng nhập lại ngay tại Hub.` }), (0, Z.jsxs)(`ol`, { children: [(0, Z.jsxs)(`li`, { children: [(0, Z.jsxs)(`a`, { href: `/downloads/promotion-hub-bridge.zip?v=1.6.13`, download: true, children: [(0, Z.jsx)(O, { size: 14 }), `Tải cầu nối Hub`] }), ` và giải nén ZIP vào một thư mục cố định.`] }), (0, Z.jsxs)(`li`, { children: [`Mở `, (0, Z.jsx)(`code`, { children: `chrome://extensions` }), ` (Edge: `, (0, Z.jsx)(`code`, { children: `edge://extensions` }), `), bật `, (0, Z.jsx)(`strong`, { children: `Developer mode` }), `, chọn `, (0, Z.jsx)(`strong`, { children: `Load unpacked` }), ` và thư mục có `, (0, Z.jsx)(`code`, { children: `manifest.json` }), `.`] }), (0, Z.jsxs)(`li`, { children: [`Nếu đã cài bản cũ, giải nén đè vào thư mục đã cài và bấm nút `, (0, Z.jsx)(`strong`, { children: `Tải lại tiện ích` }), ` trong trang extensions.`] }), (0, Z.jsxs)(`li`, { children: [`Tải lại Promotion, bấm `, (0, Z.jsx)(`strong`, { children: `Kiểm tra kết nối` }), `, sau đó `, (0, Z.jsx)(`strong`, { children: `Tự gắn mã` }), `.`] })] }), (0, Z.jsx)(`p`, { className: `source-note`, children: `CT đọc ở Contract; DEP đọc link thật ở Deposit, theo tháng YYMM trong mã. Mã chưa có trong danh sách đã đọc được giữ để kiểm tra hoặc gắn thủ công. Cầu nối chỉ chạy trên Promotion và Hub Apollo. Mật khẩu, cookie và phiên đăng nhập không được gửi sang Promotion. Luồng Hub thật chưa được kiểm tra trong phiên này do lỗi kết nối; nếu Hub đổi giao diện, lượt đọc sẽ dừng để kiểm tra.` })] }), (0, Z.jsx)(`p`, { className: `source-note`, children: `Bấm mã có màu và gạch chân để mở hồ sơ trong tab Hub. Hub và trình duyệt công ty có thể ghi nhật ký truy cập; code không tự thông báo cho IT. Quyền truy cập website do công ty quyết định.` }), (0, Z.jsxs)(`p`, { className: `hub-auto-progress`, role: `status`, "aria-live": `polite`, children: [e2.progress.total ? `${e2.progress.done}/${e2.progress.total} mã · ` : ``, e2.message || `Chọn bộ lọc trên bảng để xác định các CT / DEP cần gắn. Mã đã có link được giữ nguyên.`] }), e2.results.length ? (0, Z.jsxs)(`div`, { className: `hub-run-results`, children: [(0, Z.jsxs)(`p`, { children: [(0, Z.jsxs)(`strong`, { children: [e2.results.filter((e3) => [`saved`, `existing`].includes(e3.status)).length, ` đã có link`] }), ` · `, e2.results.filter((e3) => e3.status === `unresolved`).length, ` chưa khớp danh sách · `, e2.results.filter((e3) => e3.status === `failed`).length, ` lỗi · `, e2.results.filter((e3) => e3.status === `queued`).length, ` chưa thử`] }), (0, Z.jsxs)(`details`, { children: [(0, Z.jsxs)(`summary`, { children: [`Kết quả từng mã (`, e2.results.length, `)`] }), (0, Z.jsx)(`div`, { className: `hub-results-scroll`, children: (0, Z.jsxs)(`table`, { children: [(0, Z.jsx)(`thead`, { children: (0, Z.jsxs)(`tr`, { children: [(0, Z.jsx)(`th`, { children: `Mã CT / DEP` }), (0, Z.jsx)(`th`, { children: `Trạng thái` }), (0, Z.jsx)(`th`, { children: `Chi tiết` })] }) }), (0, Z.jsx)(`tbody`, { children: e2.results.map((e3) => (0, Z.jsxs)(`tr`, { children: [(0, Z.jsx)(`td`, { children: De(e3.ct) && [`unresolved`, `missing`].includes(e3.status) ? (0, Z.jsx)(`a`, { className: `hub-code-link`, href: De(e3.ct), target: `_blank`, rel: `noopener noreferrer`, referrerPolicy: `no-referrer`, title: `Mở danh sách Hub đúng tháng YYMM`, children: e3.ct }) : e3.ct }), (0, Z.jsx)(`td`, { children: { queued: `Chưa thử`, checking: `Kiểm tra link đã lưu`, searching: `Đang tra danh sách Hub`, saving: `Đang lưu`, saved: `Đã gắn link`, existing: `Đã có link`, unresolved: `Chưa có trong danh sách đã đọc`, missing: `Không tìm thấy`, failed: `Lỗi — chưa kết luận`, stopped: `Đã dừng` }[e3.status] }), (0, Z.jsxs)(`td`, { children: [e3.message ?? ``, [`unresolved`, `missing`].includes(e3.status) && De(e3.ct) ? (0, Z.jsx)(`small`, { children: (0, Z.jsx)(`a`, { href: De(e3.ct), target: `_blank`, rel: `noopener noreferrer`, referrerPolicy: `no-referrer`, children: `Mở danh sách Hub đúng tháng` }) }) : null] })] }, e3.ct)) })] }) }), (0, Z.jsxs)(`button`, { className: `secondary-button`, onClick: () => {
    let t3 = URL.createObjectURL(new Blob([JSON.stringify({ bridge: Ye, results: e2.results }, null, 2)], { type: `application/json` })), n3 = document.createElement(`a`);
    n3.href = t3, n3.download = `promotion-hub-diagnostic.json`, n3.click(), setTimeout(() => URL.revokeObjectURL(t3), 1e3);
  }, children: [(0, Z.jsx)(O, { size: 14 }), `Tải báo cáo tìm link`] })] })] }) : null, e2.error ? (0, Z.jsx)(`p`, { className: `hub-error`, role: `alert`, children: e2.error }) : null, e2.pending ? (0, Z.jsxs)(`div`, { className: `hub-pending`, children: [(0, Z.jsxs)(`strong`, { children: [`Link đã tìm nhưng chưa lưu: `, e2.pending.ct] }), (0, Z.jsx)(`a`, { href: e2.pending.url, target: `_blank`, rel: `noopener noreferrer`, referrerPolicy: `no-referrer`, children: `Mở link vừa tìm` }), (0, Z.jsx)(`button`, { className: `secondary-button`, disabled: e2.busy, onClick: () => void e2.retrySave(), children: `Thử lưu lại` }), (0, Z.jsx)(`button`, { className: `quiet-button`, disabled: e2.busy, onClick: e2.discard, children: `Bỏ kết quả chưa lưu` })] }) : null] });
}
function st({ ct: e2, link: t2, onAttach: n2, compact = false }) {
  let r2 = ke(t2?.url, e2), i2 = De(e2), a2 = (0, l.useContext)(nt);
  return (0, Z.jsxs)(`div`, { className: `hub-contract-cell`, children: [r2 || i2 ? (0, Z.jsx)(`a`, { className: `hub-code-link`, href: r2 ?? i2, target: `_blank`, rel: `noopener noreferrer`, referrerPolicy: `no-referrer`, "aria-label": r2 ? `Mở ${e2} trên Hub` : `Mở danh sách Hub theo tháng của ${e2}`, title: r2 ? `Mở hồ sơ chi tiết` : `Chưa có link chi tiết · mở danh sách đúng tháng YYMM`, children: e2 }) : (0, Z.jsx)(`span`, { children: e2 || `—` }), e2 && !r2 && !compact ? (0, Z.jsxs)(Z.Fragment, { children: [(0, Z.jsxs)(`button`, { type: `button`, disabled: a2?.busy, onClick: () => a2 ? a2.lookup(e2) : n2(), children: [(0, Z.jsx)(F, { size: 12 }), `Tìm link tự động`] }), (0, Z.jsx)(`button`, { type: `button`, onClick: n2, children: `Gắn thủ công` })] }) : null] });
}
function ct({ ct: e2, link: t2, datasetId: n2, onSaved: r2, onDirty: i2 }) {
  let [a2, o2] = (0, l.useState)(t2?.url ?? ``), [s2, c2] = (0, l.useState)(false), [u2, d2] = (0, l.useState)(``), [f2, p2] = (0, l.useState)(false), [m2, h2] = (0, l.useState)(false), [g2, v2] = (0, l.useState)(``), y2 = (0, l.useContext)(nt), x2 = e2.includes(`-DEP-`), S2 = (0, l.useRef)(null), C2 = (0, l.useRef)(null), w2 = a2.trim() !== (t2?.url ?? ``), T2 = ke(t2?.url, e2), E2 = !!(a2.trim() && !ke(a2, e2));
  (0, l.useEffect)(() => {
    o2(t2?.url ?? ``), d2(``), p2(false);
  }, [t2?.url, t2?.version]), (0, l.useEffect)(() => {
    i2(w2 || s2);
    let e3 = (e4) => {
      e4.preventDefault(), e4.returnValue = ``;
    };
    return (w2 || s2) && window.addEventListener(`beforeunload`, e3), () => window.removeEventListener(`beforeunload`, e3);
  }, [w2, s2, i2]), (0, l.useEffect)(() => () => {
    C2.current && clearTimeout(C2.current);
  }, []);
  let O2 = async (i3) => {
    if (!s2) {
      c2(true), d2(``), v2(``);
      try {
        let a3 = await fetch(`/api/hub-links`, { method: `PATCH`, headers: { "Content-Type": `application/json` }, body: JSON.stringify({ ct: e2, datasetId: n2, url: i3.trim(), version: t2?.version ?? 0 }) }), s3 = await a3.json();
        if (!a3.ok || !s3.link) throw p2(!!s3.conflict), Error(s3.error ?? `Chưa lưu được liên kết.`);
        r2(s3.link), o2(s3.link.url), p2(false), v2(s3.link.url ? `Đã lưu liên kết Hub.` : `Đã gỡ liên kết Hub.`);
      } catch (e3) {
        d2(e3 instanceof Error ? e3.message : `Chưa lưu được liên kết.`);
      } finally {
        c2(false);
      }
    }
  }, k2 = async () => {
    if (!s2) {
      c2(true), d2(``);
      try {
        let t3 = new URLSearchParams({ ct: e2 });
        n2 && t3.set(`dataset`, n2);
        let i3 = await fetch(`/api/hub-links?` + t3, { cache: `no-store` }), a3 = await i3.json();
        if (!i3.ok) throw Error(a3.error ?? `Chưa tải được liên kết.`);
        r2(a3.link ?? { ct: e2, url: ``, version: 0, updatedAt: `` }), o2(a3.link?.url ?? ``), p2(false), v2(`Đã tải liên kết mới.`);
      } catch (e3) {
        d2(e3 instanceof Error ? e3.message : `Chưa tải được liên kết.`);
      } finally {
        c2(false);
      }
    }
  }, A2 = async () => {
    try {
      await navigator.clipboard.writeText(e2), h2(true), C2.current && clearTimeout(C2.current), C2.current = setTimeout(() => h2(false), 1800);
    } catch {
      d2(`Trình duyệt chưa cho sao chép. Chọn mã bên dưới để sao chép thủ công.`);
    }
  };
  return (0, Z.jsxs)(`section`, { className: `hub-contract-panel`, "aria-label": `Liên kết CT / DEP trên Hub`, children: [(0, Z.jsxs)(`div`, { className: `hub-panel-heading`, children: [(0, Z.jsxs)(`div`, { children: [(0, Z.jsxs)(`h3`, { children: [(0, Z.jsx)(F, { size: 16 }), x2 ? `Deposit` : `Contract`, ` trên Hub`] }), (0, Z.jsx)(`p`, { children: `Mở hồ sơ ở tab mới và giữ bảng đối chiếu tại đây.` })] }), T2 ? (0, Z.jsxs)(`a`, { className: `primary-button`, href: T2, target: `_blank`, rel: `noopener noreferrer`, referrerPolicy: `no-referrer`, children: [`Mở `, x2 ? `Deposit` : `Contract`, ` trên Hub`, (0, Z.jsx)(_, { size: 15 })] }) : null] }), (0, Z.jsxs)(`div`, { className: `hub-contract-actions`, children: [y2 ? (0, Z.jsxs)(`button`, { className: `primary-button`, disabled: y2.busy || s2 || w2, onClick: () => y2.lookup(e2), children: [(0, Z.jsx)(F, { size: 14 }), `Tìm & gắn link tự động`] }) : null, (0, Z.jsxs)(`a`, { className: `secondary-button`, href: De(e2) ?? (x2 ? `https://hub24.apollo.vn:7777/deposit/manage` : `https://hub24.apollo.vn:7777/contract/list`), target: `_blank`, rel: `noopener noreferrer`, referrerPolicy: `no-referrer`, children: [`Mở danh sách Hub đúng tháng`, (0, Z.jsx)(_, { size: 14 })] }), (0, Z.jsxs)(`button`, { className: `secondary-button`, type: `button`, onClick: () => void A2(), children: [m2 ? (0, Z.jsx)(b, { size: 14 }) : (0, Z.jsx)(D, { size: 14 }), ` `, m2 ? `Đã sao chép` : `Sao chép mã`] }), (0, Z.jsx)(`code`, { children: e2 })] }), (0, Z.jsx)(`p`, { className: `hub-instructions`, children: `Chọn Tìm & gắn link tự động sau khi cài cầu nối Hub một lần. Cầu nối lấy cặp mã–ID hoặc link đúng dòng trong danh sách rồi gắn ngay, không mở từng hồ sơ để kiểm tra ID. Mã chưa khớp có thể dán link thủ công ở dưới. Link đã lưu dùng lại qua các đợt dữ liệu; Hub có thể yêu cầu đăng nhập lại nếu hết phiên.` }), (0, Z.jsxs)(`label`, { className: `hub-url-label`, children: [(0, Z.jsxs)(`span`, { children: [`URL chi tiết `, x2 ? `deposit` : `contract`, ` trên Hub`] }), (0, Z.jsx)(`input`, { ref: S2, type: `url`, value: a2, onChange: (e3) => {
    o2(e3.target.value), v2(``);
  }, maxLength: 2048, placeholder: `Dán đường dẫn chi tiết từ thanh địa chỉ Hub`, disabled: s2 || y2?.busy, autoComplete: `off`, spellCheck: false, "aria-invalid": E2, "aria-describedby": `hub-link-help` })] }), (0, Z.jsxs)(`p`, { id: `hub-link-help`, className: `source-note`, children: [`Chỉ lưu link chi tiết `, x2 ? `deposit` : `contract`, ` trên hub24.apollo.vn:7777. Link dùng để mở hợp đồng; số tiền, ưu đãi và trạng thái duyệt vẫn được đối chiếu riêng.`] }), E2 ? (0, Z.jsx)(`p`, { className: `hub-error`, role: `alert`, children: `Dùng URL chi tiết đúng loại CT / DEP, không dùng trang danh sách, URL đăng nhập hay đường dẫn chứa token.` }) : null, u2 ? (0, Z.jsxs)(`div`, { className: `hub-error`, role: `alert`, children: [u2, f2 ? (0, Z.jsx)(`button`, { className: `quiet-button`, type: `button`, disabled: s2, onClick: () => void k2(), children: `Tải liên kết mới (bỏ nội dung đang nhập)` }) : null] }) : null, (0, Z.jsxs)(`div`, { className: `hub-save-actions`, children: [(0, Z.jsxs)(`button`, { className: `secondary-button`, type: `button`, disabled: s2 || y2?.busy || !w2 || E2 || f2, onClick: () => void O2(a2), children: [s2 ? (0, Z.jsx)(I, { size: 14, className: `spin` }) : (0, Z.jsx)(F, { size: 14 }), `Lưu liên kết`] }), t2?.url ? (0, Z.jsx)(`button`, { className: `quiet-button`, type: `button`, disabled: s2 || y2?.busy || f2, onClick: () => void O2(``), children: `Gỡ liên kết` }) : null, (0, Z.jsx)(`span`, { role: `status`, children: s2 ? `Đang lưu liên kết…` : g2 || (w2 ? `Liên kết chưa lưu` : ``) })] })] });
}
var lt = (e2, t2) => e2.date - t2.date || String(e2.payment ?? e2.id ?? ``).localeCompare(String(t2.payment ?? t2.id ?? ``));
function ut(e2) {
  let t2 = e2.cells.contractTotal;
  if (!t2) return [];
  let n2 = e2.reconciliation?.events ?? [], r2 = /* @__PURE__ */ new Map();
  for (let t3 of [...n2, ...e2.reconciliation?.movementHistory ?? []]) {
    if (!t3.from || !t3.to) continue;
    let e3 = JSON.stringify([t3.payment, t3.from, t3.to]);
    r2.has(e3) || r2.set(e3, t3);
  }
  let i2 = /* @__PURE__ */ new Map();
  for (let e3 of r2.values()) {
    let t3 = i2.get(e3.to) ?? [];
    t3.push(e3), i2.set(e3.to, t3);
  }
  let a2 = 0, o2 = (e3, t3) => {
    let n3 = /* @__PURE__ */ new Map();
    for (let t4 of i2.get(e3) ?? []) {
      let e4 = n3.get(t4.from) ?? [];
      e4.push(t4), n3.set(t4.from, e4);
    }
    return [...n3].map(([e4, n4]) => {
      n4.sort(lt);
      let r3 = t3.has(e4), s2 = /* @__PURE__ */ new Set([...t3, e4]), c2 = !r3 && (t3.size >= 32 || a2 >= 2e3) && i2.has(e4);
      return a2++, { code: e4, date: n4[0].date, amount: n4.reduce((e5, t4) => e5 + Math.abs(t4.amount), 0), fundedAmount: n4.filter((e5) => e5.invoiceBacked).reduce((e5, t4) => e5 + Math.abs(t4.amount), 0), invoiceBacked: n4.every((e5) => e5.invoiceBacked), invoiceIds: [...new Set(n4.flatMap((e5) => e5.invoiceIds ?? []))], events: n4, cycle: r3, truncated: c2, children: r3 || c2 ? [] : o2(e4, s2) };
    }).sort((e4, t4) => e4.date - t4.date);
  };
  return o2(t2, /* @__PURE__ */ new Set([t2]));
}
function dt(e2) {
  let t2 = e2.receipts ?? [];
  return ut(e2).map((e3) => {
    let n2 = [], r2 = /* @__PURE__ */ new Set(), i2 = /* @__PURE__ */ new Set(), a2 = (e4) => {
      if (e4.cycle || e4.truncated) {
        n2.push({ kind: `notice`, code: e4.code, cycle: e4.cycle, truncated: e4.truncated });
        return;
      }
      for (let t3 of e4.children) a2(t3);
      for (let i3 of t2.filter((t3) => t3.contract === e4.code)) r2.has(i3.id) || (r2.add(i3.id), n2.push({ kind: `receipt`, receipt: i3 }));
      for (let r3 of e4.events) {
        let e5 = JSON.stringify([r3.payment, r3.from, r3.to]);
        if (i2.has(e5)) continue;
        i2.add(e5);
        let a3 = t2.filter((e6) => r3.invoiceIds?.includes(e6.id));
        n2.push({ kind: `transfer`, event: r3, invoices: a3 });
      }
    };
    return a2(e3), { code: e3.code, amount: e3.amount, fundedAmount: e3.fundedAmount, invoiceBacked: e3.invoiceBacked, steps: n2 };
  });
}
var ft = (e2) => e2 ? e2.split(`-`).reverse().join(`/`) : `Chưa công bố`;
function pt({ refs: e2 }) {
  return (0, Z.jsxs)(`details`, { className: `evidence-refs`, children: [(0, Z.jsxs)(`summary`, { children: [`Căn cứ nguồn (`, e2.length, `)`] }), e2.map((e3, t2) => (0, Z.jsxs)(`p`, { children: [(0, Z.jsx)(`strong`, { children: e3.file }), (0, Z.jsx)(`br`, {}), e3.sheet, ` · dòng `, e3.rows?.join(`, `) ?? e3.row] }, t2))] });
}
function mt() {
  return (0, Z.jsx)(`thead`, { children: (0, Z.jsxs)(`tr`, { children: [(0, Z.jsx)(`th`, { children: `Ngày` }), (0, Z.jsx)(`th`, { children: `VAT Invoice No.` }), (0, Z.jsx)(`th`, { children: `Payment code` }), (0, Z.jsx)(`th`, { children: `Mã CT / DEP` }), (0, Z.jsx)(`th`, { children: `Số tiền` }), (0, Z.jsx)(`th`, { children: `Căn cứ` })] }) });
}
function ht({ receipt: e2, doc: t2, total: n2 }) {
  return (0, Z.jsxs)(`tr`, { className: `payment-original`, "data-document": e2.contract, children: [(0, Z.jsx)(`td`, { children: q(e2.date) }), (0, Z.jsx)(`td`, { children: (0, Z.jsx)(`strong`, { children: e2.vat || `Chưa có số VAT` }) }), (0, Z.jsxs)(`td`, { children: [(0, Z.jsx)(`strong`, { children: e2.payment }), (0, Z.jsxs)(`small`, { children: [e2.method ?? `Chưa rõ phương thức`, e2.term ? ` · ${e2.term}` : ``] })] }), (0, Z.jsxs)(`td`, { children: [t2(e2.contract), (0, Z.jsx)(`small`, { children: e2.contract === n2 ? `Thu trực tiếp · Contract tổng` : `Hóa đơn gốc` }), e2.verified ? null : (0, Z.jsx)(`small`, { className: `invoice-pending`, children: `Thiếu VAT / trạng thái Paid hoặc dữ liệu mâu thuẫn · chưa gộp CT` })] }), (0, Z.jsx)(`td`, { className: `numeric`, children: K(e2.amount) }), (0, Z.jsx)(`td`, { children: (0, Z.jsx)(pt, { refs: e2.refs }) })] });
}
function gt({ row: e2, doc: t2, flows: n2 = dt(e2) }) {
  let r2 = String(e2.cells.contractTotal ?? ``);
  return (0, Z.jsxs)(`div`, { className: `payment-movement in`, children: [(0, Z.jsx)(`h4`, { children: `Moving-in · Phân bổ vào CT` }), (0, Z.jsx)(`p`, { className: `evidence-caption`, children: `Hóa đơn gốc ở trên; contract tổng ở dòng cuối mỗi luồng.` }), n2.length ? (0, Z.jsx)(`div`, { className: `ledger-scroll`, children: (0, Z.jsxs)(`table`, { className: `payment-table payment-flow-table`, children: [(0, Z.jsx)(mt, {}), n2.map((e3) => (0, Z.jsx)(`tbody`, { className: `payment-flow`, "data-source": e3.code, children: e3.steps.map((e4, n3) => {
    if (e4.kind === `receipt`) return (0, Z.jsx)(ht, { receipt: e4.receipt, doc: t2, total: r2 }, `receipt:` + e4.receipt.id);
    if (e4.kind === `notice`) return (0, Z.jsx)(`tr`, { children: (0, Z.jsxs)(`td`, { colSpan: 6, className: `invoice-pending`, children: [e4.cycle ? `Luồng chuyển vòng` : `Luồng dài · chưa hiển thị hết`, ` · `, t2(e4.code), ` · kiểm tra các dòng Transfer trong nguồn.`] }) }, `notice:` + n3);
    let i2 = e4.event, a2 = i2.transferPayments ?? [], o2 = i2.to === r2;
    return (0, Z.jsxs)(`tr`, { className: `payment-transfer${o2 ? ` payment-transfer-total` : ``}`, "data-document": i2.to, title: `Chuyển từ ${i2.from} · ${i2.kind}`, children: [(0, Z.jsx)(`td`, { children: (0, Z.jsxs)(`span`, { className: `payment-flow-date`, children: [(0, Z.jsx)(m, { className: `payment-flow-arrow`, size: 17, "aria-label": `Chuyển tiếp` }), q(i2.date)] }) }), (0, Z.jsx)(`td`, { children: e4.invoices.length ? e4.invoices.map((e5) => (0, Z.jsx)(`strong`, { className: `payment-vat-origin`, title: `VAT gốc của ${e5.contract} · ${e5.payment}`, children: e5.vat }, e5.id)) : (0, Z.jsx)(`span`, { title: `Chưa xác định VAT gốc đủ điều kiện`, children: `—` }) }), (0, Z.jsx)(`td`, { children: a2.length === 1 ? (0, Z.jsx)(`strong`, { children: a2[0] }) : a2.length > 1 ? (0, Z.jsxs)(Z.Fragment, { children: [(0, Z.jsx)(`span`, { className: `invoice-pending`, children: `Payment chuyển mâu thuẫn` }), a2.map((e5) => (0, Z.jsx)(`small`, { children: e5 }, e5))] }) : (0, Z.jsx)(`span`, { className: `payment-missing`, title: `Chưa có Payment code chuyển trong nguồn`, children: `—` }) }), (0, Z.jsxs)(`td`, { children: [t2(i2.to), (0, Z.jsxs)(`small`, { className: `payment-destination`, children: [o2 ? `Contract tổng` : `Trung gian`, i2.invoiceBacked ? (0, Z.jsx)(b, { size: 13, "aria-label": `Có hóa đơn đã thanh toán` }) : null] }), i2.invoiceBacked ? null : (0, Z.jsx)(`span`, { className: `invoice-pending`, children: `Chưa đủ hóa đơn · chưa gộp CT` })] }), (0, Z.jsx)(`td`, { className: `numeric`, children: K(Math.abs(i2.amount)) }), (0, Z.jsx)(`td`, { children: (0, Z.jsx)(pt, { refs: i2.refs }) })] }, `transfer:` + i2.payment + `:` + n3);
  }) }, e3.code))] }) }) : (0, Z.jsx)(`p`, { className: `evidence-caption`, children: `Chưa có dòng chuyển vào trong nguồn đang dùng.` }), (0, Z.jsxs)(`p`, { className: `evidence-caption`, children: [`Chuyển vào đủ hóa đơn: `, (0, Z.jsx)(`strong`, { children: K(e2.reconciliation?.transferIn ?? e2.cells.P) }), ` ₫ · không cộng lặp vào tổng thu.`] })] });
}
function _t({ row: e2, hubLinks: t2, onAttach: n2 }) {
  const linked=Oe(e2),doc=(code,compact=false)=>linked.includes(code)?(0,Z.jsx)(st,{ct:code,link:t2[code],onAttach:()=>n2(code),compact}):(0,Z.jsx)(`strong`,{children:code||`Chưa xác định`});
  return (0,Z.jsx)(PaymentInfo,{row:e2,doc,SourceRefs:pt,date:q,money:K});
}
function vt({ program: e2, activePeriod: t2, recordVerified: n2 = false }) {
  let r2 = t2?.from ?? e2.from, i2 = t2?.to ?? e2.to, a2 = n2 ? `confirmed` : e2.state, o2 = n2 ? `Sibling đã có căn cứ` : t2 ? `Cần xác minh hồ sơ` : e2.state === `confirmed` ? `Có nguồn chính sách` : e2.state === `partial` ? `Cần đối chiếu thêm` : `Chưa xác minh`;
  return (0, Z.jsxs)(`article`, { className: `program-card`, children: [(0, Z.jsxs)(`div`, { className: `program-head`, children: [(0, Z.jsx)(`h3`, { children: e2.title }), (0, Z.jsx)(`span`, { className: `policy-badge ${a2}`, children: o2 })] }), (0, Z.jsxs)(`p`, { className: `policy-window`, children: [(0, Z.jsxs)(`strong`, { children: [ft(r2), ` → `, ft(i2)] }), t2 ? (0, Z.jsxs)(`span`, { children: [`Thời hạn đang áp dụng cho hồ sơ: `, t2.title] }) : null, e2.renewFrom ? (0, Z.jsxs)(`span`, { children: [`Học viên hiện tại: từ `, ft(e2.renewFrom)] }) : null, e2.registrationDeadline ? (0, Z.jsxs)(`span`, { children: [`Hạn đăng ký: `, ft(e2.registrationDeadline)] }) : null, e2.extensionTo ? (0, Z.jsxs)(`span`, { children: [`Sau 05/10 đến `, ft(e2.extensionTo), `: cần RCM duyệt`] }) : null] }), (0, Z.jsx)(`p`, { className: `program-benefit`, children: e2.benefit }), (0, Z.jsx)(`ul`, { children: e2.conditions.map((e3, t3) => (0, Z.jsx)(`li`, { children: e3 }, t3)) }), (0, Z.jsxs)(`p`, { className: `stacking`, children: [(0, Z.jsx)(`strong`, { children: `Cộng gộp: ` }), e2.stacking] }), (0, Z.jsx)(pt, { refs: [...e2.refs, ...t2?.refs ?? []] })] });
}
function yt({ account: e2 }) {
  let t2 = typeof e2.difference == `number` ? e2.difference : null, n2 = e2.events.filter((e3) => e3.invoiceBacked), r2 = n2.filter((e3) => !e3.from).reduce((e3, t3) => e3 + t3.amount, 0), i2 = n2.filter((t3) => t3.to === e2.ct).reduce((e3, t3) => e3 + t3.amount, 0), a2 = -n2.filter((t3) => t3.from === e2.ct).reduce((e3, t3) => e3 + t3.amount, 0);
  return (0, Z.jsxs)(`section`, { className: `contract-summary`, "aria-label": `Summary`, children: [(0, Z.jsxs)(`div`, { className: `program-head`, children: [(0, Z.jsx)(`h3`, { children: `Summary` }), (0, Z.jsx)(`span`, { className: `policy-badge ${!e2.blocking ? `confirmed` : `partial`}`, children: e2.status })] }), (0, Z.jsxs)(`div`, { className: `contract-summary-grid`, children: [(0, Z.jsxs)(`div`, { children: [(0, Z.jsx)(`span`, { children: `Phải đóng theo CT (CALC)` }), (0, Z.jsx)(`strong`, { children: K(e2.calcTarget) })] }), (0, Z.jsxs)(`div`, { children: [(0, Z.jsx)(`span`, { children: `Đã nhận / phân bổ ròng` }), (0, Z.jsx)(`strong`, { children: K(e2.received) })] }), (0, Z.jsxs)(`div`, { children: [(0, Z.jsx)(`span`, { children: t2 === null || t2 === 0 ? `Chênh lệch CALC / tổng thu` : t2 > 0 ? `Thừa so với CALC` : `Còn thiếu theo CALC` }), (0, Z.jsx)(`strong`, { children: t2 === null ? `Chưa đủ căn cứ` : K(Math.abs(t2)) })] })] }), e2.ct ? (0, Z.jsxs)(`p`, { className: `evidence-caption`, children: [`Thu trực tiếp `, K(r2), ` + phân bổ vào `, K(i2), ` − chuyển ra `, K(a2), ` = `, (0, Z.jsx)(`strong`, { children: K(e2.net) }), `. Chỉ tính các khoản có hóa đơn thu gốc đã thanh toán.`] }) : null, typeof e2.target === `number` ? (0, Z.jsxs)(`p`, {className:`evidence-caption`,children:[`Giá trị CT tại nguồn / Export: `,K(e2.target),` ₫. Nguồn này được giữ để truy vết.`]}) : null, e2.unallocatedDeposit > 0 ? (0, Z.jsxs)(`p`, { className: `evidence-caption`, children: [`Cọc còn chưa phân bổ: `, (0, Z.jsx)(`strong`, { children: K(e2.unallocatedDeposit) })] }) : null, e2.warnings.length ? (0, Z.jsx)(`ul`, { className: `evidence-warnings`, children: e2.warnings.map((e3) => (0, Z.jsx)(`li`, { children: e3 }, e3)) }) : null, e2.unlinkedDeposits.length ? (0, Z.jsxs)(`details`, { className: `unlinked-funds`, children: [(0, Z.jsxs)(`summary`, { children: [`Cọc chưa có liên kết CT (`, e2.unlinkedDeposits.length, `)`] }), (0, Z.jsx)(`p`, { children: `Các khoản này chưa cộng vào CT đang xem.` }), e2.unlinkedDeposits.map((e3, t3) => (0, Z.jsxs)(`div`, { children: [(0, Z.jsxs)(`span`, { children: [e3.contract, ` · `, e3.payment, ` · `, q(e3.date)] }), (0, Z.jsx)(`strong`, { children: K(e3.amount) }), (0, Z.jsx)(pt, { refs: e3.refs })] }, t3))] }) : null] });
}
function bt({ record: e2, datasetId: t2, selected: n2, disabled: r2, onChange: i2, onBusy: a2 }) {
  let [o2, s2] = (0, l.useState)(false), [c2, u2] = (0, l.useState)([]), [d2, f2] = (0, l.useState)(false), [p2, m2] = (0, l.useState)(``), h2 = new URLSearchParams({ record: e2, ...t2 ? { dataset: t2 } : {} }).toString();
  (0, l.useEffect)(() => {
    if (!o2) return;
    let e3 = new AbortController();
    return f2(true), m2(``), fetch(`/api/evidence?` + h2, { cache: `no-store`, signal: e3.signal }).then(async (e4) => {
      let t3 = await e4.json();
      if (!e4.ok || !Array.isArray(t3.files)) throw Error(t3.error ?? `Chưa tải được căn cứ.`);
      u2(t3.files);
    }).catch((t3) => {
      e3.signal.aborted || m2(t3.message);
    }).finally(() => {
      e3.signal.aborted || f2(false);
    }), () => e3.abort();
  }, [o2, h2]);
  let g2 = async (r3) => {
    let o3 = r3.target.files?.[0];
    if (r3.target.value = ``, o3) {
      if (!o3.size || o3.size > 5242880) {
        m2(`Chọn file từ 1 byte đến 5 MB.`);
        return;
      }
      if (n2.length >= 8) {
        m2(`Mỗi xác minh chọn tối đa 8 căn cứ.`);
        return;
      }
      a2(true), m2(``);
      try {
        let r4 = new FormData();
        r4.append(`file`, o3), r4.append(`record`, e2), t2 && r4.append(`dataset`, t2);
        let a3 = await fetch(`/api/evidence`, { method: `POST`, body: r4 }), s3 = await a3.json();
        if (!a3.ok || !s3.file) throw Error(s3.error ?? `Chưa tải được file.`);
        u2((e3) => [s3.file, ...e3.filter((e4) => e4.id !== s3.file.id)]), i2([.../* @__PURE__ */ new Set([...n2, s3.file.id])]);
      } catch (e3) {
        m2(e3 instanceof Error ? e3.message : `Chưa tải được file.`);
      } finally {
        a2(false);
      }
    }
  };
  return (0, Z.jsxs)(`details`, { className: `verification-evidence`, onToggle: (e3) => s2(e3.currentTarget.open), children: [(0, Z.jsxs)(`summary`, { children: [`Căn cứ xác minh · `, n2.length, ` đã chọn`] }), (0, Z.jsx)(`p`, { children: `Chọn căn cứ cho thông tin đã đối chiếu, rồi lưu xác minh.` }), (0, Z.jsx)(`input`, { type: `file`, "aria-label": `Thêm căn cứ xác minh`, accept: `.pdf,.png,.jpg,.jpeg,.xlsx,.csv,.txt`, disabled: r2, onChange: (e3) => void g2(e3) }), d2 ? (0, Z.jsx)(`p`, { role: `status`, children: `Đang tải danh sách…` }) : null, p2 ? (0, Z.jsx)(`p`, { role: `alert`, className: `verification-error`, children: p2 }) : null, c2.map((e3) => (0, Z.jsxs)(`label`, { children: [(0, Z.jsx)(`input`, { type: `checkbox`, checked: n2.includes(e3.id), disabled: r2 || !n2.includes(e3.id) && n2.length >= 8, onChange: (t3) => i2(t3.target.checked ? [...n2, e3.id] : n2.filter((t4) => t4 !== e3.id)) }), (0, Z.jsx)(LocalFileLink, { href: `/api/evidence/file?id=` + encodeURIComponent(e3.id), target: `_blank`, rel: `noopener noreferrer`, children: e3.fileName })] }, e3.id))] });
}
var xt = (e2) => e2 === null ? `` : new Date(Date.UTC(1899, 11, 30) + e2 * 864e5).toISOString().slice(0, 10), St = (e2) => {
  let t2 = de(e2.verification?.input);
  return e2.verification?.hasInput ? t2 : { ...t2, ownFullDate: xt(G(e2.reconciliation)) };
};
function Ct({ row: e2, partners: t2, datasetId: n2, version: r2, recordedAt: i2, disabled: a2, onSave: o2, onDirty: s2 }) {
  let [c2, u2] = (0, l.useState)(() => St(e2)), [d2, f2] = (0, l.useState)(false), p2 = JSON.stringify(St(e2)), m2 = JSON.stringify(c2) !== p2;
  (0, l.useEffect)(() => {
    u2(St(e2));
  }, [e2.id, JSON.stringify(e2.verification?.input ?? {})]), (0, l.useEffect)(() => (s2(m2 || d2), () => s2(false)), [m2, d2, s2]);
  let h2 = (e3, t3) => u2((n3) => ({ ...n3, [e3]: t3 })), g2 = t2.filter((t3) => t3.kind === `contract` && t3.id !== e2.id), _2 = (e3) => {
    let t3 = g2.find((t4) => String(t4.cells.contractTotal).toUpperCase() === e3.toUpperCase());
    u2((n3) => ({ ...n3, partnerContract: t3 ? String(t3.cells.contractTotal) : e3, ...t3 ? { partnerStudentId: String(t3.cells.F ?? ``), partnerCourse: /^ATLS/i.test(String(t3.cells.H)) ? `ATLS` : /IELTS/i.test(String(t3.cells.H)) ? `IELTS` : ``, partnerFullDate: xt(G(t3.reconciliation)) } : {} }));
  }, v2 = e2.verification?.siblingRequired, y2 = e2.verification?.loyaltyRequired, b2 = e2.verification?.courseRequired, x2 = a2 || d2;
  return (0, Z.jsxs)(`section`, { className: `verification-panel`, "aria-label": `Xác minh hồ sơ`, children: [(0, Z.jsxs)(`div`, { className: `verification-heading`, children: [(0, Z.jsxs)(`div`, { children: [(0, Z.jsx)(E, { size: 18 }), (0, Z.jsx)(`h3`, { children: `Xác minh hồ sơ` })] }), (0, Z.jsx)(`span`, { className: m2 || e2.verification?.pending.length ? `verification-pending` : `verification-recorded`, children: m2 ? `Thông tin chưa lưu` : e2.verification?.pending.length ? `${e2.verification.pending.length} mục cần bổ sung` : e2.verification?.hasInput ? `Đã ghi nhận xác nhận` : `Theo nguồn hiện có` })] }), (0, Z.jsx)(`p`, { className: `evidence-caption`, children: `Điền thông tin đã đối chiếu. Có thể lưu hồ sơ còn thiếu; điều kiện chưa đủ dữ liệu hoặc căn cứ vẫn hiển thị CHECK.` }), m2 ? (0, Z.jsx)(`p`, { className: `verification-draft-note`, children: `Lưu xác minh & tính lại để cập nhật kết quả.` }) : e2.verification?.pending.length ? (0, Z.jsx)(`ol`, { className: `verification-actions`, children: e2.verification.pending.map((e3) => (0, Z.jsx)(`li`, { children: e3 }, e3)) }) : null, !m2 && e2.verification?.siblingRelationshipConfirmed ? (0, Z.jsxs)(`p`, { className: `verification-relationship`, children: [`Đã xác nhận hai học viên là anh/chị/em ruột.`, e2.verification.siblingVerified ? `` : ` Điều kiện gói học còn cần đối chiếu.`] }) : null, e2.verification?.registrationRequired ? (0,Z.jsxs)(`fieldset`, {disabled:x2,children:[(0,Z.jsx)(`legend`,{children:`Học bổng ghi danh trong ngày`}), (0,Z.jsx)(`div`,{className:`verification-grid`,children:(0,Z.jsx)(RegistrationFields,{value:c2,onChange:h2,disabled:x2,required:true})}), (0,Z.jsx)(`p`,{children:`Đối chiếu hai ngày và chọn căn cứ ghi danh/kiểm tra trình độ bên dưới.`})]}) : null, v2 ? (0, Z.jsxs)(`fieldset`, { disabled: x2, children: [(0, Z.jsx)(`legend`, { children: `Gói 36 tháng chia đôi · mỗi CT 18 tháng` }), (0, Z.jsxs)(`div`, { className: `verification-grid`, children: [(0, Z.jsxs)(`label`, { children: [(0, Z.jsx)(`span`, { children: `Hai học viên là anh/chị/em ruột?` }), (0, Z.jsxs)(`select`, { value: c2.siblingRelationship, onChange: (e3) => h2(`siblingRelationship`, e3.target.value), children: [(0, Z.jsx)(`option`, { value: ``, children: `Chưa xác nhận` }), (0, Z.jsx)(`option`, { value: `yes`, children: `Có · đã đối chiếu hồ sơ` }), (0, Z.jsx)(`option`, { value: `no`, children: `Không` })] })] }), (0, Z.jsxs)(`label`, { children: [(0, Z.jsx)(`span`, { children: `Contract tổng của học viên đối ứng` }), (0, Z.jsx)(`input`, { list: `verification-partners`, value: c2.partnerContract, maxLength: 150, onChange: (e3) => _2(e3.target.value.trim()), placeholder: `Chọn CT hoặc nhập mã có trong minh chứng` }), (0, Z.jsx)(`datalist`, { id: `verification-partners`, children: g2.map((e3) => (0, Z.jsxs)(`option`, { value: String(e3.cells.contractTotal), children: [String(e3.cells.G), ` · `, String(e3.cells.F)] }, e3.id)) })] }), (0, Z.jsxs)(`label`, { children: [(0, Z.jsx)(`span`, { children: `Student ID đối ứng` }), (0, Z.jsx)(`input`, { value: c2.partnerStudentId, maxLength: 150, onChange: (e3) => h2(`partnerStudentId`, e3.target.value.trim()) })] }), (0, Z.jsxs)(`label`, { children: [(0, Z.jsx)(`span`, { children: `Chương trình của học viên đối ứng` }), (0, Z.jsxs)(`select`, { value: c2.partnerCourse, onChange: (e3) => h2(`partnerCourse`, e3.target.value), children: [(0, Z.jsx)(`option`, { value: ``, children: `Chưa rõ` }), (0, Z.jsx)(`option`, { value: `ATLS`, children: `ATLS` }), (0, Z.jsx)(`option`, { value: `IELTS`, children: `IELTS` }), (0, Z.jsx)(`option`, { value: `OTHER`, children: `Chương trình khác` })] })] }), (0, Z.jsxs)(`label`, { children: [(0, Z.jsx)(`span`, { children: `Ngày đóng đủ phí · CT này` }), (0, Z.jsx)(`input`, { type: `date`, value: c2.ownFullDate, onInput: (e3) => h2(`ownFullDate`, e3.target.value), onChange: (e3) => h2(`ownFullDate`, e3.target.value) })] }), (0, Z.jsxs)(`label`, { children: [(0, Z.jsx)(`span`, { children: `Ngày đóng đủ phí · CT đối ứng` }), (0, Z.jsx)(`input`, { type: `date`, value: c2.partnerFullDate, onInput: (e3) => h2(`partnerFullDate`, e3.target.value), onChange: (e3) => h2(`partnerFullDate`, e3.target.value) })] })] }), (0, Z.jsx)(`p`, { children: `Ngày full có trong sổ thu được điền gợi ý để đối chiếu. CT ngoài bộ dữ liệu hiện tại cần ghi đủ Student ID, chương trình và căn cứ trong file.` })] }) : null, y2 ? (0, Z.jsxs)(`fieldset`, { disabled: x2, children: [(0, Z.jsx)(`legend`, { children: `Lịch sử để xét tháng tặng loyalty` }), (0, Z.jsxs)(`div`, { className: `verification-grid`, children: [(0, Z.jsxs)(`label`, { children: [(0, Z.jsx)(`span`, { children: `Học phí đã đóng trước đợt này (VND)` }), (0, Z.jsx)(`input`, { type: `number`, min: 0, max: 1e13, step: 1, value: c2.priorFees ?? ``, placeholder: `Để trống nếu chưa rõ`, onChange: (e3) => h2(`priorFees`, e3.target.value === `` ? null : Number(e3.target.value)) })] }), (0, Z.jsxs)(`label`, { children: [(0, Z.jsx)(`span`, { children: `Số ngày ngừng học` }), (0, Z.jsx)(`input`, { type: `number`, min: 0, max: 36500, step: 1, value: c2.stoppedDays ?? ``, placeholder: `0 nếu học liên tục và đã xác minh`, onChange: (e3) => h2(`stoppedDays`, e3.target.value === `` ? null : Number(e3.target.value)) })] })] }), (0, Z.jsx)(`p`, { children: `Để trống là chưa xác định. Chỉ nhập 0 khi có căn cứ xác nhận không có khoản đóng trước hoặc không ngừng học. Tháng tặng tính theo RULE đúng thời kỳ.` })] }) : null, b2 ? (0, Z.jsxs)(`fieldset`, { disabled: x2, children: [(0, Z.jsx)(`legend`, { children: `Thông tin khóa học từ hợp đồng` }), (0, Z.jsxs)(`label`, { children: [(0, Z.jsx)(`span`, { children: `Đã đối chiếu Course fee KOC, Hour/week và Package?` }), (0, Z.jsxs)(`select`, { value: c2.courseConfirmed, onChange: (e3) => h2(`courseConfirmed`, e3.target.value), children: [(0, Z.jsx)(`option`, { value: ``, children: `Chưa xác nhận` }), (0, Z.jsx)(`option`, { value: `yes`, children: `Đã đối chiếu với hợp đồng / Export` }), (0, Z.jsx)(`option`, { value: `no`, children: `Thông tin còn khác nhau` })] })] }), (0, Z.jsx)(`p`, { children: `Điền đủ ba trường tại Course info trước khi xác nhận. Căn cứ còn thiếu tiếp tục được báo để kiểm tra.` })] }) : null, v2 || y2 || b2 || e2.verification?.registrationRequired ? (0, Z.jsx)(bt, { record: e2.id, datasetId: n2, selected: c2.evidenceIds, disabled: x2, onChange: (e3) => h2(`evidenceIds`, e3), onBusy: f2 }) : null, (0, Z.jsxs)(`label`, { className: `verification-note`, children: [(0, Z.jsx)(`span`, { children: `Ghi chú đối chiếu / căn cứ áp dụng` }), (0, Z.jsx)(`textarea`, { value: c2.note, maxLength: 4e3, rows: 3, disabled: x2, onChange: (e3) => h2(`note`, e3.target.value), placeholder: `Ghi rõ tài liệu, ngày, hai mã CT và kết quả đối chiếu…` })] }), (0, Z.jsxs)(`div`, { className: `verification-footer`, children: [(0, Z.jsxs)(`button`, { className: `quiet-button`, disabled: x2, onClick: () => {
    u2(St(e2)), o2(null);
  }, children: [(0, Z.jsx)(re, { size: 13 }), `Bỏ xác nhận đã lưu`] }), (0, Z.jsx)(`span`, { children: m2 ? `Có thông tin chưa lưu` : e2.verification?.hasInput ? `Xác nhận hiện tại đã lưu` : `Chưa ghi nhận xác nhận thủ công` }), (0, Z.jsxs)(`button`, { className: `primary-button`, disabled: x2 || !m2 && e2.verification?.hasInput, onClick: () => o2(c2), children: [(0, Z.jsx)(E, { size: 15 }), `Lưu xác minh & tính lại`] })] }), (0, Z.jsx)(`p`, { className: `evidence-caption`, children: `Xác nhận chỉ áp dụng cho điều kiện đã đủ dữ liệu và có minh chứng. Các kiểm tra tiền, giá, thời hạn, voucher và Approved trả góp tiếp tục được đối chiếu riêng.` }), e2.verification?.hasInput && i2 ? (0, Z.jsxs)(`p`, { className: `evidence-caption`, children: [`Lần lưu gần nhất: `, new Date(i2).toLocaleString(`vi-VN`), ` · phiên bản `, r2, `.`] }) : null] });
}

function Tt({ codes: e2, saved: t2, datasetId: n2, hubLinks: r2, onAttach: i2 }) {
  let [a2, o2] = (0, l.useState)({}), [s2, c2] = (0, l.useState)(false), [u2, d2] = (0, l.useState)(true);
  return (0, l.useEffect)(() => {
    let t3 = new AbortController();
    return d2(true), c2(false), o2({}), Promise.all(e2.map(async (e3) => {
      let r3 = new URLSearchParams({ record: `CT::` + e3 });
      n2 && r3.set(`dataset`, n2);
      let i3 = await fetch(`/api/evidence?` + r3, { signal: t3.signal }), a3 = await i3.json();
      if (!i3.ok || !Array.isArray(a3.files)) throw Error(`Source evidence unavailable`);
      return [e3, a3.files];
    })).then((e3) => {
      t3.signal.aborted || o2(Object.fromEntries(e3));
    }).catch(() => {
      t3.signal.aborted || c2(true);
    }).finally(() => {
      t3.signal.aborted || d2(false);
    }), () => t3.abort();
  }, [e2.join(`|`), n2]), (0, Z.jsxs)(`details`, { className: `drawer-secondary legacy-edits`, children: [(0, Z.jsxs)(`summary`, { children: [`CT nguồn đã chuyển hết vào hồ sơ này (`, e2.length, `)`] }), (0, Z.jsx)(`p`, { className: `evidence-caption`, children: `Các khoản đã được gom vào CT nhận cuối. Gói học, Approved và xác minh đã lưu ở CT nguồn chỉ để tra cứu; không tự áp sang CT nhận.` }), e2.map((e3) => (0, Z.jsxs)(`div`, { children: [(0, Z.jsx)(st, { ct: e3, link: r2[e3], onAttach: () => i2(e3) }), a2[e3]?.map((e4) => (0, Z.jsx)(`p`, { children: (0, Z.jsxs)(LocalFileLink, { href: `/api/evidence/file?id=` + e4.id, children: [`Tải minh chứng nguồn: `, e4.fileName] }) }, e4.id))] }, e3)), u2 ? (0, Z.jsx)(`p`, { className: `evidence-caption`, children: `Đang tải danh sách minh chứng nguồn…` }) : s2 ? (0, Z.jsx)(`p`, { className: `note-warning`, children: `Chưa tải được danh sách minh chứng nguồn; mở lại hồ sơ để thử lại.` }) : Object.values(a2).some((e3) => e3.length) ? null : (0, Z.jsx)(`p`, { className: `evidence-caption`, children: `Chưa có minh chứng đính kèm ở các CT nguồn.` }), t2?.sourceHistory?.map((e3) => (0, Z.jsxs)(`div`, { children: [(0, Z.jsxs)(`strong`, { children: [`Chỉnh sửa đã lưu tại `, e3.id.replace(/^CT::/, ``)] }), Object.entries(Se).filter(([t3]) => Object.hasOwn(e3.patch, t3)).map(([t3, n3]) => (0, Z.jsxs)(`p`, { children: [n3, `: `, String(e3.patch[t3] || `Trống`)] }, t3)), e3.patch.approved === void 0 ? null : (0, Z.jsxs)(`p`, { children: [`Approved tại hồ sơ nguồn: `, e3.patch.approved ? `Có` : `Không`] }), e3.patch.verification ? (0, Z.jsxs)(`p`, { children: [`Xác minh nguồn đã lưu: `, e3.patch.verification.note || `Có thông tin xác minh riêng.`] }) : null] }, e3.id))] });
}
function Et({ row: e2, hash: t2, datasetId: n2, source: r2, links: i2, onHubSaved: a2, onSave: o2, disabled: s2 }) {
  let [c2, u2] = (0, l.useState)(``), [d2, f2] = (0, l.useState)(false), [p2, m2] = (0, l.useState)(0), h2 = (0, l.useRef)(/* @__PURE__ */ new Set()), g2 = (0, l.useRef)(null), _2 = (0, l.useRef)({ row: e2, links: i2, onHubSaved: a2, onSave: o2, source: r2 });
  _2.current = { row: e2, links: i2, onHubSaved: a2, onSave: o2, source: r2 };
  let v2 = (0, l.useContext)(nt), y2 = String(e2.cells.contractTotal ?? ``), b2 = String(e2.cells.F ?? ``), x2 = missingContractInputs(e2).length > 0;
  (0, l.useEffect)(() => {
    if (!t2 || !o2 || e2.kind !== `contract` || !y2 || !x2 || s2 || v2?.busy) return;
    let r3 = t2 + `:` + y2 + `:` + p2;
    if (h2.current.has(r3)) return;
    h2.current.add(r3);
    let i3 = new AbortController();
    g2.current = i3;
    let a3 = true, c3 = (e3) => {
      a3 && u2(e3);
    };
    return (async () => {
      try {
        if ((await Xe(`ping`, void 0, void 0, i3.signal)).version !== `1.6.13`) {
          c3(`Cập nhật cầu nối ` + Ye + ` để tự đọc trường còn thiếu từ CT trên Hub.`);
          return;
        }
        f2(true), c3(`Đang tự lấy thông tin khóa học từ CT nhận…`);
        let e3 = ke(_2.current.links[y2]?.url, y2);
        if (!e3) {
          e3 = (await et([y2], c3, i3.signal)(y2)).url ?? null;
          let t4 = await fetch(`/api/hub-links?ct=` + encodeURIComponent(y2) + (n2 ? `&dataset=` + encodeURIComponent(n2) : ``), { cache: `no-store`, signal: i3.signal }), r4 = await t4.json();
          if (!t4.ok) throw Error(r4.error ?? `Chưa tải được liên kết CT.`);
          if (r4.link?.url) e3 = r4.link.url, _2.current.onHubSaved(r4.link);
          else {
            let t5 = await fetch(`/api/hub-links`, { method: `PATCH`, headers: { "Content-Type": `application/json` }, body: JSON.stringify({ ct: y2, datasetId: n2, url: e3, version: r4.link?.version ?? 0 }) }), i4 = await t5.json();
            if (!t5.ok) throw Error(i4.error ?? `Chưa lưu được liên kết CT.`);
            _2.current.onHubSaved(i4.link);
          }
        }
        if (i3.signal.aborted) return;
        let t3 = await Ze({ ct: y2, student: b2, url: e3, readPolicy: false }, c3, i3.signal);
        if (i3.signal.aborted) return;
        await _2.current.onSave?.(_2.current.row, t3), u2([`courseFee`, `hoursPerWeek`, `package`, `giftcode`, `discount`].some((e4) => t3[e4]==null) ? `Đã lưu thông tin đọc được từ CT. Trường còn thiếu trong các nguồn cần được bổ sung.` : `Đã lưu Course info từ CT nhận. Kết quả đã được tính lại.`);
      } catch (e3) {
        i3.signal.aborted || c3(e3.message);
      } finally {
        a3 && f2(false);
      }
    })(), () => {
      a3 = false, i3.abort(), h2.current.delete(r3), g2.current = null, f2(false);
    };
  }, [t2, y2, b2, x2, s2, v2?.busy, p2, n2, o2, e2.kind]);
  let S2 = Object.entries(e2.courseInfo?.fields ?? {}).filter(([e3]) => [`H`, `I`, `J`, `K`, `L`].includes(e3)).flatMap(([, e3]) => e3.map((e4) => e4.ref)).filter(Boolean);
  return (0, Z.jsxs)(`div`, { className: `course-source-status`, children: [(0, Z.jsx)(`p`, { className: `source-note`, children: `Thông tin khóa học tự lấy theo CT nhận tiền. Chỉ bổ sung trường còn thiếu hoặc cần đối chiếu khi nguồn mâu thuẫn.` }), S2.length ? (0, Z.jsxs)(`details`, { children: [(0, Z.jsx)(`summary`, { children: `Căn cứ thông tin khóa học` }), [...new Map(S2.map((e3) => [e3.file + e3.sheet + e3.row, e3])).values()].map((e3, t3) => (0, Z.jsxs)(`p`, { className: `source-note`, children: [e3.url ? (0, Z.jsx)(`a`, { href: e3.url, target: `_blank`, rel: `noopener noreferrer`, children: e3.file }) : e3.file, ` · `, e3.sheet, e3.row ? ` · dòng ` + e3.row : ``] }, t3))] }) : null, c2 ? (0, Z.jsxs)(`p`, { role: `status`, className: `source-note`, children: [d2 ? (0, Z.jsx)(I, { size: 13, className: `spin` }) : null, c2] }) : null, d2 ? (0, Z.jsx)(`button`, { type: `button`, className: `quiet-button`, onClick: () => {
    g2.current?.abort(), f2(false), u2(`Đã dừng đọc Course info.`);
  }, children: `Dừng đọc` }) : x2 && t2 && o2 ? (0, Z.jsxs)(`button`, { type: `button`, className: `quiet-button`, disabled: s2 || v2?.busy, onClick: () => m2((e3) => e3 + 1), children: [(0, Z.jsx)(z, { size: 13 }), `Đọc lại Course info từ CT`] }) : null] });
}
function Dt({ row: e2, column: t2 }) {
  let n2 = e2.cells[t2], r2 = e2.calculationIssues?.find((e3) => e3.columns.includes(t2));
  return n2 == null || n2 === `` ? (0, Z.jsx)(`span`, { className: `missing-calculation`, title: r2 ? r2.message + ` ` + r2.action : `Chưa đủ dữ liệu để tính.`, children: `Chưa tính` }) : (0, Z.jsx)(`span`, { title: t2 === `extraHours` && e2.courseHours ? `${K(e2.courseHours.bonusMonths)} tháng tặng × ${K(e2.courseHours.weeklyHours)} giờ/tuần × ${e2.courseHours.factor===25/6?`25/6`:K(e2.courseHours.factor)} tuần/tháng; tổng giờ làm tròn sau khi cộng.` : t2 === `O` && n2 === 0 ? `Không có giftcode áp dụng.` : t2 === `P` ? `Tiền chuyển vào CT có hóa đơn Paid gốc. Đã nằm trong tổng thu; không trừ lại khỏi toàn bộ học phí CT.` : void 0, children: K(n2) });
}
function Ot({ value: e2, approved: t2 = false, reasons }) {
  let n2 = String(e2 ?? `—`), r2 = n2 === `OK` || n2 === `KHỚP`;
  return (0, Z.jsxs)(`span`, { className: `status ${r2 ? `ok` : n2 === `—` ? `neutral` : `check`}`, title: reasons?.length ? reasons.join(`\n`) : n2, children: [r2 ? (0, Z.jsx)(b, { size: 12 }) : n2 === `—` ? null : (0, Z.jsx)(`span`, { className: `status-dot` }), n2, r2 && t2 ? (0, Z.jsx)(V, { size: 12, "aria-label": `Đã duyệt vượt kỳ` }) : null] });
}
var kt = (0, l.memo)(function({ col: e2, value: t2, original: n2, disabled: r2, onSave: i2, student: a2 }) {
  let o2 = String(t2 ?? ``), [s2, c2] = (0, l.useState)(o2), u2 = (0, l.useRef)(false);
  return (0, l.useEffect)(() => c2(o2), [o2]), (0, Z.jsxs)(`div`, { className: `edit-cell ${o2 === String(n2 ?? ``) ? `` : `edited`} ${o2 ? `` : `empty`}`, children: [(0, Z.jsx)(`input`, { "aria-label": `${Se[e2]} – ${a2}`, value: s2, list: `choices-${e2}`, placeholder: `Nhập hoặc chọn…`, maxLength: e2 === `K` ? 150 : 2e3, disabled: r2, title: `Nguồn: ${String(n2 ?? `Trống`)}`, onChange: (e3) => c2(e3.target.value), onBlur: () => {
    if (u2.current) {
      u2.current = false;
      return;
    }
    let e3 = s2.trim();
    e3 !== o2 && i2(e3);
  }, onKeyDown: (e3) => {
    e3.key === `Enter` && e3.currentTarget.blur(), e3.key === `Escape` && (u2.current = true, c2(o2), e3.currentTarget.blur(), e3.stopPropagation());
  } }), (0, Z.jsx)(L, { size: 11, "aria-hidden": `true` })] });
});
function At({ row: e2, disabled: t2, onChange: n2 }) {
  let r2 = Ce(e2);
  return (0, Z.jsxs)(`label`, { className: `approval ${r2 ? `approved` : ``}`, title: `Duyệt ngoại lệ vượt kỳ trả góp. Các điều kiện khác có ô duyệt riêng.`, children: [(0, Z.jsx)(`input`, { type: `checkbox`, checked: r2, disabled: t2, onChange: (e3) => n2(e3.target.checked), "aria-label": `Duyệt vượt kỳ – ${e2.cells.G}` }), (0, Z.jsx)(`span`, { children: r2 ? `Đã duyệt` : `Chờ duyệt` })] });
}
function jt({ hubLinks: e2, onHubSaved: t2, row: n2, original: r2, savedEdit: i2, programs: a2, partners: o2, datasetId: s2, vouchers: c2, userVouchers: u2, onVoucherSave: d2, focus: f2 = `top`, disabled: p2, failure: m2, onRetry: h2, onClose: g2, onEdit: _2, onVerify: v2, onRestore: y2, sourceHash: b2, courseSource: x2, onCourseSave: S2 }) {
  let w2 = (0, l.useRef)(null), T2 = (0, l.useRef)(null), [E2, D2] = (0, l.useState)(false), [O2, k2] = (0, l.useState)(false), [A2, j2] = (0, l.useState)(false), [M2, N2] = (0, l.useState)(``), P2 = n2 ? Oe(n2) : [], F2 = P2.includes(M2) ? M2 : P2[0], [I2, ee2] = (0, l.useState)(false), [L2, R2] = (0, l.useState)(false), [z2, ie2] = (0, l.useState)(false), [B2, ae2] = (0, l.useState)(false), V2 = () => {
    I2 || L2 || B2 ? ie2(true) : g2();
  }, oe2 = fe(n2?.cells.K), H2 = u2.find((e3) => e3.code === oe2), se2 = c2.some((e3) => !e3.custom && fe(e3.AH) === oe2);
  return (0, l.useEffect)(() => {
    ee2(false), R2(false), ae2(false), ie2(false), N2(``), k2(false), j2(false);
  }, [n2?.id]), (0, l.useEffect)(() => {
    D2(f2 === `verification`);
  }, [n2?.id, f2]), (0, l.useEffect)(() => {
    let e3 = w2.current;
    n2 && !e3?.open && e3?.showModal(), !n2 && e3?.open && e3.close();
  }, [n2]), (0, l.useEffect)(() => {
    if (!n2) return;
    let e3 = requestAnimationFrame(() => {
      w2.current?.querySelector(f2 === `verification` ? `.detail-approvals` : `.drawer-result`)?.scrollIntoView({ block: `start` });
    });
    return () => cancelAnimationFrame(e3);
  }, [n2?.id, f2]), (0, Z.jsx)(`dialog`, { className: `record-drawer${A2 ? ` record-drawer-expanded` : ``}`, ref: w2, onCancel: (e3) => {
    e3.preventDefault(), A2 ? j2(false) : V2();
  }, onClick: (e3) => {
    e3.target === w2.current && V2();
  }, "aria-labelledby": `drawer-title`, children: n2 ? (0, Z.jsxs)(`div`, { className: `drawer-inner`, children: [(0, Z.jsxs)(`header`, { className: `drawer-header`, children: [(0, Z.jsxs)(`div`, { children: [(0, Z.jsx)(`div`, { className: `eyebrow`, children: `CHI TIẾT HỒ SƠ` }), (0, Z.jsx)(`h2`, { id: `drawer-title`, children: String(n2.cells.G) }), (0, Z.jsxs)(`p`, { children: [String(n2.cells.F), ` `, (0, Z.jsx)(`span`, { children: `·` }), ` `, String(n2.cells.A)] }), (0, Z.jsxs)(`div`, { className: `drawer-total-contract`, children: [(0, Z.jsx)(`span`, { children: `Contract tổng` }), n2.cells.contractTotal ? (0, Z.jsx)(st, { ct: String(n2.cells.contractTotal), link: e2[String(n2.cells.contractTotal)], onAttach: () => {
    B2 || (N2(String(n2.cells.contractTotal)), k2(true), requestAnimationFrame(() => T2.current?.scrollIntoView({ block: `nearest` })));
  } }) : (0, Z.jsx)(`strong`, { children: `Chưa xác định` })] })] }), (0, Z.jsxs)(`div`, { className: `drawer-header-actions`, children: [(0, Z.jsx)(`button`, { className: `icon-button`, type: `button`, onClick: () => j2((e3) => !e3), "aria-label": A2 ? `Thu gọn chi tiết` : `Mở rộng toàn màn hình`, title: A2 ? `Thu gọn chi tiết` : `Mở rộng toàn màn hình`, "aria-pressed": A2, children: A2 ? (0, Z.jsx)(ne, { size: 19 }) : (0, Z.jsx)(te, { size: 19 }) }), (0, Z.jsx)(`button`, { className: `icon-button`, type: `button`, onClick: V2, "aria-label": `Đóng chi tiết`, children: (0, Z.jsx)(le, { size: 20 }) })] })] }), (0, Z.jsxs)(`div`, { className: `drawer-scroll`, children: [(0, Z.jsxs)(`div`, { className: `drawer-result`, children: [(0, Z.jsx)(Ot, { value: n2.cells.AF }), (0, Z.jsx)(`span`, { children: n2.paymentCode })] }), i2?.inherited ? (0, Z.jsxs)(`div`, { className: `legacy-edits`, children: [(0, Z.jsx)(`p`, { children: `Đã giữ chỉnh sửa cũ theo chứng từ và đưa giá trị thống nhất lên CT tổng.` }), i2.notes?.length ? (0, Z.jsx)(`ul`, { className: `evidence-warnings`, children: i2.notes.map((e3) => (0, Z.jsx)(`li`, { children: e3 }, e3)) }) : null, (0, Z.jsxs)(`details`, { children: [(0, Z.jsx)(`summary`, { children: `Xem chỉnh sửa cũ` }), i2.legacy?.map((e3) => (0, Z.jsxs)(`div`, { children: [(0, Z.jsx)(`strong`, { children: e3.id }), Object.entries(e3.patch).map(([e4, t3]) => (0, Z.jsxs)(`p`, { children: [e4, `: `, String(t3)] }, e4))] }, e3.id))] })] }) : null, m2 ? (0, Z.jsxs)(`div`, { className: `error-banner`, role: `alert`, children: [(0, Z.jsxs)(`div`, { children: [(0, Z.jsx)(`strong`, { children: `Thay đổi chưa được lưu` }), (0, Z.jsx)(`p`, { children: m2.message })] }), (0, Z.jsx)(`button`, { className: `secondary-button`, onClick: () => m2.conflict ? window.location.reload() : h2(), children: m2.conflict ? `Tải bản mới` : `Thử lưu lại` })] }) : null, (0, Z.jsxs)(`section`, { className: `course-info`, "aria-label": `Course info`, children: [(0, Z.jsx)(`h3`, { children: `Course info` }), (0, Z.jsxs)(`div`, { className: `course-info-grid`, children: [(0, Z.jsx)(`div`, { className: `drawer-inputs`, children: Object.keys(Se).map((e3) => (0, Z.jsxs)(`label`, { children: [(0, Z.jsx)(`span`, { children: Se[e3] }), (0, Z.jsx)(kt, { col: e3, value: n2.cells[e3], original: r2?.cells[e3], disabled: p2 || n2.kind !== `contract`, student: String(n2.cells.G), onSave: (t3) => _2(e3, t3) }), e3 === `L` ? (0, Z.jsx)(DiscountApplyInfo, { value: n2.cells.L, date: n2.cells.D, components: n2.discountComponents, checks: n2.promotion?.checks }) : null] }, e3)) }), (0, Z.jsxs)(`dl`, { className: `course-totals`, children: [[[`Course fee · CALC`, `M`], [`Discount · CALC`, `N`], [`Giftcode · CALC`, `O`], [`Total fee · CALC`, `Q`], [`Extra hours · CALC`, `extraHours`], [`Total course hour · CALC`, `R`]].map(([e3, t3]) => (0, Z.jsxs)(`div`, { className: t3 === `Q` ? `course-total-fee` : ``, children: [(0, Z.jsx)(`dt`, { children: e3 }), (0, Z.jsxs)(`dd`, { children: [(0, Z.jsx)(Dt, { row: n2, column: t3 }), [`R`,`extraHours`].includes(t3) ? ` giờ` : ` ₫`] })] }, t3)), (0, Z.jsx)(`p`, { className: `evidence-caption`, children: `Giá tính độc lập từ bảng giá, tách khỏi tiền đã thu. Tổng giờ đã gồm giờ tặng và được làm tròn sau khi cộng.` })] })] }), (0, Z.jsx)(Et, { row: n2, hash: b2, datasetId: s2, source: x2, links: e2, onHubSaved: t2, onSave: S2, disabled: p2 }, n2.id)] }), (0, Z.jsx)(DetailApprovals, {row:n2,disabled:p2,onEdit:_2,voucher:H2,onVoucherSave:d2}, n2.id), n2.kind === `contract` && oe2 && oe2 !== `0` && !se2 ? (0, Z.jsx)(wt, { initial: H2 ?? { code: oe2 }, profile: voucherRecordProfile(n2), disabled: p2, onSave: d2, onDirty: R2 }, n2.id + `:` + oe2) : null, n2.reconciliation ? (0, Z.jsx)(yt, { account: n2.reconciliation }) : null, n2.sourceContracts?.length ? (0, Z.jsx)(Tt, { codes: n2.sourceContracts, saved: i2, datasetId: s2, hubLinks: e2, onAttach: (e3) => {
    B2 || (N2(e3), k2(true), requestAnimationFrame(() => T2.current?.scrollIntoView({ block: `nearest` })));
  } }, n2.id) : null, (0, Z.jsx)(_t, { row: n2, hubLinks: e2, onAttach: (e3) => {
    B2 || (N2(e3), k2(true), requestAnimationFrame(() => T2.current?.scrollIntoView({ block: `nearest` })));
  } }), F2 ? (0, Z.jsxs)(`details`, { className: `drawer-secondary`, ref: T2, open: O2, onToggle: (e3) => k2(e3.currentTarget.open), children: [(0, Z.jsx)(`summary`, { children: `Liên kết CT / DEP trên Hub` }), (0, Z.jsxs)(`label`, { className: `hub-document-picker`, children: [`Hồ sơ Hub`, (0, Z.jsx)(`select`, { value: F2, disabled: B2, onChange: (e3) => N2(e3.target.value), children: P2.map((e3) => (0, Z.jsx)(`option`, { value: e3, children: e3 }, e3)) })] }), (0, Z.jsx)(ct, { ct: F2, link: e2[F2], datasetId: s2, onSaved: t2, onDirty: ae2 }, n2.id + `:` + F2)] }) : null, (0, Z.jsxs)(`details`, { className: `drawer-secondary drawer-check-details`, open: E2, onToggle: (e3) => D2(e3.currentTarget.open), children: [(0, Z.jsxs)(`summary`, { children: [`Chi tiết kiểm tra & nguồn`] }), n2.resultReasons?.length ? (0,Z.jsx)(`ul`,{className:`evidence-warnings`,children:n2.resultReasons.map((reason)=>(0,Z.jsx)(`li`,{children:reason},reason))}):null, n2.groupWarnings?.length ? (0, Z.jsx)(`ul`, { className: `evidence-warnings`, children: n2.groupWarnings.map((e3) => (0, Z.jsx)(`li`, { children: e3 }, e3)) }) : null, n2.calculationIssues?.length ? (0, Z.jsx)(`ul`, { className: `evidence-warnings`, children: n2.calculationIssues.map((e3) => (0, Z.jsxs)(`li`, { children: [e3.message, ` `, e3.action] }, e3.code)) }) : null, n2.pricing ? (0, Z.jsx)(pt, { refs: n2.pricing.refs }) : null, (0, Z.jsx)(`div`, { className: `check-notes`, children: [[`BD`, `Policy`], [`BO`, `Discount`], [`CI`, `Giftcode`], [`CG`, `Thời hạn ưu đãi`], [`BY`, `Contract / Export`]].map(([e3, t3]) => (0, Z.jsxs)(`div`, { children: [(0, Z.jsx)(`span`, { children: t3 }), (0, Z.jsx)(`strong`, { className: [`OK`, `NO GIFTCODE`, `KHỚP`, ``].includes(String(n2.cells[e3] ?? ``)) ? `` : `note-warning`, children: String(n2.cells[e3] ?? `—`) })] }, e3)) }), n2.promotion?.checks.length ? (0, Z.jsx)(`ul`, { className: `evidence-warnings`, children: n2.promotion.checks.map((e3) => (0, Z.jsx)(`li`, { children: e3 }, e3)) }) : null, n2.promotion?.programIds.map((e3) => {
    let t3 = a2.find((t4) => t4.id === e3);
    return t3 ? (0, Z.jsx)(vt, { program: t3, activePeriod: e3 === `split36` ? a2.find((e4) => n2.promotion?.programIds.includes(e4.id) && [`q4`, `oct-base`].includes(e4.id)) : void 0, recordVerified: e3 === `split36` && n2.verification?.siblingVerified }, e3) : null;
  })] }), n2.errors.length > 0 ? (0, Z.jsx)(`div`, { role: `alert`, className: `error-banner`, children: `Một số phép tính chưa thực hiện được. Hồ sơ tiếp tục có trạng thái CHECK.` }) : null] }), (0, Z.jsx)(`footer`, { className: `drawer-footer`, children: z2 ? (0, Z.jsxs)(`div`, { className: `verification-close`, role: `alert`, children: [(0, Z.jsx)(`span`, { children: `Thông tin xác minh / voucher / liên kết Hub chưa lưu.` }), (0, Z.jsx)(`button`, { className: `secondary-button`, onClick: () => ie2(false), children: `Tiếp tục chỉnh` }), (0, Z.jsx)(`button`, { className: `quiet-button`, onClick: g2, children: `Bỏ thay đổi & đóng` })] }) : (0, Z.jsxs)(Z.Fragment, { children: [(0, Z.jsxs)(`button`, { className: `quiet-button`, disabled: p2 || I2 || L2 || B2, onClick: y2, children: [(0, Z.jsx)(re, { size: 14 }), `Khôi phục dữ liệu gốc`] }), (0, Z.jsxs)(`button`, { className: `primary-button`, onClick: V2, children: [`Xong`, (0, Z.jsx)(C, { size: 15 })] })] }) })] }) : null });
}
function Mt() {
  return (0, Z.jsxs)(`section`, { className: `guide-page`, children: [(0, Z.jsx)(`div`, { className: `eyebrow`, children: `HƯỚNG DẪN SỬ DỤNG` }), (0, Z.jsx)(`h2`, { children: `Từ dữ liệu gốc đến kết quả đối chiếu.` }), (0, Z.jsx)(`p`, { className: `guide-lead`, children: `Web tính lại từ ba nguồn Export, PaymentList, Transfer và đối chiếu với bảng giá, quy tắc khuyến mãi.` }), (0, Z.jsx)(`div`, { className: `guide-grid`, children: [[`01`, `Tải bộ nguồn theo kỳ`, `Mở bánh răng Cài đặt chung ở góc trên bên phải → Tải bộ nguồn, tải cùng lúc Export Payment ByCourse, Report PaymentList và Transfer PaymentList. Có thể thêm PaymentList các tháng trước hoặc chọn file Audit có các sheet nguồn. Kiểm tra loại file, sheet và cột; chọn ngày, trung tâm rồi bấm Lưu bộ nguồn & tra soát.`], [`02`, `Điền đúng đầu vào`, `Bấm Tự lấy Input theo Contract trên Bảng đối chiếu để tự tìm link, đọc Course fee KOC, Hour/week, Package, Giftcode No và Discount apply từ đúng CT nhận tiền / học viên trên Hub rồi lưu và tính lại. Cần cầu nối Hub 1.6.13 và đăng nhập Hub. Dùng tab Hub đã mở để đọc GetContractDetail / ListCourseInfo; không tạo, chuyển, đổi URL hay đóng tab Hub. Hết giờ hoặc mở lại trang, bấm tiếp tục để lấy các CT còn thiếu; tiến độ lưu sau từng CT. Nguồn mâu thuẫn vẫn chờ kiểm tra. Có thể sửa ô từ danh sách gợi ý hoặc nhập trực tiếp; nhấn Enter hay rời ô để lưu.`], [`03`, `Đối chiếu tiền theo Contract tổng`, `Mỗi CT có một dòng khóa học; các chứng từ con để trống Course fee KOC, Hour/week, Package. PaymentList là tiền thu, Transfer là phân bổ/chuyển tiền, Export là giá trị đối chiếu. Nếu thiếu cọc cũ, bổ sung PaymentList lịch sử vào bộ nguồn. Chứng từ chưa gắn CT tiếp tục chờ xác minh.`], [`04`, `Bổ sung Giftcode và voucher`, `Nhập mã tại Giftcode No rồi mở hồ sơ. Student ID và tên học viên lấy từ CT; cầu nối Hub 1.6.13 tự tìm mã đầy đủ trong Voucher và List gift code để điền phạm vi, ngày, loại/mức giảm và căn cứ. Có thể bấm Tìm & tự điền từ Hub để đọc lại. Kiểm tra trạng thái duyệt rồi bấm Lưu voucher & tính lại. Mã chờ duyệt vẫn giữ CHECK.`], [`05`, `Duyệt điều kiện hồ sơ`, `Mở Chi tiết hồ sơ → Duyệt & xác nhận, hoặc nhóm Duyệt điều kiện trên Bảng đối chiếu. Đối chiếu từng yêu cầu (CEO/RCM, ghi danh, sibling, loyalty…), tích ô sau khi đã duyệt; trạng thái hiện Đã duyệt và tự lưu, tính lại. Bỏ tích để kiểm tra lại. Duyệt từng mục không bỏ qua chênh lệch tiền, quy tắc giá hoặc voucher chưa được duyệt.`], [`06`, `Duyệt kỳ trả góp ngoại lệ`, `Tại cột Trả góp · Duyệt, tích ô để duyệt ngoại lệ CHECK - VƯỢT KỲ. Khi đã tích, ô hiện Đã duyệt. Bỏ tích để áp lại giới hạn kỳ. Các cột duyệt điều kiện hồ sơ xử lý riêng từng mục; chênh lệch tiền và giftcode vẫn tiếp tục được kiểm tra.`], [`07`, `Liên kết contract trên Hub`, `Bấm Mở Hub để đăng nhập trên Hub. Trong chi tiết CT, sao chép mã CT, mở đúng hợp đồng rồi dán URL chi tiết vào Contract trên Hub và bấm Lưu liên kết. Sau đó bấm mã có màu và gạch chân để mở lại. Mã CT tìm trong Contract, mã DEP tìm trong Deposit; Tự gắn link Hub đọc danh sách theo tháng YYMM. Mã chưa có link chi tiết mở danh sách đúng tháng để kiểm tra. Liên kết lưu riêng cho bạn và dùng lại qua các đợt dữ liệu; nội dung Hub chưa tự đồng bộ.`], [`08`, `Mở lại và xuất kết quả`, `Các đợt đã lưu trên trình duyệt này trong Tải bộ nguồn cho phép mở lại và tải từng file gốc. Bảng giá và lộ trình tiếp tục là nguồn quy tắc. Chờ Đã lưu trước khi đóng trang. Xuất CSV lấy các hồ sơ đang lọc cùng ghi chú còn thiếu.`]].map(([e2, t2, n2]) => (0, Z.jsxs)(`article`, { children: [(0, Z.jsx)(`span`, { className: `guide-number`, children: e2 }), (0, Z.jsx)(`h3`, { children: t2 }), (0, Z.jsx)(`p`, { children: n2 })] }, e2)) }), (0, Z.jsxs)(`div`, { className: `guide-note`, children: [(0, Z.jsx)(V, { size: 20 }), (0, Z.jsxs)(`div`, { children: [(0, Z.jsx)(`strong`, { children: `Duyệt riêng từng điều kiện` }), (0, Z.jsx)(`p`, { children: `Trả góp · Duyệt chỉ xử lý ngoại lệ vượt kỳ. Các điều kiện CEO/RCM và hồ sơ có ô duyệt riêng. KẾT QUẢ vẫn CHECK nếu còn chênh lệch tiền hoặc dữ liệu tính toán chưa đủ.` })] })] })] });
}
function Nt(e2, t2) {
  if (e2.every((e3) => e3.kind === `contract` || e3.kind === `unlinked`)) {
    if (t2 === `P`) return null;
    let n3 = e2.filter((e3) => e3.kind === `contract`), r3 = /* @__PURE__ */ new Set(), i3 = 0, a2 = e2.length - n3.length;
    for (let e3 of n3) {
      if (r3.has(e3.id)) continue;
      r3.add(e3.id);
      let n4 = e3.cells[t2];
      typeof n4 == `number` ? (i3 += n4, [`W`, `ctNet`].includes(t2) && (e3.receipts?.some((e4) => !e4.verified) || e3.reconciliation?.events?.some((e4) => e4.invoiceBacked === false)) && a2++) : a2++;
    }
    return { total: i3, incomplete: a2 };
  }
  if ([`P`, `Q`, `AC`].includes(t2)) return null;
  if ([`M`, `N`, `O`, `R`, `T`, `U`, `V`, `X`, `Z`, `AA`, `AB`, `AD`].includes(t2)) {
    let n3 = /* @__PURE__ */ new Map(), r3 = 0;
    for (let i4 of e2) {
      let e3 = i4.cells.contractTotal;
      if (!e3) {
        r3++;
        continue;
      }
      let a2 = n3.get(e3) ?? /* @__PURE__ */ new Set();
      a2.add(i4.cells[t2]), n3.set(e3, a2);
    }
    let i3 = 0;
    for (let e3 of n3.values()) e3.size !== 1 || typeof [...e3][0] != `number` ? r3++ : i3 += [...e3][0];
    return { total: i3, incomplete: r3 };
  }
  let n2 = /* @__PURE__ */ new Set(), r2 = [];
  for (let i3 of e2) n2.has(i3.id) || (n2.add(i3.id), r2.push(i3.cells[t2]));
  let i2 = r2.filter((e3) => typeof e3 == `number`);
  return { total: i2.reduce((e3, t3) => e3 + t3, 0), incomplete: r2.length - i2.length };
}
function Pt({ hubLinks: e2, rows: t2, data: n2, busy: r2, blocked: i2, section: a2, onSection: o2, onOpen: s2, onEdit: c2 }) {
  let [u2, d2] = (0, l.useState)(0), [f2, p2] = (0, l.useState)(25), [m2, h2] = (0, l.useState)(null), _2 = (0, l.useMemo)(() => new Map(n2.records.map((e3) => [e3.id, e3])), [n2]), reviewColumns = (0,l.useMemo)(()=>reviewTableColumns(ye,t2),[t2]), v2 = (0, l.useMemo)(() => a2 === -1 ? reviewColumns : a2 === 5 ? reviewColumns.filter(c=>c.kind===`review`||[`contractTotal`,`AF`,`AG`].includes(c.key)) : a2 === 0 ? reviewColumns.filter((e3) => be.includes(e3.key)||e3.kind===`review`) : reviewColumns.filter((e3) => e3.group === a2), [a2,reviewColumns]), y2 = (0, l.useMemo)(() => {
    let e3 = [];
    return v2.forEach((t3) => {
      let n3 = e3.at(-1);
      n3?.group === t3.group ? n3.count++ : e3.push({ group: t3.group, count: 1 });
    }), e3;
  }, [v2]), b2 = (0, l.useMemo)(() => m2 ? [...t2].sort((e3, t3) => {
    let n3 = m2.key === `paymentCode` ? e3.paymentCode : e3.cells[m2.key], r3 = m2.key === `paymentCode` ? t3.paymentCode : t3.cells[m2.key];
    return (typeof n3 == `number` && typeof r3 == `number` ? n3 - r3 : String(n3 ?? ``).localeCompare(String(r3 ?? ``), `vi`)) * (m2.asc ? 1 : -1);
  }) : t2, [t2, m2]), x2 = Math.max(1, Math.ceil(b2.length / f2)), w2 = Math.min(u2, x2 - 1), T2 = b2.slice(w2 * f2, (w2 + 1) * f2), E2 = (e3) => h2((t3) => ({ key: e3, asc: t3?.key === e3 ? !t3.asc : true })), D2 = (e3) => {
    o2(e3), document.querySelector(`.table-scroll`)?.scrollTo({ left: 0 });
  };
  return (0, Z.jsxs)(Z.Fragment, { children: [(0, Z.jsxs)(`div`, { className: `section-row`, children: [(0, Z.jsxs)(`span`, { className: `section-label`, children: [(0, Z.jsx)(P, { size: 13 }), `NHÓM CỘT`] }), (0, Z.jsxs)(`div`, { className: `section-tabs`, "aria-label": `Chọn nhóm cột`, children: [(0, Z.jsx)(`button`, { onClick: () => D2(0), className: a2 === 0 ? `active` : ``, children: `Tổng quan` }), ve.map((e3) => (0, Z.jsxs)(`button`, { onClick: () => D2(e3.id), className: a2 === e3.id ? `active` : ``, children: [(0, Z.jsxs)(`span`, { children: [`0`, e3.id] }), e3.short] }, e3.id)), (0,Z.jsx)(`button`,{onClick:()=>D2(5),className:a2===5?`active`:``,children:`Duyệt điều kiện`}), (0, Z.jsx)(`button`, { onClick: () => D2(-1), className: a2 === -1 ? `active` : ``, children: `Toàn bộ` })] }), (0, Z.jsxs)(`span`, { className: `editable-hint`, children: [(0, Z.jsx)(L, { size: 11 }), `Ô nền tím có thể sửa`] })] }), (0, Z.jsxs)(`div`, { className: `table-scroll`, tabIndex: 0, "aria-label": `Bảng Check Installment, cuộn ngang để xem các cột`, children: [(0, Z.jsxs)(`table`, { className: `audit-table`, style: { width: 283 + v2.reduce((e3, t3) => e3 + t3.width, 0) }, children: [(0, Z.jsxs)(`colgroup`, { children: [(0, Z.jsx)(`col`, { style: { width: 48 } }), (0, Z.jsx)(`col`, { style: { width: 235 } }), v2.map((e3) => (0, Z.jsx)(`col`, { style: { width: e3.width } }, e3.key))] }), (0, Z.jsxs)(`thead`, { children: [(0, Z.jsxs)(`tr`, { className: `group-headers`, children: [(0, Z.jsx)(`th`, { className: `sticky-no`, scope: `col`, rowSpan: 2, children: `No.` }), (0, Z.jsx)(`th`, { className: `sticky-student`, scope: `col`, rowSpan: 2, children: (0, Z.jsxs)(`button`, { onClick: () => E2(`G`), children: [(0, Z.jsx)(`span`, { children: `STUDENT NAME` }), (0, Z.jsx)(g, { size: 11 })] }) }), y2.map((e3) => (0, Z.jsx)(`th`, { colSpan: e3.count, scope: `colgroup`, className: `group-${e3.group}`, children: ve[e3.group - 1].name }, e3.group))] }), (0, Z.jsx)(`tr`, { className: `column-headers`, children: v2.map((e3) => (0, Z.jsx)(`th`, { scope: `col`, className: `group-${e3.group}`, children: (0, Z.jsxs)(`button`, { onClick: () => E2(e3.key), children: [(0, Z.jsx)(`span`, { children: e3.label }), e3.kind === `edit` ? (0, Z.jsx)(L, { size: 10 }) : (0, Z.jsx)(g, { size: 10 })] }) }, e3.key)) })] }), (0, Z.jsx)(`tbody`, { children: T2.map((t3, a3) => (0, Z.jsxs)(`tr`, { className: `${Ce(t3) ? `approved-row` : ``} ${r2.has(t3.id) ? `saving-row` : ``}`, children: [(0, Z.jsx)(`td`, { className: `sticky-no`, children: w2 * f2 + a3 + 1 }), (0, Z.jsx)(`td`, { className: `sticky-student`, children: (0, Z.jsxs)(`button`, { className: `student-button`, onClick: () => s2(t3.id), children: [(0, Z.jsx)(`span`, { className: `student-avatar`, children: String(t3.cells.G ?? `?`).trim().split(/\s+/).at(-1)?.slice(0, 1) }), (0, Z.jsxs)(`span`, { className: `student-info`, children: [(0, Z.jsx)(`strong`, { children: String(t3.cells.G) }), (0, Z.jsx)(`span`, { children: String(t3.cells.F) })] }), r2.has(t3.id) ? (0, Z.jsx)(I, { size: 13, className: `spin` }) : (0, Z.jsx)(C, { size: 13 })] }) }), v2.map((a4) => {
    let o3 = a4.key === `paymentCode` ? t3.paymentCode : t3.cells[a4.key], l2 = t3.kind === `unlinked` || r2.has(t3.id) || i2.has(t3.id);
    return (0, Z.jsx)(`td`, { className: `group-${a4.group} ${a4.kind === `money` || a4.kind === `number` ? `numeric` : ``} ${a4.kind === `edit` ? `editable-td` : ``}`, children: a4.key === `contractTotal` || a4.key === `C` && Oe(t3).includes(String(o3)) ? (0, Z.jsx)(st, { ct: String(o3 ?? ``), link: e2[String(o3 ?? ``)], onAttach: () => s2(t3.id) }) : a4.kind === `review` ? (0,Z.jsx)(ReviewApprovalCell,{row:t3,id:a4.reviewId,disabled:l2,onChange:checked=>c2(t3,`reviews`,updateReview(t3,a4.reviewId,checked))}) : a4.key === `verificationCheck` ? (0,Z.jsx)(`span`,{children:String(o3??`Chưa gắn CT`)}) : a4.key === `receiptCount` ? (0, Z.jsxs)(`button`, { className: `receipt-button`, onClick: () => s2(t3.id), children: [t3.receipts?.length ?? 0, ` chứng từ`, (0, Z.jsx)(C, { size: 12 })] }) : a4.kind === `edit` && t3.kind === `unlinked` ? (0, Z.jsx)(`span`, { className: `muted`, children: `—` }) : a4.kind === `edit` ? (0, Z.jsx)(kt, { col: a4.key, value: o3, original: _2.get(t3.id)?.cells[a4.key], disabled: l2, student: String(t3.cells.G), onSave: (e3) => c2(t3, a4.key, e3) }) : a4.kind === `approved` ? (0, Z.jsx)(At, { row: t3, disabled: l2, onChange: (e3) => c2(t3, `approved`, e3) }) : a4.kind === `status` ? (0, Z.jsx)(Ot, { value: o3, approved: a4.key === `AE` && Ce(t3), reasons:a4.key===`AF`?t3.resultReasons:void 0 }) : a4.kind === `date` ? q(o3) : a4.kind === `money` || a4.kind === `number` ? (0, Z.jsx)(`span`, { className: `${a4.group === 4 && typeof o3 == `number` && Math.abs(o3) > (a4.key === `AD` ? 1 : (t3.tolerance?.money??n2.tolerance)) ? `diff-value` : ``} ${typeof o3 == `number` ? `` : `muted`}`, children: a4.group === 2 || a4.group === 4 ? (0, Z.jsx)(Dt, { row: t3, column: a4.key }) : K(o3) }) : (0, Z.jsx)(`span`, { title: String(o3 ?? ``), children: o3 == null || o3 === `` ? (0, Z.jsx)(`span`, { className: `muted`, children: `—` }) : String(o3) }) }, a4.key);
  })] }, t3.id)) }), t2.length ? (0, Z.jsx)(`tfoot`, { children: (0, Z.jsxs)(`tr`, { children: [(0, Z.jsx)(`td`, { className: `sticky-no` }), (0, Z.jsxs)(`td`, { className: `sticky-student`, children: [`TOTAL `, (0, Z.jsxs)(`span`, { children: [t2.length, ` HỒ SƠ`] })] }), v2.map((e3) => {
    let n3 = e3.kind === `money` || [`R`, `X`, `AD`].includes(e3.key), r3 = n3 ? Nt(t2, e3.key) : null;
    return (0, Z.jsx)(`td`, { className: `group-${e3.group} ${n3 ? `numeric` : ``}`, title: r3?.incomplete ? `Tổng chưa gồm CT chưa gắn, thiếu kết quả hoặc có đầu vào không thống nhất` : void 0, children: r3 ? (0, Z.jsxs)(Z.Fragment, { children: [r3.incomplete && r3.incomplete >= new Set(t2.map((e4) => e4.id)).size ? `Chưa tính` : K(r3.total), r3.incomplete ? (0, Z.jsx)(`span`, { className: `incomplete-total`, children: `*` }) : null] }) : e3.key === `AF` ? `${t2.filter((e4) => e4.cells.AF !== `OK`).length} CHECK` : e3.key === `AG` ? `${t2.filter(Ce).length} duyệt` : `—` }, e3.key);
  })] }) }) : null] }), t2.length ? null : (0, Z.jsxs)(`div`, { className: `empty-state`, children: [(0, Z.jsx)(`h3`, { children: `Không có hồ sơ phù hợp` }), (0, Z.jsx)(`p`, { children: `Thử từ khóa hoặc bộ lọc khác.` })] })] }), (0, Z.jsxs)(`div`, { className: `table-bottom`, children: [(0, Z.jsxs)(`div`, { className: `table-legend`, children: [(0, Z.jsx)(`span`, { className: `legend-edit` }), `Có thể sửa`, (0, Z.jsx)(`span`, { className: `legend-divider` }), (0, Z.jsx)(`span`, { className: `legend-check` }), `Cần kiểm tra`, (0, Z.jsx)(`span`, { className: `legend-divider` }), (0, Z.jsx)(`span`, { children: `Một CT = một khóa học · Chi tiết thu tiền để trống thông tin khóa · * tổng chưa đủ` })] }), (0, Z.jsxs)(`div`, { className: `pagination`, children: [(0, Z.jsxs)(`span`, { children: [t2.length ? w2 * f2 + 1 : 0, `–`, Math.min((w2 + 1) * f2, t2.length), ` / `, t2.length] }), (0, Z.jsxs)(`select`, { value: f2, "aria-label": `Số dòng mỗi trang`, onChange: (e3) => {
    p2(+e3.target.value), d2(0);
  }, children: [(0, Z.jsx)(`option`, { value: 25, children: `25 dòng` }), (0, Z.jsx)(`option`, { value: 50, children: `50 dòng` }), (0, Z.jsx)(`option`, { value: 100, children: `100 dòng` })] }), (0, Z.jsx)(`button`, { className: `icon-button`, disabled: w2 === 0, "aria-label": `Trang trước`, onClick: () => d2(w2 - 1), children: (0, Z.jsx)(S, { size: 16 }) }), (0, Z.jsx)(`button`, { className: `icon-button`, disabled: w2 >= x2 - 1, "aria-label": `Trang sau`, onClick: () => d2(w2 + 1), children: (0, Z.jsx)(C, { size: 16 }) })] })] })] });
}
function Ft({ catalogue: e2, entries: t2 }) {
  return (0, Z.jsx)(`div`, { className: `reference-scroll`, children: (0, Z.jsxs)(`table`, { className: `reference-table promotion-table`, children: [(0, Z.jsx)(`thead`, { children: (0, Z.jsx)(`tr`, { children: [`Nguồn`, `Discount apply`, `Key / Chính sách`, `Quan sát PaymentList`, `Chương trình / thời hạn`, `Điều kiện cần đối chiếu`].map((e3) => (0, Z.jsx)(`th`, { children: e3 }, e3)) }) }), (0, Z.jsx)(`tbody`, { children: t2.map((t3) => {
    let n2 = e2.programs.filter((e3) => t3.programIds.includes(e3.id)), r2 = t3.paymentObservation;
    return (0, Z.jsxs)(`tr`, { children: [(0, Z.jsxs)(`td`, { children: [t3.masterRow === null ? `PaymentList` : `Bảng giá · dòng ${t3.masterRow}`, r2 ? (0, Z.jsx)(pt, { refs: r2.refs }) : null] }), (0, Z.jsxs)(`td`, { children: [(0, Z.jsx)(`strong`, { children: t3.label }), (0, Z.jsx)(`p`, { children: t3.family }), r2 && r2.labels.some((e3) => e3 !== t3.label) ? (0, Z.jsxs)(`details`, { children: [(0, Z.jsx)(`summary`, { children: `Cách viết trong nguồn` }), r2.labels.map((e3) => (0, Z.jsx)(`p`, { children: e3 }, e3))] }) : null] }), (0, Z.jsxs)(`td`, { children: [(0, Z.jsx)(`span`, { className: `policy-badge ${t3.state}`, children: t3.state === `confirmed` ? `Có nguồn chính sách` : t3.state === `partial` ? `Cần đối chiếu` : `Chưa xác minh` }), t3.matchKeys?.length ? (0, Z.jsx)(`p`, { children: t3.matchKeys.join(` · `) }) : null, t3.ruleKeys?.map((e3) => (0, Z.jsx)(`p`, { children: (0, Z.jsx)(`code`, { children: e3 }) }, e3))] }), (0, Z.jsxs)(`td`, { children: [r2 ? (0, Z.jsxs)(Z.Fragment, { children: [(0, Z.jsxs)(`strong`, { children: [r2.count, ` Payment`] }), (0, Z.jsxs)(`p`, { children: [`Ngày hóa đơn: `, q(r2.from), `–`, q(r2.to)] })] }) : (0, Z.jsx)(`span`, { children: `Chưa có trong PaymentList đang mở` }), t3.observedValue === null ? null : (0, Z.jsxs)(`details`, { children: [(0, Z.jsx)(`summary`, { children: `Report trong bảng giá` }), typeof t3.observedValue == `number` && t3.observedValue > 0 && t3.observedValue < 1 ? `${Math.round(t3.observedValue * 100)}%` : K(t3.observedValue), (0, Z.jsx)(`p`, { children: t3.observedMethod }), (0, Z.jsxs)(`small`, { children: [q(t3.observedFrom), `–`, q(t3.observedTo)] })] })] }), (0, Z.jsx)(`td`, { children: n2.map((e3) => (0, Z.jsxs)(`p`, { children: [(0, Z.jsx)(`strong`, { children: e3.title }), (0, Z.jsx)(`br`, {}), ft(e3.from), ` → `, ft(e3.to)] }, e3.id)) }), (0, Z.jsx)(`td`, { children: n2.map((e3) => (0, Z.jsx)(`p`, { children: e3.conditions.join(` `) }, e3.id)) })] }, t3.id);
  }) })] }) });
}
var It = (e2) => String(e2 ?? ``).toLowerCase().normalize(`NFD`).replace(/[\u0300-\u036f]/g, ``).replace(/đ/g, `d`), Lt = [{ id: `programs`, label: `Chương trình` }, { id: `discounts`, label: `Discount apply` }, { id: `master`, label: `Bảng giá chung` }, { id: `prices`, label: `RULE` }, { id: `vouchers`, label: `Voucher` }];
function Rt({ data: e2, disabled: t2, onVoucherSave: n2 }) {
  let [r2, i2] = (0, l.useState)(null), [a2, o2] = (0, l.useState)(`programs`), [s2, c2] = (0, l.useState)(``), [u2, d2] = (0, l.useState)(`all`), f2 = It((0, l.useDeferredValue)(s2)), p2 = (0, l.useMemo)(() => e2.catalogue.programs.filter((e3) => (u2 === `all` || e3.state === u2) && (!f2 || It(JSON.stringify(e3)).includes(f2))), [e2, f2, u2]), m2 = (0, l.useMemo)(() => e2.catalogue.entries.filter((e3) => (u2 === `all` || e3.state === u2) && (!f2 || It(JSON.stringify(e3)).includes(f2))), [e2, f2, u2]), h2 = (0, l.useMemo)(() => referenceRows(e2,a2).filter((e3) => !f2 || It(Object.values(e3).join(` `)).includes(f2)), [e2, a2, f2]), g2 = a2 === `programs` ? p2.length : a2 === `discounts` ? m2.length : h2.length;
  return (0, Z.jsxs)(`section`, { className: `rules-view`, children: [(0, Z.jsxs)(`div`, { className: `rules-top`, children: [(0, Z.jsx)(`div`, { className: `segmented`, children: Lt.map((e3) => (0, Z.jsx)(`button`, { className: a2 === e3.id ? `selected` : ``, onClick: () => o2(e3.id), children: e3.label }, e3.id)) }), (0, Z.jsxs)(`label`, { className: `search-box`, children: [(0, Z.jsx)(B, { size: 16 }), (0, Z.jsx)(`input`, { value: s2, onChange: (e3) => c2(e3.target.value), placeholder: `Tìm chương trình, điều kiện, mã…`, "aria-label": `Tìm trong quy tắc` })] }), [`programs`, `discounts`].includes(a2) ? (0, Z.jsxs)(`select`, { className: `reference-select`, "aria-label": `Lọc tình trạng nguồn`, value: u2, onChange: (e3) => d2(e3.target.value), children: [(0, Z.jsx)(`option`, { value: `all`, children: `Tất cả căn cứ` }), (0, Z.jsx)(`option`, { value: `confirmed`, children: `Có nguồn chính sách` }), (0, Z.jsx)(`option`, { value: `partial`, children: `Cần đối chiếu thêm` }), (0, Z.jsx)(`option`, { value: `unverified`, children: `Chưa xác minh` })] }) : null, (0, Z.jsxs)(`span`, { className: `muted`, children: [g2, ` mục`] }), a2 === `vouchers` ? (0, Z.jsxs)(`button`, { className: `secondary-button`, disabled: t2, onClick: () => i2({}), children: [(0, Z.jsx)(R, { size: 14 }), `Thêm voucher`] }) : null] }), [`master`, `prices`].includes(a2) ? (0, Z.jsxs)(Z.Fragment, {children:[(0, Z.jsx)(PolicyCoverage,{data:e2}),(0, Z.jsx)(PolicyUpdateGuide,{policy:e2.policyReference})]}) : null, a2 === `vouchers` && r2 ? (0, Z.jsx)(wt, { initial: r2, profile: profileForVoucherCode(e2.records,r2.code), disabled: t2, onSave: async (e3, t3) => {
    let r3 = await n2(e3, t3);
    return i2(r3), r3;
  }, onCancel: () => i2(null) }) : null, a2 === `vouchers` ? (0, Z.jsx)(`p`, { className: `reference-intro`, children: `Mã Giftcode No mới nhập tại hồ sơ tự xuất hiện ở đây, ở trạng thái Chờ bổ sung. Voucher lưu riêng trên trình duyệt này và dùng lại giữa các đợt. Chính sách giá nằm tại Bảng giá chung và RULE; bảng này chỉ chứa mã Giftcode và hồ sơ voucher.` }) : null, a2 === `programs` ? (0, Z.jsxs)(Z.Fragment, { children: [(0, Z.jsx)(`p`, { className: `reference-intro`, children: `Thời hạn và điều kiện lấy từ bảng giá chung, lộ trình và các tài liệu nguồn. “Có nguồn chính sách” mô tả chương trình; từng hồ sơ vẫn phải đủ điều kiện. Ngày chưa công bố được giữ rõ trên màn hình.` }), (0, Z.jsx)(`div`, { className: `program-grid`, children: p2.map((e3) => (0, Z.jsx)(vt, { program: e3 }, e3.id)) })] }) : a2 === `discounts` ? (0, Z.jsxs)(Z.Fragment, { children: [(0, Z.jsx)(`p`, { className: `reference-intro`, children: `Tên Discount apply tự bổ sung từ PaymentList của bộ nguồn đang mở và ghép với bảng giá theo key kỳ khuyến mãi, loại ưu đãi và siblings, không cần trùng nguyên tên. Ngày hóa đơn là dữ liệu quan sát; mức giảm, thời hạn và điều kiện lấy từ chính sách liên kết.` }), (0, Z.jsx)(Ft, { catalogue: e2.catalogue, entries: m2 })] }) : (0, Z.jsxs)(Z.Fragment, { children: [(0, Z.jsx)(ReferenceTable, {key:a2,section:a2,rows:h2,disabled:t2,onVoucherEdit:(code)=>i2(e2.customVouchers.find(v=>v.code===code)??null)}), a2 === `master` ? (0, Z.jsx)(`p`, { className: `reference-intro`, children: `Giá CALC lấy từ các file chính sách gốc. Audit v7 là bộ ca đối chiếu tháng 9–10, không phải danh mục rule đầy đủ. Giá có nguồn “Report / chưa có trong Audit” là số quan sát, chưa dùng để tự xác nhận hồ sơ.` }) : null] }), g2 ? null : (0, Z.jsx)(`div`, { className: `empty-state`, children: `Không có mục phù hợp với từ khóa hoặc bộ lọc.` }), (0, Z.jsxs)(`p`, { className: `reference-note`, children: [(0, Z.jsx)(ee, { size: 13 }), e2.sourceManifest.length, ` file nguồn · chốt đối chiếu `, q(e2.cutoff), ` · chỉnh đầu vào tại Check installment.`] })] });
}
function zt({ onOpen: e2 }) {
  return (0, Z.jsxs)(`div`, { className: `loading-state`, role: `status`, children: [(0, Z.jsx)(k, { size: 30 }), (0, Z.jsx)(`h2`, { children: `Chưa có bộ nguồn giao dịch` }), (0, Z.jsx)(`p`, { children: `Tải đồng thời Export ByCourse, PaymentList và Transfer, hoặc Audit có các sheet nguồn. Web tính lại từng CT; file giao dịch và minh chứng lưu riêng trên trình duyệt này.` }), (0, Z.jsx)(`button`, { className: `primary-button`, onClick: e2, children: `Tải bộ nguồn` })] });
}
var Bt = (e2) => String(e2 ?? ``).toLowerCase().normalize(`NFD`).replace(/[\u0300-\u036f]/g, ``).replace(/đ/g, `d`).replace(/\((?:raw|calc)\)/g, ``).replace(/[^a-z0-9]/g, ``), Q = (e2, t2, n2, r2 = [], i2 = false) => ({ key: e2, col: t2, label: n2, aliases: [n2, ...r2].map(Bt), required: i2 }), Vt = [Q(`paymentCode`, `D`, `Payment code`, [`Mã thanh toán`, `Payment No`], true), Q(`contractCode`, `E`, `Contract code`, [`Contract No`, `Contract code (hóa đơn)`, `Mã hợp đồng`], true), Q(`studentId`, `R`, `Student ID`, [`Mã học viên`], true), Q(`invoiceDate`, `O`, `Invoice date`, [`Ngày hóa đơn`, `Payment date`, `Ngày thu`], true), Q(`paidAmount`, `AF`, `Final payment invoice amount`, [`Final payment amount invoice`, `Amount paid`, `Số tiền đã thu`, `Số tiền`, `Thực thu`], true), Q(`studentName`, `S`, `Student name`, [`Tên học viên`, `Họ tên học viên`]), Q(`centerName`, `B`, `Center name`, [`Tên trung tâm`]), Q(`centerCode`, `C`, `Center code`, [`Mã trung tâm`]), Q(`contractTotal`, `CT_TOTAL`, `Contract tổng (CT)`, [`Contract tổng`, `Contract total`, `Parent contract`, `Contract tổng đã nhận diện`]), Q(`courseFee`, `Z`, `Course fee KOC`, [`Course fee`, `Khóa học`]), Q(`hours`, `AA`, `Hour/week`, [`Hours/week`, `Giờ/tuần`]), Q(`package`, `AB`, `Package`, [`Gói học`]), Q(`giftcode`, `AO`, `Giftcode No`, [`Giftcode No.`, `Mã giftcode`]), Q(`discountApply`, `AQ`, `Discount apply`, [`Khuyến mãi áp dụng`]), Q(`method`, `AH`, `Method`, [`Phương thức thanh toán`]), Q(`bank`, `AI`, `Bank for installment`, [`Ngân hàng trả góp`]), Q(`term`, `AJ`, `Installment month`, [`Số tháng trả góp`]), Q(`before`, `AC`, `Amount before discount`, [`Số tiền trước giảm`]), Q(`discount`, `AD`, `Discount amount`, [`Tiền giảm giá`]), Q(`giftAmount`, `AE`, `Giftcode amount`, [`Giá trị giftcode`]), Q(`totalHours`, `AG`, `Total hour of contract`, [`Tổng giờ học`]), Q(`vat`, `P`, `VAT Invoice No.`, [`VAT Invoice No`, `Số hóa đơn VAT`]), Q(`paymentType`, `F`, `Payment type`, [`Loại thanh toán`]), Q(`contractType`, `G`, `Contract type`, [`Contract type name`, `Loại hợp đồng`]), Q(`business`, `H`, `Business type`, [`Contract business type`]), Q(`invoiceStatus`, `I`, `Invoice status`, [`Status E-invoice`, `Trạng thái hóa đơn`]), Q(`fullStatus`, `J`, `Full status`, [`Tình trạng full phí`]), Q(`installmentForm`, `K`, `Installment form`, [`Hồ sơ trả góp`]), Q(`source`, `T`, `Source`, [`Nguồn học viên`]), Q(`subSource`, `U`, `Sub-Source`), Q(`groupKoc`, `X`, `Group KOC`), Q(`koc`, `Y`, `KOC`), Q(`voucherDescription`, `AP`, `Voucher description`), Q(`note`, `AR`, `Note`, [`Ghi chú`]), Q(`packageBefore`, `AW`, `Package before discount`), Q(`packageAfter`, `AX`, `Package after discount`), Q(`giftMonth`, `AY`, `Gift month`), Q(`packageTotal`, `AZ`, `Package total`)];
new Set(Vt.map((e2) => e2.col)), new Set(Vt.filter((e2) => ![`O`, `AC`, `AD`, `AE`, `AF`, `AG`].includes(e2.col)).map((e2) => e2.col));
var Ht = { export: `Export ByCourse`, payment: `PaymentList`, transfer: `Transfer` }, $ = (e2, t2, n2 = [], r2 = false, i2) => ({ key: e2, label: t2, required: r2, aliases: [t2, ...n2].map(Bt), occurrence: i2 }), Ut = { payment: Vt, export: [$(`ct`, `Contract No.`, [`Contract No`, `Contract code`], true), $(`student`, `Student code`, [`Student ID`], true), $(`target`, `Final pay amount contract`, [`Final payment amount contract`], true), $(`paid`, `Total Final payment amount invoice`, [`Total invoice amount`], true), $(`courseFee`, `Price name`, [`Course fee KOC`]), $(`hoursPerWeek`, `Hour/week`, [`Hours/week`, `Hours per week`]), $(`package`, `Package Before Discount`), $(`packageAfter`, `Package After Discount`), $(`totalHours`, `SUM: Total Hours`, [`SUM Total Hours`]), $(`dates`, `Invoice Date`), $(`studentName`, `Student name`), $(`centerName`, `Center name`), $(`center`, `Center code`), $(`contractType`, `Contract type`, [`Contact type`]), $(`business`, `Contract bussiness type`, [`Business Type`]), $(`source`, `Source`), $(`subSource`, `Sub source`)], transfer: [$(`type`, `Transfer Type`, [], true), $(`date`, `Transfer Date`, [], true), $(`fromStudent`, `From Student ID`, [], true), $(`from`, `From Contract/Deposit No`, [`From Contract No`], true), $(`out`, `Amount`, [`From amount`], true, 0), $(`toStudent`, `To Student ID`, [], true), $(`to`, `To Contract No`, [], true), $(`amount`, `Amount`, [`To amount`], true, 1), $(`fromHours`, `Hours`, [`From hours`], false, 0), $(`toHours`, `Hours`, [`To hours`], false, 1), $(`description`, `Description`), $(`payment`, `Payment code`, [`To Payment code`, `Receiving Payment code`])] }, Wt = `/source-parser.worker.mjs`;
function Gt(e2, t2 = 0) {
  if (!Ne(e2) || !Number.isInteger(t2) || t2 < 0 || t2 > 2) throw Error(`Chọn tháng và tối đa 2 tháng nguồn lịch sử.`);
  let n2 = [`transfer`, `export`, `payment`].map((t3) => ({ report: t3, month: e2 })), [r2, i2] = e2.split(`-`).map(Number);
  for (let e3 = 1; e3 <= t2; e3++) {
    let t3 = new Date(Date.UTC(r2, i2 - 1 - e3, 1)).toISOString().slice(0, 7);
    if (!Ne(t3)) throw Error(`Tháng lịch sử ngoài phạm vi hỗ trợ.`);
    for (let e4 of [`payment`, `transfer`]) n2.push({ report: e4, month: t3 });
  }
  return n2;
}
function Kt(e2, t2, n2) {
  let r2 = ze(e2, t2, n2);
  if (!r2) throw Error(`Báo cáo Hub chưa khớp tháng, North, bảng chi tiết hoặc tổng số dòng; chưa nhập dữ liệu.`);
  let i2 = Y[t2], a2 = [[`Hub report snapshot`, i2.label], [`Source URL`, r2.url], [`Captured at`, r2.capturedAt], [`Region`, `North (1)`], [`Date filter`, i2.dateField], [`Month`, n2], [`Detail records`, String(r2.total)], [], r2.headers, ...r2.rows], o2 = (e3) => `"` + String(e3).replace(/"/g, `""`) + `"`;
  return { fileName: `Hub_${i2.path.split(`/`).at(-1)}_${n2}.csv`, text: `\uFEFF` + a2.map((e3) => e3.map(o2).join(`,`)).join(`\r
`), report: t2, month: n2, total: r2.total, url: r2.url };
}
async function qt(e2, t2, { read: n2, progress: r2 = () => {
}, signal: i2 } = {}) {
  let a2 = Gt(e2, t2), o2 = [];
  for (let e3 = 0; e3 < a2.length; e3++) {
    if (i2?.aborted) throw Object.assign(Error(`Đã dừng lấy báo cáo Hub.`), { code: `cancelled` });
    let t3 = a2[e3];
    r2({ index: e3 + 1, total: a2.length, ...t3 });
    let s2 = await n2(t3, i2);
    o2.push(Kt(s2, t3.report, t3.month));
  }
  if (i2?.aborted) throw Object.assign(Error(`Đã dừng lấy báo cáo Hub.`), { code: `cancelled` });
  return o2;
}
function Jt({ value: e2 }) {
  let t2 = Be(e2);
  return t2 ? (0, Z.jsxs)(`details`, { className: `hub-report-diagnostic`, children: [(0, Z.jsx)(`summary`, { children: `Chi tiết kiểm tra báo cáo` }), (0, Z.jsx)(`p`, { className: `source-note`, children: `Chỉ gồm bước đọc, trạng thái tải, cấu trúc bảng và số dòng; không chứa dữ liệu học viên.` }), (0, Z.jsx)(`pre`, { style: { whiteSpace: `pre-wrap`, overflowWrap: `anywhere` }, children: JSON.stringify(t2, null, 2) }), (0, Z.jsxs)(`button`, { type: `button`, className: `secondary-button`, onClick: () => {
    let e3 = URL.createObjectURL(new Blob([JSON.stringify({ bridge: Ye, ...t2 }, null, 2)], { type: `application/json` })), n2 = document.createElement(`a`);
    n2.href = e3, n2.download = `promotion-hub-report-diagnostic.json`, n2.click(), setTimeout(() => URL.revokeObjectURL(e3), 1e3);
  }, children: [(0, Z.jsx)(O, { size: 14 }), `Tải chi tiết lỗi`] })] }) : null;
}
function Yt({ disabled: e2, onBusy: t2, onReports: n2 }) {
  let [r2, i2] = (0, l.useState)(() => (/* @__PURE__ */ new Date()).toISOString().slice(0, 7)), [a2, o2] = (0, l.useState)(0), [s2, c2] = (0, l.useState)(``), [u2, d2] = (0, l.useState)(false), [f2, p2] = (0, l.useState)(false), [m2, h2] = (0, l.useState)(false), [g2, _2] = (0, l.useState)(``), [v2, y2] = (0, l.useState)(``), [b2, x2] = (0, l.useState)([]), S2 = (0, l.useRef)(null), [C2, w2] = (0, l.useState)(null), T2 = async () => {
    p2(true);
    try {
      let e3 = await Xe(`ping`);
      c2(e3.version ?? ``);
      let t3 = e3.version === Ye;
      return d2(t3), t3;
    } catch {
      return d2(false), c2(``), false;
    } finally {
      p2(false);
    }
  };
  (0, l.useEffect)(() => (T2(), () => S2.current?.abort()), []), (0, l.useEffect)(() => (t2(m2), () => t2(false)), [m2, t2]);
  let E2 = async () => {
    let t3 = Ne(r2);
    if (m2 || e2 || !t3) return;
    h2(true), _2(``), w2(null), y2(`Đang kiểm tra cầu nối…`);
    let i3 = new AbortController();
    S2.current = i3, x2([]);
    try {
      if (x2(Gt(r2, a2).map((e3) => ({ ...e3, state: `queued` }))), !await T2()) throw Error(`Cập nhật / cài cầu nối ${Ye}, tải lại Promotion và kiểm tra kết nối.`);
      n2(await qt(r2, a2, { signal: i3.signal, progress: (e3) => {
        y2(`${e3.index}/${e3.total} · ${Y[e3.report].label} · ${e3.month}`), x2((t4) => t4.map((t5) => t5.report === e3.report && t5.month === e3.month ? { ...t5, state: `reading` } : t5));
      }, read: async (e3, t4) => {
        let n3 = await Qe(e3.report, e3.month, y2, t4);
        return x2((t5) => t5.map((t6) => t6.report === e3.report && t6.month === e3.month ? { ...t6, state: `done`, total: n3.total } : t6)), n3;
      } }), t3), y2(`Đã lấy đủ các bảng chi tiết. Kiểm tra bản xem trước rồi bấm Lưu bộ nguồn & tra soát.`);
    } catch (e3) {
      x2((e4) => e4.map((e5) => e5.state === `reading` ? { ...e5, state: i3.signal.aborted ? `stopped` : `error` } : e5)), _2((e3 instanceof Error ? e3.message : `Chưa lấy được dữ liệu Hub.`) + ` Bộ nguồn đang chọn được giữ nguyên; chưa nhập phần dữ liệu dở dang.`), w2(Be(e3?.diagnostic)), y2(``);
    } finally {
      h2(false), S2.current = null;
    }
  }, D2 = Ne(r2);
  return (0, Z.jsxs)(`section`, { className: `hub-reports-panel`, "aria-label": `Lấy dữ liệu từ Hub`, children: [(0, Z.jsxs)(`div`, { className: `program-head`, children: [(0, Z.jsxs)(`div`, { children: [(0, Z.jsxs)(`h3`, { children: [(0, Z.jsx)(F, { size: 18 }), `Lấy dữ liệu từ Hub`] }), (0, Z.jsx)(`p`, { children: `Dùng phiên Hub của bạn trên Chrome/Edge. Lấy bảng chi tiết, tự đặt ps theo tổng dòng; chỉ North.` })] }), (0, Z.jsx)(`span`, { className: u2 ? `hub-bridge-status ready` : `hub-bridge-status`, children: u2 ? `Cầu nối ${s2} đã kết nối` : s2 ? `Cần cập nhật ${s2} → ${Ye}` : `Chưa kết nối cầu nối` })] }), (0, Z.jsxs)(`div`, { className: `hub-report-options`, children: [(0, Z.jsxs)(`label`, { children: [(0, Z.jsx)(`span`, { children: `Tháng tra soát` }), (0, Z.jsx)(`input`, { type: `month`, min: `2000-01`, max: `2099-12`, value: r2, disabled: e2 || m2, onChange: (e3) => i2(e3.target.value) })] }), (0, Z.jsxs)(`label`, { children: [(0, Z.jsx)(`span`, { children: `Nguồn thu / chuyển của tháng trước` }), (0, Z.jsxs)(`select`, { value: a2, disabled: e2 || m2, onChange: (e3) => o2(Number(e3.target.value)), children: [(0, Z.jsx)(`option`, { value: 0, children: `Chỉ tháng đang chọn` }), (0, Z.jsx)(`option`, { value: 1, children: `Thêm 1 tháng lịch sử` }), (0, Z.jsx)(`option`, { value: 2, children: `Thêm 2 tháng lịch sử` })] })] }), (0, Z.jsxs)(`div`, { children: [(0, Z.jsx)(`span`, { children: `Phạm vi` }), (0, Z.jsx)(`strong`, { children: `North · 1` }), (0, Z.jsx)(`small`, { children: D2 ? `${D2.from} → ${D2.to}` : `Chọn tháng hợp lệ` })] })] }), (0, Z.jsx)(`div`, { className: `hub-report-mapping`, children: Object.keys(Y).map((e3) => (0, Z.jsxs)(`div`, { children: [(0, Z.jsx)(`strong`, { children: Y[e3].label }), (0, Z.jsx)(`span`, { children: Y[e3].dateField })] }, e3)) }), (0, Z.jsxs)(`p`, { className: `source-note`, children: [`PaymentList lọc `, Y.payment.centers?.split(`_`).length, ` center đã chỉ định và có thể tải lâu theo dữ liệu tháng, tốc độ mạng. Thời gian chờ tối đa `, Me(`payment`) / 6e4, ` phút mỗi bước; bạn có thể bấm Dừng lấy dữ liệu.`] }), (0, Z.jsxs)(`div`, { className: `hub-contract-actions`, children: [(0, Z.jsxs)(`button`, { className: `secondary-button`, disabled: e2 || m2 || f2, onClick: () => void T2(), children: [(0, Z.jsx)(z, { size: 14 }), f2 ? `Đang kiểm tra…` : `Kiểm tra cầu nối`] }), (0, Z.jsxs)(`button`, { className: `primary-button`, disabled: e2 || m2 || !u2 || !D2, onClick: () => void E2(), children: [(0, Z.jsx)(O, { size: 15 }), a2 ? `Lấy báo cáo & nguồn lịch sử` : `Lấy 3 báo cáo North`] }), m2 ? (0, Z.jsxs)(`button`, { className: `quiet-button`, onClick: () => S2.current?.abort(), children: [(0, Z.jsx)(H, { size: 14 }), `Dừng lấy dữ liệu`] }) : null] }), u2 ? null : (0, Z.jsxs)(`details`, { className: `hub-report-setup`, children: [(0, Z.jsxs)(`summary`, { children: [`Cài / cập nhật cầu nối `, Ye] }), (0, Z.jsxs)(`p`, { children: [(0, Z.jsx)(`a`, { href: `/downloads/promotion-hub-bridge.zip?v=1.6.13`, download: true, children: `Tải cầu nối Hub` }), `, giải nén; mở chrome://extensions (Edge: edge://extensions), bật Developer mode và Load unpacked. Nếu đã cài, thay file và bấm Tải lại tiện ích. Sau đó tải lại Promotion.`] }), (0, Z.jsx)(`p`, { children: `Đăng nhập chỉ tại tab Hub khi được yêu cầu. Promotion không nhận mật khẩu hoặc cookie.` })] }), v2 ? (0, Z.jsxs)(`p`, { className: `import-status`, role: `status`, children: [m2 ? (0, Z.jsx)(I, { size: 14, className: `spin` }) : null, v2] }) : null, b2.length ? (0, Z.jsx)(`ul`, { className: `hub-report-results`, children: b2.map((e3) => (0, Z.jsxs)(`li`, { children: [(0, Z.jsxs)(`span`, { children: [Y[e3.report].label, ` · `, e3.month] }), (0, Z.jsx)(`strong`, { children: e3.state === `done` ? `${e3.total?.toLocaleString(`vi-VN`)} dòng` : e3.state === `reading` ? `Đang đọc` : e3.state === `error` ? `Lỗi · Chưa nhập` : e3.state === `stopped` ? `Đã dừng` : `Chưa đọc` })] }, e3.report + e3.month)) }) : null, g2 ? (0, Z.jsx)(`p`, { className: `hub-error`, role: `alert`, children: g2 }) : null, g2 && C2 ? (0, Z.jsx)(Jt, { value: C2 }) : null, (0, Z.jsx)(`p`, { className: `source-note`, children: `Bản chụp CSV giữ URL báo cáo, thời điểm lấy, bộ lọc và các dòng chi tiết. Nguồn thiếu hóa đơn gốc vẫn CHECK; không dùng báo cáo chuyển tiền để tự xác nhận đã thu đủ.` })] });
}
var Xt = () => {
  let e2 = /* @__PURE__ */ new Date();
  return `${e2.getFullYear()}-${String(e2.getMonth() + 1).padStart(2, `0`)}-${String(e2.getDate()).padStart(2, `0`)}`;
};
function Zt({ currentId: e2, onClose: t2, onOpen: n2 }) {
  let [r2, i2] = (0, l.useState)([]), [a2, o2] = (0, l.useState)([]), [s2, c2] = (0, l.useState)(null), [u2, d2] = (0, l.useState)(() => Xt().slice(0, 8) + `01`), [f2, p2] = (0, l.useState)(Xt), [m2, h2] = (0, l.useState)(``), [g2, v2] = (0, l.useState)(false), [y2, x2] = (0, l.useState)(false), [S2, C2] = (0, l.useState)(false), [T2, E2] = (0, l.useState)(``), [D2, j2] = (0, l.useState)(``), [M2, N2] = (0, l.useState)(``), [P2, F2] = (0, l.useState)([]), [ee2, te2] = (0, l.useState)(false), ne2 = (0, l.useRef)(null), L2 = (0, l.useRef)(null), R2 = (0, l.useRef)(null), z2 = (0, l.useRef)(0), re2 = (0, l.useRef)(null), ie2 = (0, l.useRef)(/* @__PURE__ */ new Map());
  (0, l.useEffect)(() => {
    ne2.current?.showModal();
    let e3 = new Worker(Wt, { type: `module` });
    R2.current = e3, e3.onmessage = ({ data: e4 }) => {
      if (e4.requestId === z2.current) {
        if (e4.type === `error`) {
          j2(e4.message), v2(false), x2(false);
          return;
        }
        if (e4.type === `progress`) {
          E2(`Đang đọc file ${e4.done}/${e4.total}…`);
          return;
        }
        if (e4.type === `loaded`) {
          o2(e4.configurations), v2(false), E2(``);
          return;
        }
        if (e4.type === `selected`) {
          o2((t4) => t4.map((t5) => t5.key === e4.configuration.key ? e4.configuration : t5)), v2(false);
          return;
        }
        e4.type === `preview` && (c2(e4), x2(false), j2(``));
      }
    }, e3.onerror = () => {
      j2(`Chưa mở được bộ đọc nguồn. Hãy tải lại trang và thử lại.`), v2(false), x2(false);
    };
    let t3 = new AbortController();
    return fetch(`/api/datasets`, { cache: `no-store`, signal: t3.signal }).then(async (e4) => {
      let t4 = await e4.json();
      if (!e4.ok) throw Error(t4.error ?? `Chưa tải được các đợt đã lưu.`);
      F2(t4.datasets);
    }).catch((e4) => {
      e4.name !== `AbortError` && N2(e4.message);
    }), () => {
      t3.abort(), re2.current?.abort(), e3.terminate(), R2.current = null, z2.current++;
    };
  }, []), (0, l.useEffect)(() => {
    if (!a2.length || g2) return;
    let e3 = ++z2.current;
    x2(true), c2(null);
    let t3 = setTimeout(() => R2.current?.postMessage({ type: `preview`, requestId: e3, configurations: a2, scope: { from: u2, to: f2, center: m2 } }), 200);
    return () => clearTimeout(t3);
  }, [a2, g2, u2, f2, m2]);
  let B2 = (e3) => {
    if (e3.length) {
      if (j2(``), c2(null), o2([]), e3.length > 8 || e3.some((e4) => !e4.size || e4.size > 20971520 || !/\.(xlsx|csv|tsv)$/i.test(e4.name))) {
        j2(`Chọn tối đa 8 file XLSX/CSV/TSV, mỗi file tối đa 20 MB.`);
        return;
      }
      i2(e3), v2(true), E2(`Đang đọc bộ nguồn…`), R2.current?.postMessage({ type: `read`, requestId: ++z2.current, files: e3 });
    }
  }, ae2 = (e3, t3, n3 = false) => {
    v2(true), c2(null), R2.current?.postMessage({ type: `select`, requestId: ++z2.current, configuration: { ...e3, ...t3 }, reheader: n3 });
  }, V2 = (e3, t3) => o2((n3) => n3.map((n4) => n4.key === e3 ? { ...n4, ...t3 } : n4)), oe2 = async () => {
    if (!s2?.bundle || y2 || g2) return;
    C2(true), j2(``);
    let e3 = new AbortController();
    re2.current = e3;
    try {
      let t3 = [];
      for (let n3 = 0; n3 < r2.length; n3++) {
        let i4 = r2[n3];
        E2(`Đang lưu bản gốc ${n3 + 1}/${r2.length}: ${i4.name}`);
        let a4 = ie2.current.get(i4);
        if (!a4) {
          let t4 = new URLSearchParams({ name: i4.name }), n4 = await fetch(`/api/source-files?` + t4, { method: `POST`, headers: { "Content-Type": `application/octet-stream` }, body: i4, signal: e3.signal }), r3 = await n4.json();
          if (!n4.ok) throw Error(r3.error ?? `Chưa lưu được file nguồn.`);
          a4 = r3.file.id, ie2.current.set(i4, a4);
        }
        t3.push(a4);
      }
      E2(`Đang lưu đợt tra soát…`);
      let i3 = await fetch(`/api/datasets`, { method: `POST`, headers: { "Content-Type": `application/json` }, body: JSON.stringify({ bundle: s2.bundle, fileIds: t3 }), signal: e3.signal }), a3 = await i3.json();
      if (!i3.ok) throw Error(a3.error ?? `Chưa lưu được đợt nguồn.`);
      n2(a3.dataset.id);
    } catch (e4) {
      e4 instanceof Error && e4.name !== `AbortError` && j2(e4.message), C2(false), E2(``);
    }
  }, H2 = g2 || S2 || ee2;
  return (0, Z.jsx)(`dialog`, { ref: ne2, className: `upload-dialog`, "aria-labelledby": `source-upload-title`, onCancel: (e3) => {
    S2 ? e3.preventDefault() : t2();
  }, onClick: (e3) => {
    e3.target === ne2.current && !S2 && t2();
  }, children: (0, Z.jsxs)(`div`, { className: `upload-inner`, children: [(0, Z.jsxs)(`header`, { className: `upload-header`, children: [(0, Z.jsxs)(`div`, { children: [(0, Z.jsx)(`div`, { className: `eyebrow`, children: `NGUỒN THEO KỲ` }), (0, Z.jsx)(`h2`, { id: `source-upload-title`, children: `Nguồn tra soát theo tháng.` }), (0, Z.jsx)(`p`, { children: `Chọn ba báo cáo Export ByCourse, PaymentList, Transfer; có thể thêm PaymentList lịch sử hoặc Audit có các sheet nguồn. File và kết quả lưu riêng trên trình duyệt này. Nếu dùng Hub, dữ liệu lấy theo phạm vi hiển thị bên dưới.` })] }), (0, Z.jsx)(`button`, { className: `icon-button`, disabled: S2, onClick: t2, "aria-label": `Đóng tải nguồn`, children: (0, Z.jsx)(le, { size: 20 }) })] }), (0, Z.jsxs)(`div`, { className: `upload-body`, children: [(0, Z.jsx)(Yt, { disabled: g2 || S2, onBusy: te2, onReports: (e3, t3) => {
    d2(t3.from), p2(t3.to), h2(``), B2(e3.map((e4) => new File([e4.text], e4.fileName, { type: `text/csv;charset=utf-8` })));
  } }), (0, Z.jsxs)(`section`, { className: `upload-drop`, onDragOver: (e3) => e3.preventDefault(), onDrop: (e3) => {
    e3.preventDefault(), H2 || B2(Array.from(e3.dataTransfer.files));
  }, children: [(0, Z.jsx)(`span`, { className: `upload-drop-icon`, children: (0, Z.jsx)(A, { size: 27 }) }), (0, Z.jsxs)(`div`, { children: [(0, Z.jsx)(`strong`, { children: r2.length ? `${r2.length} file nguồn đã chọn` : `Hoặc kéo thả bộ file nguồn vào đây` }), (0, Z.jsxs)(`p`, { children: [`XLSX, CSV, TSV · mỗi file tối đa 20 MB · tối đa `, 8, ` file`] })] }), (0, Z.jsxs)(`button`, { className: `secondary-button`, disabled: H2, onClick: () => L2.current?.click(), children: [(0, Z.jsx)(ce, { size: 15 }), r2.length ? `Chọn lại bộ file` : `Chọn nhiều file`] }), (0, Z.jsx)(`input`, { ref: L2, type: `file`, multiple: true, hidden: true, accept: `.xlsx,.csv,.tsv`, onChange: (e3) => {
    B2(Array.from(e3.target.files ?? [])), e3.target.value = ``;
  } })] }), T2 ? (0, Z.jsxs)(`div`, { className: `import-status`, role: `status`, children: [(0, Z.jsx)(I, { size: 17, className: `spin` }), T2] }) : null, D2 ? (0, Z.jsxs)(`div`, { className: `error-banner`, role: `alert`, children: [(0, Z.jsx)(w, { size: 18 }), (0, Z.jsx)(`p`, { children: D2 })] }) : null, a2.length ? (0, Z.jsxs)(Z.Fragment, { children: [(0, Z.jsx)(`div`, { className: `source-role-summary`, children: Object.keys(Ht).map((e3) => (0, Z.jsxs)(`span`, { className: a2.some((t3) => t3.role === e3) ? `ready` : `pending`, children: [a2.some((t3) => t3.role === e3) ? (0, Z.jsx)(b, { size: 14 }) : (0, Z.jsx)(w, { size: 14 }), ` `, Ht[e3]] }, e3)) }), (0, Z.jsxs)(`div`, { className: `import-options`, children: [(0, Z.jsxs)(`label`, { children: [(0, Z.jsx)(`span`, { children: `Tra soát từ ngày` }), (0, Z.jsx)(`input`, { type: `date`, value: u2, disabled: H2, onInput: (e3) => d2(e3.target.value), onChange: (e3) => d2(e3.target.value) })] }), (0, Z.jsxs)(`label`, { children: [(0, Z.jsx)(`span`, { children: `Chốt đến ngày` }), (0, Z.jsx)(`input`, { type: `date`, value: f2, disabled: H2, onInput: (e3) => p2(e3.target.value), onChange: (e3) => p2(e3.target.value) })] }), (0, Z.jsxs)(`label`, { children: [(0, Z.jsx)(`span`, { children: `Trung tâm cần tra soát` }), (0, Z.jsxs)(`select`, { value: m2, disabled: H2, onChange: (e3) => h2(e3.target.value), children: [(0, Z.jsx)(`option`, { value: ``, children: `Tất cả` }), s2?.centers.map((e3) => (0, Z.jsx)(`option`, { children: e3 }, e3))] })] })] }), (0, Z.jsx)(`p`, { className: `source-note`, children: `Lưu bộ nguồn sẽ tính lại trên web từ PaymentList, Transfer và Export, không cần tính lại Excel. Khoảng ngày chọn các hóa đơn cần tra soát. Cọc và chuyển tiền liên quan trước đó được lấy từ bộ nguồn đến ngày chốt; hãy thêm PaymentList lịch sử nếu có cọc cũ. Dữ liệu giao dịch cũ không trộn vào đợt này.` }), (0, Z.jsx)(`div`, { className: `source-configurations`, children: a2.map((e3) => (0, Z.jsxs)(`details`, { className: `mapping-details`, children: [(0, Z.jsxs)(`summary`, { children: [(0, Z.jsx)(k, { size: 15 }), e3.fileName, ` · `, e3.sheetName, (0, Z.jsx)(`span`, { children: Ht[e3.role] })] }), (0, Z.jsxs)(`div`, { className: `import-options`, children: [(0, Z.jsxs)(`label`, { children: [(0, Z.jsx)(`span`, { children: `Loại nguồn` }), (0, Z.jsx)(`select`, { value: e3.role, disabled: H2, onChange: (t3) => ae2(e3, { role: t3.target.value }), children: Object.entries(Ht).map(([e4, t3]) => (0, Z.jsx)(`option`, { value: e4, children: t3 }, e4)) })] }), (0, Z.jsxs)(`label`, { children: [(0, Z.jsx)(`span`, { children: `Sheet` }), (0, Z.jsx)(`select`, { value: e3.sheetName, disabled: H2, onChange: (t3) => ae2(e3, { sheetName: t3.target.value }), children: e3.sheets.map((e4) => (0, Z.jsx)(`option`, { children: e4.name }, e4.name)) })] }), (0, Z.jsxs)(`label`, { children: [(0, Z.jsx)(`span`, { children: `Dòng tiêu đề` }), (0, Z.jsx)(`input`, { type: `number`, min: 1, max: 100, value: e3.headerRow, disabled: H2, onChange: (t3) => V2(e3.key, { headerRow: Number(t3.target.value) }), onBlur: () => {
    e3.headerRow >= 1 && e3.headerRow <= 100 && ae2(e3, {}, true);
  } })] }), (0, Z.jsxs)(`label`, { children: [(0, Z.jsx)(`span`, { children: `Ngày dạng chữ` }), (0, Z.jsxs)(`select`, { value: e3.dateOrder, disabled: H2, onChange: (t3) => V2(e3.key, { dateOrder: t3.target.value }), children: [(0, Z.jsx)(`option`, { value: `DMY`, children: `DD/MM/YYYY` }), (0, Z.jsx)(`option`, { value: `MDY`, children: `MM/DD/YYYY` })] })] })] }), (0, Z.jsx)(`div`, { className: `mapping-grid`, children: Ut[e3.role].map((t3) => (0, Z.jsxs)(`label`, { children: [(0, Z.jsxs)(`span`, { children: [t3.label, t3.required ? ` *` : ``, t3.occurrence === void 0 ? `` : ` · ${t3.key === `out` || t3.key === `fromHours` ? `Chuyển ra` : `Chuyển vào`}`] }), (0, Z.jsxs)(`select`, { value: e3.mapping[t3.key] ?? -1, disabled: H2, onChange: (n3) => V2(e3.key, { mapping: { ...e3.mapping, [t3.key]: Number(n3.target.value) } }), children: [(0, Z.jsx)(`option`, { value: -1, children: `Chưa có cột tương ứng` }), e3.headers.map((e4) => (0, Z.jsx)(`option`, { value: e4.index, children: e4.label }, e4.index))] })] }, t3.key)) })] }, e3.key)) }), y2 ? (0, Z.jsxs)(`div`, { className: `import-status`, children: [(0, Z.jsx)(I, { size: 16, className: `spin` }), `Đang nối và đối chiếu bộ nguồn…`] }) : null, s2 ? (0, Z.jsxs)(Z.Fragment, { children: [s2.summary ? (0, Z.jsxs)(`div`, { className: `import-preview-summary`, children: [(0, Z.jsxs)(`span`, { children: [(0, Z.jsx)(`strong`, { children: s2.summary.selected }), ` hóa đơn tra soát`] }), (0, Z.jsxs)(`span`, { children: [(0, Z.jsx)(`strong`, { children: s2.summary.cash }), ` bản thu/lịch sử liên quan`] }), (0, Z.jsxs)(`span`, { children: [(0, Z.jsx)(`strong`, { children: s2.summary.transfers }), ` dòng chuyển`] }), (0, Z.jsxs)(`span`, { children: [(0, Z.jsx)(`strong`, { children: s2.summary.exports }), ` CT trong Export`] })] }) : null, s2.errors.length ? (0, Z.jsxs)(`div`, { className: `import-errors`, role: `alert`, children: [(0, Z.jsxs)(`strong`, { children: [s2.errors.length, ` mục cần xử lý`] }), (0, Z.jsx)(`ul`, { children: s2.errors.slice(0, 15).map((e3, t3) => (0, Z.jsxs)(`li`, { children: [e3.row ? `Dòng ${e3.row}: ` : ``, e3.message] }, t3)) }), s2.errors.length > 15 ? (0, Z.jsxs)(`p`, { children: [`Và `, s2.errors.length - 15, ` mục khác; kiểm tra các cột và phạm vi nguồn.`] }) : null] }) : (0, Z.jsxs)(`p`, { className: `import-ready`, children: [(0, Z.jsx)(b, { size: 15 }), `Bộ nguồn đủ cấu trúc để lưu và bắt đầu tính lại.`] }), s2.warnings.map((e3) => (0, Z.jsx)(`p`, { className: `source-note`, children: e3 }, e3)), s2.samples.length ? (0, Z.jsx)(`div`, { className: `import-preview-scroll`, children: (0, Z.jsxs)(`table`, { className: `reference-table`, children: [(0, Z.jsx)(`thead`, { children: (0, Z.jsx)(`tr`, { children: [`Payment code`, `Contract code`, `Student ID`, `Ngày`, `Tiền thu`].map((e3) => (0, Z.jsx)(`th`, { children: e3 }, e3)) }) }), (0, Z.jsx)(`tbody`, { children: s2.samples.map((e3, t3) => (0, Z.jsxs)(`tr`, { children: [(0, Z.jsx)(`td`, { children: e3.cells.D }), (0, Z.jsx)(`td`, { children: e3.cells.E }), (0, Z.jsx)(`td`, { children: e3.cells.R }), (0, Z.jsx)(`td`, { children: q(e3.cells.O) }), (0, Z.jsx)(`td`, { children: K(e3.cells.AF) })] }, t3)) })] }) }) : null] }) : null] }) : null, (0, Z.jsxs)(`section`, { className: `saved-imports`, children: [(0, Z.jsx)(`h3`, { children: `Các đợt đã lưu` }), M2 ? (0, Z.jsx)(`p`, { className: `source-note`, children: M2 }) : P2.length ? P2.map((t3) => (0, Z.jsxs)(`div`, { className: `saved-import-row`, children: [(0, Z.jsx)(k, { size: 18 }), (0, Z.jsxs)(`div`, { children: [(0, Z.jsx)(`strong`, { children: t3.fileName }), (0, Z.jsxs)(`p`, { children: [t3.rowCount.toLocaleString(`vi-VN`), ` hóa đơn · `, new Date(t3.createdAt).toLocaleString(`vi-VN`)] }), t3.sources ? (0, Z.jsxs)(`details`, { children: [(0, Z.jsxs)(`summary`, { children: [t3.sources.length, ` sheet nguồn · tải bản gốc`] }), t3.sources.map((e3, n3) => (0, Z.jsxs)(`p`, { children: [Ht[e3.role], ` · `, e3.sheetName, ` `, (0, Z.jsxs)(LocalFileLink, { href: `/api/datasets/file?id=${t3.id}&file=${e3.fileId}`, children: [e3.fileName, (0, Z.jsx)(O, { size: 12 })] })] }, n3))] }) : (0, Z.jsx)(LocalFileLink, { href: `/api/datasets/file?id=` + t3.id, children: `Tải PaymentList gốc` })] }), (0, Z.jsxs)(`button`, { className: `secondary-button`, disabled: S2 || e2 === t3.id || t3.usable === false, onClick: () => n2(t3.id), children: [t3.usable === false ? `Nguồn cũ · cần lấy lại` : e2 === t3.id ? `Đang mở` : `Mở đợt`, (0, Z.jsx)(_, { size: 14 })] })] }, t3.id)) : (0, Z.jsx)(`p`, { className: `source-note`, children: `Chưa có đợt được lưu.` })] })] }), (0, Z.jsxs)(`footer`, { className: `upload-footer`, children: [(0, Z.jsx)(`span`, { className: `source-note`, children: `Mở lại web sẽ dùng bộ nguồn hợp lệ mới nhất đã lưu.` }), (0, Z.jsxs)(`button`, { className: `primary-button`, disabled: H2 || y2 || !s2?.bundle, onClick: () => void oe2(), children: [S2 ? (0, Z.jsx)(I, { size: 15, className: `spin` }) : (0, Z.jsx)(b, { size: 15 }), `Lưu bộ nguồn & tra soát`] })] })] }) });
}
function Qt({ onHub: e2, onUpload: t2, onSource: n2, onExport: r2, sourceOpen: i2, hasSource: a2, uploadDisabled: o2, exportDisabled: s2 }) {
  let [c2, u2] = (0, l.useState)(false), d2 = (0, l.useRef)(null), f2 = (0, l.useRef)(null);
  (0, l.useEffect)(() => {
    if (!c2) return;
    let e3 = (e4) => {
      e4.target instanceof Node && !d2.current?.contains(e4.target) && u2(false);
    }, t3 = (e4) => {
      e4.key === `Escape` && (e4.preventDefault(), u2(false), f2.current?.focus());
    };
    return document.addEventListener(`pointerdown`, e3), document.addEventListener(`keydown`, t3), () => {
      document.removeEventListener(`pointerdown`, e3), document.removeEventListener(`keydown`, t3);
    };
  }, [c2]);
  let p2 = (e3) => {
    u2(false), e3();
  };
  return (0, Z.jsxs)(`div`, { className: `site-settings`, ref: d2, onBlur: (e3) => {
    e3.relatedTarget instanceof Node && !e3.currentTarget.contains(e3.relatedTarget) && u2(false);
  }, children: [(0, Z.jsx)(`button`, { className: `settings-trigger ${c2 ? `active` : ``}`, ref: f2, type: `button`, "aria-label": `Cài đặt chung`, title: `Cài đặt chung`, "aria-expanded": c2, "aria-controls": `site-settings-panel`, onClick: () => u2((e3) => !e3), children: (0, Z.jsx)(ae, { size: 21 }) }), c2 ? (0, Z.jsxs)(`div`, { className: `settings-panel`, id: `site-settings-panel`, role: `region`, "aria-label": `Cài đặt chung`, children: [(0, Z.jsx)(`div`, { className: `settings-panel-heading`, children: `Cài đặt & thao tác` }), (0, Z.jsxs)(`a`, { href: we, target: `_blank`, rel: `noopener noreferrer`, referrerPolicy: `no-referrer`, onClick: () => u2(false), children: [(0, Z.jsx)(_, { size: 17 }), (0, Z.jsx)(`span`, { children: `Mở Hub` })] }), (0, Z.jsxs)(`button`, { type: `button`, onClick: () => p2(e2), children: [(0, Z.jsx)(B, { size: 17 }), (0, Z.jsx)(`span`, { children: `Tự gắn link Hub` })] }), (0, Z.jsxs)(`button`, { type: `button`, onClick: () => p2(t2), disabled: o2, children: [(0, Z.jsx)(ce, { size: 17 }), (0, Z.jsx)(`span`, { children: `Tải bộ nguồn` })] }), (0, Z.jsxs)(`button`, { type: `button`, onClick: () => p2(n2), disabled: !a2, "aria-pressed": i2, children: [(0, Z.jsx)(k, { size: 17 }), (0, Z.jsx)(`span`, { children: `Nguồn dữ liệu` })] }), (0, Z.jsxs)(`button`, { type: `button`, className: `settings-export`, onClick: () => p2(r2), disabled: s2, children: [(0, Z.jsx)(h, { size: 17 }), (0, Z.jsx)(`span`, { children: `Xuất CSV` })] })] }) : null] });
}
var $t = (e2) => e2 == null || typeof e2 == `string` && e2.trim() === ``, en = Date.UTC(1899, 11, 30), tn = (e2, t2, n2) => t2.key === `groupKoc` ? n2[e2.id] ?? `` : t2.key === `paymentCode` ? e2.paymentCode : e2.cells[t2.key], nn = (e2, t2) => JSON.stringify($t(e2) ? [`empty`] : t2.kind === `date` && typeof e2 == `number` ? [`date`, new Date(en + Math.round(e2 * 864e5)).toISOString().slice(0, 10)] : [typeof e2, e2]), rn = (e2, t2, n2 = {}) => t2.key === `method` ? [...new Set((e2.receipts?.length ? e2.receipts.map((e3) => e3.method) : [e2.context?.method]).map((e3) => nn(e3, t2)))] : [nn(tn(e2, t2, n2), t2)];
function an(e2, t2) {
  let [n2, r2] = JSON.parse(e2);
  return n2 === `empty` ? t2.key === `groupKoc` ? `Chưa có Group KOC` : `(Trống / Chưa tính)` : n2 === `date` ? r2.split(`-`).reverse().join(`/`) : n2 === `number` ? new Intl.NumberFormat(`vi-VN`, { maximumFractionDigits: 2 }).format(r2) : String(r2);
}
function on(e2, t2, n2 = {}) {
  let r2 = /* @__PURE__ */ new Map();
  for (let i2 of e2) for (let e3 of rn(i2, t2, n2)) r2.set(e3, (r2.get(e3) ?? 0) + 1);
  return [...r2].map(([e3, n3]) => ({ value: e3, label: an(e3, t2), count: n3 })).sort((e3, t3) => {
    let [n3, r3] = JSON.parse(e3.value), [i2, a2] = JSON.parse(t3.value);
    return n3 === `empty` ? -Number(i2 !== `empty`) : i2 === `empty` ? 1 : n3 === `number` && i2 === `number` ? r3 - a2 : n3 === `date` && i2 === `date` ? r3.localeCompare(a2) : e3.label.localeCompare(t3.label, `vi`, { numeric: true });
  });
}
function sn(e2, t2, n2, r2 = {}) {
  return Object.entries(t2).every(([t3, i2]) => {
    if (!i2.length) return true;
    let a2 = n2.find((e3) => e3.key === t3);
    return !!a2 && rn(e2, a2, r2).some((e3) => i2.includes(e3));
  });
}
var cn = (e2) => e2.toLowerCase().normalize(`NFD`).replace(/[\u0300-\u036f]/g, ``).replace(/đ/g, `d`);
function ln({ label: e2, options: t2, selected: n2, selectedLabels: r2, showCounts: i2 = true, onChange: a2 }) {
  let o2 = (0, l.useId)(), s2 = (0, l.useRef)(null), c2 = (0, l.useRef)(null), [u2, d2] = (0, l.useState)(false), [f2, p2] = (0, l.useState)(``), m2 = (0, l.useCallback)(() => {
    if (!s2.current || !c2.current) return;
    let e3 = s2.current.getBoundingClientRect(), t3 = window.visualViewport, n3 = t3?.offsetLeft ?? 0, r3 = t3?.offsetTop ?? 0, i3 = t3?.width ?? window.innerWidth, a3 = t3?.height ?? window.innerHeight, o3 = Math.min(300, i3 - 24), l2 = Math.max(0, r3 + a3 - e3.bottom - 20), u3 = Math.max(0, e3.top - r3 - 20), d3 = l2 >= Math.min(260, u3), f3 = Math.min(400, d3 ? l2 : u3);
    Object.assign(c2.current.style, { width: `${o3}px`, left: `${Math.max(n3 + 12, Math.min(e3.right - o3, n3 + i3 - o3 - 12))}px`, maxHeight: `${f3}px` });
    let p3 = c2.current.matches(`:popover-open`) ? Math.min(c2.current.getBoundingClientRect().height, f3) : f3;
    c2.current.style.top = `${d3 ? e3.bottom + 6 : Math.max(r3 + 12, e3.top - p3 - 6)}px`;
  }, []);
  (0, l.useEffect)(() => {
    if (!u2) return;
    let e3 = () => {
      c2.current?.contains(document.activeElement) ? m2() : c2.current?.hidePopover();
    };
    return window.addEventListener(`resize`, m2), window.addEventListener(`scroll`, e3, { passive: true }), window.visualViewport?.addEventListener(`resize`, m2), () => {
      window.removeEventListener(`resize`, m2), window.removeEventListener(`scroll`, e3), window.visualViewport?.removeEventListener(`resize`, m2);
    };
  }, [u2, m2]);
  let h2 = r2 ?? n2.map((e3) => t2.find((t3) => t3.value === e3)?.label ?? (e3 || `Chưa có Group KOC`)), g2 = n2.length ? n2.length <= 2 ? h2.join(`, `) : `${n2.length} đã chọn` : `Tất cả`, _2 = cn(f2), v2 = t2.filter((e3) => cn(e3.label).includes(_2));
  return (0, Z.jsxs)(`div`, { className: `group-koc-filter`, onBlur: (e3) => {
    e3.relatedTarget instanceof Node && !e3.currentTarget.contains(e3.relatedTarget) && c2.current?.hidePopover();
  }, children: [(0, Z.jsxs)(`button`, { ref: s2, type: `button`, className: `group-koc-trigger ${n2.length ? `active` : ``}`, "aria-label": `Lọc ${e2}`, "aria-expanded": u2, "aria-controls": o2, popoverTarget: o2, popoverTargetAction: `toggle`, onClick: m2, disabled: !t2.length, title: h2.join(`, `) || `Tất cả ${e2}`, children: [(0, Z.jsx)(N, { size: 14 }), (0, Z.jsxs)(`span`, { children: [e2, `:`] }), (0, Z.jsx)(`strong`, { children: g2 }), (0, Z.jsx)(x, { size: 13 })] }), (0, Z.jsxs)(`div`, { ref: c2, id: o2, popover: `auto`, className: `group-koc-panel`, role: `group`, "aria-label": `Chọn nhiều ${e2}`, onToggle: (e3) => {
    let t3 = e3.nativeEvent.newState === `open`;
    d2(t3), t3 && m2();
  }, children: [(0, Z.jsxs)(`div`, { className: `group-koc-panel-head`, children: [(0, Z.jsxs)(`strong`, { children: [`Chọn nhiều `, e2] }), (0, Z.jsx)(`button`, { type: `button`, onClick: () => a2([]), disabled: !n2.length, children: `Bỏ lọc` })] }), (0, Z.jsx)(`input`, { className: `filter-value-search`, type: `search`, value: f2, onChange: (e3) => p2(e3.target.value), placeholder: `Tìm giá trị…`, "aria-label": `Tìm giá trị ${e2}` }), (0, Z.jsx)(FilterSelectAll, {label: e2, options: v2, selected: n2, onChange: a2, searching: !!f2.trim()}), (0, Z.jsxs)(`div`, { className: `group-koc-options`, children: [v2.map((e3) => (0, Z.jsxs)(`label`, { children: [(0, Z.jsx)(`input`, { type: `checkbox`, "aria-label": e3.label, value: e3.value, checked: n2.includes(e3.value), onChange: () => a2(n2.includes(e3.value) ? n2.filter((t3) => t3 !== e3.value) : [...n2, e3.value]) }), (0, Z.jsx)(`span`, { children: e3.label }), i2 ? (0, Z.jsx)(`small`, { children: e3.count }) : null] }, e3.value)), v2.length ? null : (0, Z.jsx)(`p`, { className: `filter-no-values`, children: `Không có giá trị phù hợp.` })] })] })] });
}
function un({ field: e2, rows: t2, groupKocs: n2, selected: r2, onChange: i2 }) {
  let a2 = (0, l.useMemo)(() => on(t2, e2, n2), [t2, e2, n2]);
  return (0, Z.jsx)(ln, { label: e2.label, options: a2, selected: r2, selectedLabels: r2.map((t3) => an(t3, e2)), onChange: i2 });
}
function dn({ fields: e2, rows: t2, groupKocs: n2, values: r2, onChange: i2 }) {
  let [a2, o2] = (0, l.useState)(() => Object.keys(r2).length ? Object.keys(r2) : [`groupKoc`]), s2 = e2.filter((e3) => a2.includes(e3.key) || r2[e3.key]?.length), c2 = e2.filter((e3) => r2[e3.key]?.length), u2 = (0, l.useMemo)(() => e2.map((e3) => ({ value: e3.key, label: e3.label, count: 0 })), [e2]), d2 = (e3, t3) => {
    let n3 = { ...r2 };
    t3.length ? n3[e3] = t3 : delete n3[e3], i2(n3);
  };
  return (0, Z.jsxs)(`div`, { className: `field-filters`, "aria-label": `Lọc nhiều trường cùng lúc`, children: [(0, Z.jsx)(ln, { label: `Trường lọc`, options: u2, selected: s2.map((e3) => e3.key), selectedLabels: s2.map((e3) => e3.label), showCounts: false, onChange: (e3) => {
    o2(e3), i2(Object.fromEntries(Object.entries(r2).filter(([t3]) => e3.includes(t3))));
  } }), (0, Z.jsx)(`div`, { className: `field-value-filters`, children: s2.map((e3) => (0, Z.jsx)(un, { field: e3, rows: t2, groupKocs: n2, selected: r2[e3.key] ?? [], onChange: (t3) => d2(e3.key, t3) }, e3.key)) }), c2.length ? (0, Z.jsxs)(`div`, { className: `field-filter-chips`, "aria-label": `Các trường đang lọc`, children: [c2.map((e3) => {
    let t3 = r2[e3.key].map((t4) => an(t4, e3)), n3 = t3.length <= 2 ? t3.join(`, `) : `${t3.length} giá trị`;
    return (0, Z.jsxs)(`span`, { className: `field-filter-chip`, title: `${e3.label}: ${t3.join(`, `)}`, children: [(0, Z.jsxs)(`span`, { children: [e3.label, `: `, n3] }), (0, Z.jsx)(`button`, { type: `button`, "aria-label": `Bỏ lọc ${e3.label}`, onClick: () => d2(e3.key, []), children: (0, Z.jsx)(le, { size: 12 }) })] }, e3.key);
  }), (0, Z.jsx)(`button`, { type: `button`, className: `clear-field-filters`, onClick: () => i2({}), children: `Bỏ tất cả lọc trường` })] }) : null] });
}
function fn(e2, t2, n2) {
  let r2 = (e3) => {
    let t3 = String(e3 ?? ``);
    return typeof e3 != `number` && /^[=+\-@\t\r]/.test(t3) && (t3 = `'` + t3), `"` + t3.replace(/"/g, `""`) + `"`;
  };
  return `\uFEFF` + [[`No.`, `Student name`, ...t2.map((e3) => e3.label + (e3.group === 2 ? ` (CALC)` : e3.group === 3 ? ` (RAW)` : ``)), `Ghi chú`].map(r2).join(`,`), ...e2.map((e3, i2) => [i2 + 1, e3.cells.G, ...t2.map((t3) => t3.key === `paymentCode` ? e3.paymentCode : t3.key === `D` ? n2(e3.cells.D) : t3.key === `AG` ? String(e3.cells.AG ?? ``).toUpperCase() === `APPROVED` ? `APPROVED` : `` : e3.cells[t3.key]), [e3.cells.AN, e3.sourceContracts?.length ? `CT nguồn: ` + e3.sourceContracts.join(`; `) : ``].filter(Boolean).join(` | `)].map(r2).join(`,`))].join(`\r
`);
}
var pn = (e2) => String(e2 ?? ``).toLowerCase().normalize(`NFD`).replace(/[\u0300-\u036f]/g, ``).replace(/đ/g, `d`);
function mn() {
  const [hubInputBusy,setHubInputBusy]=(0,l.useState)(false);
  const [completionRequest,setCompletionRequest]=(0,l.useState)(null),autoCompletion=(0,l.useRef)(null);
  let [e2, t2] = (0, l.useState)({}), n2 = _e(), { data: r2, rows: i2, loading: a2, fatal: o2, busy: s2, failures: c2 } = n2, u2 = (0, l.useMemo)(() => ({ ...r2?.hubLinks, ...e2 }), [r2?.hubLinks, e2]), d2 = (0, l.useCallback)((e3) => t2((t3) => ({ ...t3, [e3.ct]: e3 })), []), f2 = at(n2.datasetId, d2, ()=>setCompletionRequest(newCompletionRequest('filtered'))), [p2, m2] = (0, l.useState)(false), h2 = (e3) => {
    m2(true), f2.run([e3]);
  }, [g2, b2] = (0, l.useState)(`audit`), [x2, S2] = (0, l.useState)(`all`), [C2, D2] = (0, l.useState)(0), [O2, A2] = (0, l.useState)(``), [N2, P2] = (0, l.useState)(null), [F2, ee2] = (0, l.useState)(false), [te2, ne2] = (0, l.useState)(false), [L2, R2] = (0, l.useState)(`top`), [re2, ie2] = (0, l.useState)({}), ae2 = (e3, t3 = `top`) => {
    R2(t3), P2(e3);
  }, H2 = pn((0, l.useDeferredValue)(O2)), U2 = (0, l.useMemo)(() => ({ total: i2.length, check: i2.filter((e3) => e3.cells.AF !== `OK`).length, ok: i2.filter((e3) => e3.cells.AF === `OK`).length, over: i2.filter((e3) => e3.cells.AE === `CHECK - VƯỢT KỲ`).length, approved: i2.filter(Ce).length, verify: i2.filter((e3) => ((e3.verification?.pending.length ?? 0) > 0 || e3.reviewItems?.some(item=>!item.approved))).length }), [i2]), ce2 = (0, l.useMemo)(() => i2.filter((e3) => sn(e3, re2, xe, r2?.groupKocByRecord ?? {}) && (!H2 || pn(Object.values(e3.cells).join(` `) + ` ` + e3.paymentCode + ` ` + (e3.sourceContracts ?? []).join(` `) + ` ` + (e3.receipts ?? []).map((e4) => [e4.contract, e4.payment, e4.vat].join(` `)).join(` `)).includes(H2)) && (x2 === `all` || x2 === `check` && e3.cells.AF !== `OK` || x2 === `ok` && e3.cells.AF === `OK` || x2 === `over` && e3.cells.AE === `CHECK - VƯỢT KỲ` || x2 === `approved` && Ce(e3) || x2 === `verify` && ((e3.verification?.pending.length ?? 0) > 0 || e3.reviewItems?.some(item=>!item.approved)) || x2 === `edited` && Object.keys(n2.patches[e3.id] ?? {}).length > 0 || x2 === `unlinked` && !e3.cells.contractTotal || x2 === `excess` && (e3.reconciliation?.overpaid ?? 0) > 0)), [i2, H2, x2, n2.patches, re2, r2?.groupKocByRecord]), ue2 = [...new Set(ce2.flatMap(Oe).filter((e3) => !ke(u2[e3]?.url, e3)))], W2 = i2.find((e3) => e3.id === N2) ?? null, G2 = Object.values(c2), de2 = G2.some((e3) => e3.conflict), fe2 = (0, l.useMemo)(() => new Set(n2.voucherBusy||hubInputBusy ? i2.map((e3) => e3.id) : Object.keys(c2)), [c2, i2, n2.voucherBusy,hubInputBusy]), pe2 = (e3) => {
    S2(e3), (e3 === `over` || e3 === `approved`) && D2(4);
  }, me2 = (e3) => {
    let t3 = new URL(window.location.href);
    e3 ? t3.searchParams.set(`dataset`, e3) : t3.searchParams.delete(`dataset`), t3.searchParams.set(`completeHub`,`1`), window.location.assign(t3.href);
  };
  (0,l.useEffect)(()=>{if(!a2&&r2&&n2.datasetId&&autoCompletion.current!==n2.datasetId&&new URL(window.location.href).searchParams.get('completeHub')==='1'){autoCompletion.current=n2.datasetId;setCompletionRequest(newCompletionRequest('dataset'));const url=new URL(window.location.href);url.searchParams.delete('completeHub');window.history.replaceState(null,'',url.href);}},[a2,r2,n2.datasetId]);
  return (0, Z.jsx)(nt.Provider, { value: { lookup: h2, busy: f2.busy||hubInputBusy }, children: (0, Z.jsxs)(`div`, { className: `app-shell`, children: [(0, Z.jsxs)(`div`, { className: `main-shell`, children: [(0, Z.jsxs)(`header`, { className: `masthead`, children: [(0, Z.jsxs)(`a`, { href: `/`, className: `brand`, "aria-label": `Promotion Studio`, children: [(0, Z.jsx)(j, { size: 30, strokeWidth: 1.7 }), (0, Z.jsxs)(`span`, { children: [`promotion`, (0, Z.jsx)(`span`, { className: `brand-sub`, children: `STUDIO / 2026` })] })] }), (0, Z.jsxs)(`nav`, { className: `main-nav`, "aria-label": `Điều hướng chính`, children: [(0, Z.jsxs)(`button`, { className: g2 === `audit` ? `active` : ``, "aria-current": g2 === `audit` ? `page` : void 0, onClick: () => b2(`audit`), children: [(0, Z.jsx)(E, { size: 16 }), `Check installment`] }), (0, Z.jsxs)(`button`, { className: g2 === `rules` ? `active` : ``, "aria-current": g2 === `rules` ? `page` : void 0, onClick: () => b2(`rules`), children: [(0, Z.jsx)(v, { size: 16 }), `Quy tắc & voucher`] }), (0, Z.jsxs)(`button`, { className: g2 === `guide` ? `active` : ``, "aria-current": g2 === `guide` ? `page` : void 0, onClick: () => b2(`guide`), children: [(0, Z.jsx)(T, { size: 16 }), `Hướng dẫn`] })] }), (0, Z.jsxs)(`div`, { className: `masthead-tools`, children: [(0, Z.jsxs)(`span`, { className: `private-badge`, children: [(0, Z.jsx)(M, { size: 13 }), `Công khai`] }), (0, Z.jsx)(Qt, { onHub: () => m2(true), onUpload: () => ne2(true), onSource: () => ee2((e3) => !e3), onExport: () => {
    let e3 = URL.createObjectURL(new Blob([fn(ce2, reviewTableColumns(ye,ce2), q)], { type: `text/csv;charset=utf-8;` })), t3 = document.createElement(`a`);
    t3.href = e3, t3.download = `Check_Installment_${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`, t3.click(), setTimeout(() => URL.revokeObjectURL(e3), 1e3);
  }, sourceOpen: F2, hasSource: !!r2, uploadDisabled: hubInputBusy || f2.busy || n2.voucherBusy || s2.size > 0 || G2.length > 0, exportDisabled: n2.voucherBusy || a2 || !ce2.length || s2.size > 0 || G2.length > 0 })] })] }), (0, Z.jsxs)(`header`, { className: `topbar`, children: [(0, Z.jsxs)(`div`, { className: `breadcrumb`, children: [`Promotion`, (0, Z.jsx)(`span`, { children: `/` }), (0, Z.jsx)(`strong`, { children: g2 === `audit` ? `Check installment` : g2 === `rules` ? `Quy tắc & voucher` : `Hướng dẫn` })] }), (0, Z.jsx)(`div`, { className: `save-state ${G2.length ? `failed` : ``}`, role: `status`, children: n2.voucherBusy ? (0, Z.jsxs)(Z.Fragment, { children: [(0, Z.jsx)(I, { size: 13, className: `spin` }), `Đang cập nhật voucher`] }) : s2.size ? (0, Z.jsxs)(Z.Fragment, { children: [(0, Z.jsx)(I, { size: 13, className: `spin` }), `Đang lưu `, s2.size, ` hồ sơ`] }) : G2.length ? (0, Z.jsxs)(Z.Fragment, { children: [(0, Z.jsx)(w, { size: 14 }), G2.length, ` thay đổi chưa lưu`] }) : a2 ? (0, Z.jsxs)(Z.Fragment, { children: [(0, Z.jsx)(`span`, { className: `connection-dot` }), `Đang tải dữ liệu`] }) : o2 ? (0, Z.jsxs)(Z.Fragment, { children: [(0, Z.jsx)(w, { size: 14 }), `Chưa kết nối`] }) : (0, Z.jsxs)(Z.Fragment, { children: [(0, Z.jsx)(`span`, { className: `connection-dot` }), `Đã lưu`, n2.lastSaved ? (0, Z.jsx)(`span`, { className: `save-time`, children: new Date(n2.lastSaved).toLocaleTimeString(`vi-VN`, { hour: `2-digit`, minute: `2-digit` }) }) : null] }) })] }), (0, Z.jsxs)(`main`, { className: `main-content`, children: [(0, Z.jsxs)(`div`, { className: `intro-grid ${g2 !== `audit` || !r2 ? `intro-compact` : ``}`, children: [(0, Z.jsx)(`div`, { className: `page-heading`, children: (0, Z.jsxs)(`div`, { children: [(0, Z.jsxs)(`div`, { className: `eyebrow`, children: [`PROMOTION AUDIT `, (0, Z.jsx)(`span`, { children: `2026` })] }), (0, Z.jsx)(`h1`, { children: g2 === `audit` ? `Check Installment.` : g2 === `rules` ? `Quy tắc & voucher` : `Hướng dẫn` }), (0, Z.jsx)(`p`, { children: g2 === `audit` ? `Kiểm tra học phí, ưu đãi và kỳ trả góp.` : g2 === `rules` ? `Tra cứu quy tắc tính và dữ liệu voucher trong workbook.` : `Các bước chỉnh sửa và đối chiếu hồ sơ.` })] }) }), g2 === `audit` && r2 ? (0, Z.jsxs)(`section`, { className: `metrics`, "aria-label": `Thống kê hồ sơ`, children: [(0, Z.jsxs)(`button`, { className: `metric-card metric-sky ${x2 === `all` ? `metric-active` : ``}`, "aria-pressed": x2 === `all`, onClick: () => pe2(`all`), children: [(0, Z.jsxs)(`span`, { className: `metric-label`, children: [`TỔNG HỒ SƠ`, (0, Z.jsx)(`span`, { className: `metric-icon mauve`, children: (0, Z.jsx)(j, { size: 64, strokeWidth: 1.15, "aria-hidden": `true` }) })] }), (0, Z.jsx)(`strong`, { children: U2.total }), (0, Z.jsx)(`span`, { className: `metric-foot`, children: `CT tổng và chứng từ chưa gắn CT` })] }), (0, Z.jsxs)(`button`, { className: `metric-card metric-clay ${x2 === `check` ? `metric-active` : ``}`, "aria-pressed": x2 === `check`, onClick: () => pe2(`check`), children: [(0, Z.jsxs)(`span`, { className: `metric-label`, children: [`CẦN KIỂM TRA`, (0, Z.jsx)(`span`, { className: `metric-icon peach`, children: (0, Z.jsx)(oe, { size: 60, strokeWidth: 1.15, "aria-hidden": `true` }) })] }), (0, Z.jsxs)(`strong`, { children: [U2.check, (0, Z.jsx)(`span`, { className: `mini-status`, children: `CHECK` })] }), (0, Z.jsxs)(`span`, { className: `metric-foot`, children: [U2.over, ` hồ sơ đang vượt kỳ trả góp`] })] }), (0, Z.jsxs)(`button`, { className: `metric-card metric-sage ${x2 === `ok` ? `metric-active` : ``}`, "aria-pressed": x2 === `ok`, onClick: () => pe2(`ok`), children: [(0, Z.jsxs)(`span`, { className: `metric-label`, children: [`ĐỐI CHIẾU KHỚP`, (0, Z.jsx)(`span`, { className: `metric-icon sage`, children: (0, Z.jsx)(y, { size: 62, strokeWidth: 1.15, "aria-hidden": `true` }) })] }), (0, Z.jsx)(`strong`, { children: U2.ok }), (0, Z.jsx)(`span`, { className: `metric-foot`, children: `Đáp ứng các điều kiện kiểm tra` })] }), (0, Z.jsxs)(`button`, { className: `metric-card metric-lilac ${x2 === `approved` ? `metric-active` : ``}`, "aria-pressed": x2 === `approved`, onClick: () => pe2(`approved`), children: [(0, Z.jsxs)(`span`, { className: `metric-label`, children: [`ĐÃ DUYỆT KỲ`, (0, Z.jsx)(`span`, { className: `metric-icon violet`, children: (0, Z.jsx)(V, { size: 62, strokeWidth: 1.15, "aria-hidden": `true` }) })] }), (0, Z.jsx)(`strong`, { children: U2.approved }), (0, Z.jsx)(`span`, { className: `metric-foot`, children: `Ngoại lệ kỳ trả góp được duyệt` })] })] }) : null] }), p2 ? (0, Z.jsx)(ot, { auto: f2, count: ue2.length, onStart: () => void f2.run(ue2), onClose: () => m2(false) }) : null, r2?.dataset ? (0, Z.jsxs)(`div`, { className: `dataset-banner`, children: [(0, Z.jsx)(k, { size: 20 }), (0, Z.jsxs)(`div`, { children: [(0, Z.jsx)(`strong`, { children: r2.dataset.fileName }), (0, Z.jsxs)(`span`, { children: [r2.dataset.sheetName, ` · `, r2.dataset.rowCount.toLocaleString(`vi-VN`), ` dòng · Đợt tra soát đã lưu`] })] }), (0, Z.jsxs)(`button`, { className: `quiet-button`, disabled: n2.voucherBusy || s2.size > 0 || G2.length > 0, onClick: () => me2(null), children: [`Mở bộ nguồn mới nhất`, (0, Z.jsx)(_, { size: 14 })] })] }) : null, F2 && r2 ? (0, Z.jsxs)(`div`, { className: `source-panel`, children: [(0, Z.jsx)(k, { size: 21 }), (0, Z.jsxs)(`div`, { children: [(0, Z.jsx)(`strong`, { children: r2.source }), (0, Z.jsxs)(`p`, { children: [r2.groupingStats.payments, ` dòng thu → `, r2.groupingStats.contracts, ` CT tổng + `, r2.groupingStats.unlinked, ` chứng từ chưa gắn CT · chốt `, q(r2.cutoff)] }), r2.sourceCalculation ? (0, Z.jsxs)(Z.Fragment, { children: [(0, Z.jsxs)(`p`, { children: [(0, Z.jsx)(`strong`, { children: `Tính trực tiếp trên web từ PaymentList, Transfer và Export.` }), ` Bộ nguồn thay đổi sẽ tính lại tổng CT, phân bổ, ngày đóng đủ và chênh lệch. Không dùng kết quả tính sẵn của Audit.`] }), (0, Z.jsxs)(`p`, { children: [r2.sourceCalculation.counts.payments, ` hóa đơn đủ VAT / Paid · `, r2.sourceCalculation.counts.transfers, ` dòng Transfer liên quan · `, r2.sourceCalculation.counts.exports, ` CT Export · `, r2.sourceCalculation.scope.from, ` → `, r2.sourceCalculation.scope.to] }), (0, Z.jsxs)(`details`, { children: [(0, Z.jsx)(`summary`, { children: `Nguồn giao dịch đang dùng` }), r2.sourceCalculation.inputs.map((e3, t3) => (0, Z.jsxs)(`p`, { children: [e3.file, ` · `, e3.sheet, ` · `, e3.rows.toLocaleString(`vi-VN`), ` dòng nguồn`] }, t3))] })] }) : null, (0, Z.jsx)(`p`, { children: `Bảng giá chung và lộ trình là căn cứ tính giá, ưu đãi độc lập với số thu. Chỉnh sửa được lưu tại CT tổng; các chứng từ con không gắn riêng khóa học.` }), (0, Z.jsxs)(`details`, { children: [(0, Z.jsx)(`summary`, { children: `Xem danh sách căn cứ chính sách` }), [...new Set(r2.sourceManifest.map((e3) => e3.file))].map((e3) => (0, Z.jsx)(`p`, { children: e3 }, e3))] }), r2.continuity ? (0, Z.jsxs)(`p`, { children: [`Giữ chỉnh sửa cho `, r2.continuity.matchedRecords, ` mã có cùng danh tính; `, r2.continuity.newRecords, ` mã mới.`] }) : null] }), (0, Z.jsx)(`button`, { className: `icon-button`, "aria-label": `Đóng thông tin nguồn`, onClick: () => ee2(false), children: (0, Z.jsx)(le, { size: 16 }) })] }) : null, G2.length ? (0, Z.jsxs)(`div`, { className: `error-banner`, role: `alert`, children: [(0, Z.jsx)(w, { size: 18 }), (0, Z.jsxs)(`div`, { children: [(0, Z.jsx)(`strong`, { children: de2 ? `Có phiên bản mới từ phiên làm việc khác` : `Chưa lưu được thay đổi` }), (0, Z.jsx)(`p`, { children: G2[0].message })] }), de2 ? (0, Z.jsx)(`button`, { className: `secondary-button`, onClick: () => window.location.reload(), children: `Tải bản mới (bỏ sửa chưa lưu)` }) : (0, Z.jsx)(`button`, { className: `secondary-button`, onClick: () => void n2.retry(), disabled: s2.size > 0, children: `Thử lưu lại` })] }) : null, a2 ? (0, Z.jsxs)(`div`, { className: `loading-state`, children: [(0, Z.jsx)(`span`, { className: `loading-flower`, children: (0, Z.jsx)(j, { size: 28 }) }), (0, Z.jsx)(`h2`, { children: n2.progress ? `Đang tra soát bộ nguồn` : `Đang mở bảng đối chiếu` }), (0, Z.jsx)(`p`, { children: n2.progress ? `${n2.progress.done.toLocaleString(`vi-VN`)} / ${n2.progress.total.toLocaleString(`vi-VN`)} CT / chứng từ · ${n2.progress.name}` : `Nạp dữ liệu nguồn và quy tắc đối chiếu…` }), (0, Z.jsx)(I, { size: 20, className: `spin` })] }) : o2 ? (0, Z.jsxs)(`div`, { className: `loading-state`, children: [(0, Z.jsx)(w, { size: 30 }), (0, Z.jsx)(`h2`, { children: `Chưa mở được dữ liệu` }), (0, Z.jsx)(`p`, { children: o2 }), (0, Z.jsx)(`button`, { className: `secondary-button`, onClick: () => ne2(true), children: `Chọn nguồn từ Hub` }), (0, Z.jsxs)(`button`, { className: `primary-button`, onClick: () => window.location.reload(), children: [(0, Z.jsx)(z, { size: 15 }), `Thử lại`] })] }) : (r2?(0,Z.jsx)(`div`,{hidden:g2!==`audit`,children:(0,Z.jsx)(HubInputAutofill,{rows:completionRequest?.scope==='dataset'?i2:ce2,request:completionRequest,onRequestConsumed:()=>setCompletionRequest(null),vouchers:r2?.customVouchers??[],onVoucherSave:n2.saveVoucher,datasetId:n2.datasetId,disabled:n2.voucherBusy||s2.size>0||G2.length>0||f2.busy,checkBridge:signal=>Xe(`ping`,void 0,void 0,signal),makeLookup:et,readInputs:Ze,onSave:n2.saveCourseSource,onLinkSaved:d2,onBusyChange:setHubInputBusy})}):null), g2 === `audit` && r2?.needsSources ? (0, Z.jsx)(zt, { onOpen: () => ne2(true) }) : g2 === `guide` ? (0, Z.jsx)(Mt, {}) : g2 === `rules` && r2 ? (0, Z.jsx)(Rt, { data: r2, disabled: hubInputBusy || f2.busy || n2.voucherBusy || s2.size > 0 || G2.length > 0, onVoucherSave: n2.saveVoucher }) : r2 ? (0, Z.jsxs)(Z.Fragment, { children: [(0, Z.jsxs)(`div`, { className: `ct-summarybar`, children: [(0, Z.jsxs)(`span`, { children: [(0, Z.jsxs)(`strong`, { children: [r2.groupingStats.contracts, ` CT tổng`] }), ` từ `, r2.reconciliationStats.resolved, `/`, r2.groupingStats.payments, ` dòng thu đã gắn CT · `, r2.catalogue.programs.length, ` nhóm chính sách`] }), (0, Z.jsxs)(`button`, { className: x2 === `unlinked` ? `selected` : ``, onClick: () => {
    S2(`unlinked`), D2(1);
  }, children: [`Chưa gắn CT (`, i2.filter((e3) => !e3.cells.contractTotal).length, `)`] }), (0, Z.jsxs)(`button`, { className: x2 === `excess` ? `selected` : ``, onClick: () => {
    S2(`excess`), D2(4);
  }, children: [`Thừa tiền CT (`, new Set(i2.filter((e3) => (e3.reconciliation?.overpaid ?? 0) > 0).map((e3) => e3.cells.contractTotal)).size, `)`] })] }), (0, Z.jsxs)(`section`, { className: `audit-workspace`, children: [(0, Z.jsxs)(`div`, { className: `workspace-heading`, children: [(0, Z.jsxs)(`div`, { className: `workspace-title`, children: [(0, Z.jsx)(`span`, { className: `table-symbol`, children: (0, Z.jsx)(se, { size: 18 }) }), (0, Z.jsxs)(`div`, { children: [(0, Z.jsx)(`h2`, { children: `Bảng đối chiếu` }), (0, Z.jsxs)(`p`, { children: [ce2.length, ` hồ sơ`, (0, Z.jsx)(`span`, { className: `dot-separator`, children: `·` }), `Đơn vị: VND`] })] })] }), (0, Z.jsxs)(`button`, { className: `quiet-button refresh-button`, onClick: () => window.location.reload(), disabled: n2.voucherBusy || s2.size > 0 || G2.length > 0, children: [(0, Z.jsx)(z, { size: 14 }), `Làm mới`] })] }), (0, Z.jsxs)(`div`, { className: `filter-row`, children: [(0, Z.jsx)(`div`, { className: `status-tabs`, "aria-label": `Lọc trạng thái`, children: [[`all`, `Tất cả`, U2.total], [`check`, `Cần kiểm tra`, U2.check], [`over`, `Vượt kỳ`, U2.over], [`approved`, `Đã duyệt kỳ`, U2.approved], [`verify`, `Cần xác minh`, U2.verify], [`edited`, `Đã sửa`, n2.editCount]].map(([e3, t3, n3]) => (0, Z.jsxs)(`button`, { className: x2 === e3 ? `active` : ``, onClick: () => pe2(e3), children: [t3, (0, Z.jsx)(`span`, { children: n3 })] }, e3)) }), (0, Z.jsxs)(`div`, { className: `filter-tools`, children: [(0, Z.jsx)(AuditSearch, {value: O2, onChange: A2}), (0, Z.jsx)(dn, { fields: xe, rows: i2, groupKocs: r2.groupKocByRecord, values: re2, onChange: ie2 })] })] }), (0, Z.jsx)(Pt, { hubLinks: u2, rows: ce2, data: r2, busy: s2, blocked: fe2, section: C2, onSection: D2, onOpen: ae2, onEdit: n2.change })] }), (0, Z.jsxs)(`div`, { className: `approval-explainer`, children: [(0, Z.jsx)(V, { size: 16 }), (0, Z.jsxs)(`p`, { children: [(0, Z.jsx)(`strong`, { children: `Duyệt trả góp` }), ` chuyển “CHECK – VƯỢT KỲ” thành “OK”. KẾT QUẢ vẫn kiểm tra các chênh lệch khác.`] }), (0, Z.jsxs)(`button`, { onClick: () => {
    D2(4), pe2(`over`);
  }, children: [`Xem hồ sơ vượt kỳ`, (0, Z.jsx)(_, { size: 13 })] })] })] }) : null, (0, Z.jsxs)(`footer`, { className: `page-footer`, children: [(0, Z.jsx)(`span`, { children: `PROMOTION STUDIO` }), (0, Z.jsx)(`span`, { children: `Dữ liệu giao dịch, chỉnh sửa và minh chứng lưu riêng trên trình duyệt này.` })] })] })] }), r2 ? Object.keys(Se).map((e3) => (0, Z.jsx)(`datalist`, { id: `choices-${e3}`, children: r2.choices[e3].map((e4) => (0, Z.jsx)(`option`, { value: e4 }, e4)) }, e3)) : null, te2 ? (0, Z.jsx)(Zt, { currentId: n2.datasetId, onClose: () => ne2(false), onOpen: me2 }) : null, (0, Z.jsx)(jt, { sourceHash: r2?.hash, courseSource: r2?.courseSources?.[String(W2?.cells.contractTotal)], onCourseSave: n2.saveCourseSource, hubLinks: u2, onHubSaved: d2, row: W2, original: r2?.records.find((e3) => e3.id === N2), savedEdit: W2 ? n2.edits[W2.id] : void 0, programs: r2?.catalogue.programs ?? [], partners: i2, focus: L2, datasetId: n2.datasetId, vouchers: r2?.vouchers ?? [], userVouchers: r2?.customVouchers ?? [], onVoucherSave: n2.saveVoucher, failure: W2 ? c2[W2.id] : void 0, onRetry: () => void n2.retry(), onVerify: (e3) => {
    W2 && n2.verify(W2, e3);
  }, disabled: W2 ? W2.kind === `unlinked` || s2.has(W2.id) || fe2.has(W2.id) : false, onClose: () => P2(null), onEdit: (e3, t3) => {
    W2 && n2.change(W2, e3, t3);
  }, onRestore: () => {
    W2 && n2.restore(W2);
  } })] }) });
}
export { mn as default };
