/** Pick a representative chromatic family, ignoring black borders and highlights. */
export function dominantColor(bgra: Uint8Array): string {
  const bins = Array.from({ length: 24 }, () => ({
    weight: 0,
    r: 0,
    g: 0,
    b: 0,
  }));
  let gray = 0,
    count = 0;
  for (let i = 0; i + 3 < bgra.length; i += 4) {
    if (bgra[i + 3] < 128) continue;
    const r = bgra[i + 2] / 255,
      g = bgra[i + 1] / 255,
      b = bgra[i] / 255;
    const max = Math.max(r, g, b),
      min = Math.min(r, g, b),
      d = max - min;
    const light = (max + min) / 2;
    if (light < 0.08 || light > 0.92) continue;
    gray += light;
    count++;
    if (d < 0.07) continue;
    const sat = d / (1 - Math.abs(2 * light - 1));
    let h =
      max === r
        ? ((g - b) / d) % 6
        : max === g
          ? (b - r) / d + 2
          : (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
    const weight = (0.2 + sat) * Math.sqrt(Math.sin(light * Math.PI));
    const bin = bins[Math.floor(h / 15) % 24];
    bin.weight += weight;
    bin.r += r * weight;
    bin.g += g * weight;
    bin.b += b * weight;
  }
  const winner = bins.reduce((a, b) => (a.weight > b.weight ? a : b));
  if (!winner.weight) {
    const n = count
      ? Math.max(70, Math.min(155, Math.round((gray / count) * 255)))
      : 110;
    return (
      "#" +
      [n, Math.min(170, n + 7), Math.min(190, n + 18)]
        .map((v) => v.toString(16).padStart(2, "0"))
        .join("")
    );
  }
  const rgb = [winner.r, winner.g, winner.b].map((v) => v / winner.weight);
  const max = Math.max(...rgb);
  const gain = max < 0.5 ? 0.58 / max : 1;
  return (
    "#" +
    rgb
      .map((v) =>
        Math.round(Math.max(0, Math.min(1, v * gain)) * 255)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}
