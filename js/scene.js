/* ============================================================
 * scene.js — Builds the SVG scenes as strings.
 *
 * Two scenes are produced:
 *   1. buildSceneSVG()        — the lower motor unit:
 *      spinal-cord anterior horn with the motor-neuron cell body,
 *      dendrites, axon hillock, a long myelinated peripheral axon,
 *      neuromuscular junctions, and the muscle fibers of the motor
 *      unit. A fainter NEIGHBORING healthy motor neuron is included
 *      because it is needed for stage 4 (collateral reinnervation).
 *   2. buildCrossSectionSVG() — spinal-cord cross-section showing
 *      the anterior horn.
 *
 * Coordinates live in a 1240 x 660 viewBox; the SVG scales to any
 * screen width. Stage changes are applied mostly by swapping the
 * class stage0..stage5 on the root <svg> (see style.css).
 * ============================================================ */

const SceneBuilder = (function () {
  "use strict";

  /* ---- small helpers to keep the markup readable ---- */
  function myelinSegs(xs, y, h, cls) {
    // One Schwann cell + myelin segment per entry. Gaps between
    // segments are the nodes of Ranvier.
    return xs.map(function (x, i) {
      var w = x[1] - x[0];
      return '<g class="myelin-seg ' + cls + '" data-key="myelin">' +
        '<rect class="myelin" x="' + x[0] + '" y="' + (y - h / 2) + '" width="' + w + '" height="' + h + '" rx="' + (h / 2) + '"/>' +
        '<ellipse class="schwann-nucleus" data-key="schwann" cx="' + (x[0] + w * 0.4) + '" cy="' + (y - h / 2 - 2) + '" rx="7" ry="4.5"/>' +
        '</g>';
    }).join("");
  }

  function boutons(cx, cy, cls) {
    // Cluster of synaptic boutons forming a motor axon terminal.
    var pts = [[-6, -9], [2, -5], [-5, 1], [3, 5], [-3, 10]];
    return '<g class="terminal ' + cls + '">' + pts.map(function (p) {
      return '<circle class="bouton" cx="' + (cx + p[0]) + '" cy="' + (cy + p[1]) + '" r="5"/>';
    }).join("") + "</g>";
  }

  function striations(x, y, w, h) {
    // Skeletal muscle is striated muscle: draw the cross-striations.
    var out = "";
    for (var i = x + 26; i < x + w - 12; i += 32) {
      out += '<line class="striation" x1="' + i + '" y1="' + (y + 7) + '" x2="' + i + '" y2="' + (y + h - 7) + '"/>';
    }
    return out;
  }

  function fiber(cls, x, y, w, h, label) {
    return '<g class="fiber ' + cls + '" data-key="fiber">' +
      '<rect class="fiber-body" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (h / 2) + '"/>' +
      striations(x, y, w, h) +
      '<text class="fiber-tag" x="' + (x + w - 8) + '" y="' + (y + h / 2 + 4) + '">' + label + "</text>" +
      "</g>";
  }

  /* Clickable text label with a leader line to its structure. */
  function lbl(key, tx, ty, px, py, text, stages) {
    return '<g class="lbl" data-key="' + key + '" data-stages="' + (stages || "all") + '" tabindex="0" role="button" aria-label="' + text + ' — show explanation">' +
      '<line class="leader" x1="' + tx + '" y1="' + (ty + 4) + '" x2="' + px + '" y2="' + py + '"/>' +
      '<circle class="leader-dot" cx="' + px + '" cy="' + py + '" r="3"/>' +
      '<text class="lbl-text" x="' + tx + '" y="' + ty + '">' + text + "</text>" +
      "</g>";
  }

  function buildSceneSVG() {
    var mainMyelin = myelinSegs(
      [[350, 425], [439, 514], [528, 603], [617, 692], [706, 781], [795, 852]],
      330, 30, "main");
    var neighborMyelin = myelinSegs(
      [[280, 345], [359, 424], [438, 503], [517, 582], [596, 661], [675, 740], [754, 819], [833, 898]],
      185, 20, "nb");

    return '' +
'<svg id="scene" class="stage0" viewBox="0 0 1240 660" role="img" aria-label="Diagram of a lower motor neuron, its axon, neuromuscular junctions and muscle fibers">' +

  /* ---- background zones ---- */
  '<rect class="zone zone-cord" x="28" y="118" width="292" height="452" rx="120"/>' +
  '<text class="caption" x="72" y="550">Spinal cord — anterior (ventral) horn</text>' +
  '<rect class="zone zone-muscle" x="958" y="96" width="268" height="502" rx="22"/>' +
  '<text class="caption" x="1004" y="118">Skeletal muscle</text>' +

  /* ============================================================
   * NEIGHBORING motor neuron (healthy). MEDICAL: included so that
   * stage 4 can show collateral sprouting / reinnervation from a
   * surviving neuron — the real source of compensation in ALS.
   * ============================================================ */
  '<g id="neighbor">' +
    '<path class="dendrite nb" d="M152,128 C140,114 128,106 116,96"/>' +
    '<path class="dendrite nb" d="M146,146 C128,142 114,140 100,138"/>' +
    '<path class="dendrite nb" d="M158,172 C148,184 138,192 128,200"/>' +
    '<path class="axon-line nb" d="M205,164 C224,172 240,182 258,184 L945,185"/>' +
    neighborMyelin +
    '<path class="axon-line nb nb-term" d="M945,185 C965,180 978,166 985,156"/>' +
    boutons(988, 148, "nb-term-boutons") +
    /* Collateral sprouts — hidden until stage 4 (reinnervation) */
    '<path id="sprout-f3" class="sprout" d="M850,186 C905,205 948,378 981,412"/>' +
    '<path id="sprout-f4" class="sprout" d="M868,186 C925,215 952,498 982,544"/>' +
    '<g class="sprout-boutons">' + boutons(984, 414, "sp3") + boutons(985, 546, "sp4") + "</g>" +
    '<path class="soma nb" d="M175,112 C197,112 212,130 212,150 C212,172 196,188 175,188 C154,188 140,172 140,150 C140,128 153,112 175,112 Z"/>' +
    '<circle class="nucleus nb" cx="175" cy="150" r="14"/>' +
    '<circle class="nucleolus nb" cx="175" cy="150" r="4.5"/>' +
    '<text class="caption nb-cap" x="218" y="146">Neighboring motor neuron (surviving)</text>' +
  "</g>" +

  /* ============================================================
   * MAIN lower motor neuron — the cell whose fate we follow.
   * ============================================================ */
  '<g id="main-neuron">' +
    /* Dendritic tree (receives synaptic input) */
    '<g id="main-dendrites" data-key="dendrites">' +
      '<path class="dendrite" d="M152,296 C136,272 118,258 98,238"/>' +
      '<path class="dendrite thin" d="M120,260 C108,252 96,250 84,244"/>' +
      '<path class="dendrite" d="M138,322 C112,318 92,318 66,314"/>' +
      '<path class="dendrite thin" d="M100,318 C90,310 82,304 74,296"/>' +
      '<path class="dendrite" d="M148,362 C130,384 116,398 100,420"/>' +
      '<path class="dendrite thin" d="M122,392 C112,398 102,400 92,406"/>' +
      '<path class="dendrite" d="M186,282 C186,258 184,238 180,216"/>' +
      '<path class="dendrite thin" d="M183,250 C176,240 170,234 164,226"/>' +
      '<path class="dendrite" d="M190,378 C196,398 200,414 204,432"/>' +
    "</g>" +

    /* Axon hillock — MEDICAL: the trigger zone that initiates the action potential */
    '<path id="hillock" data-key="hillock" d="M222,322 L248,330 L222,338 Z"/>' +

    /* Axon: proximal (healthy-ish in ALS) and distal (degenerates first — "dying back") */
    '<path id="axon-prox" class="axon-line" d="M244,330 L620,330"/>' +
    '<path id="axon-dist" class="axon-line" d="M620,330 L862,330"/>' +
    mainMyelin +
    /* MEDICAL: axonal swellings (spheroids) — stalled-transport cargo accumulates */
    '<g id="axon-swell"><circle cx="655" cy="330" r="10"/><circle cx="770" cy="330" r="8"/></g>' +

    /* Distal arborization: one branch per muscle fiber of the motor unit */
    '<path class="branch b2" d="M862,330 C905,328 945,295 982,286"/>' +
    '<path class="branch b3" d="M862,330 C905,334 948,405 982,416"/>' +
    '<path class="branch b4" d="M862,330 C908,338 950,525 983,549"/>' +
    boutons(985, 288, "t2") + boutons(984, 418, "t3") + boutons(985, 551, "t4") +

    /* Cell body with nucleus; stress markers appear in ALS stage 1 */
    '<g id="main-soma-group" data-key="soma">' +
      '<path id="main-soma" d="M175,272 C205,272 226,296 228,326 C230,356 210,384 180,388 C150,392 124,372 122,340 C120,308 145,272 175,272 Z"/>' +
      '<circle class="nucleus" cx="175" cy="330" r="24"/>' +
      '<circle class="nucleolus" cx="175" cy="330" r="7"/>' +
      /* MEDICAL: misfolded-protein aggregates (e.g. TDP-43-like clumps) */
      '<g class="agg"><circle cx="150" cy="306" r="5"/><circle cx="204" cy="316" r="4"/><circle cx="158" cy="356" r="4.5"/><circle cx="200" cy="352" r="5.5"/><circle cx="140" cy="332" r="3.5"/></g>' +
      /* MEDICAL: swollen/dysfunctional mitochondria in the soma */
      '<g class="stress-mito"><ellipse cx="196" cy="296" rx="8" ry="4.5"/><ellipse cx="146" cy="344" rx="7" ry="4"/></g>' +
      /* MEDICAL: altered RNA processing — RNA clumps in the nucleus */
      '<circle class="rna-clump" cx="183" cy="338" r="4"/>' +
      /* MEDICAL: oxidative stress — reactive oxygen species marks */
      '<g class="ros"><path d="M132,286 l3,7 7,3 -7,3 -3,7 -3,-7 -7,-3 7,-3 Z"/><path d="M226,304 l2.5,6 6,2.5 -6,2.5 -2.5,6 -2.5,-6 -6,-2.5 6,-2.5 Z"/><path d="M208,372 l2.5,6 6,2.5 -6,2.5 -2.5,6 -2.5,-6 -6,-2.5 6,-2.5 Z"/></g>' +
    "</g>" +
  "</g>" +

  /* ---- Muscle fibers of the motor unit (F2–F4) + neighbor's fiber (F1) ---- */
  fiber("f1", 1000, 124, 216, 52, "F1") +
  fiber("f2", 1000, 259, 216, 52, "F2") +
  fiber("f3", 1000, 394, 216, 52, "F3") +
  fiber("f4", 1000, 529, 216, 52, "F4") +

  /* NMJ receptor region marks on the fiber edges */
  '<g class="nmj-marks">' +
    '<path class="nmj-arc" data-key="nmj" d="M1000,142 q-10,8 0,16"/>' +
    '<path class="nmj-arc" data-key="nmj" d="M1000,277 q-10,8 0,16"/>' +
    '<path class="nmj-arc" data-key="nmj" d="M1000,412 q-10,8 0,16"/>' +
    '<path class="nmj-arc" data-key="nmj" d="M1000,547 q-10,8 0,16"/>' +
  "</g>" +

  /* Motor-unit bracket: one neuron + all its fibers = one motor unit */
  '<g class="lbl unit-lbl" data-key="unit" data-stages="all" tabindex="0" role="button" aria-label="Motor unit — show explanation">' +
    '<path class="unit-bracket" d="M1005,600 v12 h206 v-12"/>' +
    '<text class="lbl-text" x="1108" y="642">Motor unit (one neuron + its fibers)</text>' +
  "</g>" +

  /* ---- dynamic layers (filled by animation.js) ---- */
  '<g id="particles"></g>' +
  '<g id="ach-layer"></g>' +
  '<g id="pulse-layer"></g>' +

  /* ---- clickable labels (leader lines point at structures) ---- */
  '<g id="labels">' +
    lbl("soma", 34, 58, 150, 290, "Motor-neuron cell body") +
    lbl("dendrites", 34, 92, 108, 258, "Dendrites") +
    lbl("hillock", 238, 212, 233, 324, "Axon hillock") +
    lbl("axon", 282, 250, 297, 326, "Axon") +
    lbl("schwann", 352, 250, 380, 310, "Schwann cell") +
    lbl("myelin", 470, 250, 480, 314, "Myelin sheath") +
    lbl("mito", 420, 452, 372, 337, "Mitochondria") +
    lbl("transport", 596, 452, 688, 338, "Axonal-transport system") +
    lbl("terminal", 862, 238, 983, 284, "Motor axon terminal") +
    lbl("nmj", 1052, 238, 1004, 283, "Neuromuscular junction") +
    lbl("ach", 1130, 340, 1012, 292, "Acetylcholine", "0,1") +
    lbl("fiber", 1152, 212, 1150, 258, "Muscle fiber") +
    lbl("denervation", 756, 585, 968, 548, "Denervation", "2,3,4,5") +
    lbl("reinnervation", 690, 505, 928, 424, "Reinnervation", "4,5") +
    lbl("atrophy", 1122, 348, 1122, 292, "Muscle atrophy", "5") +
  "</g>" +

  /* ---- invisible fat hit-areas so structures themselves are clickable ---- */
  '<g id="hits">' +
    '<path class="hit" data-key="axon" d="M250,330 L862,330"/>' +
    '<circle class="hit" data-key="soma" cx="175" cy="330" r="58"/>' +
    '<path class="hit" data-key="transport" d="M350,330 L850,330" style="stroke-width:44"/>' +
    '<path class="hit" data-key="terminal" d="M862,330 C908,338 950,525 983,549"/>' +
    '<path class="hit" data-key="terminal" d="M862,330 C905,328 945,295 982,286"/>' +
    '<path class="hit" data-key="terminal" d="M862,330 C905,334 948,405 982,416"/>' +
  "</g>" +
"</svg>";
  }

  /* Spinal-cord cross-section: butterfly gray matter, anterior horn
   * highlighted — where lower motor-neuron cell bodies live. */
  function buildCrossSectionSVG() {
    return '' +
'<svg id="cross-section" viewBox="0 0 420 400" role="img" aria-label="Spinal cord cross-section highlighting the anterior horn">' +
  '<ellipse class="cs-cord" cx="210" cy="195" rx="178" ry="158"/>' +
  /* dorsal root (sensory, top) and ventral root (motor, bottom) */
  '<path class="cs-root" d="M196,42 C192,26 188,16 184,8"/>' +
  '<path class="cs-root" d="M224,42 C228,26 232,16 236,8"/>' +
  '<path class="cs-root" d="M205,348 C202,366 200,380 198,392"/>' +
  '<path class="cs-root" d="M218,348 C221,366 223,380 225,392"/>' +
  /* gray matter butterfly */
  '<path class="cs-gray" d="M210,55 C192,58 180,72 178,95 C176,118 186,140 178,165 C170,190 152,205 140,224 C128,243 123,265 131,286 C141,310 173,322 210,322 C247,322 279,310 289,286 C297,265 292,243 280,224 C268,205 250,190 242,165 C234,140 244,118 242,95 C240,72 228,58 210,55 Z"/>' +
  /* anterior (ventral) horns — MEDICAL: lower motor-neuron cell bodies sit here */
  '<path class="cs-horn" d="M138,225 C126,245 122,267 130,287 C140,311 172,323 210,323 L210,240 C188,238 158,232 138,225 Z"/>' +
  '<path class="cs-horn" d="M282,225 C294,245 298,267 290,287 C280,311 248,323 210,323 L210,240 C232,238 262,232 282,225 Z"/>' +
  /* a few motor-neuron cell bodies drawn in the anterior horn */
  '<g class="cs-mn"><circle cx="172" cy="272" r="7"/><circle cx="205" cy="292" r="7"/><circle cx="248" cy="272" r="7"/></g>' +
  '<circle class="cs-canal" cx="210" cy="192" r="5"/>' +
  '<line class="cs-mid" x1="210" y1="48" x2="210" y2="340"/>' +
  /* labels */
  '<text class="cs-lbl" x="14" y="60">Posterior (dorsal) horn — sensory</text>' +
  '<line class="cs-leader" x1="120" y1="64" x2="180" y2="105"/>' +
  '<text class="cs-lbl" x="238" y="120">White matter</text>' +
  '<line class="cs-leader" x1="312" y1="124" x2="318" y2="170"/>' +
  '<text class="cs-lbl" x="14" y="200">Gray matter (butterfly shape)</text>' +
  '<line class="cs-leader" x1="106" y1="192" x2="150" y2="180"/>' +
  '<text class="cs-lbl strong" x="16" y="368">Anterior (ventral) horn —</text>' +
  '<text class="cs-lbl strong" x="16" y="384">lower motor-neuron cell bodies</text>' +
  '<line class="cs-leader" x1="150" y1="362" x2="172" y2="300"/>' +
  '<text class="cs-lbl" x="404" y="368" text-anchor="end">Ventral root — motor axons exit</text>' +
  '<line class="cs-leader" x1="250" y1="360" x2="222" y2="348"/>' +
"</svg>";
  }

  return { buildSceneSVG: buildSceneSVG, buildCrossSectionSVG: buildCrossSectionSVG };
})();
