import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

type Tokens = Record<string, string>;

function read(relative: string): string {
  return readFileSync(new URL(relative, import.meta.url).pathname, "utf8");
}

function parseTokens(css: string): Tokens {
  const tokens: Tokens = {};
  const pattern = /(--[a-z0-9-]+)\s*:\s*([^;]+);/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(css)) !== null) {
    const [, name, value] = match;
    if (name && value) tokens[name] = value.trim();
  }
  return tokens;
}

function tok(tokens: Tokens, name: string): string {
  const value = tokens[name];
  if (!value) throw new Error(`missing design token ${name}`);
  return value;
}

function rgb(value: string): [number, number, number] {
  const hex = value.replace("#", "").trim();
  const full =
    hex.length === 3
      ? hex
          .split("")
          .map((c) => c + c)
          .join("")
      : hex;
  if (!/^[0-9a-f]{6}$/i.test(full)) throw new Error(`not a hex colour: ${value}`);
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function luminance([r, g, b]: [number, number, number]): number {
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(fg: string, bg: string): number {
  const a = luminance(rgb(fg));
  const b = luminance(rgb(bg));
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

const tokens = parseTokens(read("./tokens.css"));
const styles = read("../styles.css");

describe("design tokens — AA contrast (ADR 0014)", () => {
  it("subtle text meets 4.5:1 on every surface", () => {
    const subtle = tok(tokens, "--ll-color-text-subtle");
    for (const surface of [
      "--ll-color-canvas",
      "--ll-color-surface",
      "--ll-color-surface-muted",
      "--ll-color-surface-sunken",
    ]) {
      expect(contrast(subtle, tok(tokens, surface))).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("accent foreground meets 4.5:1 on the accent fill", () => {
    expect(
      contrast(tok(tokens, "--ll-color-accent-fg"), tok(tokens, "--ll-color-accent")),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it("selection uses a design token", () => {
    expect(styles).toMatch(/::selection\s*\{[^}]*var\(--ll-[a-z-]+\)/);
  });
});
