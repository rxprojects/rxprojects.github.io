/* Rx Projects — site logic */
(function () {
  "use strict";

  var CFG = window.RX_CONFIG || {};
  var CAT = window.RX_CATALOG || {};
  var DEMO = !CFG.APPS_SCRIPT_URL;
  var STATUSES = ["جديد", "بانتظار العربون", "قيد التنفيذ", "مسودة للمراجعة", "تعديلات", "بانتظار باقي المبلغ", "مكتمل"];

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var fmt = function (n) { return Number(n).toLocaleString("en-US"); };
  var tgNorm = function (s) { return String(s || "").trim().replace(/^https?:\/\/(www\.)?t\.me\//i, "").replace(/^@/, "").toLowerCase(); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };

  /* ---------- basics ---------- */
  $("#year").textContent = new Date().getFullYear();
  if (DEMO) $("#demoBar").hidden = false;
  function fillCfg() {
    $$("[data-cfg]").forEach(function (el) { el.textContent = CFG[el.getAttribute("data-cfg")] || "—"; });
    $$("[data-max]").forEach(function (el) { el.textContent = CFG.MAX_UPLOAD_MB || 25; });
    $$("[data-pct]").forEach(function (el) { el.textContent = "+" + Math.round((Number(CFG[el.getAttribute("data-pct")]) || 0) * 100) + "%"; });
  }
  fillCfg();

  $$(".copy").forEach(function (b) {
    b.addEventListener("click", function () {
      var v = CFG[b.getAttribute("data-copy")] || "";
      var done = function () { var t = b.textContent; b.textContent = "اتنسخ"; setTimeout(function () { b.textContent = t; }, 1400); };
      if (navigator.clipboard) navigator.clipboard.writeText(v).then(done, done); else done();
    });
  });

  function contact() {
    var box = $("#contactLinks"), html = "", u = CFG.TELEGRAM_USERNAME || "RxProjects", link = "https://t.me/" + encodeURIComponent(u);
    html += '<a href="' + link + '" rel="noopener" target="_blank">@' + esc(u) + "</a>";
    if (CFG.EMAIL) html += '<a href="mailto:' + esc(CFG.EMAIL) + '">البريد</a>';
    box.innerHTML = html;
    $$("#tgFloat, #ctaTelegram").forEach(function (a) { a.href = link; });
  }
  contact();

  /* ---------- pricing helpers ---------- */
  function allItems() { return [].concat(CAT.undergrad.items, CAT.postgrad.items, [CAT.custom]); }
  function findItem(id) { return allItems().filter(function (i) { return i.id === id; })[0]; }
  function priceKind(item) {
    if (!item || item.price == null) return "review";
    if (item.sizing) return "sized";
    if (item.unit && item.unit.indexOf("لكل") === 0) return "perUnit";
    if (item.unit && item.unit.indexOf("يبدأ") === 0) return "from";
    return "fixed";
  }
  function basePrice(item, size) {
    var s = item.sizing; if (!s) return item.price;
    var n = size || s.def;
    if (s.kind === "pages") return item.price + Math.max(0, n - s.included) * s.extra;
    return item.price * Math.ceil(n / s.per);
  }
  function quote(item, express, size) {
    var k = priceKind(item);
    if (k === "review" || k === "perUnit") return { kind: k, total: null };
    var mult = express ? 1 + (CFG.EXPRESS_SURCHARGE || 0.4) : 1;
    var total = Math.round(basePrice(item, size) * mult);
    var was = item.was ? Math.round(item.was * mult) : null;
    var full = total < (CFG.FULL_PAYMENT_BELOW || 1000);
    var deposit = full ? total : Math.round(total * (CFG.DEPOSIT_RATE || 0.5));
    return { kind: k, total: total, deposit: deposit, full: full, was: was };
  }

  /* ---------- size stepper (pages / words) ---------- */
  function stepper(host, item, val, onChange) {
    var s = item && item.sizing;
    if (!s) { host.innerHTML = ""; host.hidden = true; return null; }
    var n = val || s.def;
    host.hidden = false;
    host.innerHTML = '<span class="stp-label">' + (s.kind === "pages" ? "عدد الصفحات" : "عدد الكلمات") + '</span>' +
      '<div class="stp"><button type="button" class="stp-btn" data-d="-1" aria-label="أقل">−</button>' +
      '<input class="stp-val" inputmode="numeric" aria-label="' + s.label + '" value="' + n + '">' +
      '<button type="button" class="stp-btn" data-d="1" aria-label="أكتر">+</button></div>' +
      '<span class="stp-hint">' + (s.kind === "pages" ? "أول " + fmt(s.included) + " صفحة في السعر، وبعدها " + s.extra + " ج.م للصفحة" : fmt(item.price) + " ج.م لكل " + fmt(s.per) + " كلمة") + '</span>';
    var input = host.querySelector(".stp-val");
    function set(v) {
      v = Math.round(Number(String(v).replace(/[^\d]/g, "")) || s.def);
      v = Math.min(s.max, Math.max(s.min, v)); n = v; input.value = v; onChange(v);
    }
    host.querySelectorAll(".stp-btn").forEach(function (b) {
      b.addEventListener("click", function () { set(n + Number(b.getAttribute("data-d")) * s.step); });
    });
    input.addEventListener("change", function () { set(input.value); });
    onChange(n);
    return { get: function () { return n; } };
  }

  /* ---------- packages section ---------- */
  function pkgCard(item, level) {
    var unit = item.unit ? '<span>' + esc(item.unit) + '</span>' : '';
    var lis = (item.includes || []).map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("");
    return '<article class="pkg' + (item.featured ? " featured" : "") + '">' +
      (item.featured ? '<span class="pkg-flag">الأكثر طلبًا</span>' : "") +
      "<h3>" + esc(item.name) + "</h3>" +
      '<p class="pkg-sum">' + esc(item.summary) + "</p>" +
      '<div class="pkg-price">' + (item.was ? '<s>' + fmt(item.was) + '</s>' : '') + '<b>' + fmt(item.price) + '</b><span>ج.م</span>' + unit +
      (item.was ? '<em class="save">وفّر ' + Math.round((1 - item.price / item.was) * 100) + '%</em>' : '') + "</div>" +
      "<ul>" + lis + "</ul>" +
      '<div class="pkg-foot"><span class="pkg-days">التسليم: ' + esc(item.days) + '</span>' +
      '<a href="#order" class="btn' + (item.featured ? " btn-gold" : "") + '" data-pick="' + esc(item.id) + '" data-level="' + level + '">اطلب</a></div>' +
      "</article>";
  }
  function renderPkgs() {
    ["undergrad", "postgrad"].forEach(function (lv) {
      $("#panel-" + lv).innerHTML = '<div class="pkg-grid">' + CAT[lv].items.map(function (i) { return pkgCard(i, lv); }).join("") + "</div>";
    });
  }
  renderPkgs();

  var tabs = $$('.tabs [role="tab"]');
  function selectTab(btn) {
    tabs.forEach(function (t) {
      var on = t === btn;
      t.setAttribute("aria-selected", on); t.tabIndex = on ? 0 : -1;
      $("#" + t.getAttribute("aria-controls")).hidden = !on;
    });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () { selectTab(t); });
    t.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      var n = tabs[(i + 1) % tabs.length]; selectTab(n); n.focus();
    });
  });

  /* ---------- order form ---------- */
  var form = $("#orderForm");
  var step = 1, files = [];
  function maxBytes() { return (CFG.MAX_UPLOAD_MB || 25) * 1024 * 1024; }

  function level() { return $('input[name="level"]:checked', form).value; }
  function selectedService() { var r = $('input[name="service"]:checked', form); return r ? findItem(r.value) : null; }

  function priceLabel(item) {
    var k = priceKind(item);
    if (k === "review") return "حسب المراجعة";
    var s = fmt(item.price) + " ج.م";
    if (k === "from") return "من " + s;
    return s + (item.unit ? "<small>" + esc(item.unit) + "</small>" : "");
  }
  function renderChoices(keep) {
    var items = CAT[level()].items.concat([CAT.custom]);
    $("#serviceChoices").innerHTML = items.map(function (i) {
      return '<label class="choice"><input type="radio" name="service" value="' + esc(i.id) + '"' + (keep === i.id ? " checked" : "") + '>' +
        '<span><span class="c-name">' + esc(i.name) + '</span><span class="c-sum">' + esc(i.summary) + "</span></span>" +
        '<span class="c-price">' + priceLabel(i) + "</span></label>";
    }).join("");
  }
  var formSize = null, presetSize = null;
  function syncSize() {
    var item = selectedService();
    var st = stepper($("#formSize"), item, presetSize, function (v) { formSize = v; });
    if (!st) formSize = null;
    presetSize = null;
  }
  $("#serviceChoices").addEventListener("change", syncSize);
  var _render = renderChoices;
  renderChoices = function (keep) { _render(keep); syncSize(); };
  renderChoices();
  $$('input[name="level"]', form).forEach(function (r) { r.addEventListener("change", function () { renderChoices(); }); });

  // "اطلب" buttons on packages preselect the service
  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-pick]");
    if (!a) return;
    var id = a.getAttribute("data-pick");
    var lv = a.getAttribute("data-level");
    if (lv) $('input[name="level"][value="' + lv + '"]', form).checked = true;
    renderChoices(id);
    showDone(false); goTo(1);
  });

  function setError(msg, el) {
    var box = $("#formError");
    if (!msg) { box.hidden = true; return; }
    box.textContent = msg; box.hidden = false;
    if (el) { el.setAttribute("aria-invalid", "true"); el.focus(); }
  }
  form.addEventListener("input", function (e) { if (e.target.hasAttribute("aria-invalid")) e.target.removeAttribute("aria-invalid"); });

  function validate(n) {
    setError("");
    if (n === 1 && !selectedService()) { setError("اختار الخدمة اللي محتاجها"); return false; }
    if (n === 2) {
      var name = $("#f-name"), tg = $("#f-tg"), uni = $("#f-uni"), dl = $("#f-deadline");
      if (!name.value.trim()) { setError("اكتب اسمك", name); return false; }
      if (!/^[a-z][a-z0-9_]{4,31}$/.test(tgNorm(tg.value))) { setError("يوزر التيليجرام مش مظبوط، اكتبه زي @username (5 حروف على الأقل)", tg); return false; }
      if (!uni.value.trim()) { setError("اكتب الجامعة والكلية", uni); return false; }
      if (!dl.value) { setError("حدد آخر موعد للتسليم", dl); return false; }
      var em = $("#f-email");
      if (em.value && !em.checkValidity()) { setError("البريد الإلكتروني مش مظبوط", em); return false; }
    }
    if (n === 3) {
      var link = $("#f-link");
      if (!files.length && !link.value.trim()) { setError("ارفع ملف واحد على الأقل، أو حط لينك للملفات"); return false; }
      if (link.value && !link.checkValidity()) { setError("اللينك مش مظبوط، لازم يبدأ بـ https://", link); return false; }
      if (totalSize() > maxBytes()) { setError("حجم الملفات أكبر من " + CFG.MAX_UPLOAD_MB + " ميجا، شيل الكبير منها وابعته كلينك"); return false; }
    }
    if (n === 4 && !$("#agree").checked) { setError("لازم توافق على سياسات العمل الأول", $("#agree")); return false; }
    return true;
  }

  function goTo(n) {
    step = n;
    $$(".step", form).forEach(function (s) { s.hidden = Number(s.getAttribute("data-step")) !== n; });
    $$(".progress li", form).forEach(function (li) {
      var k = Number(li.getAttribute("data-for"));
      li.classList.toggle("is-current", k === n); li.classList.toggle("is-done", k < n);
      if (k === n) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
    });
    $("#prevBtn").hidden = n === 1;
    $("#nextBtn").hidden = n === 4;
    $("#submitBtn").hidden = n !== 4;
    if (n === 4) buildSummary();
    setError("");
  }
  $("#nextBtn").addEventListener("click", function () {
    if (!validate(step)) return;
    goTo(step + 1);
    var lg = $('.step[data-step="' + step + '"] legend', form);
    form.scrollIntoView({ block: "start" });
    if (lg) { lg.tabIndex = -1; lg.focus({ preventScroll: true }); }
  });
  $("#prevBtn").addEventListener("click", function () { goTo(step - 1); });

  // min date = today
  (function () { var d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); $("#f-deadline").min = d.toISOString().slice(0, 10); })();

  /* files */
  function totalSize() { return files.reduce(function (s, f) { return s + f.size; }, 0); }
  function mb(b) { return (b / 1048576).toFixed(b < 1048576 ? 2 : 1) + " MB"; }
  function renderFiles() {
    var list = $("#fileList");
    if (!files.length) { list.innerHTML = ""; return; }
    var over = totalSize() > maxBytes();
    list.innerHTML = files.map(function (f, i) {
      return '<li><span class="fn">' + esc(f.name) + '</span><span class="fs">' + mb(f.size) + '</span><button type="button" data-rm="' + i + '" aria-label="شيل ' + esc(f.name) + '">شيل</button></li>';
    }).join("") + '<li class="total' + (over ? " over" : "") + '"><span>الإجمالي</span><span>' + mb(totalSize()) + " من " + CFG.MAX_UPLOAD_MB + " MB</span></li>";
  }
  function addFiles(list) {
    Array.prototype.forEach.call(list, function (f) {
      if (!files.some(function (x) { return x.name === f.name && x.size === f.size; })) files.push(f);
    });
    renderFiles();
  }
  $("#f-files").addEventListener("change", function (e) { addFiles(e.target.files); e.target.value = ""; });
  $("#fileList").addEventListener("click", function (e) {
    var b = e.target.closest("[data-rm]"); if (!b) return;
    files.splice(Number(b.getAttribute("data-rm")), 1); renderFiles();
  });
  var dz = $("#dropzone");
  ["dragenter", "dragover"].forEach(function (ev) { dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.add("is-over"); }); });
  ["dragleave", "drop"].forEach(function (ev) { dz.addEventListener(ev, function () { dz.classList.remove("is-over"); }); });
  dz.addEventListener("drop", function (e) { e.preventDefault(); if (e.dataTransfer) addFiles(e.dataTransfer.files); });

  /* promo code */
  var promo = null;
  function applyPromo(q) {
    if (!promo || q.total == null) return q;
    var t = Math.round(q.total * (1 - promo.pct / 100));
    var full = t < (CFG.FULL_PAYMENT_BELOW || 1000);
    return { kind: q.kind, total: t, before: q.total, deposit: full ? t : Math.round(t * (CFG.DEPOSIT_RATE || 0.5)), full: full };
  }
  $("#promoBtn").addEventListener("click", function () {
    var inp = $("#f-promo"), msg = $("#promoMsg"), code = inp.value.trim();
    if (!code) { promo = null; msg.textContent = ""; buildSummary(); return; }
    msg.className = "promo-msg"; msg.textContent = "بنتأكد من الكود…";
    api({ action: "promo", code: code }).then(function (r) {
      if (!r.ok) { promo = null; msg.className = "promo-msg bad"; msg.textContent = r.error || "الكود ده مش شغال"; }
      else { promo = { code: r.code, pct: r.pct }; msg.className = "promo-msg good"; msg.textContent = "تم تطبيق خصم " + r.pct + "%"; }
      buildSummary();
    }).catch(function () { msg.className = "promo-msg bad"; msg.textContent = "مقدرناش نتأكد من الكود دلوقتي"; });
  });
  $("#f-promo").addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); $("#promoBtn").click(); } });

  /* summary */
  function buildSummary() {
    var item = selectedService(), express = $("#express").checked, q = applyPromo(quote(item, express, formSize));
    var rows = [
      ["الخدمة", esc(item.name) + (express ? " — مستعجل" : "")],
      ["الاسم", esc($("#f-name").value)],
      ["تيليجرام", '<span dir="ltr">@' + esc(tgNorm($("#f-tg").value)) + "</span>"],
      ["الجامعة", esc($("#f-uni").value)],
      ["التسليم المطلوب", esc($("#f-deadline").value)],
      ["الملفات", files.length + " ملف" + ($("#f-link").value ? " + لينك" : "")]
    ];
    var totalText;
    if (q.total == null) totalText = "بعد مراجعة الملفات";
    else totalText = (q.before ? '<s class="was">' + fmt(q.before) + "</s> " : "") + (q.kind === "from" ? "يبدأ من " : "") + fmt(q.total) + " ج.م";
    if (promo) rows.push(["كود الخصم", '<span dir="ltr">' + esc(promo.code) + "</span> · " + promo.pct + "%"]);
    rows.push(["السعر المبدئي", '<span class="sum-total">' + totalText + "</span>"]);
    $("#summary").innerHTML = rows.map(function (r) { return "<dt>" + r[0] + "</dt><dd>" + r[1] + "</dd>"; }).join("");

    var hasPay = !!(CFG.INSTAPAY_HANDLE || CFG.VODAFONE_CASH);
    $("#payMethods").hidden = !hasPay;
    $$(".pay-method", form).forEach(function (m) { var k = m.querySelector("[data-cfg]").getAttribute("data-cfg"); m.hidden = !CFG[k]; });
    $("#payHint").textContent = hasPay
      ? "تقدر تدفع دلوقتي وترفع الإيصال، أو تبعت الطلب الأول ونأكدلك السعر قبل الدفع"
      : "بيانات التحويل (InstaPay أو فودافون كاش) هتوصلك على تيليجرام مع تأكيد السعر، وبعدها ترفع الإيصال من صفحة \"تابع طلبك\"";
    var pt = $("#payText");
    if (q.total == null) pt.textContent = "هنبعتلك السعر النهائي بعد مراجعة الملفات، وبعدها تحوّل العربون";
    else if (q.full) pt.innerHTML = "الطلب أقل من " + fmt(CFG.FULL_PAYMENT_BELOW) + " ج.م، فبيتدفع كامل مقدمًا: <b>" + fmt(q.deposit) + " ج.م</b>";
    else pt.innerHTML = "العربون " + Math.round((CFG.DEPOSIT_RATE || 0.5) * 100) + "%: <b>" + fmt(q.deposit) + " ج.م</b>" + (q.kind === "from" ? " (مبدئيًا)" : "");
  }

  /* submit */
  function toB64(file) {
    return new Promise(function (res, rej) {
      var r = new FileReader();
      r.onload = function () { res({ name: file.name, type: file.type || "application/octet-stream", data: String(r.result).split(",")[1] }); };
      r.onerror = function () { rej(new Error("مقدرناش نقرا الملف " + file.name)); };
      r.readAsDataURL(file);
    });
  }
  function api(payload) {
    if (DEMO) return new Promise(function (res) { setTimeout(function () { res(demoReply(payload)); }, 900); });
    return fetch(CFG.APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" }, // avoids CORS preflight with Apps Script
      body: JSON.stringify(payload),
      redirect: "follow"
    }).then(function (r) { return r.json(); });
  }
  function demoReply(p) {
    var d = new Date(), yymm = String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, "0");
    if (p.action === "order") return { ok: true, orderId: "RX-" + yymm + "-" + String(Math.floor(Math.random() * 900) + 100) };
    if (p.action === "track") return { ok: true, orderId: p.orderId.toUpperCase(), service: "Present", status: "قيد التنفيذ", updated: d.toISOString().slice(0, 10), due: "", note: "ده رد تجريبي، الحالة الحقيقية هتظهر بعد ربط الموقع بـ Apps Script" };
    if (p.action === "receipt") return { ok: true };
    if (p.action === "promo") return /^test10$/i.test(p.code) ? { ok: true, code: "TEST10", pct: 10 } : { ok: false, error: "الكود ده مش شغال" };
    return { ok: false, error: "طلب غير معروف" };
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!validate(4)) return;
    var btn = $("#submitBtn"), item = selectedService(), express = $("#express").checked, q = applyPromo(quote(item, express, formSize));
    btn.disabled = true; btn.textContent = "بنرفع ملفاتك…";
    var receiptFile = $("#f-receipt").files[0];
    Promise.all(files.map(toB64).concat(receiptFile ? [toB64(receiptFile)] : [])).then(function (encoded) {
      var receipt = receiptFile ? encoded.pop() : null;
      return api({
        action: "order",
        level: level() === "undergrad" ? "بكالوريوس" : "دراسات عليا",
        service: item.name, serviceId: item.id, express: express,
        quotedTotal: q.total, quotedDeposit: q.deposit || null,
        name: $("#f-name").value.trim(), telegram: tgNorm($("#f-tg").value),
        email: $("#f-email").value.trim(),
        university: $("#f-uni").value.trim(), deadline: $("#f-deadline").value,
        size: (formSize && item.sizing ? fmt(formSize) + " " + item.sizing.label + (" — " + $("#f-pages").value.trim()).replace(/ — $/, "") : $("#f-pages").value.trim()), refStyle: $("#f-style").value,
        notes: $("#f-notes").value.trim(), filesLink: $("#f-link").value.trim(),
        promoCode: promo ? promo.code : "",
        files: encoded, receipt: receipt
      });
    }).then(function (res) {
      if (!res || !res.ok) throw new Error((res && res.error) || "حصلت مشكلة في الإرسال");
      $("#orderId").textContent = res.orderId;
      $("#t-id").value = res.orderId; $("#t-tg").value = "@" + tgNorm($("#f-tg").value);
      showDone(true);
    }).catch(function (err) {
      setError(err.message + " جرّب تاني، أو ابعتلنا على تيليجرام");
    }).then(function () { btn.disabled = false; btn.textContent = "ابعت الطلب"; });
  });

  function showDone(on) {
    form.hidden = on; $("#orderDone").hidden = !on;
    if (on) { $("#orderDone").focus(); }
  }
  $("#newOrder").addEventListener("click", function () {
    form.reset(); files = []; promo = null; $("#promoMsg").textContent = ""; renderFiles(); renderChoices(); goTo(1); showDone(false);
  });

  /* ---------- quick quote (hero) ---------- */
  (function quickQuote() {
    var sel = $("#qqService"); if (!sel) return;
    var exp = $("#qqExpress"), priceEl = $("#qqPrice"), depEl = $("#qqDeposit"), qqSize = null;
    function lv() { return $('input[name="qqLevel"]:checked').value; }
    function fill() {
      sel.innerHTML = CAT[lv()].items.map(function (i) {
        return '<option value="' + esc(i.id) + '"' + (i.featured ? " selected" : "") + ">" + esc(i.name) + " — " + esc(i.summary) + "</option>";
      }).join("");
      onService();
    }
    function onService() {
      var st = stepper($("#qqSize"), findItem(sel.value), null, function (v) { qqSize = v; update(); });
      if (!st) { qqSize = null; update(); }
    }
    function update() {
      var item = findItem(sel.value), q = quote(item, exp.checked, qqSize), k = priceKind(item);
      if (q.total == null) {
        priceEl.innerHTML = fmt(item.price) + " <small>ج.م " + esc(item.unit || "") + "</small>";
        depEl.textContent = "بعد المراجعة";
      } else {
        priceEl.innerHTML = (q.was ? '<s>' + fmt(q.was) + '</s> ' : "") + (k === "from" ? '<small>من </small>' : "") + fmt(q.total) + " <small>ج.م</small>" +
          (q.was ? ' <em class="save">وفّر ' + Math.round((1 - q.total / q.was) * 100) + '%</em>' : "");
        depEl.textContent = (q.full ? "دفعة واحدة " : "عربون ") + fmt(q.deposit) + " ج.م";
      }
      priceEl.classList.remove("bump"); void priceEl.offsetWidth; priceEl.classList.add("bump");
    }
    $$('input[name="qqLevel"]').forEach(function (r) { r.addEventListener("change", fill); });
    sel.addEventListener("change", onService); exp.addEventListener("change", update);
    $("#qqGo").addEventListener("click", function () {
      $('input[name="level"][value="' + lv() + '"]', form).checked = true;
      presetSize = qqSize;
      renderChoices(sel.value);
      $("#express").checked = exp.checked;
      showDone(false); goTo(1);
      $("#order").scrollIntoView({ behavior: "smooth" });
    });
    fill();
    window.__rxQQ = fill;
  })();

  /* ---------- live settings from the control panel ---------- */
  window.addEventListener("rx:settings", function () {
    CFG = window.RX_CONFIG || CFG; CAT = window.RX_CATALOG || CAT;
    fillCfg(); contact(); renderPkgs();
    var cur = $('input[name="service"]:checked', form);
    renderChoices(cur ? cur.value : undefined);
    if (window.__rxQQ) window.__rxQQ();
    if (step === 4) buildSummary();
  });

  /* ---------- tracking ---------- */
  $("#trackForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var id = $("#t-id").value.trim(), tg = tgNorm($("#t-tg").value), out = $("#trackResult");
    out.hidden = false;
    if (!id || !tg) { out.innerHTML = '<p class="err">اكتب رقم الطلب ويوزر التيليجرام.</p>'; return; }
    out.innerHTML = "<p class=\"meta\">بندوّر على طلبك…</p>";
    api({ action: "track", orderId: id, telegram: tg }).then(function (r) {
      if (!r.ok) { out.innerHTML = '<p class="err">' + esc(r.error || "مش لاقيين طلب بالبيانات دي، اتأكد من رقم الطلب واليوزر") + "</p>"; return; }
      var idx = STATUSES.indexOf(r.status);
      var pct = idx < 0 ? 0 : Math.round((idx / (STATUSES.length - 1)) * 100);
      var cell = function (k, v) { return v ? "<div><dt>" + k + "</dt><dd>" + esc(v) + "</dd></div>" : ""; };
      out.innerHTML = '<div class="trk-head"><div><span class="trk-k">رقم الطلب</span><h3 dir="ltr">' + esc(r.orderId) + '</h3></div>' +
        '<span class="trk-chip' + (idx === STATUSES.length - 1 ? " ok" : "") + '">' + esc(r.status || "—") + "</span></div>" +
        '<div class="trk-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '"><i style="--w:' + pct + '%"></i></div>' +
        '<dl class="trk-grid">' + cell("الخدمة", r.service) + cell("آخر تحديث", r.updated) + cell("موعد التسليم", r.due || "بيتحدد بعد المراجعة") + cell("الإنجاز", pct + "%") + "</dl>" +
        '<ol class="status-line">' + STATUSES.map(function (s, i) {
          return '<li class="' + (i < idx ? "done" : i === idx ? "now" : "") + '"' + (i === idx ? ' aria-current="step"' : "") + ">" + s + "</li>";
        }).join("") + "</ol>" +
        (r.note ? '<p class="trk-note">' + esc(window.RX_NODOT ? window.RX_NODOT(r.note) : r.note) + "</p>" : "") +
        '<a class="trk-tg" href="https://t.me/' + esc(CFG.TELEGRAM_USERNAME || "") + '" target="_blank" rel="noopener">عندك سؤال عن طلبك؟ كلمنا على تيليجرام</a>';
    }).catch(function () { out.innerHTML = '<p class="err">مقدرناش نوصل للسيرفر دلوقتي، جرّب كمان شوية</p>'; });
  });
  $("#trackThis").addEventListener("click", function () { setTimeout(function () { $("#trackForm").requestSubmit(); }, 300); });

  $("#receiptForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var msg = $("#receiptMsg"), f = $("#r-file").files[0], id = $("#r-id").value.trim(), tg = tgNorm($("#r-tg").value);
    if (!id || !tg || !f) { msg.style.color = "var(--err)"; msg.textContent = "املا الخانات الثلاثة"; return; }
    msg.style.color = "var(--muted)"; msg.textContent = "بنرفع الإيصال…";
    toB64(f).then(function (rc) { return api({ action: "receipt", orderId: id, telegram: tg, receipt: rc }); })
      .then(function (r) {
        if (!r.ok) throw new Error(r.error || "مش لاقيين الطلب");
        msg.style.color = "var(--ok)"; msg.textContent = "الإيصال وصل، هنأكد الدفع ونحدّث حالة طلبك";
        e.target.reset();
      }).catch(function (err) { msg.style.color = "var(--err)"; msg.textContent = err.message; });
  });
})();
