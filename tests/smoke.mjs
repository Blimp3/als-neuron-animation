import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const root = new URL("..", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

const [readme, index, browserSmoke, sources, notices] = await Promise.all([
  read("README.md"),
  read("index.html"),
  read("tests/browser-smoke.html"),
  read("SOURCES.md"),
  read("THIRD_PARTY_NOTICES.md")
]);

assert.match(readme, /cd als-website/);
assert.match(readme, /illustrative teaching/);
assert.match(index, /aria-label="Illustrative teaching states"/);
assert.match(index, /Teaching states: healthy/);
assert.match(index, /WebGL-disabled|2D diagram below|2D diagram/);
assert.match(browserSmoke, /iframe/);
assert.match(browserSmoke, /\.\.\/index\.html/);
assert.match(browserSmoke, /data-status/);
assert.match(sources, /NCBI Bookshelf/);
assert.match(sources, /does not implement a clinical staging system/);
assert.match(notices, /Three\.js `r128`/);

const expectedHashes = {
  "js/vendor/three.min.js":
    "9274bbcec8d96168626c732b5d31c775aa8cfb7eaa0599bec0c175908a2c1ce2",
  "js/vendor/OrbitControls.js":
    "02bb4ade710f3e607329e37a21f098bc3ac70eb6e33daf8a65e79f4db785e7b2"
};

for (const [path, expected] of Object.entries(expectedHashes)) {
  const digest = createHash("sha256").update(await readFile(new URL(path, root))).digest("hex");
  assert.equal(digest, expected, `${path} no longer matches the documented upstream r128 file`);
}

console.log("Static ALS smoke checks passed.");
