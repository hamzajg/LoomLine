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

function block(css: string, selector: string): Tokens {
  const start = css.indexOf(selector);
  if (start === -1) throw new Error(`missing selector ${selector}`);
  const open = css.indexOf("{", start);
  const close = css.indexOf("}", open);
  if (open === -1 || close === -1) throw new Error(`missing body for ${selector}`);
  return parseTokens(css.slice(open + 1, close));
}

function mediaDark(css: string): Tokens {
  const media = css.indexOf("@media (prefers-color-scheme: dark)");
  if (media === -1) throw new Error("missing prefers-color-scheme: dark block");
  const root = css.indexOf(":root", media);
  const open = css.indexOf("{", root);
  const close = css.indexOf("}", open);
  return parseTokens(css.slice(open + 1, close));
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

const css = read("./tokens.css");
const styles = read("../styles.css");
const light = block(css, ":root {");
const dark = block(css, ':root[data-theme="dark"]');
const darkOs = mediaDark(css);

const PAIRS: Array<[string, string]> = [
  ["--ll-color-text", "--ll-color-surface"],
  ["--ll-color-text-muted", "--ll-color-canvas"],
  ["--ll-color-text-muted", "--ll-color-surface"],
  ["--ll-color-text-subtle", "--ll-color-canvas"],
  ["--ll-color-text-subtle", "--ll-color-surface"],
  ["--ll-color-text-subtle", "--ll-color-surface-muted"],
  ["--ll-color-text-subtle", "--ll-color-surface-sunken"],
  ["--ll-color-accent-fg", "--ll-color-accent"],
  ["--ll-color-danger-contrast", "--ll-color-danger"],
  ["--ll-color-info-fg", "--ll-color-info-bg"],
  ["--ll-color-success-fg", "--ll-color-success-bg"],
  ["--ll-color-warning-fg", "--ll-color-warning-bg"],
  ["--ll-color-danger-fg", "--ll-color-danger-bg"],
  ["--ll-color-selection-ink", "--ll-color-selection-bg"],
  ["--ll-color-chrome-fg", "--ll-color-chrome"],
  ["--ll-color-chrome-fg-muted", "--ll-color-chrome"],
  ["--ll-color-disabled-ink", "--ll-color-disabled-bg"],
];

describe("design tokens — AA contrast (ADR 0014)", () => {
  it.each(["light", "dark"] as const)("%s mode meets 4.5:1 for every text pair", (mode) => {
    const tokens = mode === "light" ? light : dark;
    for (const [fg, bg] of PAIRS) {
      const ratio = contrast(tok(tokens, fg), tok(tokens, bg));
      expect(ratio, `${mode}: ${fg} on ${bg} = ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("the OS dark block matches the forced dark theme", () => {
    for (const [name, value] of Object.entries(dark)) {
      expect(darkOs[name], name).toBe(value);
    }
  });

  it("declares an explicit colour scheme for both modes", () => {
    expect(css).toMatch(/:root\s*\{[^}]*color-scheme:\s*light/);
    expect(css).toMatch(/:root\[data-theme="dark"\]\s*\{[^}]*color-scheme:\s*dark/);
  });

  it("selection uses a design token", () => {
    expect(styles).toMatch(/::selection\s*\{[^}]*var\(--ll-[a-z-]+\)/);
  });
});
