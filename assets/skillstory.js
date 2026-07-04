(function () {
  "use strict";

  var root = document.getElementById("skillstory");
  if (!root) return;
  var stage = root.querySelector("[data-ss-root]");
  var railEl = root.querySelector("[data-ss-rail]");
  var viewportEl = root.querySelector("[data-ss-viewport]");
  var dotsEl = root.querySelector("[data-ss-dots]");
  var dataEl = root.querySelector("[data-ss-data]");
  if (!stage || !railEl || !viewportEl || !dotsEl || !dataEl) return;

  // ---- config ----
  var DURATION = 3500;               // ~3.5s per card
  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- parse data ----
  var groups;
  try { groups = JSON.parse(dataEl.textContent.trim()); }
  catch (e) { return; }
  if (!Array.isArray(groups) || !groups.length) return;
  var N = groups.length;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function pad(n) { return (n < 10 ? "0" : "") + n; }

  // ---- build DOM ----
  var tabs = [], fills = [], slides = [], dots = [];

  groups.forEach(function (g, i) {
    // tab + per-card progress bar
    var tab = document.createElement("button");
    tab.type = "button";
    tab.className = "ss-tab";
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-selected", i === 0 ? "true" : "false");
    tab.setAttribute("aria-controls", "ss-slide-" + i);
    tab.setAttribute("data-state", i === 0 ? "active" : "upcoming");
    tab.innerHTML =
      '<span class="ss-tab-label">' + esc(g.group) + "</span>" +
      '<span class="ss-track"><span class="ss-fill"></span></span>';
    tab.addEventListener("click", function () { go(i, true); });
    railEl.appendChild(tab);
    tabs.push(tab);
    fills.push(tab.querySelector(".ss-fill"));

    // slide
    var items = Array.isArray(g.items) ? g.items : [];
    var chips = items.map(function (it, ci) {
      return '<span class="ss-chip" style="--i:' + ci + '">' + esc(it) + "</span>";
    }).join("");
    var slide = document.createElement("div");
    slide.className = "ss-slide";
    slide.id = "ss-slide-" + i;
    slide.setAttribute("role", "tabpanel");
    slide.setAttribute("aria-hidden", i === 0 ? "false" : "true");
    slide.setAttribute("aria-label", g.group + " skills");
    slide.innerHTML =
      '<div class="ss-meta">' +
        '<div class="ss-index">STACK <b>' + pad(i + 1) + "</b> / " + pad(N) + "</div>" +
        '<h3 class="ss-group">' + esc(g.group) + "</h3>" +
        '<div class="ss-rule" aria-hidden="true"></div>' +
        '<p class="ss-count">' + items.length + (items.length === 1 ? " skill" : " skills") + "</p>" +
      "</div>" +
      '<div class="ss-chips">' + chips + "</div>";
    viewportEl.appendChild(slide);
    slides.push(slide);

    // dot
    var dot = document.createElement("button");
    dot.type = "button";
    dot.className = "ss-dot";
    dot.setAttribute("role", "tab");
    dot.setAttribute("aria-label", "Show " + g.group);
    dot.setAttribute("aria-current", i === 0 ? "true" : "false");
    dot.addEventListener("click", function () { go(i, true); });
    dotsEl.appendChild(dot);
    dots.push(dot);
  });

  // ---- state ----
  var current = 0;
  var paused = false;
  var rafId = null;
  var segStart = 0;      // timestamp when current segment began
  var elapsed = 0;       // ms already elapsed in current segment (survives pause)

  function setFillStates() {
    for (var i = 0; i < N; i++) {
      var st = i < current ? "done" : (i === current ? "active" : "upcoming");
      tabs[i].setAttribute("data-state", st);
      if (st !== "active") fills[i].style.transition = "";
      if (st === "done") fills[i].style.width = "100%";
      if (st === "upcoming") fills[i].style.width = "0%";
    }
  }

  function render(idx) {
    for (var i = 0; i < N; i++) {
      var on = i === idx;
      slides[i].setAttribute("aria-hidden", on ? "false" : "true");
      tabs[i].setAttribute("aria-selected", on ? "true" : "false");
      dots[i].setAttribute("aria-current", on ? "true" : "false");
    }
    setFillStates();
  }

  function go(idx, userInitiated) {
    idx = ((idx % N) + N) % N;
    current = idx;
    elapsed = 0;
    segStart = now();
    render(current);
    if (userInitiated && !reduceMotion) {
      stop(); start();
    }
  }

  function now() {
    return (window.performance && performance.now) ? performance.now() : Date.now();
  }

  function tick() {
    if (paused) { rafId = requestAnimationFrame(tick); return; }
    var t = elapsed + (now() - segStart);
    var pct = Math.min(1, t / DURATION);
    fills[current].style.width = (pct * 100).toFixed(2) + "%";
    if (pct >= 1) {
      go(current + 1, false);   // advance + loop forever
    }
    rafId = requestAnimationFrame(tick);
  }

  function start() {
    if (reduceMotion) return;     // no auto-advance when reduced motion
    if (rafId != null) return;
    segStart = now();
    rafId = requestAnimationFrame(tick);
  }
  function stop() {
    if (rafId != null) { cancelAnimationFrame(rafId); rafId = null; }
  }

  // ---- pause on hover / focus ----
  function pause() {
    if (paused) return;
    paused = true;
    elapsed += (now() - segStart);   // bank progress
    stage.classList.add("is-paused");
  }
  function resume() {
    if (!paused) return;
    paused = false;
    segStart = now();
    stage.classList.remove("is-paused");
  }
  stage.addEventListener("mouseenter", pause);
  stage.addEventListener("mouseleave", resume);
  stage.addEventListener("focusin", pause);
  stage.addEventListener("focusout", function (e) {
    if (!stage.contains(e.relatedTarget)) resume();
  });

  // ---- keyboard: left/right to navigate ----
  stage.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") { e.preventDefault(); go(current + 1, true); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); go(current - 1, true); }
  });

  // ---- pause when tab not visible ----
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) pause(); else resume();
  });

  // ---- pause auto-play until scrolled into view ----
  var started = false;
  function kick() {
    if (started) return;
    started = true;
    render(0);
    if (!reduceMotion) start();
  }
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { kick(); io.disconnect(); } });
    }, { threshold: 0.25 });
    io.observe(stage);
  } else {
    kick();
  }

  // initial paint
  render(0);
  if (reduceMotion) {
    stage.classList.remove("is-paused");
  }
})();
