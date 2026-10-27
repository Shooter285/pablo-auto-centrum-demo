(function () {
  "use strict";

  document.documentElement.classList.add("js");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var desktop = window.matchMedia("(min-width: 960px)");
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  // Toast
  var toastEl = $(".toast");
  var toastTimer;
  function toast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.hidden = true; }, 4200);
  }

  // Header
  var header = $("[data-header]");
  function updateHeader() {
    if (header) header.classList.toggle("is-solid", window.scrollY > 24 || document.body.classList.contains("menu-open"));
  }
  window.addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();

  // Menu
  var navToggle = $(".nav-toggle");
  var nav = $("#site-nav");
  var toggleLabel = $("[data-toggle-label]");
  function setNav(open) {
    navToggle.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("is-open", open);
    document.body.classList.toggle("menu-open", open);
    toggleLabel.textContent = open ? "Zamknij menu" : "Menu";
    updateHeader();
  }
  if (navToggle && nav) {
    navToggle.addEventListener("click", function () { setNav(navToggle.getAttribute("aria-expanded") !== "true"); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setNav(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) { setNav(false); navToggle.focus(); }
    });
    desktop.addEventListener("change", function (e) { if (e.matches) setNav(false); });
  }

  // Aktywny link w menu
  var navLinks = $$('.site-nav li a[href^="#"]');
  if ("IntersectionObserver" in window && navLinks.length) {
    var byId = {};
    navLinks.forEach(function (a) { byId[a.getAttribute("href").slice(1)] = a; });
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) { a.removeAttribute("aria-current"); });
        if (byId[entry.target.id]) byId[entry.target.id].setAttribute("aria-current", "true");
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(byId).forEach(function (id) { var s = document.getElementById(id); if (s) sectionObserver.observe(s); });
  }

  // Godziny otwarcia
  var HOURS = { 1: [8, 20], 2: [8, 20], 3: [8, 20], 4: [8, 20], 5: [8, 20], 6: [8, 14], 0: null };
  function polandNow() {
    try {
      var parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Warsaw", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
      var map = {};
      parts.forEach(function (p) { map[p.type] = p.value; });
      var days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      return { day: days[map.weekday], minutes: (parseInt(map.hour, 10) % 24) * 60 + parseInt(map.minute, 10) };
    } catch (err) {
      var d = new Date();
      return { day: d.getDay(), minutes: d.getHours() * 60 + d.getMinutes() };
    }
  }
  function updateHours() {
    var now = polandNow();
    var range = HOURS[now.day];
    var isOpen = !!range && now.minutes >= range[0] * 60 && now.minutes < range[1] * 60;
    var status = $("[data-open-status]");
    if (status) {
      var text;
      if (isOpen) text = "Teraz otwarte, do " + range[1] + ":00";
      else if (range && now.minutes < range[0] * 60) text = "Teraz zamknięte, otwieramy dziś o " + range[0] + ":00";
      else {
        var next = (now.day + 1) % 7;
        while (!HOURS[next]) next = (next + 1) % 7;
        var names = ["w niedzielę", "w poniedziałek", "we wtorek", "w środę", "w czwartek", "w piątek", "w sobotę"];
        text = "Teraz zamknięte, otwieramy " + (next === (now.day + 1) % 7 ? "jutro" : names[next]) + " o " + HOURS[next][0] + ":00";
      }
      status.textContent = text;
      status.classList.toggle("is-open", isOpen);
    }
    $$("[data-hours] tr[data-days]").forEach(function (row) {
      var days = row.getAttribute("data-days").split(",").map(Number);
      row.classList.toggle("is-today", days.indexOf(now.day) !== -1);
    });
  }
  updateHours();
  setInterval(updateHours, 60000);

  // Usługi
  var lineup = $("[data-lineup]");
  var activateService = function () {};
  if (lineup) {
    var items = $$(".lineup-item", lineup);
    var heads = items.map(function (it) { return $(".lineup-btn", it); });
    var stage = $$(".lineup-stage img", lineup);

    activateService = function (i) {
      items.forEach(function (it, k) {
        var on = k === i;
        it.classList.toggle("is-active", on);
        if (desktop.matches) heads[k].setAttribute("aria-expanded", String(on));
      });
      stage.forEach(function (img, k) {
        if (k === i && img.loading === "lazy") img.loading = "eager";
        img.classList.toggle("is-active", k === i);
      });
    };

    function onKey(e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activateService(heads.indexOf(e.currentTarget)); }
    }
    function onClick(e) { activateService(heads.indexOf(e.currentTarget)); }
    function onHover(e) { activateService(heads.indexOf(e.currentTarget)); }

    function setMode() {
      heads.forEach(function (h) {
        if (desktop.matches) {
          h.setAttribute("role", "button");
          h.setAttribute("tabindex", "0");
          h.setAttribute("aria-controls", h.getAttribute("data-controls"));
          h.addEventListener("click", onClick);
          h.addEventListener("keydown", onKey);
          h.addEventListener("mouseenter", onHover);
        } else {
          ["role", "tabindex", "aria-controls", "aria-expanded"].forEach(function (a) { h.removeAttribute(a); });
          h.removeEventListener("click", onClick);
          h.removeEventListener("keydown", onKey);
          h.removeEventListener("mouseenter", onHover);
        }
      });
      var current = items.findIndex(function (it) { return it.classList.contains("is-active"); });
      activateService(current < 0 ? 0 : current);
    }
    setMode();
    desktop.addEventListener("change", setMode);
  }
  $$("[data-service-link]").forEach(function (a) {
    a.addEventListener("click", function () { activateService(parseInt(a.getAttribute("data-service-link"), 10)); });
  });

  // Etapy naprawy
  $$("[data-film]").forEach(function (root) {
    var track = $("[data-film-track]", root);
    var prev = $("[data-film-prev]", root);
    var next = $("[data-film-next]", root);
    var bar = $("[data-film-bar]", root);
    var current = $("[data-film-current]", root);
    var frames = $$(".film-frame", track);
    if (!track || !frames.length) return;

    function step() {
      var gap = parseFloat(getComputedStyle(track).columnGap) || 16;
      return frames[0].getBoundingClientRect().width + gap;
    }
    function update() {
      var max = track.scrollWidth - track.clientWidth;
      var x = track.scrollLeft;
      var idx = Math.min(frames.length - 1, Math.round(x / step()));
      if (x >= max - 4) idx = frames.length - 1;
      current.textContent = String(idx + 1).padStart(2, "0");
      bar.style.setProperty("--progress", ((idx + 1) / frames.length).toFixed(3));
      prev.disabled = x <= 4;
      next.disabled = x >= max - 4;
    }
    function go(dir) {
      var start = track.scrollLeft;
      var target = start + dir * step();
      track.scrollTo({ left: target, behavior: reduceMotion ? "auto" : "smooth" });
      setTimeout(function () {
        if (Math.abs(track.scrollLeft - start) < 2) track.scrollTo({ left: target, behavior: "auto" });
        update();
      }, 350);
      setTimeout(update, 900);
    }
    prev.addEventListener("click", function () { go(-1); });
    next.addEventListener("click", function () { go(1); });
    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  });

  // Przed / po
  $$("[data-compare]").forEach(function (fig) {
    var stage = $(".compare-stage", fig);
    var range = $(".compare-range", fig);
    var dragging = false, decided = false, startX = 0, startY = 0;

    function set(value) {
      var v = Math.max(0, Math.min(100, value));
      stage.style.setProperty("--pos", v + "%");
      range.value = Math.round(v);
      range.setAttribute("aria-valuetext", Math.round(v) + "% zdjęcia przed myciem");
    }
    function capture(id) { try { stage.setPointerCapture(id); } catch (err) {} }
    function fromPointer(e) {
      var rect = stage.getBoundingClientRect();
      set(((e.clientX - rect.left) / rect.width) * 100);
    }
    stage.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      dragging = true;
      decided = e.pointerType === "mouse";
      startX = e.clientX; startY = e.clientY;
      if (decided) { capture(e.pointerId); stage.classList.add("is-dragging"); fromPointer(e); }
    });
    stage.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      if (!decided) {
        var dx = Math.abs(e.clientX - startX), dy = Math.abs(e.clientY - startY);
        if (dx < 6 && dy < 6) return;
        if (dy > dx) { dragging = false; return; }
        decided = true;
        capture(e.pointerId);
        stage.classList.add("is-dragging");
      }
      fromPointer(e);
    });
    function end(e) {
      if (dragging && !decided && e && e.type === "pointerup") fromPointer(e);
      dragging = false;
      stage.classList.remove("is-dragging");
    }
    stage.addEventListener("pointerup", end);
    stage.addEventListener("pointercancel", end);
    range.addEventListener("input", function () { set(parseFloat(range.value)); });
    range.addEventListener("focus", function () { if (range.matches(":focus-visible")) stage.classList.add("has-focus"); });
    range.addEventListener("blur", function () { stage.classList.remove("has-focus"); });
    stage.addEventListener("click", function () { range.focus({ preventScroll: true }); });
    set(50);
  });

  // Zakładki cennika
  var tabs = $$('[role="tab"]');
  var ink = $(".tabs-ink");
  function moveInk(tab) {
    if (!ink || !tab) return;
    ink.style.setProperty("--ink-x", tab.offsetLeft + "px");
    ink.style.setProperty("--ink-s", (tab.offsetWidth / 100).toFixed(3));
  }
  function selectTab(tab, focus) {
    tabs.forEach(function (t) {
      var selected = t === tab;
      t.setAttribute("aria-selected", String(selected));
      t.tabIndex = selected ? 0 : -1;
      var panel = document.getElementById(t.getAttribute("aria-controls"));
      if (panel) panel.hidden = !selected;
    });
    moveInk(tab);
    if (focus) tab.focus();
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () { selectTab(tab); });
    tab.addEventListener("keydown", function (e) {
      var idx = null;
      if (e.key === "ArrowRight") idx = (i + 1) % tabs.length;
      if (e.key === "ArrowLeft") idx = (i - 1 + tabs.length) % tabs.length;
      if (e.key === "Home") idx = 0;
      if (e.key === "End") idx = tabs.length - 1;
      if (idx !== null) { e.preventDefault(); selectTab(tabs[idx], true); }
    });
  });
  $$("[data-tab-link]").forEach(function (link) {
    link.addEventListener("click", function () {
      var tab = document.getElementById("tab-" + link.getAttribute("data-tab-link"));
      if (tab) selectTab(tab);
    });
  });
  function inkToSelected() { moveInk($('[role="tab"][aria-selected="true"]')); }
  inkToSelected();
  window.addEventListener("resize", inkToSelected);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(inkToSelected);

  // Cena opon
  var rimInputs = $$('input[name="rim"]');
  var rimPrice = $("[data-rim-price]");
  var rimSize = $("[data-rim-size]");
  var rimSet = $("[data-rim-set]");
  rimInputs.forEach(function (input) {
    input.addEventListener("change", function () {
      var price = parseInt(input.value, 10);
      rimPrice.textContent = String(price);
      rimSize.textContent = input.getAttribute("data-size");
      rimSet.textContent = (price * 4) + " zł";
      if (!reduceMotion) {
        rimPrice.classList.remove("is-flip");
        void rimPrice.offsetWidth;
        rimPrice.classList.add("is-flip");
      }
    });
  });

  // Lightbox
  var lb = $(".lightbox");
  if (lb && typeof lb.showModal === "function") {
    var lbImg = $(".lightbox-img", lb);
    var lbCaption = $("[data-lb-caption]", lb);
    var lbCount = $("[data-lb-count]", lb);
    var group = [], index = 0, opener = null;

    function show(i) {
      index = (i + group.length) % group.length;
      var item = group[index];
      var thumb = item.querySelector("img");
      lbImg.style.opacity = "0";
      lbImg.onload = function () { lbImg.style.opacity = "1"; };
      lbImg.src = item.getAttribute("data-full");
      lbImg.alt = thumb ? thumb.alt : "";
      lbCaption.textContent = item.getAttribute("data-caption") || "";
      lbCount.textContent = (index + 1) + " / " + group.length;
      if (lbImg.complete) lbImg.style.opacity = "1";
      var pre = new Image();
      pre.src = group[(index + 1) % group.length].getAttribute("data-full");
    }
    $$("[data-lightbox]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        group = $$('[data-lightbox="' + btn.getAttribute("data-lightbox") + '"]');
        opener = btn;
        show(group.indexOf(btn));
        lb.showModal();
        $("[data-lb-close]", lb).focus();
      });
    });
    lb.addEventListener("close", function () {
      lbImg.removeAttribute("src");
      var back = opener;
      if (back) setTimeout(function () { back.focus({ preventScroll: true }); }, 0);
    });
    $("[data-lb-close]", lb).addEventListener("click", function () { lb.close(); });
    $("[data-lb-prev]", lb).addEventListener("click", function () { show(index - 1); });
    $("[data-lb-next]", lb).addEventListener("click", function () { show(index + 1); });
    lb.addEventListener("click", function (e) {
      if (e.target === lb || e.target.classList.contains("lightbox-figure")) lb.close();
    });
    lb.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); show(index + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); show(index - 1); }
    });

    // swipe
    var sx = 0, sy = 0, swiping = false, multi = false;
    var fig = $(".lightbox-figure", lb);
    fig.addEventListener("touchstart", function (e) {
      multi = e.touches.length > 1;
      if (multi) return;
      sx = e.touches[0].clientX; sy = e.touches[0].clientY;
      swiping = true;
      lbImg.classList.add("is-dragging");
    }, { passive: true });
    fig.addEventListener("touchmove", function (e) {
      if (!swiping || multi || e.touches.length > 1) return;
      var dx = e.touches[0].clientX - sx, dy = e.touches[0].clientY - sy;
      if (Math.abs(dx) > Math.abs(dy)) lbImg.style.transform = "translateX(" + dx + "px)";
    }, { passive: true });
    fig.addEventListener("touchend", function (e) {
      if (!swiping) return;
      swiping = false;
      lbImg.classList.remove("is-dragging");
      lbImg.style.transform = "";
      if (multi) return;
      var t = e.changedTouches[0];
      var dx = t.clientX - sx, dy = t.clientY - sy;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(dx < 0 ? index + 1 : index - 1);
    });
  }

  // Formularz
  var form = $("#enquiry");
  if (form) {
    var status = $(".form-status", form);
    function setError(field, el, msgEl, invalid) {
      field.classList.toggle("has-error", invalid);
      msgEl.hidden = !invalid;
      if (el) {
        if (invalid) { el.setAttribute("aria-invalid", "true"); el.setAttribute("aria-describedby", msgEl.id); }
        else { el.removeAttribute("aria-invalid"); el.removeAttribute("aria-describedby"); }
      }
      return invalid;
    }
    function validate() {
      var firstBad = null;
      var name = $("#f-name"), phone = $("#f-phone"), consent = $("#f-consent");
      var radios = $$('input[name="usluga"]', form);
      if (setError(name.closest(".field"), name, $("#f-name-err"), name.value.trim().length < 2)) firstBad = firstBad || name;
      if (setError(phone.closest(".field"), phone, $("#f-phone-err"), phone.value.replace(/\D/g, "").length < 9)) firstBad = firstBad || phone;
      if (setError(radios[0].closest(".field"), null, $("#f-usluga-err"), !radios.some(function (r) { return r.checked; }))) firstBad = firstBad || radios[0];
      if (setError(consent.closest(".field"), consent, $("#f-consent-err"), !consent.checked)) firstBad = firstBad || consent;
      return firstBad;
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var bad = validate();
      if (bad) { status.hidden = true; bad.focus(); return; }
      status.textContent = "To wersja demo – w wersji finalnej wiadomość trafi do firmy.";
      status.hidden = false;
    });
    ["input", "change"].forEach(function (type) {
      form.addEventListener(type, function (e) {
        var field = e.target.closest(".field");
        if (field && field.classList.contains("has-error")) validate();
      });
    });
  }

  // Polityka prywatności
  $$("[data-privacy]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      toast("Polityka prywatności zostanie dodana w wersji finalnej strony.");
    });
  });

  // Animacje przy przewijaniu
  var revealables = $$(".reveal, .reveal-media");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("is-in"); io.unobserve(entry.target); }
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.08 });
    revealables.forEach(function (el) { io.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add("is-in"); });
  }

  // Rok
  var year = $("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());
})();
