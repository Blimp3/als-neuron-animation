# Lower Motor Neuron & ALS — Interactive Visualization

An educational, interactive single-page visualization of the lower motor unit
(motor-neuron cell body → axon → neuromuscular junction → muscle fibers) and
selected ALS-related changes. The timeline presents illustrative teaching
states; it is not a clinical staging system or a prediction of disease
progression.

**This is an educational illustration, not medical advice, not a diagnostic
tool, and not treatment guidance. It is schematic and not to scale; the
teaching states are not clinical stages or a patient timeline.**

## Running locally

No backend and no build step are required. Either:

- **Simply open the file:** double-click `index.html` in a file browser, or
- **Serve it (optional, recommended):**

  ```bash
  cd als-website
  python3 -m http.server 8000
  # then open http://localhost:8000 in a browser
  ```

The page is intended to run in current desktop and mobile browsers. The
repeatable browser check below was run in Chromium; it does not establish
cross-browser or mobile equivalence.

## Checks

The dependency-free static check used by CI is:

```bash
node tests/smoke.mjs
```

For a real-browser behavior check, serve the repository:

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Open `http://127.0.0.1:8000/tests/browser-smoke.html` in a browser. The page
must report **Passed**; a failed assertion names the behavior to inspect.

The browser harness loads the real `index.html` in an iframe and checks dialog
focus containment and return, Escape close, timeline values 0–5 and the
reduced-motion control. It does not establish full accessibility conformance,
clinical validity or cross-browser equivalence; those require separate review.

## Using the visualization

- **Timeline / slider** — move between the healthy state and five illustrative
  teaching states.
- **Normal / ALS-affected buttons** — jump straight to either mode.
- **Signal journey** — animates a voluntary motor command from the cell body to
  muscle contraction; in ALS-related states it shows where the journey fails.
- **Click any label or structure** — shows its normal role and how ALS affects it.
- **Spinal cord cross-section** — shows the anterior horn, where lower
  motor-neuron cell bodies are located.
- **Reduce motion** — disables animation (also auto-enabled when the operating
  system requests reduced motion).

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

Medically important sections are marked with `MEDICAL:` comments in the code.
The simplified educational claims and their source mapping are recorded in
[`SOURCES.md`](SOURCES.md). Vendored Three.js files and their exact upstream
checksums are recorded in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

## License

Original project source is licensed under the [MIT License](LICENSE). The
vendored Three.js files retain their upstream MIT notice, recorded in
[`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md). External sources and
trademarks remain the property of their respective owners.
