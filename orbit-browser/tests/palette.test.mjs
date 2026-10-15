import { test } from "node:test";
import assert from "node:assert/strict";
import { dominantColor } from "../electron/browser/palette.ts";
const bitmap = (colors) =>
  Uint8Array.from(colors.flatMap(([r, g, b, a = 255]) => [b, g, r, a]));
test("green wallpaper produces a green tint", () => {
  const hex = dominantColor(
    bitmap(Array.from({ length: 100 }, () => [30, 180, 65])),
  );
  const rgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  assert(rgb[1] > rgb[0] * 2 && rgb[1] > rgb[2] * 2);
});
test("ignores black borders and white highlights", () => {
  assert.equal(
    dominantColor(
      bitmap([
        [255, 255, 255],
        [0, 0, 0],
        [25, 65, 200],
        [25, 65, 200],
      ]),
    ),
    dominantColor(bitmap([[25, 65, 200]])),
  );
});
test("neutral and transparent images have a valid fallback", () => {
  for (const pixels of [[], [[100, 100, 100]], [[255, 0, 0, 0]]])
    assert.match(dominantColor(bitmap(pixels)), /^#[a-f\d]{6}$/);
});
test("small bright detail does not replace the dominant hue", () => {
  const color = dominantColor(
    bitmap([
      ...Array.from({ length: 100 }, () => [30, 140, 60]),
      [250, 15, 20],
    ]),
  );
  const rgb = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));
  assert(rgb[1] > rgb[0] && rgb[1] > rgb[2]);
});
