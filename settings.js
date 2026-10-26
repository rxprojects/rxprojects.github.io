/* Rx Projects — live settings from the control panel */
(function () {
  "use strict";
  var CFG = window.RX_CONFIG || {}, KEY = "rx-settings-v1";
  var DEF_CFG = JSON.parse(JSON.stringify(CFG));
  var DEF_CAT = JSON.parse(JSON.stringify(window.RX_CATALOG || {}));
  var CFG_KEYS = ["INSTAPAY_HANDLE", "VODAFONE_CASH", "PAYEE_NAME", "TELEGRAM_USERNAME", "EMAIL", "DEPOSIT_RATE", "FULL_PAYMENT_BELOW", "EXPRESS_SURCHARGE", "MAX_UPLOAD_MB"];
  var AR = /[؀-ۿ]/, ABBR = { "د": 1, "أ": 1, "Dr": 1, "Mr": 1, "Mrs": 1, "Ms": 1, "Prof": 1 };
  var defaults = {};

  /* sentences without a closing period */
  function noDot(s) {
    s = String(s == null ? "" : s);
    if (!AR.test(s)) return s;
    var out = "", i, n = s.length;
    for (i = 0; i < n; i++) {
      var c = s[i];
      if (c !== ".") { out += c; continue; }
      var p = s[i - 1] || "", x = s[i + 1] || "";
      var tok = (s.slice(0, i).match(/([^\s(«"]+)$/) || [])[1] || "";
      if (p === "." || x === "." || (/\d/.test(p) && /\d/.test(x)) || (x && !/\s/.test(x)) || ABBR[tok]) { out += c; continue; }
      if (!s.slice(i + 1).trim()) continue;
      if (/^[ \t]*\n/.test(s.slice(i + 1))) continue;
      out += "،";
    }
    return out;
  }
  window.RX_NODOT = noDot;

  function read() { try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { return null; } }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }

  function cleanCat(cat) {
    if (!cat || !cat.undergrad || !cat.postgrad) return null;
    var c = JSON.parse(JSON.stringify(cat));
    ["undergrad", "postgrad"].forEach(function (k) {
      c[k].items = (c[k].items || []).filter(function (i) { return i && i.id && !i.hidden; }).map(function (i) {
        ["name", "summary", "unit", "days"].forEach(function (f) { if (i[f]) i[f] = noDot(i[f]); });
        i.includes = (i.includes || []).map(noDot);
        if (i.price !== null && i.price !== "" && i.price != null) i.price = Number(i.price);
        if (i.was) i.was = Number(i.was) || null;
        return i;
      });
    });
    if (!c.custom) c.custom = DEF_CAT.custom;
    return c;
  }

  function apply(s) {
    if (!s || typeof s !== "object") return;
    var cfg = s.config || {};
    CFG_KEYS.forEach(function (k) { CFG[k] = (k in cfg && cfg[k] !== "" && cfg[k] != null) ? cfg[k] : DEF_CFG[k]; });
    window.RX_CONFIG = CFG;
    window.RX_CATALOG = cleanCat(s.catalog) || JSON.parse(JSON.stringify(DEF_CAT));

    var texts = s.texts || {};
    Array.prototype.forEach.call(document.querySelectorAll("[data-t]"), function (el) {
      var k = el.getAttribute("data-t");
      if (!(k in defaults)) defaults[k] = el.textContent;
      var v = texts[k] != null && String(texts[k]).trim() !== "" ? noDot(texts[k]) : defaults[k];
      if (el.hasAttribute("data-split")) {
        if (el.getAttribute("data-src") !== v) { el.setAttribute("data-src", v); el.textContent = v; if (window.RX_SPLIT) window.RX_SPLIT(el); }
      } else if (el.textContent !== v) el.textContent = v;
    });

    var an = s.announce || {}, bar = document.getElementById("announce");
    if (bar) {
      var dismissed = false; try { dismissed = sessionStorage.getItem("rx-ann-x") === (an.text || ""); } catch (e) {}
      var on = !!(an.on && an.text) && !dismissed;
      bar.hidden = !on;
      document.documentElement.classList.toggle("has-announce", on);
      if (on) {
        document.getElementById("announceText").textContent = noDot(an.text);
        var cta = document.getElementById("announceCta");
        cta.hidden = !an.cta; cta.textContent = an.cta || ""; cta.href = an.link || "#order";
        var setH = function () { document.documentElement.style.setProperty("--ann-h", bar.offsetHeight + "px"); };
        setH(); window.addEventListener("resize", setH);
      }
    }
  }

  var x = document.getElementById("announceX");
  if (x) x.addEventListener("click", function () {
    var s = read() || {}; try { sessionStorage.setItem("rx-ann-x", (s.announce && s.announce.text) || ""); } catch (e) {}
    document.getElementById("announce").hidden = true; document.documentElement.classList.remove("has-announce");
  });

  var cached = read();
  apply(cached || {});

  if (!CFG.APPS_SCRIPT_URL || !window.fetch) return;
  fetch(CFG.APPS_SCRIPT_URL + "?action=settings&t=" + Math.floor(Date.now() / 60000), { redirect: "follow" })
    .then(function (r) { return r.json(); })
    .then(function (r) {
      if (!r || !r.ok || !r.settings) return;
      var fresh = r.settings;
      if (cached && JSON.stringify(cached) === JSON.stringify(fresh)) return;
      save(fresh);
      apply(fresh);
      window.dispatchEvent(new CustomEvent("rx:settings"));
    })
    .catch(function () {});
})();
