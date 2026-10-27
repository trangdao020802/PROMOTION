  var e = (e2, t2) => () => (t2 || (e2((t2 = { exports: {} }).exports, t2), e2 = null), t2.exports), t = Uint8Array, n = Uint16Array, r = Int32Array, i = new t([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0, 0, 0, 0]), a = new t([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, 0, 0]), o = new t([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]), s = function(e2, t2) {
    for (var i2 = new n(31), a2 = 0; a2 < 31; ++a2) i2[a2] = t2 += 1 << e2[a2 - 1];
    for (var o2 = new r(i2[30]), a2 = 1; a2 < 30; ++a2) for (var s2 = i2[a2]; s2 < i2[a2 + 1]; ++s2) o2[s2] = s2 - i2[a2] << 5 | a2;
    return { b: i2, r: o2 };
  }, c = s(i, 2), l = c.b, u = c.r;
  l[28] = 258, u[258] = 28;
  var d = s(a, 0), f = d.b;
  d.r;
  for (var p = new n(32768), m = 0; m < 32768; ++m) {
    var h = (m & 43690) >> 1 | (m & 21845) << 1;
    h = (h & 52428) >> 2 | (h & 13107) << 2, h = (h & 61680) >> 4 | (h & 3855) << 4, p[m] = ((h & 65280) >> 8 | (h & 255) << 8) >> 1;
  }
  for (var g = (function(e2, t2, r2) {
    for (var i2 = e2.length, a2 = 0, o2 = new n(t2); a2 < i2; ++a2) e2[a2] && ++o2[e2[a2] - 1];
    var s2 = new n(t2);
    for (a2 = 1; a2 < t2; ++a2) s2[a2] = s2[a2 - 1] + o2[a2 - 1] << 1;
    var c2;
    if (r2) {
      c2 = new n(1 << t2);
      var l2 = 15 - t2;
      for (a2 = 0; a2 < i2; ++a2) if (e2[a2]) for (var u2 = a2 << 4 | e2[a2], d2 = t2 - e2[a2], f2 = s2[e2[a2] - 1]++ << d2, m2 = f2 | (1 << d2) - 1; f2 <= m2; ++f2) c2[p[f2] >> l2] = u2;
    } else for (c2 = new n(i2), a2 = 0; a2 < i2; ++a2) e2[a2] && (c2[a2] = p[s2[e2[a2] - 1]++] >> 15 - e2[a2]);
    return c2;
  }), _ = new t(288), m = 0; m < 144; ++m) _[m] = 8;
  for (var m = 144; m < 256; ++m) _[m] = 9;
  for (var m = 256; m < 280; ++m) _[m] = 7;
  for (var m = 280; m < 288; ++m) _[m] = 8;
  for (var v = new t(32), m = 0; m < 32; ++m) v[m] = 5;
  var y = g(_, 9, 1), b = g(v, 5, 1), x = function(e2) {
    for (var t2 = e2[0], n2 = 1; n2 < e2.length; ++n2) e2[n2] > t2 && (t2 = e2[n2]);
    return t2;
  }, S = function(e2, t2, n2) {
    var r2 = t2 / 8 | 0;
    return (e2[r2] | e2[r2 + 1] << 8) >> (t2 & 7) & n2;
  }, C = function(e2, t2) {
    var n2 = t2 / 8 | 0;
    return (e2[n2] | e2[n2 + 1] << 8 | e2[n2 + 2] << 16) >> (t2 & 7);
  }, ee = function(e2) {
    return (e2 + 7) / 8 | 0;
  }, w = function(e2, n2, r2) {
    return (n2 == null || n2 < 0) && (n2 = 0), (r2 == null || r2 > e2.length) && (r2 = e2.length), new t(e2.subarray(n2, r2));
  }, T = [`unexpected EOF`, `invalid block type`, `invalid length/literal`, `invalid distance`, `stream finished`, `no stream handler`, , `no callback`, `invalid UTF-8 data`, `extra field too long`, `date not in range 1980-2099`, `filename too long`, `stream finishing`, `invalid zip data`], E = function(e2, t2, n2) {
    var r2 = Error(t2 || T[e2]);
    if (r2.code = e2, Error.captureStackTrace && Error.captureStackTrace(r2, E), !n2) throw r2;
    return r2;
  }, D = function(e2, n2, r2, s2) {
    var c2 = e2.length, u2 = s2 ? s2.length : 0;
    if (!c2 || n2.f && !n2.l) return r2 || new t(0);
    var d2 = !r2, p2 = d2 || n2.i != 2, m2 = n2.i;
    d2 && (r2 = new t(c2 * 3));
    var h2 = function(e3) {
      var n3 = r2.length;
      if (e3 > n3) {
        var i2 = new t(Math.max(n3 * 2, e3));
        i2.set(r2), r2 = i2;
      }
    }, _2 = n2.f || 0, v2 = n2.p || 0, T2 = n2.b || 0, D2 = n2.l, O2 = n2.d, k2 = n2.m, A2 = n2.n, j2 = c2 * 8;
    do {
      if (!D2) {
        _2 = S(e2, v2, 1);
        var te2 = S(e2, v2 + 1, 3);
        if (v2 += 3, !te2) {
          var M2 = ee(v2) + 4, ne2 = e2[M2 - 4] | e2[M2 - 3] << 8, re2 = M2 + ne2;
          if (re2 > c2) {
            m2 && E(0);
            break;
          }
          p2 && h2(T2 + ne2), r2.set(e2.subarray(M2, re2), T2), n2.b = T2 += ne2, n2.p = v2 = re2 * 8, n2.f = _2;
          continue;
        } else if (te2 == 1) D2 = y, O2 = b, k2 = 9, A2 = 5;
        else if (te2 == 2) {
          var ie2 = S(e2, v2, 31) + 257, ae2 = S(e2, v2 + 10, 15) + 4, oe2 = ie2 + S(e2, v2 + 5, 31) + 1;
          v2 += 14;
          for (var N2 = new t(oe2), P2 = new t(19), F2 = 0; F2 < ae2; ++F2) P2[o[F2]] = S(e2, v2 + F2 * 3, 7);
          v2 += ae2 * 3;
          for (var se2 = x(P2), ce2 = (1 << se2) - 1, le2 = g(P2, se2, 1), F2 = 0; F2 < oe2; ) {
            var I2 = le2[S(e2, v2, ce2)];
            v2 += I2 & 15;
            var M2 = I2 >> 4;
            if (M2 < 16) N2[F2++] = M2;
            else {
              var L2 = 0, R2 = 0;
              for (M2 == 16 ? (R2 = 3 + S(e2, v2, 3), v2 += 2, L2 = N2[F2 - 1]) : M2 == 17 ? (R2 = 3 + S(e2, v2, 7), v2 += 3) : M2 == 18 && (R2 = 11 + S(e2, v2, 127), v2 += 7); R2--; ) N2[F2++] = L2;
            }
          }
          var z2 = N2.subarray(0, ie2), B2 = N2.subarray(ie2);
          k2 = x(z2), A2 = x(B2), D2 = g(z2, k2, 1), O2 = g(B2, A2, 1);
        } else E(1);
        if (v2 > j2) {
          m2 && E(0);
          break;
        }
      }
      p2 && h2(T2 + 131072);
      for (var ue2 = (1 << k2) - 1, de2 = (1 << A2) - 1, fe2 = v2; ; fe2 = v2) {
        var L2 = D2[C(e2, v2) & ue2], V2 = L2 >> 4;
        if (v2 += L2 & 15, v2 > j2) {
          m2 && E(0);
          break;
        }
        if (L2 || E(2), V2 < 256) r2[T2++] = V2;
        else if (V2 == 256) {
          fe2 = v2, D2 = null;
          break;
        } else {
          var H2 = V2 - 254;
          if (V2 > 264) {
            var F2 = V2 - 257, U2 = i[F2];
            H2 = S(e2, v2, (1 << U2) - 1) + l[F2], v2 += U2;
          }
          var W2 = O2[C(e2, v2) & de2], G2 = W2 >> 4;
          W2 || E(3), v2 += W2 & 15;
          var B2 = f[G2];
          if (G2 > 3) {
            var U2 = a[G2];
            B2 += C(e2, v2) & (1 << U2) - 1, v2 += U2;
          }
          if (v2 > j2) {
            m2 && E(0);
            break;
          }
          p2 && h2(T2 + 131072);
          var K2 = T2 + H2;
          if (T2 < B2) {
            var pe2 = u2 - B2, me2 = Math.min(B2, K2);
            for (pe2 + T2 < 0 && E(3); T2 < me2; ++T2) r2[T2] = s2[pe2 + T2];
          }
          for (; T2 < K2; ++T2) r2[T2] = r2[T2 - B2];
        }
      }
      n2.l = D2, n2.p = fe2, n2.b = T2, n2.f = _2, D2 && (_2 = 1, n2.m = k2, n2.d = O2, n2.n = A2);
    } while (!_2);
    return T2 != r2.length && d2 ? w(r2, 0, T2) : r2.subarray(0, T2);
  }, O = new t(0), k = function(e2, t2) {
    return e2[t2] | e2[t2 + 1] << 8;
  }, A = function(e2, t2) {
    return (e2[t2] | e2[t2 + 1] << 8 | e2[t2 + 2] << 16 | e2[t2 + 3] << 24) >>> 0;
  }, j = function(e2, t2) {
    return A(e2, t2) + A(e2, t2 + 4) * 4294967296;
  };
  function te(e2, t2) {
    return D(e2, { i: 2 }, t2 && t2.out, t2 && t2.dictionary);
  }
  var M = typeof TextDecoder < `u` && new TextDecoder();
  try {
    M.decode(O, { stream: true });
  } catch {
  }
  var ne = function(e2) {
    for (var t2 = ``, n2 = 0; ; ) {
      var r2 = e2[n2++], i2 = (r2 > 127) + (r2 > 223) + (r2 > 239);
      if (n2 + i2 > e2.length) return { s: t2, r: w(e2, n2 - 1) };
      i2 ? i2 == 3 ? (r2 = ((r2 & 15) << 18 | (e2[n2++] & 63) << 12 | (e2[n2++] & 63) << 6 | e2[n2++] & 63) - 65536, t2 += String.fromCharCode(55296 | r2 >> 10, 56320 | r2 & 1023)) : i2 & 1 ? t2 += String.fromCharCode((r2 & 31) << 6 | e2[n2++] & 63) : t2 += String.fromCharCode((r2 & 15) << 12 | (e2[n2++] & 63) << 6 | e2[n2++] & 63) : t2 += String.fromCharCode(r2);
    }
  };
  function re(e2, t2) {
    if (t2) {
      for (var n2 = ``, r2 = 0; r2 < e2.length; r2 += 16384) n2 += String.fromCharCode.apply(null, e2.subarray(r2, r2 + 16384));
      return n2;
    } else if (M) return M.decode(e2);
    else {
      var i2 = ne(e2), a2 = i2.s, n2 = i2.r;
      return n2.length && E(8), a2;
    }
  }
  var ie = function(e2, t2) {
    return t2 + 30 + k(e2, t2 + 26) + k(e2, t2 + 28);
  }, ae = function(e2, t2, n2) {
    var r2 = k(e2, t2 + 28), i2 = k(e2, t2 + 30), a2 = re(e2.subarray(t2 + 46, t2 + 46 + r2), !(k(e2, t2 + 8) & 2048)), o2 = t2 + 46 + r2, s2 = oe(e2, o2, i2, n2, A(e2, t2 + 20), A(e2, t2 + 24), A(e2, t2 + 42)), c2 = s2[0], l2 = s2[1], u2 = s2[2];
    return [k(e2, t2 + 10), c2, l2, a2, o2 + i2 + k(e2, t2 + 32), u2];
  }, oe = function(e2, t2, n2, r2, i2, a2, o2) {
    var s2 = i2 == 4294967295, c2 = a2 == 4294967295, l2 = o2 == 4294967295, u2 = t2 + n2, d2 = s2 + c2 + l2;
    if (r2 && d2) {
      for (; t2 + 4 < u2; t2 += 4 + k(e2, t2 + 2)) if (k(e2, t2) == 1) return [s2 ? j(e2, t2 + 4 + 8 * c2) : i2, c2 ? j(e2, t2 + 4) : a2, l2 ? j(e2, t2 + 4 + 8 * (c2 + s2)) : o2, 1];
      r2 < 2 && E(13);
    }
    return [i2, a2, o2, 0];
  };
  function N(e2, n2) {
    for (var r2 = {}, i2 = e2.length - 22; A(e2, i2) != 101010256; --i2) (!i2 || e2.length - i2 > 65558) && E(13);
    var a2 = k(e2, i2 + 8);
    if (!a2) return {};
    var o2 = A(e2, i2 + 16), s2 = A(e2, i2 - 20) == 117853008;
    if (s2) {
      var c2 = A(e2, i2 - 12);
      s2 = A(e2, c2) == 101075792, s2 && (a2 = A(e2, c2 + 32), o2 = A(e2, c2 + 48));
    }
    for (var l2 = n2 && n2.filter, u2 = 0; u2 < a2; ++u2) {
      var d2 = ae(e2, o2, s2), f2 = d2[0], p2 = d2[1], m2 = d2[2], h2 = d2[3], g2 = d2[4], _2 = d2[5], v2 = ie(e2, _2);
      o2 = g2, (!l2 || l2({ name: h2, size: p2, originalSize: m2, compression: f2 })) && (f2 ? f2 == 8 ? r2[h2] = te(e2.subarray(v2, v2 + p2), { out: new t(m2) }) : E(14, `unknown compression type ` + f2) : r2[h2] = w(e2, v2, v2 + p2));
    }
    return r2;
  }
  var P = e(((e2) => {
    /**
    * Character classes and associated utilities for the 5th edition of XML 1.0.
    *
    * @author Louis-Dominique Dubeau
    * @license MIT
    * @copyright Louis-Dominique Dubeau
    */
    Object.defineProperty(e2, `__esModule`, { value: true }), e2.CHAR = `	
\r -퟿-�𐀀-􏿿`, e2.S = ` 	\r
`, e2.NAME_START_CHAR = `:A-Z_a-zÀ-ÖØ-öø-˿Ͱ-ͽͿ-῿‌‍⁰-↏Ⰰ-⿯、-퟿豈-﷏ﷰ-�𐀀-󯿿`, e2.NAME_CHAR = `-` + e2.NAME_START_CHAR + `.0-9·̀-ͯ‿-⁀`, e2.CHAR_RE = RegExp(`^[` + e2.CHAR + `]$`, `u`), e2.S_RE = RegExp(`^[` + e2.S + `]+$`, `u`), e2.NAME_START_CHAR_RE = RegExp(`^[` + e2.NAME_START_CHAR + `]$`, `u`), e2.NAME_CHAR_RE = RegExp(`^[` + e2.NAME_CHAR + `]$`, `u`), e2.NAME_RE = RegExp(`^[` + e2.NAME_START_CHAR + `][` + e2.NAME_CHAR + `]*$`, `u`), e2.NMTOKEN_RE = RegExp(`^[` + e2.NAME_CHAR + `]+$`, `u`);
    var t2 = 9, n2 = 10, r2 = 13, i2 = 32;
    e2.S_LIST = [i2, n2, r2, t2];
    function a2(e3) {
      return e3 >= i2 && e3 <= 55295 || e3 === n2 || e3 === r2 || e3 === t2 || e3 >= 57344 && e3 <= 65533 || e3 >= 65536 && e3 <= 1114111;
    }
    e2.isChar = a2;
    function o2(e3) {
      return e3 === i2 || e3 === n2 || e3 === r2 || e3 === t2;
    }
    e2.isS = o2;
    function s2(e3) {
      return e3 >= 65 && e3 <= 90 || e3 >= 97 && e3 <= 122 || e3 === 58 || e3 === 95 || e3 === 8204 || e3 === 8205 || e3 >= 192 && e3 <= 214 || e3 >= 216 && e3 <= 246 || e3 >= 248 && e3 <= 767 || e3 >= 880 && e3 <= 893 || e3 >= 895 && e3 <= 8191 || e3 >= 8304 && e3 <= 8591 || e3 >= 11264 && e3 <= 12271 || e3 >= 12289 && e3 <= 55295 || e3 >= 63744 && e3 <= 64975 || e3 >= 65008 && e3 <= 65533 || e3 >= 65536 && e3 <= 983039;
    }
    e2.isNameStartChar = s2;
    function c2(e3) {
      return s2(e3) || e3 >= 48 && e3 <= 57 || e3 === 45 || e3 === 46 || e3 === 183 || e3 >= 768 && e3 <= 879 || e3 >= 8255 && e3 <= 8256;
    }
    e2.isNameChar = c2;
  })), F = e(((e2) => {
    /**
    * Character classes and associated utilities for the 2nd edition of XML 1.1.
    *
    * @author Louis-Dominique Dubeau
    * @license MIT
    * @copyright Louis-Dominique Dubeau
    */
    Object.defineProperty(e2, `__esModule`, { value: true }), e2.CHAR = `-퟿-�𐀀-􏿿`, e2.RESTRICTED_CHAR = `-\b\v\f---`, e2.S = ` 	\r
`, e2.NAME_START_CHAR = `:A-Z_a-zÀ-ÖØ-öø-˿Ͱ-ͽͿ-῿‌‍⁰-↏Ⰰ-⿯、-퟿豈-﷏ﷰ-�𐀀-󯿿`, e2.NAME_CHAR = `-` + e2.NAME_START_CHAR + `.0-9·̀-ͯ‿-⁀`, e2.CHAR_RE = RegExp(`^[` + e2.CHAR + `]$`, `u`), e2.RESTRICTED_CHAR_RE = RegExp(`^[` + e2.RESTRICTED_CHAR + `]$`, `u`), e2.S_RE = RegExp(`^[` + e2.S + `]+$`, `u`), e2.NAME_START_CHAR_RE = RegExp(`^[` + e2.NAME_START_CHAR + `]$`, `u`), e2.NAME_CHAR_RE = RegExp(`^[` + e2.NAME_CHAR + `]$`, `u`), e2.NAME_RE = RegExp(`^[` + e2.NAME_START_CHAR + `][` + e2.NAME_CHAR + `]*$`, `u`), e2.NMTOKEN_RE = RegExp(`^[` + e2.NAME_CHAR + `]+$`, `u`);
    var t2 = 9, n2 = 10, r2 = 13, i2 = 32;
    e2.S_LIST = [i2, n2, r2, t2];
    function a2(e3) {
      return e3 >= 1 && e3 <= 55295 || e3 >= 57344 && e3 <= 65533 || e3 >= 65536 && e3 <= 1114111;
    }
    e2.isChar = a2;
    function o2(e3) {
      return e3 >= 1 && e3 <= 8 || e3 === 11 || e3 === 12 || e3 >= 14 && e3 <= 31 || e3 >= 127 && e3 <= 132 || e3 >= 134 && e3 <= 159;
    }
    e2.isRestrictedChar = o2;
    function s2(e3) {
      return e3 === 9 || e3 === 10 || e3 === 13 || e3 > 31 && e3 < 127 || e3 === 133 || e3 > 159 && e3 <= 55295 || e3 >= 57344 && e3 <= 65533 || e3 >= 65536 && e3 <= 1114111;
    }
    e2.isCharAndNotRestricted = s2;
    function c2(e3) {
      return e3 === i2 || e3 === n2 || e3 === r2 || e3 === t2;
    }
    e2.isS = c2;
    function l2(e3) {
      return e3 >= 65 && e3 <= 90 || e3 >= 97 && e3 <= 122 || e3 === 58 || e3 === 95 || e3 === 8204 || e3 === 8205 || e3 >= 192 && e3 <= 214 || e3 >= 216 && e3 <= 246 || e3 >= 248 && e3 <= 767 || e3 >= 880 && e3 <= 893 || e3 >= 895 && e3 <= 8191 || e3 >= 8304 && e3 <= 8591 || e3 >= 11264 && e3 <= 12271 || e3 >= 12289 && e3 <= 55295 || e3 >= 63744 && e3 <= 64975 || e3 >= 65008 && e3 <= 65533 || e3 >= 65536 && e3 <= 983039;
    }
    e2.isNameStartChar = l2;
    function u2(e3) {
      return l2(e3) || e3 >= 48 && e3 <= 57 || e3 === 45 || e3 === 46 || e3 === 183 || e3 >= 768 && e3 <= 879 || e3 >= 8255 && e3 <= 8256;
    }
    e2.isNameChar = u2;
  })), se = e(((e2) => {
    /**
    * Character class utilities for XML NS 1.0 edition 3.
    *
    * @author Louis-Dominique Dubeau
    * @license MIT
    * @copyright Louis-Dominique Dubeau
    */
    Object.defineProperty(e2, `__esModule`, { value: true }), e2.NC_NAME_START_CHAR = `A-Z_a-zÀ-ÖØ-öø-˿Ͱ-ͽͿ-῿‌-‍⁰-↏Ⰰ-⿯、-퟿豈-﷏ﷰ-�𐀀-󯿿`, e2.NC_NAME_CHAR = `-` + e2.NC_NAME_START_CHAR + `.0-9·̀-ͯ‿-⁀`, e2.NC_NAME_START_CHAR_RE = RegExp(`^[` + e2.NC_NAME_START_CHAR + `]$`, `u`), e2.NC_NAME_CHAR_RE = RegExp(`^[` + e2.NC_NAME_CHAR + `]$`, `u`), e2.NC_NAME_RE = RegExp(`^[` + e2.NC_NAME_START_CHAR + `][` + e2.NC_NAME_CHAR + `]*$`, `u`);
    function t2(e3) {
      return e3 >= 65 && e3 <= 90 || e3 === 95 || e3 >= 97 && e3 <= 122 || e3 >= 192 && e3 <= 214 || e3 >= 216 && e3 <= 246 || e3 >= 248 && e3 <= 767 || e3 >= 880 && e3 <= 893 || e3 >= 895 && e3 <= 8191 || e3 >= 8204 && e3 <= 8205 || e3 >= 8304 && e3 <= 8591 || e3 >= 11264 && e3 <= 12271 || e3 >= 12289 && e3 <= 55295 || e3 >= 63744 && e3 <= 64975 || e3 >= 65008 && e3 <= 65533 || e3 >= 65536 && e3 <= 983039;
    }
    e2.isNCNameStartChar = t2;
    function n2(e3) {
      return t2(e3) || e3 === 45 || e3 === 46 || e3 >= 48 && e3 <= 57 || e3 === 183 || e3 >= 768 && e3 <= 879 || e3 >= 8255 && e3 <= 8256;
    }
    e2.isNCNameChar = n2;
  })), ce = e(((e2) => {
    Object.defineProperty(e2, `__esModule`, { value: true }), e2.SaxesParser = e2.EVENTS = void 0;
    let t2 = P(), n2 = F(), r2 = se();
    var i2 = t2.isS, a2 = t2.isChar, o2 = t2.isNameStartChar, s2 = t2.isNameChar, c2 = t2.S_LIST, l2 = t2.NAME_RE, u2 = n2.isChar, d2 = r2.isNCNameStartChar, f2 = r2.isNCNameChar, p2 = r2.NC_NAME_RE;
    let m2 = `http://www.w3.org/XML/1998/namespace`, h2 = `http://www.w3.org/2000/xmlns/`, g2 = { __proto__: null, xml: m2, xmlns: h2 }, _2 = { __proto__: null, amp: `&`, gt: `>`, lt: `<`, quot: `"`, apos: `'` }, v2 = 8232, y2 = (e3) => e3 === 34 || e3 === 39, b2 = [34, 39], x2 = [...b2, 91, 62], S2 = [...b2, 60, 93], C2 = [61, 63, ...c2], ee2 = [...c2, 62, 38, 60];
    function w2(e3, t3, n3) {
      switch (t3) {
        case `xml`:
          n3 !== m2 && e3.fail(`xml prefix must be bound to ${m2}.`);
          break;
        case `xmlns`:
          n3 !== h2 && e3.fail(`xmlns prefix must be bound to ${h2}.`);
          break;
        default:
      }
      switch (n3) {
        case h2:
          e3.fail(t3 === `` ? `the default namespace may not be set to ${n3}.` : `may not assign a prefix (even "xmlns") to the URI ${h2}.`);
          break;
        case m2:
          switch (t3) {
            case `xml`:
              break;
            case ``:
              e3.fail(`the default namespace may not be set to ${n3}.`);
              break;
            default:
              e3.fail(`may not assign the xml namespace to another prefix.`);
          }
          break;
        default:
      }
    }
    function T2(e3, t3) {
      for (let n3 of Object.keys(t3)) w2(e3, n3, t3[n3]);
    }
    let E2 = (e3) => p2.test(e3), D2 = (e3) => l2.test(e3);
    e2.EVENTS = [`xmldecl`, `text`, `processinginstruction`, `doctype`, `comment`, `opentagstart`, `attribute`, `opentag`, `closetag`, `cdata`, `error`, `end`, `ready`];
    let O2 = { xmldecl: `xmldeclHandler`, text: `textHandler`, processinginstruction: `piHandler`, doctype: `doctypeHandler`, comment: `commentHandler`, opentagstart: `openTagStartHandler`, attribute: `attributeHandler`, opentag: `openTagHandler`, closetag: `closeTagHandler`, cdata: `cdataHandler`, error: `errorHandler`, end: `endHandler`, ready: `readyHandler` };
    e2.SaxesParser = class {
      constructor(e3) {
        this.opt = e3 ?? {}, this.fragmentOpt = !!this.opt.fragment;
        let t3 = this.xmlnsOpt = !!this.opt.xmlns;
        if (this.trackPosition = this.opt.position !== false, this.fileName = this.opt.fileName, t3) {
          this.nameStartCheck = d2, this.nameCheck = f2, this.isName = E2, this.processAttribs = this.processAttribsNS, this.pushAttrib = this.pushAttribNS, this.ns = Object.assign({ __proto__: null }, g2);
          let e4 = this.opt.additionalNamespaces;
          e4 != null && (T2(this, e4), Object.assign(this.ns, e4));
        } else this.nameStartCheck = o2, this.nameCheck = s2, this.isName = D2, this.processAttribs = this.processAttribsPlain, this.pushAttrib = this.pushAttribPlain;
        this.stateTable = [this.sBegin, this.sBeginWhitespace, this.sDoctype, this.sDoctypeQuote, this.sDTD, this.sDTDQuoted, this.sDTDOpenWaka, this.sDTDOpenWakaBang, this.sDTDComment, this.sDTDCommentEnding, this.sDTDCommentEnded, this.sDTDPI, this.sDTDPIEnding, this.sText, this.sEntity, this.sOpenWaka, this.sOpenWakaBang, this.sComment, this.sCommentEnding, this.sCommentEnded, this.sCData, this.sCDataEnding, this.sCDataEnding2, this.sPIFirstChar, this.sPIRest, this.sPIBody, this.sPIEnding, this.sXMLDeclNameStart, this.sXMLDeclName, this.sXMLDeclEq, this.sXMLDeclValueStart, this.sXMLDeclValue, this.sXMLDeclSeparator, this.sXMLDeclEnding, this.sOpenTag, this.sOpenTagSlash, this.sAttrib, this.sAttribName, this.sAttribNameSawWhite, this.sAttribValue, this.sAttribValueQuoted, this.sAttribValueClosed, this.sAttribValueUnquoted, this.sCloseTag, this.sCloseTagSawWhite], this._init();
      }
      get closed() {
        return this._closed;
      }
      _init() {
        var e3;
        this.openWakaBang = ``, this.text = ``, this.name = ``, this.piTarget = ``, this.entity = ``, this.q = null, this.tags = [], this.tag = null, this.topNS = null, this.chunk = ``, this.chunkPosition = 0, this.i = 0, this.prevI = 0, this.carriedFromPrevious = void 0, this.forbiddenState = 0, this.attribList = [];
        let { fragmentOpt: t3 } = this;
        this.state = t3 ? 13 : 0, this.reportedTextBeforeRoot = this.reportedTextAfterRoot = this.closedRoot = this.sawRoot = t3, this.xmlDeclPossible = !t3, this.xmlDeclExpects = [`version`], this.entityReturnState = void 0;
        let { defaultXMLVersion: n3 } = this.opt;
        if (n3 === void 0) {
          if (this.opt.forceXMLVersion === true) throw Error(`forceXMLVersion set but defaultXMLVersion is not set`);
          n3 = `1.0`;
        }
        this.setXMLVersion(n3), this.positionAtNewLine = 0, this.doctype = false, this._closed = false, this.xmlDecl = { version: void 0, encoding: void 0, standalone: void 0 }, this.line = 1, this.column = 0, this.ENTITIES = Object.create(_2), (e3 = this.readyHandler) == null || e3.call(this);
      }
      get position() {
        return this.chunkPosition + this.i;
      }
      get columnIndex() {
        return this.position - this.positionAtNewLine;
      }
      on(e3, t3) {
        this[O2[e3]] = t3;
      }
      off(e3) {
        this[O2[e3]] = void 0;
      }
      makeError(e3) {
        let t3 = this.fileName ?? ``;
        return this.trackPosition && (t3.length > 0 && (t3 += `:`), t3 += `${this.line}:${this.column}`), t3.length > 0 && (t3 += `: `), Error(t3 + e3);
      }
      fail(e3) {
        let t3 = this.makeError(e3), n3 = this.errorHandler;
        if (n3 === void 0) throw t3;
        return n3(t3), this;
      }
      write(e3) {
        if (this.closed) return this.fail(`cannot write after close; assign an onready handler.`);
        let t3 = false;
        e3 === null ? (t3 = true, e3 = ``) : typeof e3 == `object` && (e3 = e3.toString()), this.carriedFromPrevious !== void 0 && (e3 = `${this.carriedFromPrevious}${e3}`, this.carriedFromPrevious = void 0);
        let n3 = e3.length, r3 = e3.charCodeAt(n3 - 1);
        !t3 && (r3 === 13 || r3 >= 55296 && r3 <= 56319) && (this.carriedFromPrevious = e3[n3 - 1], n3--, e3 = e3.slice(0, n3));
        let { stateTable: i3 } = this;
        for (this.chunk = e3, this.i = 0; this.i < n3; ) i3[this.state].call(this);
        return this.chunkPosition += n3, t3 ? this.end() : this;
      }
      close() {
        return this.write(null);
      }
      getCode10() {
        let { chunk: e3, i: t3 } = this;
        if (this.prevI = t3, this.i = t3 + 1, t3 >= e3.length) return -1;
        let n3 = e3.charCodeAt(t3);
        if (this.column++, n3 < 55296) {
          if (n3 >= 32 || n3 === 9) return n3;
          switch (n3) {
            case 10:
              return this.line++, this.column = 0, this.positionAtNewLine = this.position, 10;
            case 13:
              return e3.charCodeAt(t3 + 1) === 10 && (this.i = t3 + 2), this.line++, this.column = 0, this.positionAtNewLine = this.position, -2;
            default:
              return this.fail(`disallowed character.`), n3;
          }
        }
        if (n3 > 56319) return n3 >= 57344 && n3 <= 65533 || this.fail(`disallowed character.`), n3;
        let r3 = 65536 + (n3 - 55296) * 1024 + (e3.charCodeAt(t3 + 1) - 56320);
        return this.i = t3 + 2, r3 > 1114111 && this.fail(`disallowed character.`), r3;
      }
      getCode11() {
        let { chunk: e3, i: t3 } = this;
        if (this.prevI = t3, this.i = t3 + 1, t3 >= e3.length) return -1;
        let n3 = e3.charCodeAt(t3);
        if (this.column++, n3 < 55296) {
          if (n3 > 31 && n3 < 127 || n3 > 159 && n3 !== v2 || n3 === 9) return n3;
          switch (n3) {
            case 10:
              return this.line++, this.column = 0, this.positionAtNewLine = this.position, 10;
            case 13: {
              let n4 = e3.charCodeAt(t3 + 1);
              (n4 === 10 || n4 === 133) && (this.i = t3 + 2);
            }
            case 133:
            case v2:
              return this.line++, this.column = 0, this.positionAtNewLine = this.position, -2;
            default:
              return this.fail(`disallowed character.`), n3;
          }
        }
        if (n3 > 56319) return n3 >= 57344 && n3 <= 65533 || this.fail(`disallowed character.`), n3;
        let r3 = 65536 + (n3 - 55296) * 1024 + (e3.charCodeAt(t3 + 1) - 56320);
        return this.i = t3 + 2, r3 > 1114111 && this.fail(`disallowed character.`), r3;
      }
      getCodeNorm() {
        let e3 = this.getCode();
        return e3 === -2 ? 10 : e3;
      }
      unget() {
        this.i = this.prevI, this.column--;
      }
      captureTo(e3) {
        let { i: t3 } = this, { chunk: n3 } = this;
        for (; ; ) {
          let r3 = this.getCode(), i3 = r3 === -2, a3 = i3 ? 10 : r3;
          if (a3 === -1 || e3.includes(a3)) return this.text += n3.slice(t3, this.prevI), a3;
          i3 && (this.text += `${n3.slice(t3, this.prevI)}
`, t3 = this.i);
        }
      }
      captureToChar(e3) {
        let { i: t3 } = this, { chunk: n3 } = this;
        for (; ; ) {
          let r3 = this.getCode();
          switch (r3) {
            case -2:
              this.text += `${n3.slice(t3, this.prevI)}
`, t3 = this.i, r3 = 10;
              break;
            case -1:
              return this.text += n3.slice(t3), false;
            default:
          }
          if (r3 === e3) return this.text += n3.slice(t3, this.prevI), true;
        }
      }
      captureNameChars() {
        let { chunk: e3, i: t3 } = this;
        for (; ; ) {
          let n3 = this.getCode();
          if (n3 === -1) return this.name += e3.slice(t3), -1;
          if (!s2(n3)) return this.name += e3.slice(t3, this.prevI), n3 === -2 ? 10 : n3;
        }
      }
      skipSpaces() {
        for (; ; ) {
          let e3 = this.getCodeNorm();
          if (e3 === -1 || !i2(e3)) return e3;
        }
      }
      setXMLVersion(e3) {
        this.currentXMLVersion = e3, e3 === `1.0` ? (this.isChar = a2, this.getCode = this.getCode10) : (this.isChar = u2, this.getCode = this.getCode11);
      }
      sBegin() {
        this.chunk.charCodeAt(0) === 65279 && (this.i++, this.column++), this.state = 1;
      }
      sBeginWhitespace() {
        let e3 = this.i, t3 = this.skipSpaces();
        switch (this.prevI !== e3 && (this.xmlDeclPossible = false), t3) {
          case 60:
            if (this.state = 15, this.text.length !== 0) throw Error(`no-empty text at start`);
            break;
          case -1:
            break;
          default:
            this.unget(), this.state = 13, this.xmlDeclPossible = false;
        }
      }
      sDoctype() {
        var e3;
        let t3 = this.captureTo(x2);
        switch (t3) {
          case 62:
            (e3 = this.doctypeHandler) == null || e3.call(this, this.text), this.text = ``, this.state = 13, this.doctype = true;
            break;
          case -1:
            break;
          default:
            this.text += String.fromCodePoint(t3), t3 === 91 ? this.state = 4 : y2(t3) && (this.state = 3, this.q = t3);
        }
      }
      sDoctypeQuote() {
        let e3 = this.q;
        this.captureToChar(e3) && (this.text += String.fromCodePoint(e3), this.q = null, this.state = 2);
      }
      sDTD() {
        let e3 = this.captureTo(S2);
        e3 !== -1 && (this.text += String.fromCodePoint(e3), e3 === 93 ? this.state = 2 : e3 === 60 ? this.state = 6 : y2(e3) && (this.state = 5, this.q = e3));
      }
      sDTDQuoted() {
        let e3 = this.q;
        this.captureToChar(e3) && (this.text += String.fromCodePoint(e3), this.state = 4, this.q = null);
      }
      sDTDOpenWaka() {
        let e3 = this.getCodeNorm();
        switch (this.text += String.fromCodePoint(e3), e3) {
          case 33:
            this.state = 7, this.openWakaBang = ``;
            break;
          case 63:
            this.state = 11;
            break;
          default:
            this.state = 4;
        }
      }
      sDTDOpenWakaBang() {
        let e3 = String.fromCodePoint(this.getCodeNorm()), t3 = this.openWakaBang += e3;
        this.text += e3, t3 !== `-` && (this.state = t3 === `--` ? 8 : 4, this.openWakaBang = ``);
      }
      sDTDComment() {
        this.captureToChar(45) && (this.text += `-`, this.state = 9);
      }
      sDTDCommentEnding() {
        let e3 = this.getCodeNorm();
        this.text += String.fromCodePoint(e3), this.state = e3 === 45 ? 10 : 8;
      }
      sDTDCommentEnded() {
        let e3 = this.getCodeNorm();
        this.text += String.fromCodePoint(e3), e3 === 62 ? this.state = 4 : (this.fail(`malformed comment.`), this.state = 8);
      }
      sDTDPI() {
        this.captureToChar(63) && (this.text += `?`, this.state = 12);
      }
      sDTDPIEnding() {
        let e3 = this.getCodeNorm();
        this.text += String.fromCodePoint(e3), e3 === 62 && (this.state = 4);
      }
      sText() {
        this.tags.length === 0 ? this.handleTextOutsideRoot() : this.handleTextInRoot();
      }
      sEntity() {
        let { i: e3 } = this, { chunk: t3 } = this;
        loop: for (; ; ) switch (this.getCode()) {
          case -2:
            this.entity += `${t3.slice(e3, this.prevI)}
`, e3 = this.i;
            break;
          case 59: {
            let { entityReturnState: n3 } = this, r3 = this.entity + t3.slice(e3, this.prevI);
            this.state = n3;
            let i3;
            r3 === `` ? (this.fail(`empty entity name.`), i3 = `&;`) : (i3 = this.parseEntity(r3), this.entity = ``), (n3 !== 13 || this.textHandler !== void 0) && (this.text += i3);
            break loop;
          }
          case -1:
            this.entity += t3.slice(e3);
            break loop;
          default:
        }
      }
      sOpenWaka() {
        let e3 = this.getCode();
        if (o2(e3)) this.state = 34, this.unget(), this.xmlDeclPossible = false;
        else switch (e3) {
          case 47:
            this.state = 43, this.xmlDeclPossible = false;
            break;
          case 33:
            this.state = 16, this.openWakaBang = ``, this.xmlDeclPossible = false;
            break;
          case 63:
            this.state = 23;
            break;
          default:
            this.fail(`disallowed character in tag name`), this.state = 13, this.xmlDeclPossible = false;
        }
      }
      sOpenWakaBang() {
        switch (this.openWakaBang += String.fromCodePoint(this.getCodeNorm()), this.openWakaBang) {
          case `[CDATA[`:
            !this.sawRoot && !this.reportedTextBeforeRoot && (this.fail(`text data outside of root node.`), this.reportedTextBeforeRoot = true), this.closedRoot && !this.reportedTextAfterRoot && (this.fail(`text data outside of root node.`), this.reportedTextAfterRoot = true), this.state = 20, this.openWakaBang = ``;
            break;
          case `--`:
            this.state = 17, this.openWakaBang = ``;
            break;
          case `DOCTYPE`:
            this.state = 2, (this.doctype || this.sawRoot) && this.fail(`inappropriately located doctype declaration.`), this.openWakaBang = ``;
            break;
          default:
            this.openWakaBang.length >= 7 && this.fail(`incorrect syntax.`);
        }
      }
      sComment() {
        this.captureToChar(45) && (this.state = 18);
      }
      sCommentEnding() {
        var e3;
        let t3 = this.getCodeNorm();
        t3 === 45 ? (this.state = 19, (e3 = this.commentHandler) == null || e3.call(this, this.text), this.text = ``) : (this.text += `-${String.fromCodePoint(t3)}`, this.state = 17);
      }
      sCommentEnded() {
        let e3 = this.getCodeNorm();
        e3 === 62 ? this.state = 13 : (this.fail(`malformed comment.`), this.text += `--${String.fromCodePoint(e3)}`, this.state = 17);
      }
      sCData() {
        this.captureToChar(93) && (this.state = 21);
      }
      sCDataEnding() {
        let e3 = this.getCodeNorm();
        e3 === 93 ? this.state = 22 : (this.text += `]${String.fromCodePoint(e3)}`, this.state = 20);
      }
      sCDataEnding2() {
        var e3;
        let t3 = this.getCodeNorm();
        switch (t3) {
          case 62:
            (e3 = this.cdataHandler) == null || e3.call(this, this.text), this.text = ``, this.state = 13;
            break;
          case 93:
            this.text += `]`;
            break;
          default:
            this.text += `]]${String.fromCodePoint(t3)}`, this.state = 20;
        }
      }
      sPIFirstChar() {
        let e3 = this.getCodeNorm();
        this.nameStartCheck(e3) ? (this.piTarget += String.fromCodePoint(e3), this.state = 24) : e3 === 63 || i2(e3) ? (this.fail(`processing instruction without a target.`), this.state = e3 === 63 ? 26 : 25) : (this.fail(`disallowed character in processing instruction name.`), this.piTarget += String.fromCodePoint(e3), this.state = 24);
      }
      sPIRest() {
        let { chunk: e3, i: t3 } = this;
        for (; ; ) {
          let n3 = this.getCodeNorm();
          if (n3 === -1) {
            this.piTarget += e3.slice(t3);
            return;
          }
          if (!this.nameCheck(n3)) {
            this.piTarget += e3.slice(t3, this.prevI);
            let r3 = n3 === 63;
            r3 || i2(n3) ? this.piTarget === `xml` ? (this.xmlDeclPossible || this.fail(`an XML declaration must be at the start of the document.`), this.state = r3 ? 33 : 27) : this.state = r3 ? 26 : 25 : (this.fail(`disallowed character in processing instruction name.`), this.piTarget += String.fromCodePoint(n3));
            break;
          }
        }
      }
      sPIBody() {
        if (this.text.length === 0) {
          let e3 = this.getCodeNorm();
          e3 === 63 ? this.state = 26 : i2(e3) || (this.text = String.fromCodePoint(e3));
        } else this.captureToChar(63) && (this.state = 26);
      }
      sPIEnding() {
        var e3;
        let t3 = this.getCodeNorm();
        if (t3 === 62) {
          let { piTarget: t4 } = this;
          t4.toLowerCase() === `xml` && this.fail(`the XML declaration must appear at the start of the document.`), (e3 = this.piHandler) == null || e3.call(this, { target: t4, body: this.text }), this.piTarget = this.text = ``, this.state = 13;
        } else t3 === 63 ? this.text += `?` : (this.text += `?${String.fromCodePoint(t3)}`, this.state = 25);
        this.xmlDeclPossible = false;
      }
      sXMLDeclNameStart() {
        let e3 = this.skipSpaces();
        if (e3 === 63) {
          this.state = 33;
          return;
        }
        e3 !== -1 && (this.state = 28, this.name = String.fromCodePoint(e3));
      }
      sXMLDeclName() {
        let e3 = this.captureTo(C2);
        if (e3 === 63) {
          this.state = 33, this.name += this.text, this.text = ``, this.fail(`XML declaration is incomplete.`);
          return;
        }
        if (i2(e3) || e3 === 61) {
          if (this.name += this.text, this.text = ``, !this.xmlDeclExpects.includes(this.name)) switch (this.name.length) {
            case 0:
              this.fail(`did not expect any more name/value pairs.`);
              break;
            case 1:
              this.fail(`expected the name ${this.xmlDeclExpects[0]}.`);
              break;
            default:
              this.fail(`expected one of ${this.xmlDeclExpects.join(`, `)}`);
          }
          this.state = e3 === 61 ? 30 : 29;
        }
      }
      sXMLDeclEq() {
        let e3 = this.getCodeNorm();
        if (e3 === 63) {
          this.state = 33, this.fail(`XML declaration is incomplete.`);
          return;
        }
        i2(e3) || (e3 !== 61 && this.fail(`value required.`), this.state = 30);
      }
      sXMLDeclValueStart() {
        let e3 = this.getCodeNorm();
        if (e3 === 63) {
          this.state = 33, this.fail(`XML declaration is incomplete.`);
          return;
        }
        i2(e3) || (y2(e3) ? this.q = e3 : (this.fail(`value must be quoted.`), this.q = 32), this.state = 31);
      }
      sXMLDeclValue() {
        let e3 = this.captureTo([this.q, 63]);
        if (e3 === 63) {
          this.state = 33, this.text = ``, this.fail(`XML declaration is incomplete.`);
          return;
        }
        if (e3 === -1) return;
        let t3 = this.text;
        switch (this.text = ``, this.name) {
          case `version`: {
            this.xmlDeclExpects = [`encoding`, `standalone`];
            let e4 = t3;
            this.xmlDecl.version = e4, /^1\.[0-9]+$/.test(e4) ? this.opt.forceXMLVersion || this.setXMLVersion(e4) : this.fail(`version number must match /^1\\.[0-9]+$/.`);
            break;
          }
          case `encoding`:
            /^[A-Za-z][A-Za-z0-9._-]*$/.test(t3) || this.fail(`encoding value must match /^[A-Za-z0-9][A-Za-z0-9._-]*$/.`), this.xmlDeclExpects = [`standalone`], this.xmlDecl.encoding = t3;
            break;
          case `standalone`:
            t3 !== `yes` && t3 !== `no` && this.fail(`standalone value must match "yes" or "no".`), this.xmlDeclExpects = [], this.xmlDecl.standalone = t3;
            break;
          default:
        }
        this.name = ``, this.state = 32;
      }
      sXMLDeclSeparator() {
        let e3 = this.getCodeNorm();
        if (e3 === 63) {
          this.state = 33;
          return;
        }
        i2(e3) || (this.fail(`whitespace required.`), this.unget()), this.state = 27;
      }
      sXMLDeclEnding() {
        var e3;
        this.getCodeNorm() === 62 ? (this.piTarget === `xml` ? this.name !== `version` && this.xmlDeclExpects.includes(`version`) && this.fail(`XML declaration must contain a version.`) : this.fail(`processing instructions are not allowed before root.`), (e3 = this.xmldeclHandler) == null || e3.call(this, this.xmlDecl), this.name = ``, this.piTarget = this.text = ``, this.state = 13) : this.fail(`The character ? is disallowed anywhere in XML declarations.`), this.xmlDeclPossible = false;
      }
      sOpenTag() {
        var e3;
        let t3 = this.captureNameChars();
        if (t3 === -1) return;
        let n3 = this.tag = { name: this.name, attributes: /* @__PURE__ */ Object.create(null) };
        switch (this.name = ``, this.xmlnsOpt && (this.topNS = n3.ns = /* @__PURE__ */ Object.create(null)), (e3 = this.openTagStartHandler) == null || e3.call(this, n3), this.sawRoot = true, !this.fragmentOpt && this.closedRoot && this.fail(`documents may contain only one root.`), t3) {
          case 62:
            this.openTag();
            break;
          case 47:
            this.state = 35;
            break;
          default:
            i2(t3) || this.fail(`disallowed character in tag name.`), this.state = 36;
        }
      }
      sOpenTagSlash() {
        this.getCode() === 62 ? this.openSelfClosingTag() : (this.fail(`forward-slash in opening tag not followed by >.`), this.state = 36);
      }
      sAttrib() {
        let e3 = this.skipSpaces();
        e3 !== -1 && (o2(e3) ? (this.unget(), this.state = 37) : e3 === 62 ? this.openTag() : e3 === 47 ? this.state = 35 : this.fail(`disallowed character in attribute name.`));
      }
      sAttribName() {
        let e3 = this.captureNameChars();
        e3 === 61 ? this.state = 39 : i2(e3) ? this.state = 38 : e3 === 62 ? (this.fail(`attribute without value.`), this.pushAttrib(this.name, this.name), this.name = this.text = ``, this.openTag()) : e3 !== -1 && this.fail(`disallowed character in attribute name.`);
      }
      sAttribNameSawWhite() {
        let e3 = this.skipSpaces();
        switch (e3) {
          case -1:
            return;
          case 61:
            this.state = 39;
            break;
          default:
            this.fail(`attribute without value.`), this.text = ``, this.name = ``, e3 === 62 ? this.openTag() : o2(e3) ? (this.unget(), this.state = 37) : (this.fail(`disallowed character in attribute name.`), this.state = 36);
        }
      }
      sAttribValue() {
        let e3 = this.getCodeNorm();
        y2(e3) ? (this.q = e3, this.state = 40) : i2(e3) || (this.fail(`unquoted attribute value.`), this.state = 42, this.unget());
      }
      sAttribValueQuoted() {
        let { q: e3, chunk: t3 } = this, { i: n3 } = this;
        for (; ; ) switch (this.getCode()) {
          case e3:
            this.pushAttrib(this.name, this.text + t3.slice(n3, this.prevI)), this.name = this.text = ``, this.q = null, this.state = 41;
            return;
          case 38:
            this.text += t3.slice(n3, this.prevI), this.state = 14, this.entityReturnState = 40;
            return;
          case 10:
          case -2:
          case 9:
            this.text += `${t3.slice(n3, this.prevI)} `, n3 = this.i;
            break;
          case 60:
            this.text += t3.slice(n3, this.prevI), this.fail(`disallowed character.`);
            return;
          case -1:
            this.text += t3.slice(n3);
            return;
          default:
        }
      }
      sAttribValueClosed() {
        let e3 = this.getCodeNorm();
        i2(e3) ? this.state = 36 : e3 === 62 ? this.openTag() : e3 === 47 ? this.state = 35 : o2(e3) ? (this.fail(`no whitespace between attributes.`), this.unget(), this.state = 37) : this.fail(`disallowed character in attribute name.`);
      }
      sAttribValueUnquoted() {
        let e3 = this.captureTo(ee2);
        switch (e3) {
          case 38:
            this.state = 14, this.entityReturnState = 42;
            break;
          case 60:
            this.fail(`disallowed character.`);
            break;
          case -1:
            break;
          default:
            this.text.includes(`]]>`) && this.fail(`the string "]]>" is disallowed in char data.`), this.pushAttrib(this.name, this.text), this.name = this.text = ``, e3 === 62 ? this.openTag() : this.state = 36;
        }
      }
      sCloseTag() {
        let e3 = this.captureNameChars();
        e3 === 62 ? this.closeTag() : i2(e3) ? this.state = 44 : e3 !== -1 && this.fail(`disallowed character in closing tag.`);
      }
      sCloseTagSawWhite() {
        switch (this.skipSpaces()) {
          case 62:
            this.closeTag();
            break;
          case -1:
            break;
          default:
            this.fail(`disallowed character in closing tag.`);
        }
      }
      handleTextInRoot() {
        let { i: e3, forbiddenState: t3 } = this, { chunk: n3, textHandler: r3 } = this;
        scanLoop: for (; ; ) switch (this.getCode()) {
          case 60:
            if (this.state = 15, r3 !== void 0) {
              let { text: t4 } = this, i3 = n3.slice(e3, this.prevI);
              t4.length === 0 ? i3.length !== 0 && r3(i3) : (r3(t4 + i3), this.text = ``);
            }
            t3 = 0;
            break scanLoop;
          case 38:
            this.state = 14, this.entityReturnState = 13, r3 !== void 0 && (this.text += n3.slice(e3, this.prevI)), t3 = 0;
            break scanLoop;
          case 93:
            switch (t3) {
              case 0:
                t3 = 1;
                break;
              case 1:
                t3 = 2;
                break;
              case 2:
                break;
              default:
                throw Error(`impossible state`);
            }
            break;
          case 62:
            t3 === 2 && this.fail(`the string "]]>" is disallowed in char data.`), t3 = 0;
            break;
          case -2:
            r3 !== void 0 && (this.text += `${n3.slice(e3, this.prevI)}
`), e3 = this.i, t3 = 0;
            break;
          case -1:
            r3 !== void 0 && (this.text += n3.slice(e3));
            break scanLoop;
          default:
            t3 = 0;
        }
        this.forbiddenState = t3;
      }
      handleTextOutsideRoot() {
        let { i: e3 } = this, { chunk: t3, textHandler: n3 } = this, r3 = false;
        outRootLoop: for (; ; ) {
          let a3 = this.getCode();
          switch (a3) {
            case 60:
              if (this.state = 15, n3 !== void 0) {
                let { text: r4 } = this, i3 = t3.slice(e3, this.prevI);
                r4.length === 0 ? i3.length !== 0 && n3(i3) : (n3(r4 + i3), this.text = ``);
              }
              break outRootLoop;
            case 38:
              this.state = 14, this.entityReturnState = 13, n3 !== void 0 && (this.text += t3.slice(e3, this.prevI)), r3 = true;
              break outRootLoop;
            case -2:
              n3 !== void 0 && (this.text += `${t3.slice(e3, this.prevI)}
`), e3 = this.i;
              break;
            case -1:
              n3 !== void 0 && (this.text += t3.slice(e3));
              break outRootLoop;
            default:
              i2(a3) || (r3 = true);
          }
        }
        r3 && (!this.sawRoot && !this.reportedTextBeforeRoot && (this.fail(`text data outside of root node.`), this.reportedTextBeforeRoot = true), this.closedRoot && !this.reportedTextAfterRoot && (this.fail(`text data outside of root node.`), this.reportedTextAfterRoot = true));
      }
      pushAttribNS(e3, t3) {
        var n3;
        let { prefix: r3, local: i3 } = this.qname(e3), a3 = { name: e3, prefix: r3, local: i3, value: t3 };
        if (this.attribList.push(a3), (n3 = this.attributeHandler) == null || n3.call(this, a3), r3 === `xmlns`) {
          let e4 = t3.trim();
          this.currentXMLVersion === `1.0` && e4 === `` && this.fail(`invalid attempt to undefine prefix in XML 1.0`), this.topNS[i3] = e4, w2(this, i3, e4);
        } else if (e3 === `xmlns`) {
          let e4 = t3.trim();
          this.topNS[``] = e4, w2(this, ``, e4);
        }
      }
      pushAttribPlain(e3, t3) {
        var n3;
        let r3 = { name: e3, value: t3 };
        this.attribList.push(r3), (n3 = this.attributeHandler) == null || n3.call(this, r3);
      }
      end() {
        var e3, t3;
        this.sawRoot || this.fail(`document must contain a root element.`);
        let { tags: n3 } = this;
        for (; n3.length > 0; ) {
          let e4 = n3.pop();
          this.fail(`unclosed tag: ${e4.name}`);
        }
        this.state !== 0 && this.state !== 13 && this.fail(`unexpected end.`);
        let { text: r3 } = this;
        return r3.length !== 0 && ((e3 = this.textHandler) == null || e3.call(this, r3), this.text = ``), this._closed = true, (t3 = this.endHandler) == null || t3.call(this), this._init(), this;
      }
      resolve(e3) {
        var t3;
        let n3 = this.topNS[e3];
        if (n3 !== void 0) return n3;
        let { tags: r3 } = this;
        for (let t4 = r3.length - 1; t4 >= 0; t4--) if (n3 = r3[t4].ns[e3], n3 !== void 0) return n3;
        return n3 = this.ns[e3], n3 === void 0 ? (t3 = this.opt).resolvePrefix?.call(t3, e3) : n3;
      }
      qname(e3) {
        let t3 = e3.indexOf(`:`);
        if (t3 === -1) return { prefix: ``, local: e3 };
        let n3 = e3.slice(t3 + 1), r3 = e3.slice(0, t3);
        return (r3 === `` || n3 === `` || n3.includes(`:`)) && this.fail(`malformed name: ${e3}.`), { prefix: r3, local: n3 };
      }
      processAttribsNS() {
        let { attribList: e3 } = this, t3 = this.tag;
        {
          let { prefix: e4, local: n4 } = this.qname(t3.name);
          t3.prefix = e4, t3.local = n4;
          let r4 = t3.uri = this.resolve(e4) ?? ``;
          e4 !== `` && (e4 === `xmlns` && this.fail(`tags may not have "xmlns" as prefix.`), r4 === `` && (this.fail(`unbound namespace prefix: ${JSON.stringify(e4)}.`), t3.uri = e4));
        }
        if (e3.length === 0) return;
        let { attributes: n3 } = t3, r3 = /* @__PURE__ */ new Set();
        for (let t4 of e3) {
          let { name: e4, prefix: i3, local: a3 } = t4, o3, s3;
          i3 === `` ? (o3 = e4 === `xmlns` ? h2 : ``, s3 = e4) : (o3 = this.resolve(i3), o3 === void 0 && (this.fail(`unbound namespace prefix: ${JSON.stringify(i3)}.`), o3 = i3), s3 = `{${o3}}${a3}`), r3.has(s3) && this.fail(`duplicate attribute: ${s3}.`), r3.add(s3), t4.uri = o3, n3[e4] = t4;
        }
        this.attribList = [];
      }
      processAttribsPlain() {
        let { attribList: e3 } = this, t3 = this.tag.attributes;
        for (let { name: n3, value: r3 } of e3) t3[n3] !== void 0 && this.fail(`duplicate attribute: ${n3}.`), t3[n3] = r3;
        this.attribList = [];
      }
      openTag() {
        var e3;
        this.processAttribs();
        let { tags: t3 } = this, n3 = this.tag;
        n3.isSelfClosing = false, (e3 = this.openTagHandler) == null || e3.call(this, n3), t3.push(n3), this.state = 13, this.name = ``;
      }
      openSelfClosingTag() {
        var e3, t3;
        this.processAttribs();
        let { tags: n3 } = this, r3 = this.tag;
        r3.isSelfClosing = true, (e3 = this.openTagHandler) == null || e3.call(this, r3), (t3 = this.closeTagHandler) == null || t3.call(this, r3), (this.tag = n3[n3.length - 1] ?? null) === null && (this.closedRoot = true), this.state = 13, this.name = ``;
      }
      closeTag() {
        let { tags: e3, name: t3 } = this;
        if (this.state = 13, this.name = ``, t3 === ``) {
          this.fail(`weird empty close tag.`), this.text += `</>`;
          return;
        }
        let n3 = this.closeTagHandler, r3 = e3.length;
        for (; r3-- > 0; ) {
          let r4 = this.tag = e3.pop();
          if (this.topNS = r4.ns, n3?.(r4), r4.name === t3) break;
          this.fail(`unexpected close tag.`);
        }
        r3 === 0 ? this.closedRoot = true : r3 < 0 && (this.fail(`unmatched closing tag: ${t3}.`), this.text += `</${t3}>`);
      }
      parseEntity(e3) {
        if (e3[0] !== `#`) {
          let t4 = this.ENTITIES[e3];
          return t4 === void 0 ? (this.fail(this.isName(e3) ? `undefined entity.` : `disallowed character in entity name.`), `&${e3};`) : t4;
        }
        let t3 = NaN;
        return e3[1] === `x` && /^#x[0-9a-f]+$/i.test(e3) ? t3 = parseInt(e3.slice(2), 16) : /^#[0-9]+$/.test(e3) && (t3 = parseInt(e3.slice(1), 10)), this.isChar(t3) ? String.fromCodePoint(t3) : (this.fail(`malformed character entity.`), `&${e3};`);
      }
    };
  }))();
  let le = 100 * 1024 * 1024;
  function I(e2, { filter: t2 = () => true } = {}) {
    let n2 = e2 instanceof Uint8Array ? e2 : new Uint8Array(e2), r2 = new DataView(n2.buffer, n2.byteOffset, n2.byteLength), i2 = -1;
    for (let e3 = n2.length - 22; e3 >= Math.max(0, n2.length - 65557); e3--) if (r2.getUint32(e3, true) === 101010256 && e3 + 22 + r2.getUint16(e3 + 20, true) === n2.length) {
      i2 = e3;
      break;
    }
    if (i2 < 0 || r2.getUint16(i2 + 4, true) || r2.getUint16(i2 + 6, true)) throw Error(`File không phải Excel .xlsx hợp lệ.`);
    let a2 = r2.getUint16(i2 + 10, true), o2 = r2.getUint32(i2 + 16, true), s2 = r2.getUint32(i2 + 12, true);
    if (!a2 || a2 > 2e3 || o2 + s2 > i2 || r2.getUint16(i2 + 8, true) !== a2) throw Error(`Cấu trúc Excel không được hỗ trợ hoặc quá lớn.`);
    let c2 = o2, l2 = 0;
    for (let e3 = 0; e3 < a2; e3++) {
      if (c2 + 46 > i2 || r2.getUint32(c2, true) !== 33639248) throw Error(`Cấu trúc Excel bị hỏng.`);
      if (r2.getUint16(c2 + 8, true) & 1) throw Error(`Hãy bỏ mật khẩu bảo vệ file trước khi tải lên.`);
      let e4 = r2.getUint16(c2 + 28, true);
      if (t2(new TextDecoder().decode(n2.subarray(c2 + 46, c2 + 46 + e4))) && (l2 += r2.getUint32(c2 + 24, true)), l2 > le) throw Error(`Nội dung Excel quá lớn. Hãy xuất PaymentList theo tháng hoặc trung tâm.`);
      c2 += 46 + r2.getUint16(c2 + 28, true) + r2.getUint16(c2 + 30, true) + r2.getUint16(c2 + 32, true);
    }
    if (c2 !== o2 + s2) throw Error(`Cấu trúc Excel bị hỏng.`);
    return n2;
  }
  let L = (e2, t2) => Object.values(e2.attributes).find((e3) => e3.name === t2)?.value;
  function R(e2) {
    let t2 = e2[0] === 255 && e2[1] === 254 ? `utf-16le` : e2[0] === 254 && e2[1] === 255 ? `utf-16be` : `utf-8`;
    return new TextDecoder(t2, { fatal: true }).decode(e2);
  }
  function z(e2, t2) {
    let n2 = new ce.SaxesParser({ xmlns: true, position: false });
    n2.on(`error`, (e3) => {
      throw Error(`XML Excel không hợp lệ: ${e3.message}`);
    }), n2.on(`doctype`, () => {
      throw Error(`Không hỗ trợ XML chứa DOCTYPE.`);
    });
    for (let [e3, r2] of Object.entries(t2)) n2.on(e3, r2);
    n2.write(e2).close();
  }
  function B(e2) {
    let t2 = [], n2 = ``, r2 = false, i2 = false, a2 = 0;
    return z(e2, { opentag: (e3) => {
      e3.local === `si` && (n2 = ``, r2 = true), e3.local === `rPh` && a2++, e3.local === `t` && r2 && !a2 && (i2 = true);
    }, text: (e3) => {
      i2 && (n2 += e3);
    }, closetag: (e3) => {
      e3.local === `t` && (i2 = false), e3.local === `rPh` && a2--, e3.local === `si` && (t2.push(n2), r2 = false);
    } }), t2;
  }
  function ue(e2) {
    let t2 = /* @__PURE__ */ new Map(), n2 = [], r2 = false;
    return z(e2, { opentag: (e3) => {
      if (e3.local === `numFmt` && t2.set(+L(e3, `numFmtId`), L(e3, `formatCode`) ?? ``), e3.local === `cellXfs` && (r2 = true), e3.local === `xf` && r2) {
        let r3 = +L(e3, `numFmtId`), i2 = t2.get(r3) ?? ``, a2 = i2.replace(/"[^"]*"|\\.|\[[^\]]*\]/g, ``);
        n2.push({ date: r3 >= 14 && r3 <= 22 || r3 >= 45 && r3 <= 47 || /[ymd]/i.test(a2), zeros: /^0{2,}$/.test(i2) ? i2.length : 0 });
      }
    }, closetag: (e3) => {
      e3.local === `cellXfs` && (r2 = false);
    } }), n2;
  }
  function de(e2, { strings: t2 = [], formats: n2 = [], date1904: r2 = false } = {}) {
    let i2 = [], a2 = [], o2 = -1, s2 = 0, c2 = null, l2 = ``, u2 = ``, d2 = ``, f2 = 0;
    return z(e2, { opentag: (e3) => {
      if (e3.local === `row`) {
        let t3 = L(e3, `r`);
        if (o2 = t3 ? t3 - 1 : o2 + 1, !Number.isSafeInteger(o2) || o2 < 0 || o2 >= 1e5) throw Error(`Sheet vượt quá 100.000 dòng. Hãy xuất phạm vi nhỏ hơn.`);
        for (a2 = [], s2 = 0; i2.length < o2; ) i2.push([]);
        i2[o2] = a2;
      }
      if (e3.local === `c`) {
        let t3 = L(e3, `r`), n3 = t3 ? /^([A-Z]+)[1-9]\d*$/.exec(t3)?.[1] : null, r3 = s2;
        if (t3 && !n3) throw Error(`Tọa độ ô Excel không hợp lệ.`);
        if (n3) {
          r3 = 0;
          for (let e4 of n3) r3 = r3 * 26 + e4.charCodeAt(0) - 64;
          r3--;
        }
        if (r3 > 255) throw Error(`Sheet vượt quá 256 cột; hãy chọn sheet PaymentList.`);
        c2 = { col: r3, type: L(e3, `t`) ?? `n`, style: +(L(e3, `s`) ?? 0) }, u2 = ``, d2 = ``, l2 = ``, s2 = r3 + 1;
      }
      e3.local === `rPh` && f2++, c2 && e3.local === `v` && (l2 = `v`), c2 && e3.local === `t` && !f2 && (l2 = `t`);
    }, text: (e3) => {
      l2 === `v` ? u2 += e3 : l2 === `t` && (d2 += e3);
    }, closetag: (e3) => {
      if ((e3.local === `v` || e3.local === `t`) && (l2 = ``), e3.local === `rPh` && f2--, e3.local === `c` && c2) {
        let e4 = null, i3 = n2[c2.style];
        if (c2.type === `inlineStr`) e4 = d2;
        else if (c2.type === `s`) {
          let n3 = Number(u2);
          if (!/^\d+$/.test(u2) || n3 >= t2.length) throw Error(`Chỉ mục chuỗi Excel không hợp lệ.`);
          e4 = t2[n3];
        } else if (c2.type === `str` || c2.type === `d`) e4 = u2;
        else if (c2.type === `b`) e4 = u2 === `1`;
        else if (c2.type === `e`) e4 = u2 ? `#EXCEL:${u2}` : null;
        else if (u2.trim() !== ``) {
          let t3 = Number(u2);
          e4 = Number.isFinite(t3) ? t3 : u2, typeof e4 == `number` && i3?.date && r2 ? e4 += 1462 : typeof e4 == `number` && i3?.zeros && Number.isInteger(e4) && e4 >= 0 && (e4 = String(e4).padStart(i3.zeros, `0`));
        }
        if (o2 < 0) throw Error(`Thiếu dòng chứa ô Excel.`);
        a2[c2.col] = e4, c2 = null;
      }
    } }), i2;
  }
  function fe(e2) {
    let t2 = (e2.startsWith(`/`) ? e2.slice(1) : `xl/${e2}`).replaceAll(`\\`, `/`).split(`/`), n2 = [];
    for (let e3 of t2) e3 === `..` ? n2.pop() : e3 && e3 !== `.` && n2.push(e3);
    return n2.join(`/`);
  }
  function V(e2, { sourceOnly: t2 = false } = {}) {
    let n2 = (e3) => /^xl\/(?:workbook|sharedStrings|styles)\.xml$/.test(e3) || e3 === `xl/_rels/workbook.xml.rels`, r2 = t2 ? n2 : () => true, i2 = N(I(e2, { filter: r2 }), { filter: (e3) => r2(e3.name) && /\.(?:xml|rels)$/i.test(e3.name) && e3.originalSize <= le }), a2 = (e3) => {
      if (!i2[e3]) throw Error(`Không tìm thấy ${e3} trong file Excel.`);
      return R(i2[e3]);
    }, o2 = /* @__PURE__ */ new Map();
    z(a2(`xl/_rels/workbook.xml.rels`), { opentag: (e3) => {
      e3.local === `Relationship` && L(e3, `TargetMode`) !== `External` && o2.set(L(e3, `Id`), fe(L(e3, `Target`) ?? ``));
    } });
    let s2 = [], c2 = false;
    if (z(a2(`xl/workbook.xml`), { opentag: (e3) => {
      if (e3.local === `workbookPr` && (c2 = [`1`, `true`].includes(L(e3, `date1904`))), e3.local === `sheet`) {
        let t3 = Object.values(e3.attributes).find((e4) => e4.local === `id`)?.value, n3 = o2.get(t3), r3 = L(e3, `name`);
        n3 && r3 && s2.push({ name: r3, path: n3 });
      }
    } }), !s2.length) throw Error(`File Excel không có sheet dữ liệu.`);
    if (t2) {
      let t3 = s2.filter((e3) => /^(EXPORT_SOURCE|PAYMENT_SOURCE|HISTORY_SOURCE|TRANSFER_SOURCE|RAW_REPORT)$/i.test(e3.name));
      if (t3.length) {
        let r3 = new Set(t3.map((e3) => e3.path));
        I(e2, { filter: (e3) => n2(e3) || r3.has(e3) });
      }
    }
    let l2 = i2[`xl/sharedStrings.xml`] ? B(a2(`xl/sharedStrings.xml`)) : [], u2 = i2[`xl/styles.xml`] ? ue(a2(`xl/styles.xml`)) : [];
    return { sheets: s2.map((e3) => ({ name: e3.name })), readSheet(r3) {
      let i3 = s2.find((e3) => e3.name === r3);
      if (!i3) throw Error(`Không tìm thấy sheet.`);
      if (t2) {
        let t3 = N(I(e2, { filter: (e3) => n2(e3) || e3 === i3.path }), { filter: (e3) => e3.name === i3.path && e3.originalSize <= le });
        if (!t3[i3.path]) throw Error(`Không tìm thấy sheet trong file.`);
        return de(R(t3[i3.path]), { strings: l2, formats: u2, date1904: c2 });
      }
      return de(a2(i3.path), { strings: l2, formats: u2, date1904: c2 });
    } };
  }
  let H = 2e3, U = Date.UTC(1899, 11, 30), W = (e2) => String(e2 ?? ``).toLowerCase().normalize(`NFD`).replace(/[\u0300-\u036f]/g, ``).replace(/đ/g, `d`).replace(/\((?:raw|calc)\)/g, ``).replace(/[^a-z0-9]/g, ``), G = (e2, t2, n2, r2 = [], i2 = false) => ({ key: e2, col: t2, label: n2, aliases: [n2, ...r2].map(W), required: i2 }), K = [G(`paymentCode`, `D`, `Payment code`, [`Mã thanh toán`, `Payment No`], true), G(`contractCode`, `E`, `Contract code`, [`Contract No`, `Contract code (hóa đơn)`, `Mã hợp đồng`], true), G(`studentId`, `R`, `Student ID`, [`Mã học viên`], true), G(`invoiceDate`, `O`, `Invoice date`, [`Ngày hóa đơn`, `Payment date`, `Ngày thu`], true), G(`paidAmount`, `AF`, `Final payment invoice amount`, [`Final payment amount invoice`, `Amount paid`, `Số tiền đã thu`, `Số tiền`, `Thực thu`], true), G(`studentName`, `S`, `Student name`, [`Tên học viên`, `Họ tên học viên`]), G(`centerName`, `B`, `Center name`, [`Tên trung tâm`]), G(`centerCode`, `C`, `Center code`, [`Mã trung tâm`]), G(`contractTotal`, `CT_TOTAL`, `Contract tổng (CT)`, [`Contract tổng`, `Contract total`, `Parent contract`, `Contract tổng đã nhận diện`]), G(`courseFee`, `Z`, `Course fee KOC`, [`Course fee`, `Khóa học`]), G(`hours`, `AA`, `Hour/week`, [`Hours/week`, `Giờ/tuần`]), G(`package`, `AB`, `Package`, [`Gói học`]), G(`giftcode`, `AO`, `Giftcode No`, [`Giftcode No.`, `Mã giftcode`]), G(`discountApply`, `AQ`, `Discount apply`, [`Khuyến mãi áp dụng`]), G(`method`, `AH`, `Method`, [`Phương thức thanh toán`]), G(`bank`, `AI`, `Bank for installment`, [`Ngân hàng trả góp`]), G(`term`, `AJ`, `Installment month`, [`Số tháng trả góp`]), G(`before`, `AC`, `Amount before discount`, [`Số tiền trước giảm`]), G(`discount`, `AD`, `Discount amount`, [`Tiền giảm giá`]), G(`giftAmount`, `AE`, `Giftcode amount`, [`Giá trị giftcode`]), G(`totalHours`, `AG`, `Total hour of contract`, [`Tổng giờ học`]), G(`vat`, `P`, `VAT Invoice No.`, [`VAT Invoice No`, `Số hóa đơn VAT`]), G(`paymentType`, `F`, `Payment type`, [`Loại thanh toán`]), G(`contractType`, `G`, `Contract type`, [`Contract type name`, `Loại hợp đồng`]), G(`business`, `H`, `Business type`, [`Contract business type`]), G(`invoiceStatus`, `I`, `Invoice status`, [`Status E-invoice`, `Trạng thái hóa đơn`]), G(`fullStatus`, `J`, `Full status`, [`Tình trạng full phí`]), G(`installmentForm`, `K`, `Installment form`, [`Hồ sơ trả góp`]), G(`source`, `T`, `Source`, [`Nguồn học viên`]), G(`subSource`, `U`, `Sub-Source`), G(`groupKoc`, `X`, `Group KOC`), G(`koc`, `Y`, `KOC`), G(`voucherDescription`, `AP`, `Voucher description`), G(`note`, `AR`, `Note`, [`Ghi chú`]), G(`packageBefore`, `AW`, `Package before discount`), G(`packageAfter`, `AX`, `Package after discount`), G(`giftMonth`, `AY`, `Gift month`), G(`packageTotal`, `AZ`, `Package total`)], pe = new Set(K.map((e2) => e2.col)), me = new Set(K.filter((e2) => ![`O`, `AC`, `AD`, `AE`, `AF`, `AG`].includes(e2.col)).map((e2) => e2.col)), he = (e2) => typeof e2 == `string` && /^[A-Za-z0-9][A-Za-z0-9_.:/-]{0,149}$/.test(e2) && !Object.hasOwn(Object.prototype, e2);
  function ge(e2) {
    let t2 = e2.replace(/^\ufeff/, ``), n2 = [`,`, `;`, `	`], r2 = (e3) => {
      let n3 = false, r3 = 0, i3 = 0, a3 = 0;
      for (let o3 = 0; o3 < t2.length && a3 < 100; o3++) {
        let s3 = t2[o3];
        s3 === `"` ? n3 && t2[o3 + 1] === `"` ? o3++ : n3 = !n3 : !n3 && s3 === e3 ? r3++ : !n3 && s3 === `
` && (i3 = Math.max(i3, r3), r3 = 0, a3++);
      }
      return Math.max(i3, r3);
    }, i2 = n2.map((e3) => [e3, r2(e3)]).sort((e3, t3) => t3[1] - e3[1])[0][0], a2 = [], o2 = [], s2 = ``, c2 = false;
    for (let e3 = 0; e3 < t2.length; e3++) {
      let n3 = t2[e3];
      n3 === `"` ? c2 && t2[e3 + 1] === `"` ? (s2 += `"`, e3++) : c2 || s2 === `` ? c2 = !c2 : s2 += n3 : !c2 && (n3 === i2 || n3 === `
` || n3 === `\r`) ? (o2.push(s2), s2 = ``, n3 !== i2 && (a2.push(o2), o2 = [], n3 === `\r` && t2[e3 + 1] === `
` && e3++)) : s2 += n3;
    }
    if (c2) throw Error(`CSV có dấu ngoặc kép chưa đóng.`);
    return (s2 !== `` || o2.length) && (o2.push(s2), a2.push(o2)), a2;
  }
  function q(e2, t2 = `DMY`) {
    if (e2 instanceof Date) return Number.isFinite(e2.getTime()) ? (e2.getTime() - U) / 864e5 : null;
    if (typeof e2 == `number`) return e2 >= 1 && e2 <= 1e5 ? e2 : null;
    let n2 = String(e2 ?? ``).trim();
    if (!n2) return null;
    if (/^\d{5,6}(?:\.\d+)?$/.test(n2)) return +n2 <= 1e5 ? +n2 : null;
    let r2 = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?Z?)?$/.exec(n2), i2 = /^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/.exec(n2), a2, o2, s2, c2 = 0, l2 = 0, u2 = 0;
    if (r2) [, a2, o2, s2, c2 = 0, l2 = 0, u2 = 0] = r2;
    else if (i2) a2 = i2[3], o2 = i2[t2 === `MDY` ? 1 : 2], s2 = i2[t2 === `MDY` ? 2 : 1], c2 = i2[4] ?? 0, l2 = i2[5] ?? 0, u2 = i2[6] ?? 0;
    else return null;
    let d2 = new Date(Date.UTC(+a2, o2 - 1, +s2, +c2, +l2, +u2));
    return d2.getUTCFullYear() === +a2 && d2.getUTCMonth() === o2 - 1 && d2.getUTCDate() === +s2 && +c2 < 24 && +l2 < 60 && +u2 < 60 ? (d2.getTime() - U) / 864e5 : null;
  }
  function _e(e2) {
    if (typeof e2 == `number`) return Number.isFinite(e2) ? e2 : null;
    let t2 = String(e2 ?? ``).trim().replace(/[\s₫đ]/gi, ``);
    if (!t2) return null;
    let n2 = /^\(.*\)$/.test(t2);
    if (n2 && (t2 = t2.slice(1, -1)), !/^[+-]?[\d.,]+$/.test(t2)) return null;
    if (t2.includes(`,`) && t2.includes(`.`)) {
      let e3 = Math.max(t2.lastIndexOf(`,`), t2.lastIndexOf(`.`));
      t2 = t2.length - e3 - 1 == 2 ? t2.slice(0, e3).replace(/[.,]/g, ``) + `.` + t2.slice(e3 + 1) : t2.replace(/[.,]/g, ``);
    } else /^[+-]?\d{1,3}(?:[.,]\d{3})+$/.test(t2) ? t2 = t2.replace(/[.,]/g, ``) : t2.includes(`,`) && (t2 = t2.replace(`,`, `.`));
    let r2 = Number(t2);
    return Number.isFinite(r2) ? n2 ? -Math.abs(r2) : r2 : null;
  }
  function ve(e2, t2) {
    let { headerRow: n2, mapping: r2, dateOrder: i2 = `DMY`, from: a2 = ``, to: o2 = ``, center: s2 = ``, maxRows: c2 = H, sourceMode: l2 = false } = t2, u2 = [], d2 = [], f2 = [], p2 = /* @__PURE__ */ new Map(), m2 = 0, h2 = 0, g2 = 0, _2 = (e3, t3) => u2.push({ row: e3, message: t3 });
    if (!Number.isSafeInteger(n2) || n2 < 1 || n2 > e2.length) return { records: f2, errors: [{ row: 0, message: `Dòng tiêu đề không hợp lệ.` }], warnings: d2, duplicateCount: m2, skipped: h2, matched: g2 };
    let v2 = /* @__PURE__ */ new Set();
    for (let e3 of K) {
      let t3 = r2[e3.key];
      e3.required && (t3 === void 0 || t3 === -1) && _2(n2, `Chưa chọn cột ${e3.label}.`), t3 !== void 0 && t3 !== -1 && ((!Number.isSafeInteger(t3) || t3 < 0 || t3 > 255 || v2.has(t3)) && _2(n2, `Ánh xạ cột ${e3.label} không hợp lệ hoặc bị trùng.`), v2.add(t3));
    }
    if (u2.length) return { records: f2, errors: u2, warnings: d2, duplicateCount: m2, skipped: h2, matched: g2 };
    let y2 = a2 ? q(a2) : null, b2 = o2 ? q(o2) : null;
    y2 !== null && b2 !== null && y2 > b2 && _2(0, `Từ ngày phải trước hoặc bằng đến ngày.`);
    for (let t3 = n2; t3 < e2.length; t3++) {
      let n3 = e2[t3];
      if (!n3.some((e3) => e3 != null && e3 !== ``)) continue;
      let a3 = {};
      for (let e3 of K) {
        let t4 = r2[e3.key];
        if (t4 === void 0 || t4 === -1) continue;
        let i3 = n3[t4];
        i3 != null && i3 !== `` && (a3[e3.col] = i3);
      }
      if (!a3.D && !a3.E) {
        a3.R || a3.O ? _2(t3 + 1, `Dòng có học viên/ngày thu nhưng thiếu cả Payment code và Contract code.`) : h2++;
        continue;
      }
      if (s2 && String(a3.C ?? ``).trim().toUpperCase() !== s2.trim().toUpperCase()) {
        h2++;
        continue;
      }
      let o3 = q(a3.O, i2);
      if (o3 !== null && (y2 !== null && o3 < y2 || b2 !== null && o3 >= b2 + 1)) {
        h2++;
        continue;
      }
      if (g2++, o3 === null) {
        _2(t3 + 1, `Invoice date không hợp lệ; kiểm tra kiểu ngày DD/MM hoặc MM/DD.`);
        continue;
      }
      a3.O = o3;
      for (let e3 of me) a3[e3] !== void 0 && (a3[e3] = String(a3[e3]).trim());
      for (let e3 of [`AC`, `AD`, `AE`, `AF`, `AG`]) if (a3[e3] !== void 0) {
        let n4 = _e(a3[e3]);
        n4 === null ? _2(t3 + 1, `${K.find((t4) => t4.col === e3).label} không phải số hợp lệ.`) : a3[e3] = n4;
      }
      for (let e3 of [`D`, `E`, `R`]) he(a3[e3]) || _2(t3 + 1, `Thiếu hoặc sai ${K.find((t4) => t4.col === e3).label}; cần mã định danh, không phải họ tên.`);
      if (a3.AF === void 0 && _2(t3 + 1, `Thiếu số tiền đã thu.`), a3.S ||= a3.R ?? ``, !a3.X && /^(ATLS|AGLS)\b/i.test(String(a3.Z ?? ``)) && (a3.X = String(a3.Z).slice(0, 4).toUpperCase()), Object.values(a3).some((e3) => typeof e3 == `string` && e3.length > 2e3) && _2(t3 + 1, `Có ô dài quá 2.000 ký tự.`), p2.has(a3.D)) {
        if (l2) {
          f2.push({ sourceRow: t3 + 1, cells: a3 });
          continue;
        }
        let e3 = p2.get(a3.D);
        JSON.stringify(e3.cells) === JSON.stringify(a3) ? m2++ : _2(t3 + 1, `Payment code ${a3.D} khác dữ liệu ở dòng ${e3.sourceRow}; cần xử lý chứng từ trùng trước khi nhập.`);
        continue;
      }
      let c3 = { sourceRow: t3 + 1, cells: a3 };
      p2.set(a3.D, c3), f2.push(c3);
    }
    return f2.length > c2 && _2(0, `Có ${f2.length.toLocaleString(`vi-VN`)} dòng. Mỗi đợt tối đa ${c2.toLocaleString(`vi-VN`)} dòng; chọn khoảng ngày hoặc trung tâm nhỏ hơn.`), !f2.length && !u2.length && _2(0, `Không có dòng thanh toán trong phạm vi đã chọn.`), m2 && d2.push(`${m2} dòng giống hệt được nhận diện trùng và tính một lần.`), (r2.courseFee === void 0 || r2.courseFee === -1) && d2.push(`Chưa có Course fee KOC; có thể bổ sung tại dòng CT tổng sau khi nhập.`), { records: f2.slice(0, c2), errors: u2, warnings: d2, duplicateCount: m2, skipped: h2, matched: g2 };
  }
  function ye(e2) {
    if (!Array.isArray(e2) || !e2.length || e2.length > 2e3) return `Cần từ 1 đến ${H} dòng thanh toán.`;
    let t2 = /* @__PURE__ */ new Set();
    for (let n2 of e2) {
      if (!n2 || !Number.isSafeInteger(n2.sourceRow) || n2.sourceRow < 1 || !n2.cells || typeof n2.cells != `object` || Array.isArray(n2.cells)) return `Dòng dữ liệu không hợp lệ.`;
      let e3 = n2.cells;
      for (let [t3, n3] of Object.entries(e3)) if (!pe.has(t3) || ![`string`, `number`, `boolean`].includes(typeof n3) || typeof n3 == `string` && n3.length > 2e3 || typeof n3 == `number` && !Number.isFinite(n3)) return `Có ô hoặc cột không hợp lệ.`;
      for (let t3 of [`D`, `E`, `R`]) if (!he(e3[t3])) return `Payment code, Contract code và Student ID phải là mã hợp lệ (tối đa 150 ký tự).`;
      if (typeof e3.O != `number` || e3.O < 1 || e3.O > 1e5 || typeof e3.AF != `number` || Math.abs(e3.AF) > 1e13) return `Ngày hóa đơn hoặc số tiền không hợp lệ.`;
      for (let t3 of [`AC`, `AD`, `AE`, `AG`]) if (e3[t3] !== void 0 && typeof e3[t3] != `number`) return `Cột số tiền/giờ học phải là số.`;
      if (t2.has(e3.D)) return `Payment code bị trùng trong dữ liệu nhập.`;
      t2.add(e3.D);
    }
    return new TextEncoder().encode(JSON.stringify(e2)).length > 1536e3 ? `Dữ liệu quá lớn cho một đợt; chọn phạm vi nhỏ hơn.` : null;
  }
  new Set(Object.keys({ code: ``, label: ``, studentId: ``, studentName: ``, center: ``, startDate: ``, endDate: ``, type: ``, amount: null, rate: null, minimum: null, maximum: null, status: `PENDING`, approvalNote: `` }));
  let be = { export: `Export ByCourse`, payment: `PaymentList`, transfer: `Transfer` }, J = (e2, t2, n2 = [], r2 = false, i2) => ({ key: e2, label: t2, required: r2, aliases: [t2, ...n2].map(W), occurrence: i2 }), Y = { payment: K, export: [J(`ct`, `Contract No.`, [`Contract No`, `Contract code`], true), J(`student`, `Student code`, [`Student ID`], true), J(`target`, `Final pay amount contract`, [`Final payment amount contract`], true), J(`paid`, `Total Final payment amount invoice`, [`Total invoice amount`], true), J(`courseFee`, `Price name`, [`Course fee KOC`]), J(`hoursPerWeek`, `Hour/week`, [`Hours/week`, `Hours per week`]), J(`package`, `Package Before Discount`), J(`packageAfter`, `Package After Discount`), J(`totalHours`, `SUM: Total Hours`, [`SUM Total Hours`]), J(`dates`, `Invoice Date`), J(`studentName`, `Student name`), J(`centerName`, `Center name`), J(`center`, `Center code`), J(`contractType`, `Contract type`, [`Contact type`]), J(`business`, `Contract bussiness type`, [`Business Type`]), J(`source`, `Source`), J(`subSource`, `Sub source`)], transfer: [J(`type`, `Transfer Type`, [], true), J(`date`, `Transfer Date`, [], true), J(`fromStudent`, `From Student ID`, [], true), J(`from`, `From Contract/Deposit No`, [`From Contract No`], true), J(`out`, `Amount`, [`From amount`], true, 0), J(`toStudent`, `To Student ID`, [], true), J(`to`, `To Contract No`, [], true), J(`amount`, `Amount`, [`To amount`], true, 1), J(`fromHours`, `Hours`, [`From hours`], false, 0), J(`toHours`, `Hours`, [`To hours`], false, 1), J(`description`, `Description`), J(`payment`, `Payment code`, [`To Payment code`, `Receiving Payment code`])] }, X = (e2) => typeof e2 == `string` && /^[A-Za-z0-9][A-Za-z0-9_.:/-]{0,149}$/.test(e2) && !Object.hasOwn(Object.prototype, e2), xe = (e2) => /-CT-/i.test(e2 ?? ``), Se = (e2) => new TextEncoder().encode(JSON.stringify(e2)).length, Z = (e2) => String(e2 ?? ``).trim(), Q = (e2) => typeof e2 == `number` && Number.isFinite(e2) && Math.abs(e2) <= 1e13, Ce = (e2) => typeof e2 == `number` && Number.isFinite(e2) && e2 >= 1 && e2 <= 1e5;
  function we(e2, t2) {
    let n2 = { headerRow: 1, mapping: {}, score: 0 };
    for (let r2 = 0; r2 < Math.min(100, e2.length); r2++) {
      let i2 = {};
      for (let n3 of Y[t2] ?? []) {
        let t3 = [];
        e2[r2].forEach((e3, r3) => {
          n3.aliases.includes(W(e3)) && t3.push(r3);
        }), t3.length === 1 && n3.occurrence === void 0 ? i2[n3.key] = t3[0] : n3.occurrence !== void 0 && t3[n3.occurrence] !== void 0 && (i2[n3.key] = t3[n3.occurrence]);
      }
      let a2 = (Y[t2] ?? []).reduce((e3, t3) => e3 + (i2[t3.key] === void 0 ? 0 : t3.required ? 5 : 1), 0);
      a2 > n2.score && (n2 = { headerRow: r2 + 1, mapping: i2, score: a2 });
    }
    return n2;
  }
  function Te(e2, t2, n2) {
    if (t2 === `payment`) return ve(e2, { ...n2, from: ``, to: ``, center: ``, maxRows: 1e5, sourceMode: true });
    let r2 = [], i2 = [], a2 = [], o2 = Y[t2], s2 = n2.mapping ?? {};
    if (!o2) return { records: i2, errors: [{ row: 0, message: `Chọn loại nguồn hợp lệ.` }], warnings: a2 };
    if (!Number.isSafeInteger(n2.headerRow) || n2.headerRow < 1 || n2.headerRow > 100) return { records: i2, errors: [{ row: 0, message: `Dòng tiêu đề phải từ 1 đến 100.` }], warnings: a2 };
    let c2 = /* @__PURE__ */ new Set();
    for (let e3 of o2) {
      let t3 = s2[e3.key];
      e3.required && (t3 === void 0 || t3 === -1) && r2.push({ row: n2.headerRow, message: `Chưa chọn cột ${e3.label} (${e3.key}).` }), t3 !== void 0 && t3 !== -1 && ((!Number.isSafeInteger(t3) || t3 < 0 || t3 > 255 || c2.has(t3)) && r2.push({ row: n2.headerRow, message: `Ánh xạ ${e3.key} sai hoặc trùng.` }), c2.add(t3));
    }
    if (r2.length) return { records: i2, errors: r2, warnings: a2 };
    for (let a3 = n2.headerRow; a3 < e2.length; a3++) {
      let c3 = e2[a3];
      if (!c3?.some((e3) => e3 != null && e3 !== ``)) continue;
      let l2 = {};
      for (let e3 of o2) {
        let t3 = s2[e3.key];
        t3 !== void 0 && t3 !== -1 && c3[t3] !== null && c3[t3] !== void 0 && c3[t3] !== `` && (l2[e3.key] = c3[t3]);
      }
      if (t2 === `export` && !l2.ct && !l2.student || t2 === `transfer` && !l2.from && !l2.to) continue;
      for (let [e3, t3] of Object.entries(l2)) l2[e3] = [`target`, `paid`, `totalHours`, `out`, `amount`, `fromHours`, `toHours`].includes(e3) ? _e(t3) : e3 === `date` ? q(t3, n2.dateOrder ?? `DMY`) : Z(t3);
      let u2 = t2 === `export` ? Ee(l2) : De(l2);
      u2 ? r2.push({ row: a3 + 1, message: u2 }) : i2.push({ sourceRow: a3 + 1, ...l2 });
    }
    return { records: i2, errors: r2, warnings: a2 };
  }
  function Ee(e2) {
    let t2 = Y.export.map((e3) => e3.key);
    if (Object.keys(e2).some((e3) => !t2.includes(e3) && ![`sourceRow`, `sourceKey`].includes(e3))) return `Export có cột không hợp lệ.`;
    if (!X(e2.ct) || !xe(e2.ct) || !X(e2.student)) return `Export cần Contract CT và Student ID hợp lệ.`;
    if (!Q(e2.target) || e2.target < 0 || !Q(e2.paid)) return `Export cần giá trị CT và tổng đã đóng hợp lệ.`;
    if (e2.totalHours !== void 0 && (!Q(e2.totalHours) || e2.totalHours < 0)) return `Tổng giờ Export không hợp lệ.`;
    for (let [t3, n2] of Object.entries(e2)) if (![`target`, `paid`, `totalHours`, `sourceRow`].includes(t3) && (typeof n2 != `string` || n2.length > 4e3)) return `Export có ô quá dài hoặc sai kiểu.`;
    return null;
  }
  function De(e2) {
    let t2 = Y.transfer.map((e3) => e3.key);
    if (Object.keys(e2).some((e3) => !t2.includes(e3) && ![`sourceRow`, `sourceKey`].includes(e3))) return `Transfer có cột không hợp lệ.`;
    if (!X(e2.from) || !X(e2.to) || !X(e2.fromStudent) || !X(e2.toStudent) || !Z(e2.type)) return `Transfer cần hai mã hợp đồng/học viên và loại chuyển hợp lệ.`;
    if (e2.payment !== void 0 && (!X(e2.payment) || !/-PAY-/i.test(e2.payment))) return `Payment code chuyển không hợp lệ.`;
    if (!Ce(e2.date) || !Q(e2.out) || !Q(e2.amount) || e2.out < 0 || e2.amount < 0) return `Ngày/số tiền Transfer không hợp lệ.`;
    for (let t3 of [`fromHours`, `toHours`]) if (e2[t3] !== void 0 && !Q(e2[t3])) return `Giờ Transfer không hợp lệ.`;
    for (let [t3, n2] of Object.entries(e2)) if (![`out`, `amount`, `date`, `fromHours`, `toHours`, `sourceRow`].includes(t3) && (typeof n2 != `string` || n2.length > 4e3)) return `Transfer có ô quá dài hoặc sai kiểu.`;
    return null;
  }
  let Oe = (e2, t2) => ({ file: e2.fileName, sheet: e2.sheetName, row: t2 }), ke = (e2, t2) => ({ payment: e2.cells.D, contract: e2.cells.E, student: e2.cells.R, vat: Z(e2.cells.P), date: e2.cells.O, amount: /refund|hoàn tiền/i.test(Z(e2.cells.F)) ? -Math.abs(e2.cells.AF) : e2.cells.AF, cancelled: /cancel|void|hủy/i.test(Z(e2.cells.I)), paid: /^paid$/i.test(Z(e2.cells.I)), installment: Z(e2.cells.K), ref: Oe(t2, e2.sourceRow) });
  function Ae(e2, t2) {
    let n2 = [], r2 = [], i2 = new Set(e2.map((e3) => e3.role));
    for (let e3 of Object.keys(be)) i2.has(e3) || n2.push({ row: 0, message: `Thiếu ${be[e3]}.` });
    e2.length > 12 && n2.push({ row: 0, message: `Tối đa 12 sheet nguồn trong một đợt.` }), (!t2.from || !t2.to || q(t2.from) === null || q(t2.to) === null || q(t2.from) > q(t2.to)) && n2.push({ row: 0, message: `Chọn khoảng ngày tra soát hợp lệ.` });
    for (let t3 of e2) for (let e3 of t3.errors ?? []) n2.push({ ...e3, message: `${t3.fileName} / ${t3.sheetName}: ${e3.message}` });
    if (n2.length) return { bundle: null, errors: n2, warnings: r2 };
    let a2 = Math.floor(q(t2.to)), o2 = Math.floor(q(t2.from)), s2 = [], c2 = e2.filter((e3) => e3.role === `payment`).flatMap((e3) => e3.records.map((t3) => ({ ...t3, sourceKey: e3.key }))), l2 = /* @__PURE__ */ new Map(), u2 = /* @__PURE__ */ new Set(), d2 = [], f2 = 0;
    for (let n3 of c2) {
      let r3 = l2.get(n3.cells.D);
      if (r3) {
        let t3 = ke(r3, e2.find((e3) => e3.key === r3.sourceKey)), i3 = ke(n3, e2.find((e3) => e3.key === n3.sourceKey));
        (t3.contract !== i3.contract || t3.student !== i3.student || Math.abs(t3.amount - i3.amount) > 1 || Math.floor(t3.date) !== Math.floor(i3.date) || t3.cancelled !== i3.cancelled || t3.paid !== i3.paid || t3.vat.replace(/^0+(?=\d)/, ``) !== i3.vat.replace(/^0+(?=\d)/, ``) || [`Z`, `AA`, `AB`, `AO`, `AQ`].some((e3) => r3.cells[e3] && n3.cells[e3] && Z(r3.cells[e3]) !== Z(n3.cells[e3]))) && d2.push({ r: n3, prior: r3, message: `Payment ${n3.cells.D} có dữ liệu/VAT mâu thuẫn trong các nguồn; cần đối chiếu trước khi nhập.` }), f2++;
      } else l2.set(n3.cells.D, n3);
      !u2.has(n3.cells.D) && n3.cells.O >= o2 && n3.cells.O < a2 + 1 && (!t2.center || Z(n3.cells.C).toUpperCase() === Z(t2.center).toUpperCase()) && (s2.push(n3), u2.add(n3.cells.D));
    }
    let p2 = ye(s2);
    p2 && n2.push({ row: 0, message: p2 });
    let m2 = new Set(s2.map((e3) => e3.cells.R)), h2 = new Set(s2.map((e3) => e3.cells.E));
    for (let e3 of c2) e3.cells.O < a2 + 1 && m2.has(e3.cells.R) && h2.add(e3.cells.E);
    let g2 = e2.filter((e3) => e3.role === `transfer`).flatMap((e3) => e3.records.filter((e4) => e4.date < a2 + 1).map((t3) => ({ ...t3, sourceKey: e3.key }))), _2 = true;
    for (; _2; ) {
      _2 = false;
      for (let e3 of g2) (h2.has(e3.from) || h2.has(e3.to)) && (h2.has(e3.from) || (h2.add(e3.from), _2 = true), h2.has(e3.to) || (h2.add(e3.to), _2 = true));
    }
    let v2 = c2.filter((e3) => e3.cells.O < a2 + 1 && (h2.has(e3.cells.E) || m2.has(e3.cells.R)));
    for (let e3 of d2) [e3.r, e3.prior].some((e4) => e4.cells.O < a2 + 1 && (h2.has(e4.cells.E) || m2.has(e4.cells.R))) && n2.push({ row: e3.r.sourceRow, message: e3.message });
    let y2 = g2.filter((e3) => h2.has(e3.from) || h2.has(e3.to)), b2 = e2.filter((e3) => e3.role === `export`).flatMap((e3) => e3.records.filter((e4) => h2.has(e4.ct) || m2.has(e4.student)).map((t3) => ({ ...t3, sourceKey: e3.key }))), x2 = /* @__PURE__ */ new Map();
    for (let e3 of b2) {
      let t3 = x2.get(e3.ct);
      if (t3) {
        let r3 = ({ sourceKey: e4, sourceRow: t4, ...n3 }) => n3;
        JSON.stringify(r3(t3)) !== JSON.stringify(r3(e3)) && n2.push({ row: e3.sourceRow, message: `Export có CT ${e3.ct} khác dữ liệu giữa các dòng/file. Chỉ dùng một bản chốt nhất quán.` });
      } else x2.set(e3.ct, e3);
    }
    v2.length + y2.length + x2.size > 6e3 && n2.push({ row: 0, message: `Nguồn liên quan vượt 6000 dòng. Chọn ít trung tâm hoặc khoảng ngày nhỏ hơn.` }), f2 = v2.length - new Set(v2.map((e3) => e3.cells.D + `|` + Z(e3.cells.P).replace(/^0+(?=\d)/, ``))).size, f2 && r2.push(`${f2} bản Payment trùng trong nguồn liên quan được đối chiếu và chỉ tính thu một lần.`), r2.push(`Chỉ các file trong đợt này được dùng làm nguồn thu/chuyển/Export. Hãy bổ sung PaymentList các tháng trước nếu CT có cọc cũ; cảnh báo từ Export được giữ trong truy vết; đối chiếu tiền so CALC với tổng thu/phân bổ.`);
    let S2 = e2.map(({ key: e3, fileIndex: t3, fileName: n3, sheetName: r3, role: i3, records: a3, headerRow: o3 }) => ({ key: e3, fileIndex: t3, fileName: n3, sheetName: r3, role: i3, rowCount: a3.length, headerRow: o3 })), C2 = { kind: `source-bundle-v1`, scope: { from: t2.from, to: t2.to, center: Z(t2.center) }, cutoff: a2, records: s2, cash: v2, transfers: y2, exports: [...x2.values()], sources: S2 }, ee2 = je(C2);
    return ee2 && n2.push({ row: 0, message: ee2 }), { bundle: n2.length ? null : C2, errors: n2, warnings: r2, summary: { selected: s2.length, cash: v2.length, transfers: y2.length, exports: x2.size, copies: f2 } };
  }
  function je(e2) {
    if (!e2 || e2.kind !== `source-bundle-v1` || Object.keys(e2).some((e3) => ![`kind`, `scope`, `cutoff`, `records`, `cash`, `transfers`, `exports`, `sources`].includes(e3))) return `Bộ nguồn không hợp lệ.`;
    if (!Array.isArray(e2.sources) || !e2.sources.length || e2.sources.length > 12) return `Cần từ 3 đến 12 sheet nguồn.`;
    let t2 = /* @__PURE__ */ new Set(), n2 = /* @__PURE__ */ new Set();
    for (let r3 of e2.sources) {
      if (!r3 || Object.keys(r3).some((e3) => ![`key`, `fileIndex`, `fileName`, `sheetName`, `role`, `rowCount`, `headerRow`, `fileId`, `fileHash`].includes(e3)) || typeof r3.key != `string` || !X(r3.key) || t2.has(r3.key) || !Object.hasOwn(be, r3.role) || !Number.isSafeInteger(r3.fileIndex) || r3.fileIndex < 0 || r3.fileIndex >= 8 || typeof r3.fileName != `string` || r3.fileName.length > 180 || typeof r3.sheetName != `string` || !r3.sheetName || r3.sheetName.length > 150 || !Number.isSafeInteger(r3.rowCount) || r3.rowCount < 0 || r3.rowCount > 1e5 || !Number.isSafeInteger(r3.headerRow) || r3.headerRow < 1 || r3.headerRow > 100) return `Thông tin file/sheet nguồn không hợp lệ.`;
      t2.add(r3.key), n2.add(r3.role);
    }
    if (Object.keys(be).some((e3) => !n2.has(e3))) return `Cần đủ Export, PaymentList và Transfer.`;
    if (!e2.scope || Object.keys(e2.scope).some((e3) => ![`from`, `to`, `center`].includes(e3)) || typeof e2.scope.from != `string` || typeof e2.scope.to != `string` || typeof e2.scope.center != `string` || e2.scope.center.length > 150 || q(e2.scope.from) === null || q(e2.scope.to) === null || q(e2.scope.from) > q(e2.scope.to) || Math.floor(q(e2.scope.to)) !== e2.cutoff) return `Phạm vi ngày/chốt dữ liệu không hợp lệ.`;
    let r2 = ye(e2.records);
    if (r2) return r2;
    if (!Array.isArray(e2.cash) || !Array.isArray(e2.transfers) || !Array.isArray(e2.exports) || e2.cash.length + e2.transfers.length + e2.exports.length > 6e3) return `Phạm vi nguồn quá lớn.`;
    let i2 = (t3, n3) => Number.isSafeInteger(t3.sourceRow) && t3.sourceRow > 0 && e2.sources.some((e3) => e3.key === t3.sourceKey && e3.role === n3);
    for (let t3 of [...e2.records, ...e2.cash]) if (!i2(t3, `payment`) || Object.keys(t3).some((e3) => ![`sourceRow`, `sourceKey`, `cells`].includes(e3)) || ye([t3])) return `Dòng PaymentList không hợp lệ.`;
    let a2 = /* @__PURE__ */ new Map();
    for (let t3 of e2.cash) {
      let e3 = t3.cells, n3 = a2.get(e3.D);
      if (n3 && (n3.E !== e3.E || n3.R !== e3.R || Math.abs(n3.AF - e3.AF) > 1 || Math.floor(n3.O) !== Math.floor(e3.O) || /^paid$/i.test(Z(n3.I)) !== /^paid$/i.test(Z(e3.I)) || Z(n3.P).replace(/^0+(?=\d)/, ``) !== Z(e3.P).replace(/^0+(?=\d)/, ``) || /refund|hoàn tiền/i.test(Z(n3.F)) !== /refund|hoàn tiền/i.test(Z(e3.F)) || /cancel|void|hủy/i.test(Z(n3.I)) !== /cancel|void|hủy/i.test(Z(e3.I)))) return `Payment ${e3.D} mâu thuẫn trong nguồn liên quan.`;
      a2.set(e3.D, e3);
    }
    for (let t3 of e2.transfers) if (!i2(t3, `transfer`) || De(t3)) return `Dòng Transfer không hợp lệ.`;
    let o2 = /* @__PURE__ */ new Set();
    for (let t3 of e2.exports) {
      if (!i2(t3, `export`) || Ee(t3) || o2.has(t3.ct)) return `Dòng Export không hợp lệ hoặc trùng CT.`;
      o2.add(t3.ct);
    }
    for (let t3 of e2.records) if (!e2.cash.some((e3) => e3.sourceKey === t3.sourceKey && e3.sourceRow === t3.sourceRow && JSON.stringify(e3.cells) === JSON.stringify(t3.cells)) || t3.cells.O < q(e2.scope.from) || t3.cells.O >= e2.cutoff + 1 || e2.scope.center && Z(t3.cells.C).toUpperCase() !== e2.scope.center.toUpperCase()) return `Dòng tra soát không thuộc nguồn/phạm vi đã chọn.`;
    return Se(e2) > 1843200 ? `Bộ nguồn quá lớn cho một đợt; chọn phạm vi nhỏ hơn.` : null;
  }
  let Me = (e2) => /audit[\s_.-]*promotion|promotion[\s_.-]*audit|check[\s_.-]*installment/i.test(String(e2 ?? ``)), Ne = (e2) => /^(?:RAW_REPORT|CHECK_INSTALLMENT|PAYMENT_SOURCE|HISTORY_SOURCE|EXPORT_SOURCE|TRANSFER_SOURCE)$/i.test(String(e2 ?? ``));
  function Pe(e2, t2) {
    return Me(e2) || Ne(t2);
  }

export {V as parseXlsx,ge as parseCsv,we as autoMap,Te as normalizeSheet,Ae as buildBundle,je as validateBundle,q as parseDate,Y as sourceFields};
