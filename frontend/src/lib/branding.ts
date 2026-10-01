export interface BrandColors {
  primary: string;
  secondary: string;
  accent: string;
}

const HEX = /^#[0-9a-f]{6}$/i;

const toRgb = (hex: string): [number, number, number] => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];

const toHex = (rgb: number[]): string =>
  `#${rgb.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`;

/** WCAG relative luminance of a #rrggbb color. */
function luminance(hex: string): number {
  const [r, g, b] = toRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Darkens a color by mixing it with black; used for hover/pressed states. */
const darken = (hex: string, amount: number): string => toHex(toRgb(hex).map((c) => c * (1 - amount)));

/** Near-black or white, whichever reads better on `background`. */
const readableOn = (background: string): string => (luminance(background) > 0.4 ? '#0f172a' : '#ffffff');

/**
 * Applies a school's brand colors to the document. Invalid values are ignored
 * so a bad database value can never blank out the UI.
 */
export function applyBrandColors({ primary, secondary, accent }: BrandColors): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement.style;

  if (HEX.test(primary)) {
    root.setProperty('--primary', primary);
    root.setProperty('--primary-hover', darken(primary, 0.12));
    root.setProperty('--primary-foreground', readableOn(primary));
  }
  if (HEX.test(secondary)) root.setProperty('--secondary', secondary);
  if (HEX.test(accent)) root.setProperty('--accent', accent);
}
