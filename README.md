# Lower Motor Neuron & ALS — Interactive Visualization

This project is an educational, interactive single-page visualization. It
shows the lower motor unit and selected changes related to amyotrophic lateral
sclerosis (ALS).

The lower motor unit in the visualization is:
motor-neuron cell body → axon → neuromuscular junction (NMJ) → muscle fibers.

The timeline shows illustrative teaching states. The timeline is not a clinical
staging system or a prediction of disease progression.

**This is an educational illustration, not medical advice, not a diagnostic
tool, and not treatment guidance. It is schematic and not to scale; the
teaching states are not clinical stages or a patient timeline.**

## Controls

- **Timeline / slider**: Moves between the healthy state and five illustrative
  teaching states.
- **Normal / ALS-affected buttons**: Go directly to one of the two modes.
- **Signal journey**: Animates a voluntary motor command from the cell body to
  muscle contraction. In ALS-related states, it shows where the journey fails.
- **Click any label or structure**: Shows the normal role of the structure and
  how ALS affects it.
- **Spinal cord cross-section**: Shows the anterior horn. The lower
  motor-neuron cell bodies are in the anterior horn.
- **Reduce motion**: Turns off the animation. If the operating system requests
  reduced motion, the page turns on Reduce motion automatically.

## Requirements

- To view the page: a current desktop or mobile browser
- To serve the files and run the browser check (optional): Python 3
- To run the static check: Node.js

The project needs no backend and no build step.

## Run locally

Use one of these two methods.

### Method 1: Open the file

1. Double-click `index.html` in a file browser.

### Method 2: Serve the files (optional, recommended)

1. Open a terminal in the folder that contains the clone.
2. Run these commands:

   ```bash
   cd als-neuron-animation
   python3 -m http.server 8000
   # then open http://localhost:8000 in a browser
   ```

## Checks

The project has two checks: a static check and a browser check.

### Static check

CI uses this static check. The static check has no dependencies.

1. Run:

   ```bash
   node tests/smoke.mjs
   ```

   Result: the static check prints `Static ALS smoke checks passed.`

### Browser check

The browser check (`tests/browser-smoke.html`) tests behavior in a real
browser.

1. In the `als-neuron-animation` folder, serve the files:

   ```bash
   python3 -m http.server 8000 --bind 127.0.0.1
   ```

2. Open `http://127.0.0.1:8000/tests/browser-smoke.html` in a browser.

   Result: the page must show **Passed**. If an assertion fails, the page
   names the behavior to inspect.

The browser check loads the real `index.html` in an iframe. It checks these
behaviors:

- dialog focus containment and return
- Escape close
- timeline values 0–5
- the reduced-motion control

## Code layout

| File | Purpose |
|---|---|
| `index.html` | Page structure: controls, panels, footer |
| `css/style.css` | Medical-illustration styling, responsive layout, stage-based SVG states |
| `js/data.js` | All medical/scientific text (labels, teaching-state descriptions, disclaimers) |
| `js/scene.js` | Builds the SVG scene (neuron, axon, NMJ, muscle) and the spinal-cord cross-section |
| `js/scene3d.js` | Interactive 3D model (Three.js): orbit/zoom, clickable structures, synced with the same teaching states and signal journey |
| `js/animation.js` | Axonal-transport particles, signal-journey animation, per-state behavior |
| `js/app.js` | UI wiring: timeline, modes, info panel, keyboard access, reduced motion |
| `js/vendor/` | Vendored Three.js r128 + OrbitControls (local copies, so the 3D model works offline and from `file://`) |

- `MEDICAL:` comments in the code mark the medically important sections.
- [`SOURCES.md`](SOURCES.md) records the simplified educational claims and
  their source mapping.
- [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) records the vendored
  Three.js files and their exact upstream checksums.

## Limits

- The repeatable browser check ran in Chromium. This result does not establish
  cross-browser or mobile equivalence.
- The browser check does not establish full accessibility conformance,
  clinical validity or cross-browser equivalence. These need separate review.

## License

Original project source is licensed under the [MIT License](LICENSE). The
vendored Three.js files retain their upstream MIT notice, recorded in
[`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md). External sources and
trademarks remain the property of their respective owners.
