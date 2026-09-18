/* ============================================================
 * app.js — UI wiring: builds the scenes, connects the timeline
 * slider, mode buttons, info panel, comparison panel, spinal-cord
 * cross-section dialog, keyboard navigation and reduced motion.
 * ============================================================ */

(function () {
  "use strict";

  var currentStage = 0;
  var lastAlsStage = 1;

  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }

  /* ---------- build scenes ---------- */
  $("#scene-wrap").innerHTML = SceneBuilder.buildSceneSVG();
  $("#cross-section-wrap").innerHTML = SceneBuilder.buildCrossSectionSVG();

  var scene = $("#scene");
  var slider = $("#stage-slider");
  var reduceToggle = $("#reduce-motion");

  /* ---------- stage handling ---------- */
  function setStage(n, fromSlider) {
    currentStage = n;
    if (n > 0) lastAlsStage = n;

    scene.setAttribute("class", "stage" + n);
    document.body.classList.toggle("mode-als", n > 0);

    // slider + its spoken value
    if (!fromSlider) slider.value = n;
    var st = LMN_DATA.stages[n];
    slider.setAttribute("aria-valuetext", st.title);

    // mode buttons
    $("#mode-normal").setAttribute("aria-pressed", n === 0 ? "true" : "false");
    $("#mode-als").setAttribute("aria-pressed", n > 0 ? "true" : "false");

    // stage description panel
    $("#stage-title").textContent = st.title;
    $("#stage-body").textContent = st.body;
    var tags = $("#stage-tags");
    tags.innerHTML = "";
    st.tags.forEach(function (t) {
      var li = document.createElement("li");
      li.textContent = t;
      tags.appendChild(li);
    });

    // tick highlight
    $$(".tick").forEach(function (t) {
      t.classList.toggle("on", Number(t.dataset.stage) === n);
    });

    // stage-conditional labels (denervation, reinnervation, atrophy, ACh)
    $$("#scene .lbl").forEach(function (g) {
      var stages = g.getAttribute("data-stages");
      var show = stages === "all" || stages.split(",").indexOf(String(n)) !== -1;
      g.style.display = show ? "" : "none";
      if (show) g.removeAttribute("aria-hidden");
      else g.setAttribute("aria-hidden", "true");
    });

    LmnAnimation.setStage(n);
    if (typeof Lmn3D !== "undefined") Lmn3D.setStage(n);
  }

  slider.addEventListener("input", function () { setStage(Number(slider.value), true); });

  $$(".tick").forEach(function (t) {
    t.addEventListener("click", function () { setStage(Number(t.dataset.stage)); });
  });

  $("#mode-normal").addEventListener("click", function () { setStage(0); });
  $("#mode-als").addEventListener("click", function () { setStage(lastAlsStage); });

  /* ---------- info panel ---------- */
  var panel = $("#info-panel");

  function openInfo(key) {
    var d = LMN_DATA.labels[key];
    if (!d) return;
    $("#info-title").textContent = d.title;
    $("#info-normal").textContent = d.normal;
    $("#info-als").textContent = d.als;
    panel.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
    $("#info-close").focus({ preventScroll: true });
  }

  function closeInfo() {
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
  }

  $("#info-close").addEventListener("click", closeInfo);

  // Labels and structures are clickable AND keyboard-activatable.
  $("#scene-wrap").addEventListener("click", function (e) {
    var g = e.target.closest("[data-key]");
    if (g) openInfo(g.getAttribute("data-key"));
  });
  $("#scene-wrap").addEventListener("keydown", function (e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    var g = e.target.closest("[data-key]");
    if (g && g.classList.contains("lbl")) {
      e.preventDefault();
      openInfo(g.getAttribute("data-key"));
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeInfo();
      closeCrossSection();
    }
  });

  /* ---------- signal journey ---------- */
  $("#play-journey").addEventListener("click", function () {
    var btn = this;
    if (LmnAnimation.isPlaying()) return;
    btn.disabled = true;
    btn.textContent = "Signal travelling…";
    LmnAnimation.playJourney();
    if (typeof Lmn3D !== "undefined") Lmn3D.playPulse();
    var poll = setInterval(function () {
      if (!LmnAnimation.isPlaying()) {
        clearInterval(poll);
        btn.disabled = false;
        btn.textContent = "▶ Signal journey";
      }
    }, 300);
  });

  /* ---------- spinal-cord cross-section dialog ---------- */
  var csDialog = $("#cross-section-dialog");
  var csOpener = null;

  function dialogFocusables() {
    return Array.prototype.slice.call(csDialog.querySelectorAll(
      "button, [href], input, select, textarea, [tabindex]:not([tabindex=\"-1\"])"
    )).filter(function (el) {
      return !el.disabled && el.getAttribute("aria-hidden") !== "true";
    });
  }

  function openCrossSection() {
    csOpener = document.activeElement;
    csDialog.classList.add("open");
    csDialog.setAttribute("aria-hidden", "false");
    $("#cs-close").focus();
  }
  function closeCrossSection() {
    csDialog.classList.remove("open");
    csDialog.setAttribute("aria-hidden", "true");
    if (csOpener && typeof csOpener.focus === "function") {
      csOpener.focus({ preventScroll: true });
    }
    csOpener = null;
  }
  $("#open-cross-section").addEventListener("click", openCrossSection);
  $("#cs-close").addEventListener("click", closeCrossSection);
  csDialog.addEventListener("keydown", function (e) {
    if (e.key !== "Tab") return;
    var focusables = dialogFocusables();
    if (!focusables.length) {
      e.preventDefault();
      return;
    }
    var first = focusables[0];
    var last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
  csDialog.addEventListener("click", function (e) {
    if (e.target === csDialog) closeCrossSection();
  });

  /* ---------- reduced motion ---------- */
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  function setReduced(on) {
    document.body.classList.toggle("reduced-motion", on);
    reduceToggle.setAttribute("aria-pressed", on ? "true" : "false");
    reduceToggle.textContent = "Reduce motion: " + (on ? "on" : "off");
    LmnAnimation.setReducedMotion(on);
    if (typeof Lmn3D !== "undefined") Lmn3D.setReducedMotion(on);
  }
  reduceToggle.addEventListener("click", function () {
    setReduced(!document.body.classList.contains("reduced-motion"));
  });
  prefersReduced.addEventListener("change", function (e) { setReduced(e.matches); });

  /* ---------- static text from data.js ---------- */
  $("#key-lesson-text").textContent = LMN_DATA.keyLesson;
  $("#umn-note").textContent = LMN_DATA.umnNote;
  $("#disclaimer-text").textContent = LMN_DATA.disclaimer;
  ["healthy", "als"].forEach(function (col) {
    var ul = $("#compare-" + col);
    LMN_DATA.compare[col].forEach(function (item) {
      var li = document.createElement("li");
      li.textContent = item;
      ul.appendChild(li);
    });
  });

  /* ---------- go ---------- */
  setReduced(prefersReduced.matches);
  // deep-link support: index.html#stage=3 opens directly at that stage
  var hashStage = (location.hash.match(/stage=(\d)/) || [])[1];
  setStage(hashStage ? Math.min(5, Number(hashStage)) : 0);
  LmnAnimation.init();
  // 3D model: clicks on structures open the same info panel as the 2D diagram
  if (typeof Lmn3D !== "undefined") Lmn3D.init($("#scene3d-wrap"), openInfo);
})();
