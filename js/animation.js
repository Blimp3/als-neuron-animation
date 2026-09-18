/* ============================================================
 * animation.js — Motion for the motor-unit scene.
 *
 *  1. Axonal-transport particles: mitochondria, vesicles, proteins
 *     and RNA move in BOTH directions along the axon (anterograde =
 *     toward the terminal, retrograde = toward the cell body).
 *     MEDICAL: in ALS stages the transport slows, then stalls, and
 *     cargo piles up at a "block point" on the distal axon.
 *  2. Signal journey: an action-potential pulse travels
 *     cell body → axon → NMJ → acetylcholine release → contraction.
 *     MEDICAL: in ALS stages the pulse slows, weakens, or dies at
 *     the point where the neuron has failed.
 *  3. Fasciculations in stage 5 (spontaneous twitches of a
 *     denervated motor unit).
 *
 * All motion honors the reduced-motion flag: when set, particles
 * stand still and the journey becomes a sequence of static highlights.
 * ============================================================ */

const LmnAnimation = (function () {
  "use strict";

  var SVGNS = "http://www.w3.org/2000/svg";
  var state = {
    stage: 0,
    reducedMotion: false,
    particles: [],      // main-axon transport particles
    nbParticles: [],    // neighboring (healthy) axon particles
    rafId: null,
    lastT: 0,
    playing: false,
    fascicTimer: null
  };

  /* MEDICAL: per-stage transport parameters.
   * speed  — multiplier on cargo speed
   * count  — how many cargoes are still moving
   * block  — x-position beyond which anterograde cargo can no longer
   *          pass (null = no block); distal axon fails first. */
  var STAGE_TRANSPORT = [
    { speed: 1.0,  count: 16, block: null },
    { speed: 0.55, count: 14, block: null },
    { speed: 0.45, count: 12, block: null },
    { speed: 0.3,  count: 10, block: 640 },
    { speed: 0.3,  count: 10, block: 640 },
    { speed: 0.12, count: 6,  block: 480 }
  ];

  var CARGO_TYPES = [
    { type: "mito",    speed: 42 },   // mitochondria — slow, large
    { type: "vesicle", speed: 72 },   // synaptic vesicles — fast
    { type: "protein", speed: 55 },   // protein complexes
    { type: "rna",     speed: 60 }    // RNA granules
  ];

  function el(name, attrs) {
    var n = document.createElementNS(SVGNS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  function $(sel) { return document.querySelector(sel); }

  /* ---------- transport particles ---------- */

  function makeParticle(group, xMin, xMax, yAnt, yRet, i) {
    var t = CARGO_TYPES[i % CARGO_TYPES.length];
    var anterograde = (i % 2 === 0); // half go each way — bidirectional transport
    var shape;
    if (t.type === "mito") {
      shape = el("ellipse", { rx: 7, ry: 4, "class": "cargo mito", "data-key": "mito" });
    } else if (t.type === "vesicle") {
      shape = el("circle", { r: 3.2, "class": "cargo vesicle" });
    } else if (t.type === "protein") {
      shape = el("rect", { width: 6, height: 6, rx: 1.5, "class": "cargo protein" });
    } else {
      shape = el("circle", { r: 2.2, "class": "cargo rna" });
    }
    var p = {
      node: shape,
      x: xMin + Math.random() * (xMax - xMin),
      dir: anterograde ? 1 : -1,
      speed: t.speed * (0.85 + Math.random() * 0.3),
      xMin: xMin, xMax: xMax,
      y: anterograde ? yAnt : yRet
    };
    group.appendChild(shape);
    return p;
  }

  function drawParticle(p) {
    if (p.node.tagName === "rect") {
      p.node.setAttribute("x", p.x - 3);
      p.node.setAttribute("y", p.y - 3);
    } else {
      p.node.setAttribute("cx", p.x);
      p.node.setAttribute("cy", p.y);
    }
  }

  function initParticles() {
    var group = $("#particles");
    group.innerHTML = "";
    state.particles = [];
    for (var i = 0; i < 16; i++) {
      state.particles.push(makeParticle(group, 345, 855, 324, 337, i));
    }
    // Neighboring healthy axon keeps normal transport in every stage —
    // a deliberate visual contrast with the sick neuron.
    for (var j = 0; j < 6; j++) {
      state.nbParticles.push(makeParticle(group, 285, 940, 180, 190, j));
    }
    applyTransportStage();
    state.particles.concat(state.nbParticles).forEach(drawParticle);
  }

  function applyTransportStage() {
    var cfg = STAGE_TRANSPORT[state.stage];
    // Retire surplus cargoes in late stages (they have stalled and
    // been cleared); the remainder keep creeping along.
    state.particles.forEach(function (p, i) {
      p.node.style.display = i < cfg.count ? "" : "none";
      p.stalled = false;
    });
  }

  function tickParticles(dt) {
    var cfg = STAGE_TRANSPORT[state.stage];
    state.particles.forEach(function (p) {
      if (p.node.style.display === "none") return;
      if (!p.stalled) p.x += p.dir * p.speed * cfg.speed * dt;
      // MEDICAL: with disrupted transport, anterograde cargo piles up
      // at the block point (visible as axonal swellings in the scene).
      if (cfg.block !== null && p.dir > 0 && p.x >= cfg.block) {
        p.stalled = true;
        p.x = cfg.block - Math.random() * 14;
        // after a wait, the cargo is returned toward the cell body
        setTimeout(function () { p.dir = -1; p.stalled = false; }, 1200 + Math.random() * 2000);
      }
      if (p.x > p.xMax) { p.dir = -1; p.y = 337; }
      if (p.x < p.xMin) { p.dir = 1; p.y = 324; }
      drawParticle(p);
    });
    state.nbParticles.forEach(function (p) {
      p.x += p.dir * p.speed * dt;
      if (p.x > p.xMax) { p.dir = -1; p.y = 190; }
      if (p.x < p.xMin) { p.dir = 1; p.y = 180; }
      drawParticle(p);
    });
  }

  function loop(t) {
    if (!state.lastT) state.lastT = t;
    var dt = Math.min((t - state.lastT) / 1000, 0.1);
    state.lastT = t;
    tickParticles(dt);
    state.rafId = requestAnimationFrame(loop);
  }

  function startLoop() {
    if (state.reducedMotion || state.rafId) return;
    state.rafId = requestAnimationFrame(loop);
  }

  function stopLoop() {
    if (state.rafId) cancelAnimationFrame(state.rafId);
    state.rafId = null;
    state.lastT = 0;
  }

  /* ---------- acetylcholine release & muscle contraction ---------- */

  // MEDICAL: ACh vesicles released from the terminal drift across the
  // synaptic cleft to the muscle-fiber membrane.
  function releaseACh(fiberIndex, strength, done) {
    var layer = $("#ach-layer");
    var cy = { 1: 150, 2: 285, 3: 420, 4: 555 }[fiberIndex];
    var n = Math.max(2, Math.round(7 * strength));
    for (var i = 0; i < n; i++) {
      (function (i) {
        var d = el("circle", { r: 2.6, "class": "ach-dot", cx: 988, cy: cy - 6 + (i % 4) * 4 });
        layer.appendChild(d);
        var dx = 14 + Math.random() * 10;
        var dy = (Math.random() - 0.5) * 10;
        var start = null;
        function step(ts) {
          if (!start) start = ts;
          var k = Math.min((ts - start) / 480, 1);
          d.setAttribute("cx", 988 + dx * k);
          d.setAttribute("cy", (cy - 6 + (i % 4) * 4) + dy * k);
          d.setAttribute("opacity", 1 - k * 0.9);
          if (k < 1) requestAnimationFrame(step);
          else { d.remove(); if (i === 0 && done) done(); }
        }
        if (state.reducedMotion) {
          setTimeout(function () { d.remove(); if (i === 0 && done) done(); }, 500);
        } else {
          requestAnimationFrame(step);
        }
      })(i);
    }
  }

  function contractFiber(fiberIndex, strength) {
    var f = $(".fiber.f" + fiberIndex);
    if (!f) return;
    var cls = strength >= 0.99 ? "contract" : "contract-weak";
    f.classList.remove("contract", "contract-weak");
    void f.getBBox; // reflow trick not needed for class re-add in SVG; use timeout
    setTimeout(function () {
      f.classList.add(cls);
      setTimeout(function () { f.classList.remove(cls); }, 700);
    }, 20);
  }

  /* ---------- signal journey ---------- */

  function pulseNode(colorCls) {
    var g = el("g", { "class": "pulse " + (colorCls || "") });
    g.appendChild(el("circle", { r: 12, "class": "pulse-halo" }));
    g.appendChild(el("circle", { r: 6, "class": "pulse-core" }));
    $("#pulse-layer").appendChild(g);
    return g;
  }

  function moveAlong(node, points, pxPerSec, done) {
    // points: array of [x,y]; animate along the polyline.
    if (state.reducedMotion) { if (done) done(); return; }
    var seg = 0, segStart = null, x = points[0][0], y = points[0][1];
    function step(ts) {
      if (seg >= points.length - 1) { node.remove(); if (done) done(); return; }
      if (segStart === null) segStart = ts;
      var a = points[seg], b = points[seg + 1];
      var len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      var dur = len / pxPerSec * 1000;
      var k = Math.min((ts - segStart) / dur, 1);
      x = a[0] + (b[0] - a[0]) * k;
      y = a[1] + (b[1] - a[1]) * k;
      node.setAttribute("transform", "translate(" + x + "," + y + ")");
      if (k >= 1) { seg++; segStart = null; }
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function moveAlongPath(node, pathEl, pxPerSec, fadeAt, done) {
    // Animate along an SVG path (used for the curved axonal branches).
    if (state.reducedMotion) { if (done) done(); return; }
    var total = pathEl.getTotalLength();
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var dist = (ts - start) / 1000 * pxPerSec;
      var k = Math.min(dist / total, 1);
      // MEDICAL: on degenerating branches the pulse dies midway
      // (fadeAt < 1) — the signal never reaches the muscle fiber.
      if (fadeAt && k >= fadeAt) {
        fadeOut(node);
        if (done) done(false);
        return;
      }
      var pt = pathEl.getPointAtLength(dist);
      node.setAttribute("transform", "translate(" + pt.x + "," + pt.y + ")");
      if (k < 1) requestAnimationFrame(step);
      else { node.remove(); if (done) done(true); }
    }
    requestAnimationFrame(step);
  }

  function fadeOut(node) {
    if (state.reducedMotion) { node.remove(); return; }
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var k = Math.min((ts - start) / 600, 1);
      node.setAttribute("opacity", 1 - k);
      if (k < 1) requestAnimationFrame(step); else node.remove();
    }
    requestAnimationFrame(step);
  }

  function flashSoma(weak) {
    var s = $("#main-soma-group");
    s.classList.add(weak ? "fire-weak" : "fire");
    setTimeout(function () { s.classList.remove("fire", "fire-weak"); }, 600);
  }

  /* Static (reduced-motion) version: step highlights, nothing moves. */
  function journeyReduced(stage) {
    var seq = [];
    seq.push([$("#main-soma-group"), "hl"]);
    seq.push([$("#axon-prox"), "hl"]);
    if (stage < 5) seq.push([$("#axon-dist"), stage >= 3 ? "hl-weak" : "hl"]);
    var active = fibersResponding(stage);
    active.forEach(function (fi) {
      seq.push([$(".terminal.t" + fi), "hl"]);
      seq.push([$(".fiber.f" + fi), stage >= 2 ? "hl-weak" : "hl"]);
    });
    var i = 0;
    function next() {
      if (i > 0) seq[i - 1][0].classList.remove("hl", "hl-weak");
      if (i >= seq.length) { state.playing = false; return; }
      seq[i][0].classList.add(seq[i][1]);
      i++;
      setTimeout(next, 650);
    }
    next();
  }

  /* MEDICAL: which fibers of the main motor unit still respond,
   * per stage. F4 is denervated first, then F3; by stage 5 the main
   * neuron's unit is silent (F3/F4 survive only via the neighbor). */
  function fibersResponding(stage) {
    if (stage <= 1) return [2, 3, 4];
    if (stage === 2) return [2, 3];
    if (stage === 3 || stage === 4) return [2];
    return [];
  }

  function playJourney() {
    if (state.playing) return;
    state.playing = true;
    var stage = state.stage;

    if (state.reducedMotion) { journeyReduced(stage); return; }

    flashSoma(stage >= 5);
    var speed = stage === 0 ? 380 : stage === 1 ? 190 : 300;

    /* Stage 5 — MEDICAL: the dying neuron can no longer sustain a
     * signal; the pulse fades on the proximal axon. */
    if (stage === 5) {
      var p5 = pulseNode();
      p5.setAttribute("transform", "translate(175,330)");
      moveAlong(p5, [[175, 330], [470, 330]], 220, function () {});
      setTimeout(function () { fadeOut(p5); neighborJourney(); finishLater(); }, 1400);
      return;
    }

    var pulse = pulseNode();
    pulse.setAttribute("transform", "translate(175,330)");
    moveAlong(pulse, [[175, 330], [862, 330]], speed, function () {
      var responding = fibersResponding(stage);
      [2, 3, 4].forEach(function (fi, idx) {
        var branch = document.querySelector(".branch.b" + fi);
        var bp = pulseNode();
        var end = branch.getPointAtLength(0);
        bp.setAttribute("transform", "translate(" + end.x + "," + end.y + ")");
        var alive = responding.indexOf(fi) !== -1;
        // stage 3+: degenerating branches kill the pulse partway
        var fadeAt = !alive && stage >= 3 ? 0.55 : null;
        moveAlongPath(bp, branch, 300, fadeAt, function (arrived) {
          if (!arrived) return;
          if (!alive) return; // denervated terminal: nothing to release onto
          var strength = stage === 0 ? 1 : stage === 1 ? 0.55 : 0.4;
          setTimeout(function () {
            releaseACh(fi, strength, function () { contractFiber(fi, strength); });
          }, idx * 120);
        });
      });
      if (stage >= 4) setTimeout(neighborJourney, 1600);
      finishLater(stage >= 4 ? 4500 : 3200);
    });
  }

  /* Stage 4+ — MEDICAL: the surviving neighbor conducts normally and
   * its new collateral sprouts re-drive the reinnervated fibers F3/F4
   * (weakly — compensation is partial). */
  function neighborJourney() {
    var stage = state.stage;
    var np = pulseNode("nb-pulse");
    np.setAttribute("transform", "translate(175,150)");
    moveAlong(np, [[175, 150], [205, 164], [258, 184], [945, 185], [985, 156]], 340, function () {
      releaseACh(1, 1, function () { contractFiber(1, 1); });
    });
    if (stage >= 4) {
      ["f3", "f4"].forEach(function (fk, i) {
        var sprout = document.getElementById("sprout-" + fk);
        var sp = pulseNode("nb-pulse");
        var p0 = sprout.getPointAtLength(0);
        sp.setAttribute("transform", "translate(" + p0.x + "," + p0.y + ")");
        setTimeout(function () {
          moveAlongPath(sp, sprout, 220, null, function (arrived) {
            if (!arrived) return;
            var fi = fk === "f3" ? 3 : 4;
            releaseACh(fi, 0.45, function () { contractFiber(fi, 0.4); });
          });
        }, 700 + i * 250);
      });
    }
  }

  function finishLater(ms) {
    setTimeout(function () { state.playing = false; }, ms || 3000);
  }

  /* ---------- fasciculations (stage 5) ----------
   * MEDICAL: spontaneous, involuntary twitches of a denervated motor
   * unit — here the abandoned fiber F2 fires on its own. */
  function updateFasciculations() {
    if (state.fascicTimer) { clearInterval(state.fascicTimer); state.fascicTimer = null; }
    if (state.stage !== 5 || state.reducedMotion) return;
    state.fascicTimer = setInterval(function () {
      var f = $(".fiber.f2");
      if (!f) return;
      f.classList.add("twitch");
      setTimeout(function () { f.classList.remove("twitch"); }, 400);
    }, 3600);
  }

  /* ---------- public API ---------- */
  return {
    init: function () {
      initParticles();
      startLoop();
      updateFasciculations();
    },
    setStage: function (n) {
      state.stage = n;
      applyTransportStage();
      updateFasciculations();
    },
    setReducedMotion: function (on) {
      state.reducedMotion = on;
      if (on) { stopLoop(); }
      else { initParticles(); startLoop(); updateFasciculations(); }
    },
    playJourney: playJourney,
    isPlaying: function () { return state.playing; }
  };
})();
