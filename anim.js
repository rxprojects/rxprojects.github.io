/* Rx Projects — motion layer (progressive enhancement) */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* header */
  var header = $("#siteHeader"), tg = $("#tgFloat"), hero = $(".hero");
  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle("scrolled", y > 30);
    if (tg && hero) tg.classList.toggle("show", y > hero.offsetHeight * 0.6);
    timeline(); parallax();
  }

  /* hero title: split into words, last 3 words in gold */
  var title = $("[data-split]");
  if (title) {
    var words = title.textContent.trim().split(/\s+/);
    title.innerHTML = words.map(function (w, i) {
      var gold = i >= words.length - 3 ? " gold" : "";
      return '<span class="w' + gold + '"><span style="--i:' + i + '">' + w + "</span></span>";
    }).join(" ");
    requestAnimationFrame(function () { setTimeout(function () { title.classList.add("is-in"); }, 60); });
  }

  /* reveal on scroll */
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      $$("[data-count]", e.target).forEach(countUp);
      io.unobserve(e.target);
    });
  }, { threshold: 0.18, rootMargin: "0px 0px -6% 0px" }) : null;
  $$(".reveal").forEach(function (el) { if (io) io.observe(el); else el.classList.add("in"); });

  function countUp(el) {
    if (el.dataset.done) return; el.dataset.done = 1;
    var target = Number(el.getAttribute("data-count")), t0 = null, dur = reduce ? 1 : 1600;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(target * e);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* spotlight on tiles */
  $$(".spotlight").forEach(function (t) {
    t.addEventListener("pointermove", function (e) {
      var r = t.getBoundingClientRect();
      t.style.setProperty("--mx", (e.clientX - r.left) + "px");
      t.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
  });

  /* tilt quote card */
  var fine = window.matchMedia("(pointer: fine)").matches;
  if (!reduce && fine) {
    $$(".tilt").forEach(function (c) {
      c.addEventListener("pointermove", function (e) {
        var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        c.style.transform = "perspective(1200px) rotateY(" + (x * 6) + "deg) rotateX(" + (-y * 6) + "deg)";
      });
      c.addEventListener("pointerleave", function () { c.style.transform = ""; });
    });
    $$(".magnetic").forEach(function (b) {
      b.addEventListener("pointermove", function (e) {
        var r = b.getBoundingClientRect();
        b.style.transform = "translate(" + ((e.clientX - r.left - r.width / 2) * .15) + "px," + ((e.clientY - r.top - r.height / 2) * .25) + "px)";
      });
      b.addEventListener("pointerleave", function () { b.style.transform = ""; });
    });
  }

  /* before / after slider */
  var cmp = $("#compare"), range = $("#cmpRange");
  if (cmp && range) {
    var set = function () { cmp.style.setProperty("--pos", range.value + "%"); };
    range.addEventListener("input", set); set();
    // gentle intro sweep
    if (!reduce && io) {
      var once = new IntersectionObserver(function (en) {
        if (!en[0].isIntersecting) return; once.disconnect();
        var t0 = null;
        (function sweep(t) {
          if (!t0) t0 = t; var p = Math.min((t - t0) / 1800, 1);
          range.value = 50 + Math.sin(p * Math.PI * 2) * 22; set();
          if (p < 1) requestAnimationFrame(sweep); else { range.value = 50; set(); }
        })(performance.now());
      }, { threshold: .6 });
      once.observe(cmp);
    }
  }

  /* tabs ink */
  var tabs = $(".tabs"), ink = $(".tab-ink");
  function placeInk() {
    if (!tabs || !ink) return;
    var sel = $('[aria-selected="true"]', tabs); if (!sel) return;
    ink.style.left = sel.offsetLeft + "px"; ink.style.width = sel.offsetWidth + "px";
  }
  if (tabs) {
    new MutationObserver(placeInk).observe(tabs, { attributes: true, subtree: true, attributeFilter: ["aria-selected"] });
    window.addEventListener("resize", placeInk);
    document.fonts && document.fonts.ready.then(placeInk);
    placeInk();
  }

  /* timeline progress */
  var tl = $("#timeline"), fill = $(".t-fill"), items = tl ? $$("li", tl) : [];
  function timeline() {
    if (!tl) return;
    var r = tl.getBoundingClientRect(), vh = window.innerHeight;
    var p = Math.min(Math.max((vh * .6 - r.top) / r.height, 0), 1);
    fill.style.setProperty("--fill", (p * 100) + "%");
    items.forEach(function (li) { var b = li.getBoundingClientRect(); li.classList.toggle("lit", b.top < vh * .6); });
  }

  /* parallax on final photo */
  var fp = $(".final-photo");
  function parallax() {
    if (!fp || reduce) return;
    var r = fp.parentElement.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) return;
    fp.style.setProperty("--py", (r.top * -0.12) + "px");
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();
