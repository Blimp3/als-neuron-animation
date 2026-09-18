/* ============================================================
 * scene3d.js — Interactive 3D model of the lower motor unit.
 *
 * A rotatable/zoomable Three.js companion to the 2D diagram. It
 * mirrors the same anatomy (cell body, dendrites, axon hillock,
 * myelinated axon, NMJs, muscle fibers, plus the surviving
 * neighbor neuron) and the same ALS stages:
 *   stage 1 — soma stress markers appear
 *   stage 2 — F4 terminal withdrawn (denervation)
 *   stage 3 — distal axon + branches fade (dying-back), swellings
 *   stage 4 — neighbor collateral sprouts appear (reinnervation)
 *   stage 5 — soma shrinks, denervated fibers atrophy
 * Transport particles and the signal-journey pulse are synced with
 * the 2D controls via Lmn3D.setStage / playPulse / setReducedMotion.
 *
 * Uses the vendored UMD builds (js/vendor/) so the page keeps
 * working offline and from file:// — no ES modules required.
 * ============================================================ */

const Lmn3D = (function () {
  "use strict";

  var C = {
    soma: 0xe3a967, somaLine: 0xb57f3e, somaSick: 0xc49a63,
    axon: 0xecc988, myelin: 0xd7e4f0, schwann: 0x7c9bb8,
    muscle: 0xe7b3ab, terminal: 0xb47fa0,
    neighbor: 0x9fc4b0, neighborLine: 0x6e9a85,
    nucleus: 0xf6e3c2, nucleolus: 0xb57f3e,
    agg: 0x6d4a3a, ros: 0xc0563f,
    mito: 0xe8934a, vesicle: 0x5a8fc7, protein: 0x9a7ab8, rna: 0x57a773,
    pulse: 0xffd166, ach: 0xd46aa0
  };

  var renderer, scene3, camera, controls, container;
  var raycaster, pointerDown = null;
  var reduced = false, stage = 0;
  var rafId = null, lastT = 0;
  var tweens = [];
  var openInfoCb = null;

  var R = {};          // named references to meshes/groups
  var particles = [], nbParticles = [];
  var FIBERS = {       // muscle-fiber layout (x is the length axis)
    1: { y: 13.5, z: -6 },
    2: { y: 4.5,  z: 1.5 },
    3: { y: -4.5, z: -1.5 },
    4: { y: -13.5, z: 1 }
  };
  var FIBER_X = 64, FIBER_LEN = 18;

  /* per-stage transport behaviour, mirroring animation.js */
  var STAGE_TRANSPORT = [
    { speed: 1.0,  count: 12, block: null },
    { speed: 0.55, count: 11, block: null },
    { speed: 0.45, count: 10, block: null },
    { speed: 0.3,  count: 8,  block: 16 },
    { speed: 0.3,  count: 8,  block: 16 },
    { speed: 0.12, count: 5,  block: 2 }
  ];

  function mat(color, opts) {
    var m = new THREE.MeshPhongMaterial(Object.assign({
      color: color, shininess: 18, transparent: true
    }, opts || {}));
    return m;
  }

  function mesh(geo, material, key) {
    var m = new THREE.Mesh(geo, material);
    if (key) m.userData.key = key;
    return m;
  }

  /* tube along a list of Vector3 points (dendrites, branches, sprouts) */
  function tube(points, radius, material, key) {
    var curve = new THREE.CatmullRomCurve3(points);
    var t = mesh(new THREE.TubeGeometry(curve, 24, radius, 8), material, key);
    t.userData.curve = curve;
    return t;
  }

  function v3(x, y, z) { return new THREE.Vector3(x, y, z || 0); }

  /* ---------- build ---------- */

  function buildNeuron() {
    var g = new THREE.Group();

    /* cell body — low-poly icosahedron for a stylized "medical model" look */
    var somaMat = mat(C.soma, { opacity: 0.88, flatShading: true });
    R.soma = mesh(new THREE.IcosahedronGeometry(6.5, 1), somaMat, "soma");
    R.soma.position.set(-45, 0, 0);
    g.add(R.soma);

    R.nucleus = mesh(new THREE.SphereGeometry(2.8, 20, 16), mat(C.nucleus, { opacity: 0.95 }), "soma");
    R.nucleolus = mesh(new THREE.SphereGeometry(1, 12, 10), mat(C.nucleolus), "soma");
    R.soma.add(R.nucleus); R.soma.add(R.nucleolus);

    /* dendritic tree — MEDICAL: receives incoming synaptic signals */
    R.dendrites = new THREE.Group();
    var dendDirs = [
      [v3(-48, 4, 2), v3(-52, 9, 4), v3(-55, 13, 5)],
      [v3(-49, 2, -3), v3(-54, 5, -7), v3(-57, 8, -9)],
      [v3(-50, -1, 3), v3(-55, -2, 6), v3(-59, -3, 8)],
      [v3(-49, -4, -2), v3(-53, -8, -4), v3(-56, -12, -5)],
      [v3(-46, -5, 3), v3(-47, -10, 5), v3(-48, -14, 7)],
      [v3(-45, 6, -2), v3(-45, 11, -4), v3(-44, 15, -6)]
    ];
    var dendMat = mat(C.somaLine, { opacity: 1 });
    dendDirs.forEach(function (pts) {
      R.dendrites.add(tube(pts, 0.7, dendMat.clone(), "dendrites"));
    });
    g.add(R.dendrites);

    /* axon hillock — the action-potential trigger zone */
    var hill = mesh(new THREE.ConeGeometry(1.8, 4, 12), mat(C.soma), "hillock");
    hill.rotation.z = -Math.PI / 2;
    hill.position.set(-39.5, 0, 0);
    R.hillock = hill;
    g.add(hill);

    /* axon (proximal + distal so the distal part can degenerate) */
    var axonMatProx = mat(C.axon, { opacity: 1 });
    var axonMatDist = mat(C.axon, { opacity: 1 });
    R.axonProx = mesh(new THREE.CylinderGeometry(1.05, 1.05, 40, 12), axonMatProx, "axon");
    R.axonProx.rotation.z = Math.PI / 2;
    R.axonProx.position.set(-18, 0, 0);
    R.axonDist = mesh(new THREE.CylinderGeometry(1.05, 1.05, 28, 12), axonMatDist, "axon");
    R.axonDist.rotation.z = Math.PI / 2;
    R.axonDist.position.set(16, 0, 0);
    g.add(R.axonProx); g.add(R.axonDist);

    /* myelin segments (Schwann cells) with nodes of Ranvier between */
    R.myelin = new THREE.Group();
    for (var x = -30; x <= 34; x += 8) {
      var seg = mesh(new THREE.CylinderGeometry(2.1, 2.1, 6, 14), mat(C.myelin, { opacity: 0.96 }), "myelin");
      seg.rotation.z = Math.PI / 2;
      seg.position.set(x, 0, 0);
      var nuc = mesh(new THREE.SphereGeometry(0.9, 10, 8), mat(C.schwann), "schwann");
      nuc.position.set(x + 1, 2.1, 0.6);
      R.myelin.add(seg); R.myelin.add(nuc);
    }
    g.add(R.myelin);

    /* axonal swellings — stalled-transport cargo (stage 3+) */
    R.swell = new THREE.Group();
    [[14, 1.7], [26, 1.5]].forEach(function (s) {
      var b = mesh(new THREE.SphereGeometry(s[1], 12, 10), mat(0xe8b96a), "transport");
      b.position.set(s[0], 0, 0);
      R.swell.add(b);
    });
    R.swell.visible = false;
    g.add(R.swell);

    /* soma stress markers (stage 1+) — MEDICAL: aggregates, ROS */
    R.stress = new THREE.Group();
    [[-47, 2, 3, "agg"], [-43, -3, 2.5, "agg"], [-46, -2, -3.5, "agg"],
     [-42, 3, -2, "ros"], [-48, -4, 1, "ros"]].forEach(function (p) {
      var s = mesh(new THREE.SphereGeometry(p[3] === "agg" ? 0.9 : 0.6, 8, 6),
        mat(p[3] === "agg" ? C.agg : C.ros), p[3] === "agg" ? "soma" : "soma");
      s.position.set(p[0], p[1], p[2]);
      R.stress.add(s);
    });
    R.stress.visible = false;
    g.add(R.stress);

    /* distal branches to F2/F3/F4 + their terminals (bouton clusters) */
    R.branches = {}; R.terminals = {};
    [2, 3, 4].forEach(function (fi) {
      var f = FIBERS[fi];
      var br = tube([v3(30, 0, 0), v3(38, f.y * 0.3, f.z * 0.3), v3(47, f.y * 0.8, f.z * 0.8), v3(53.5, f.y, f.z)],
        0.7, mat(C.axon), "terminal");
      R.branches[fi] = br;
      g.add(br);
      var term = new THREE.Group();
      [[0, 0, 0], [1.2, 1, 0.5], [1.4, -0.8, -0.4], [0.6, 0.4, 1], [0.8, -0.5, -1]].forEach(function (o) {
        var b = mesh(new THREE.SphereGeometry(0.85, 10, 8), mat(C.terminal), "terminal");
        b.position.set(54 + o[0], f.y + o[1], f.z + o[2]);
        term.add(b);
      });
      R.terminals[fi] = term;
      g.add(term);
    });

    scene3.add(g);
    R.mainNeuron = g;
  }

  function buildNeighbor() {
    var g = new THREE.Group();
    var soma = mesh(new THREE.IcosahedronGeometry(4, 1), mat(C.neighbor, { opacity: 0.85, flatShading: true }));
    soma.position.set(-45, 14, -8);
    g.add(soma);
    var dendMat = mat(C.neighborLine);
    [[v3(-48, 17, -7), v3(-52, 20, -6)], [v3(-48, 12, -9), v3(-53, 10, -10)], [v3(-44, 17.5, -9), v3(-43, 21, -10)]]
      .forEach(function (pts) { g.add(tube(pts, 0.5, dendMat.clone())); });
    /* its axon runs parallel to the main one, at F1's height */
    var ax = mesh(new THREE.CylinderGeometry(0.8, 0.8, 84, 10), mat(C.neighbor, { opacity: 0.9 }), null);
    ax.rotation.z = Math.PI / 2;
    ax.position.set(0, 13.5, -6);
    g.add(ax);
    for (var x = -28; x <= 32; x += 10) {
      var seg = mesh(new THREE.CylinderGeometry(1.5, 1.5, 6, 12), mat(0xe2ede8, { opacity: 0.9 }));
      seg.rotation.z = Math.PI / 2;
      seg.position.set(x, 13.5, -6);
      g.add(seg);
    }
    /* terminal onto its own fiber F1 */
    g.add(tube([v3(42, 13.5, -6), v3(49, 13.5, -6), v3(53.5, 13.5, -6)], 0.55, mat(C.neighbor)));
    var term = new THREE.Group();
    [[0, 0, 0], [1, 0.9, 0.4], [1, -0.8, -0.4]].forEach(function (o) {
      var b = mesh(new THREE.SphereGeometry(0.75, 10, 8), mat(C.neighborLine));
      b.position.set(54 + o[0], 13.5 + o[1], -6 + o[2]);
      term.add(b);
    });
    g.add(term);

    /* collateral sprouts to F3/F4 — hidden until stage 4 (reinnervation) */
    R.sprouts = new THREE.Group();
    [[3, v3(20, 13.5, -6)], [4, v3(28, 13.5, -6)]].forEach(function (cfg) {
      var fi = cfg[0], from = cfg[1], f = FIBERS[fi];
      var sp = tube([from, v3((from.x + 50) / 2, (from.y + f.y) / 2, (from.z + f.z) / 2 + 2), v3(53.5, f.y, f.z)],
        0.45, mat(C.neighborLine), "reinnervation");
      R.sprouts.add(sp);
      var b = mesh(new THREE.SphereGeometry(0.8, 10, 8), mat(C.neighborLine), "reinnervation");
      b.position.set(54.5, f.y, f.z);
      R.sprouts.add(b);
    });
    R.sprouts.visible = false;
    g.add(R.sprouts);

    scene3.add(g);
    R.neighbor = g;
    // NB: faintness (0.45) is applied by setStage() AFTER base
    // opacities are recorded, so stage 4 can restore full strength.
  }

  function buildFibers() {
    R.fibers = {};
    Object.keys(FIBERS).forEach(function (fi) {
      var f = FIBERS[fi];
      var g = new THREE.Group();
      var body = mesh(new THREE.CylinderGeometry(2.3, 2.3, FIBER_LEN, 18), mat(C.muscle), "fiber");
      body.rotation.z = Math.PI / 2;
      g.add(body);
      [-FIBER_LEN / 2, FIBER_LEN / 2].forEach(function (off) {
        var cap = mesh(new THREE.SphereGeometry(2.3, 14, 10), body.material, "fiber");
        cap.position.set(off, 0, 0);
        g.add(cap);
      });
      for (var i = -6; i <= 6; i += 4) {   // striation rings
        var ring = mesh(new THREE.TorusGeometry(2.32, 0.09, 6, 24), mat(0xc08d86), "fiber");
        ring.rotation.y = Math.PI / 2;
        ring.position.set(i, 0, 0);
        g.add(ring);
      }
      g.position.set(FIBER_X, f.y, f.z);
      scene3.add(g);
      R.fibers[fi] = g;
    });
  }

  function buildParticles() {
    var types = [C.mito, C.vesicle, C.protein, C.rna];
    for (var i = 0; i < 12; i++) {
      var p = mesh(new THREE.SphereGeometry(0.55, 8, 6), mat(types[i % 4]), i % 4 === 0 ? "mito" : "transport");
      p.userData = { x: -28 + Math.random() * 66, dir: i % 2 ? 1 : -1, speed: 4 + (i % 4) * 1.5, key: p.userData.key };
      scene3.add(p);
      particles.push(p);
    }
    for (var j = 0; j < 4; j++) {
      var q = mesh(new THREE.SphereGeometry(0.5, 8, 6), mat(types[j % 4]));
      q.userData = { x: -26 + Math.random() * 60, dir: j % 2 ? 1 : -1, speed: 4 + j, nb: true };
      scene3.add(q);
      nbParticles.push(q);
    }
  }

  /* ---------- helpers ---------- */

  function setOpacity(obj, k) {
    obj.traverse(function (o) {
      if (o.material) o.material.opacity = (o.userData.baseOpacity || 1) * k;
    });
  }

  function rememberBaseOpacities() {
    scene3.traverse(function (o) {
      if (o.material) o.userData.baseOpacity = o.material.opacity;
    });
  }

  function tween(dur, update, done) {
    tweens.push({ t: 0, dur: dur, update: update, done: done });
  }

  function stepTweens(dt) {
    for (var i = tweens.length - 1; i >= 0; i--) {
      var tw = tweens[i];
      tw.t += dt;
      var k = Math.min(tw.t / tw.dur, 1);
      tw.update(k);
      if (k >= 1) { tweens.splice(i, 1); if (tw.done) tw.done(); }
    }
  }

  /* ---------- transport + pulse ---------- */

  function stepParticles(dt) {
    var cfg = STAGE_TRANSPORT[stage];
    particles.forEach(function (p, i) {
      p.visible = i < cfg.count;
      if (!p.visible) return;
      var u = p.userData;
      u.x += u.dir * u.speed * cfg.speed * dt;
      if (cfg.block !== null && u.dir > 0 && u.x >= cfg.block) { u.dir = -1; }
      if (u.x > 38) u.dir = -1;
      if (u.x < -30) u.dir = 1;
      p.position.set(u.x, u.dir > 0 ? 0.55 : -0.55, 0);
    });
    nbParticles.forEach(function (p) {
      var u = p.userData;
      u.x += u.dir * u.speed * dt;
      if (u.x > 36) u.dir = -1;
      if (u.x < -28) u.dir = 1;
      p.position.set(u.x, 13.5 + (u.dir > 0 ? 0.45 : -0.45), -6);
    });
  }

  function pulse(color) {
    var p = mesh(new THREE.SphereGeometry(1.5, 14, 10),
      new THREE.MeshBasicMaterial({ color: color || C.pulse, transparent: true, opacity: 0.95 }));
    scene3.add(p);
    return p;
  }

  function movePulse(p, curveOrPts, dur, fadeAt, done) {
    var curve = curveOrPts.getPoint ? curveOrPts : new THREE.CatmullRomCurve3(curveOrPts);
    if (reduced) { scene3.remove(p); if (done) done(true); return; }
    tween(dur, function (k) {
      if (fadeAt && k >= fadeAt) { p.material.opacity = 0.95 * (1 - (k - fadeAt) / (1 - fadeAt)); }
      p.position.copy(curve.getPoint(Math.min(k, 0.999)));
    }, function () {
      scene3.remove(p);
      if (done) done(!(fadeAt && 1 >= fadeAt));
    });
  }

  function achBurst(fi, strength) {
    var f = FIBERS[fi];
    for (var i = 0; i < Math.round(6 * strength); i++) {
      (function (i) {
        var d = mesh(new THREE.SphereGeometry(0.32, 6, 5), new THREE.MeshBasicMaterial({ color: C.ach, transparent: true }));
        d.position.set(54.5, f.y, f.z);
        scene3.add(d);
        var off = v3(1.6 + Math.random(), (Math.random() - 0.5) * 1.6, (Math.random() - 0.5) * 1.6);
        tween(0.5, function (k) {
          d.position.set(54.5 + off.x * k, f.y + off.y * k, f.z + off.z * k);
          d.material.opacity = 1 - k;
        }, function () { scene3.remove(d); });
      })(i);
    }
  }

  function contractFiber3d(fi, strength) {
    var g = R.fibers[fi];
    if (!g) return;
    var sx = strength >= 0.99 ? 0.9 : 0.96;
    var sy = strength >= 0.99 ? 1.12 : 1.05;
    tween(0.35, function (k) { g.scale.set(1 + (sx - 1) * k, 1 + (sy - 1) * k, 1 + (sy - 1) * k); },
      function () {
        tween(0.45, function (k) { g.scale.set(sx + (1 - sx) * k, sy + (1 - sy) * k, sy + (1 - sy) * k); });
      });
  }

  /* which fibers of the MAIN unit still respond, per stage (as in 2D) */
  function fibersResponding(n) {
    if (n <= 1) return [2, 3, 4];
    if (n === 2) return [2, 3];
    if (n === 3 || n === 4) return [2];
    return [];
  }

  function playPulse() {
    if (reduced) { flashPath(); return; }
    var n = stage;
    var mainPath = [v3(-45, 0, 0), v3(30, 0, 0)];
    var p = pulse();
    if (n === 5) {
      // MEDICAL: the dying neuron's signal fades on the proximal axon
      movePulse(p, [v3(-45, 0, 0), v3(-10, 0, 0)], 1.2, 0.5, function () { neighborPulse(); });
      return;
    }
    movePulse(p, mainPath, n <= 1 ? 1.6 : 1.1, null, function () {
      var responding = fibersResponding(n);
      [2, 3, 4].forEach(function (fi) {
        var alive = responding.indexOf(fi) !== -1;
        var bp = pulse();
        movePulse(bp, R.branches[fi].userData.curve, 0.8, (!alive && n >= 3) ? 0.55 : null, function (arrived) {
          if (!arrived || !alive) return;
          var s = n === 0 ? 1 : 0.45;
          achBurst(fi, s);
          setTimeout(function () { contractFiber3d(fi, s); }, 350);
        });
      });
      if (n >= 4) setTimeout(neighborPulse, 1300);
    });
  }

  function neighborPulse() {
    var np = pulse(0x8fd0b2);
    movePulse(np, [v3(-45, 14, -8), v3(0, 13.5, -6), v3(53.5, 13.5, -6)], 1.4, null, function () {
      achBurst(1, 1); contractFiber3d(1, 1);
    });
    if (stage >= 4) {
      R.sprouts.children.forEach(function (sp) {
        if (!sp.userData.curve) return;
        var s = pulse(0x8fd0b2);
        movePulse(s, sp.userData.curve, 1.1, null, function (arrived) {
          if (!arrived) return;
          var fi = sp === R.sprouts.children[0] ? 3 : 4;
          achBurst(fi, 0.45); contractFiber3d(fi, 0.4);
        });
      });
    }
  }

  /* reduced-motion journey: brief static highlight instead of movement */
  function flashPath() {
    var mats = [R.axonProx.material];
    if (stage < 5) mats.push(R.axonDist.material);
    mats.forEach(function (m) { m.emissive = new THREE.Color(0x554400); });
    setTimeout(function () {
      mats.forEach(function (m) { m.emissive = new THREE.Color(0x000000); });
    }, 900);
  }

  /* ---------- stage ---------- */

  function setStage(n) {
    stage = n;
    R.stress.visible = n >= 1;

    /* stage 2+: terminal withdrawal; stage 3+: branch/distant die-back */
    setOpacity(R.terminals[4], n >= 2 ? 0.12 : 1);
    setOpacity(R.terminals[3], n >= 3 ? 0.12 : 1);
    setOpacity(R.terminals[2], n >= 5 ? 0.12 : 1);
    setOpacity(R.branches[4], n >= 2 ? (n >= 3 ? 0.18 : 0.4) : 1);
    setOpacity(R.branches[3], n >= 3 ? 0.18 : 1);
    setOpacity(R.branches[2], n >= 5 ? 0.25 : 1);
    R.axonDist.material.opacity = n >= 3 ? (n >= 5 ? 0.25 : 0.55) : 1;
    R.axonProx.material.opacity = n >= 5 ? 0.6 : 1;
    R.swell.visible = n >= 3;

    /* stage 4: neighbor emphasized + sprouts (reinnervation) */
    setOpacity(R.neighbor, n >= 4 ? 1 : 0.45);
    R.sprouts.visible = n >= 4;

    /* fiber responses + stage-5 neurogenic atrophy */
    var fop = { 1: 1, 2: 1, 3: 1, 4: 1 };
    if (n === 2) fop[4] = 0.6;
    if (n === 3) { fop[3] = 0.55; fop[4] = 0.55; }
    if (n === 4) { fop[3] = 0.85; fop[4] = 0.85; }
    Object.keys(R.fibers).forEach(function (fi) {
      var g = R.fibers[fi];
      setOpacity(g, fop[fi]);
      if (n >= 5) {
        var s = fi === "1" ? 1 : fi === "2" ? 0.5 : 0.68;
        g.scale.set(1, s, s);
        setOpacity(g, fi === "1" ? 1 : 0.8);
      } else {
        g.scale.set(1, 1, 1);
      }
    });

    /* stage 5: cell-body degeneration */
    R.soma.scale.setScalar(n >= 5 ? 0.78 : 1);
    R.soma.material.color.setHex(n >= 5 ? C.somaSick : C.soma);
    setOpacity(R.dendrites, n >= 5 ? 0.3 : 1);
  }

  /* ---------- picking (click a structure → explanation) ---------- */

  function onPointerDown(e) { pointerDown = { x: e.clientX, y: e.clientY }; }
  function onPointerUp(e) {
    if (!pointerDown || Math.hypot(e.clientX - pointerDown.x, e.clientY - pointerDown.y) > 6) return;
    var r = renderer.domElement.getBoundingClientRect();
    var mx = ((e.clientX - r.left) / r.width) * 2 - 1;
    var my = -((e.clientY - r.top) / r.height) * 2 + 1;
    raycaster.setFromCamera(new THREE.Vector2(mx, my), camera);
    var hits = raycaster.intersectObjects(scene3.children, true);
    for (var i = 0; i < hits.length; i++) {
      var o = hits[i].object, key = o.userData.key;
      if (key) { if (openInfoCb) openInfoCb(key); return; }
    }
  }

  /* ---------- main loop ---------- */

  function loop(t) {
    rafId = requestAnimationFrame(loop);
    var dt = Math.min((t - lastT) / 1000, 0.1) || 0.016;
    lastT = t;
    if (!reduced) stepParticles(dt);
    stepTweens(dt);
    controls.update();
    renderer.render(scene3, camera);
  }

  function resize() {
    var w = container.clientWidth, h = container.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  /* ---------- public API ---------- */
  return {
    init: function (el, openInfo) {
      container = el;
      openInfoCb = openInfo;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      } catch (err) {
        el.innerHTML = '<p class="webgl-fallback">3D is not available in this browser — the 2D diagram below has the same content.</p>';
        return;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      el.appendChild(renderer.domElement);

      scene3 = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(45, 2, 0.1, 500);
      camera.position.set(8, 14, 108);

      scene3.add(new THREE.HemisphereLight(0xffffff, 0xd8d2c8, 0.95));
      var dir = new THREE.DirectionalLight(0xffffff, 0.55);
      dir.position.set(30, 60, 80);
      scene3.add(dir);

      buildNeuron();
      buildNeighbor();
      buildFibers();
      buildParticles();
      rememberBaseOpacities();

      raycaster = new THREE.Raycaster();
      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.target.set(8, 1, 0);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.autoRotate = !reduced;
      controls.autoRotateSpeed = 0.7;
      controls.minDistance = 30;
      controls.maxDistance = 220;

      renderer.domElement.addEventListener("pointerdown", onPointerDown);
      renderer.domElement.addEventListener("pointerup", onPointerUp);
      window.addEventListener("resize", resize);
      if (window.ResizeObserver) new ResizeObserver(resize).observe(el);

      setStage(stage);
      resize();
      rafId = requestAnimationFrame(loop);
    },
    setStage: function (n) { if (renderer) setStage(n); stage = n; },
    playPulse: function () { if (renderer) playPulse(); },
    setReducedMotion: function (on) {
      reduced = on;
      if (controls) controls.autoRotate = !on;
    }
  };
})();
