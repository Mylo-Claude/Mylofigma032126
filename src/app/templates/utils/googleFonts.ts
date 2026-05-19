import type { Template, TemplateStyle, CSSProperties } from '../../mylo/template';

export type FontStyle = 'normal' | 'italic';

export type FontFamilyMetadata = {
  family: string;
  source: 'google' | 'system' | 'fallback';
  weights: number[];
  styles: {
    normal: number[];
    italic: number[];
  };
  isVariable?: boolean;
};

export type FontLoadRequest = {
  family: string;
  styles: {
    normal: number[];
    italic: number[];
  };
};

type GoogleFontApiItem = {
  family?: string;
  variants?: string[];
  axes?: Array<{
    tag?: string;
    start?: number;
    end?: number;
  }>;
};

export const FALLBACK_FONTS: string[] = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Merriweather',
  'Playfair Display',
  'Source Serif 4',
  'Nunito',
  'Raleway',
  'Oswald',
  'Montserrat',
  'PT Serif',
  'Noto Serif',
  'EB Garamond',
  'Libre Baskerville',
  'Crimson Text',
  'Cormorant Garamond',
  'DM Sans',
  'Instrument Serif',
  'Karla',
  'Josefin Sans',
  'Bitter',
  'Spectral',
  'Arvo',
  'Caveat',
];

const SYSTEM_FONT_NAMES = new Set([
  'system-ui',
  '-apple-system',
  'blinkmacsystemfont',
  'arial',
  'helvetica',
  'georgia',
  'times new roman',
  'serif',
  'sans-serif',
  'monospace',
  'cursive',
  'fantasy',
]);

const SYSTEM_FONT_METADATA: FontFamilyMetadata[] = [
  createMetadata('system-ui', 'system', [400, 700], [400, 700]),
  createMetadata('-apple-system', 'system', [400, 700], [400, 700]),
  createMetadata('BlinkMacSystemFont', 'system', [400, 700], [400, 700]),
  createMetadata('Arial', 'system', [400, 700], [400, 700]),
  createMetadata('Helvetica', 'system', [400, 700], [400, 700]),
  createMetadata('Georgia', 'system', [400, 700], [400, 700]),
  createMetadata('Times New Roman', 'system', [400, 700], [400, 700]),
  createMetadata('serif', 'system', [400, 700], [400, 700]),
  createMetadata('sans-serif', 'system', [400, 700], [400, 700]),
  createMetadata('monospace', 'system', [400, 700], [400, 700]),
  createMetadata('cursive', 'system', [400], [400]),
  createMetadata('fantasy', 'system', [400], [400]),
];

const FALLBACK_FONT_METADATA: FontFamilyMetadata[] = [
  createMetadata('Inter', 'fallback', rangeWeights(100, 900), rangeWeights(100, 900), true),
  createMetadata('Roboto', 'fallback', [100, 300, 400, 500, 700, 900], [100, 300, 400, 500, 700, 900]),
  createMetadata('Open Sans', 'fallback', [300, 400, 500, 600, 700, 800], [300, 400, 500, 600, 700, 800]),
  createMetadata('Lato', 'fallback', [100, 300, 400, 700, 900], [100, 300, 400, 700, 900]),
  createMetadata('Merriweather', 'fallback', [300, 400, 700, 900], [300, 400, 700, 900]),
  createMetadata('Playfair Display', 'fallback', [400, 500, 600, 700, 800, 900], [400, 500, 600, 700, 800, 900]),
  createMetadata('Source Serif 4', 'fallback', [200, 300, 400, 500, 600, 700, 800, 900], [200, 300, 400, 500, 600, 700, 800, 900], true),
  createMetadata('Nunito', 'fallback', [200, 300, 400, 500, 600, 700, 800, 900], [200, 300, 400, 500, 600, 700, 800, 900]),
  createMetadata('Raleway', 'fallback', rangeWeights(100, 900), rangeWeights(100, 900)),
  createMetadata('Oswald', 'fallback', [200, 300, 400, 500, 600, 700], []),
  createMetadata('Montserrat', 'fallback', rangeWeights(100, 900), rangeWeights(100, 900)),
  createMetadata('PT Serif', 'fallback', [400, 700], [400, 700]),
  createMetadata('Noto Serif', 'fallback', rangeWeights(100, 900), rangeWeights(100, 900), true),
  createMetadata('EB Garamond', 'fallback', [400, 500, 600, 700, 800], [400, 500, 600, 700, 800]),
  createMetadata('Libre Baskerville', 'fallback', [400, 700], [400]),
  createMetadata('Crimson Text', 'fallback', [400, 600, 700], [400, 600, 700]),
  createMetadata('Cormorant Garamond', 'fallback', [300, 400, 500, 600, 700], [300, 400, 500, 600, 700]),
  createMetadata('DM Sans', 'fallback', rangeWeights(100, 900), rangeWeights(100, 900), true),
  createMetadata('Instrument Serif', 'fallback', [400], [400]),
  createMetadata('Karla', 'fallback', [200, 300, 400, 500, 600, 700, 800], [200, 300, 400, 500, 600, 700, 800]),
  createMetadata('Josefin Sans', 'fallback', [100, 200, 300, 400, 500, 600, 700], [100, 200, 300, 400, 500, 600, 700]),
  createMetadata('Bitter', 'fallback', rangeWeights(100, 900), rangeWeights(100, 900), true),
  createMetadata('Spectral', 'fallback', [200, 300, 400, 500, 600, 700, 800], [200, 300, 400, 500, 600, 700, 800]),
  createMetadata('Arvo', 'fallback', [400, 700], [400, 700]),
  createMetadata('Caveat', 'fallback', [400, 500, 600, 700], []),
];

const metadataByFamily = new Map<string, FontFamilyMetadata>();
const metadataListeners = new Set<() => void>();
let metadataRequest: Promise<FontFamilyMetadata[]> | null = null;
const loadedFontUrls = new Set<string>();

seedMetadata([...SYSTEM_FONT_METADATA, ...FALLBACK_FONT_METADATA]);

function rangeWeights(start: number, end: number): number[] {
  const weights: number[] = [];
  for (let weight = start; weight <= end; weight += 100) {
    weights.push(weight);
  }
  return weights;
}

function createMetadata(
  family: string,
  source: FontFamilyMetadata['source'],
  normal: number[],
  italic: number[],
  isVariable?: boolean,
): FontFamilyMetadata {
  const weights = uniqueSortedWeights([...normal, ...italic]);
  return {
    family,
    source,
    weights,
    styles: {
      normal: uniqueSortedWeights(normal),
      italic: uniqueSortedWeights(italic),
    },
    isVariable,
  };
}

function seedMetadata(metadata: FontFamilyMetadata[]): void {
  metadata.forEach((font) => {
    metadataByFamily.set(font.family.toLowerCase(), font);
  });
}

function notifyMetadataListeners(): void {
  metadataListeners.forEach((listener) => listener());
}

function uniqueSortedWeights(weights: number[]): number[] {
  return Array.from(new Set(weights))
    .filter((weight) => Number.isFinite(weight) && weight > 0)
    .sort((a, b) => a - b);
}

function parseCssWeight(value: string | number | undefined, fallback = 400): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return fallback;
}

function getStyleFromAdvanced(advanced?: CSSProperties): FontStyle {
  return advanced?.fontStyle === 'italic' ? 'italic' : 'normal';
}

function addWeight(
  requestMap: Map<string, FontLoadRequest>,
  familyValue: string | number | undefined,
  weightValue: string | number | undefined,
  style: FontStyle,
  fallbackWeight = 400,
): void {
  if (typeof familyValue !== 'string' || !familyValue) return;

  const family = getBareFontFamily(familyValue);
  if (!family || SYSTEM_FONT_NAMES.has(family.toLowerCase())) return;

  const weight = getClosestAvailableWeight(family, parseCssWeight(weightValue, fallbackWeight), style);
  const key = family.toLowerCase();
  const request = requestMap.get(key) ?? {
    family,
    styles: {
      normal: [],
      italic: [],
    },
  };

  request.styles[style].push(weight);
  request.styles[style] = uniqueSortedWeights(request.styles[style]);
  requestMap.set(key, request);
}

function mergeWeights(
  requestMap: Map<string, FontLoadRequest>,
  familyValue: string | number | undefined,
  weights: number[],
  style: FontStyle,
): void {
  weights.forEach((weight) => addWeight(requestMap, familyValue, weight, style, weight));
}

export function parseGoogleFontVariants(variants: string[] = []): FontFamilyMetadata['styles'] {
  const styles: FontFamilyMetadata['styles'] = {
    normal: [],
    italic: [],
  };

  variants.forEach((variant) => {
    if (variant === 'regular') {
      styles.normal.push(400);
      return;
    }
    if (variant === 'italic') {
      styles.italic.push(400);
      return;
    }

    const match = variant.match(/^(\d+)(italic)?$/);
    if (!match) return;

    const weight = parseInt(match[1], 10);
    if (match[2] === 'italic') {
      styles.italic.push(weight);
    } else {
      styles.normal.push(weight);
    }
  });

  return {
    normal: uniqueSortedWeights(styles.normal),
    italic: uniqueSortedWeights(styles.italic),
  };
}

export function metadataFromGoogleFont(item: GoogleFontApiItem): FontFamilyMetadata | null {
  if (!item.family) return null;

  const styles = parseGoogleFontVariants(item.variants);
  const wghtAxis = item.axes?.find((axis) => axis.tag === 'wght');
  const isVariable = Boolean(wghtAxis);

  if (wghtAxis?.start && wghtAxis.end) {
    const axisWeights = rangeWeights(
      Math.ceil(wghtAxis.start / 100) * 100,
      Math.floor(wghtAxis.end / 100) * 100,
    );
    if (styles.normal.length > 0) styles.normal = axisWeights;
    if (styles.italic.length > 0) styles.italic = axisWeights;
  }

  if (styles.normal.length === 0 && styles.italic.length === 0) {
    styles.normal = [400];
  }

  return createMetadata(item.family, 'google', styles.normal, styles.italic, isVariable);
}

export function getBareFontFamily(value: string): string {
  return value
    .split(',')[0]
    .trim()
    .replace(/^["']|["']$/g, '')
    .trim();
}

export function getFontMetadata(family: string): FontFamilyMetadata {
  const bareFamily = getBareFontFamily(family);
  return metadataByFamily.get(bareFamily.toLowerCase()) ??
    createMetadata(bareFamily || 'sans-serif', 'fallback', [400, 700], [400, 700]);
}

export function subscribeToFontMetadata(listener: () => void): () => void {
  metadataListeners.add(listener);
  return () => metadataListeners.delete(listener);
}

export function getAvailableFontWeights(family: string, style: FontStyle): number[] {
  const metadata = getFontMetadata(family);
  const weights = metadata.styles[style];
  if (weights.length > 0) return weights;
  return metadata.styles.normal.length > 0 ? metadata.styles.normal : [400];
}

export function getClosestAvailableWeight(
  family: string,
  desiredWeight: string | number,
  style: FontStyle,
): number {
  const desired = parseCssWeight(desiredWeight);
  const weights = getAvailableFontWeights(family, style);
  return weights.reduce((closest, weight) => {
    const currentDelta = Math.abs(weight - desired);
    const closestDelta = Math.abs(closest - desired);
    if (currentDelta === closestDelta) return weight > closest ? weight : closest;
    return currentDelta < closestDelta ? weight : closest;
  }, weights[0] ?? 400);
}

export function getFontWeightLabel(weight: string | number): string {
  const weightNumber = parseCssWeight(weight);
  const labels: Record<number, string> = {
    100: 'Thin',
    200: 'Extra Light',
    300: 'Light',
    400: 'Regular',
    500: 'Medium',
    600: 'Semi Bold',
    700: 'Bold',
    800: 'Extra Bold',
    900: 'Black',
  };
  return `${labels[weightNumber] ?? 'Weight'} (${weightNumber})`;
}

export function buildGoogleFontsCssUrl(request: FontLoadRequest): string {
  const normalWeights = uniqueSortedWeights(request.styles.normal);
  const italicWeights = uniqueSortedWeights(request.styles.italic);
  const family = encodeURIComponent(request.family).replace(/%20/g, '+');
  const allWeights = uniqueSortedWeights([...normalWeights, ...italicWeights]);

  if (allWeights.length === 0) {
    return `https://fonts.googleapis.com/css2?family=${family}&display=swap`;
  }

  if (italicWeights.length === 0) {
    return `https://fonts.googleapis.com/css2?family=${family}:wght@${normalWeights.join(';')}&display=swap`;
  }

  const entries = [
    ...normalWeights.map((weight) => `0,${weight}`),
    ...italicWeights.map((weight) => `1,${weight}`),
  ].join(';');

  return `https://fonts.googleapis.com/css2?family=${family}:ital,wght@${entries}&display=swap`;
}

export function loadGoogleFont(
  family: string,
  weights: number[] | FontLoadRequest['styles'] = [400],
): void {
  if (typeof document === 'undefined') return;

  const bareFamily = getBareFontFamily(family);
  if (!bareFamily) return;

  const normalizedFamily = bareFamily.toLowerCase();
  if (SYSTEM_FONT_NAMES.has(normalizedFamily)) return;

  const styles = Array.isArray(weights)
    ? { normal: weights, italic: [] }
    : weights;

  const request: FontLoadRequest = {
    family: bareFamily,
    styles: {
      normal: uniqueSortedWeights(styles.normal),
      italic: uniqueSortedWeights(styles.italic),
    },
  };

  const href = buildGoogleFontsCssUrl(request);
  if (loadedFontUrls.has(href)) return;

  loadedFontUrls.add(href);

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

export async function fetchGoogleFonts(): Promise<FontFamilyMetadata[]> {
  const key = import.meta.env.VITE_GOOGLE_FONTS_API_KEY;
  if (typeof key !== 'string' || key.trim() === '') {
    return FALLBACK_FONT_METADATA;
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/webfonts/v1/webfonts?sort=popularity&key=${encodeURIComponent(key)}`
    );
    if (!response.ok) return FALLBACK_FONT_METADATA;

    const data = await response.json() as {
      items?: GoogleFontApiItem[];
    };

    const metadata = data.items
      ?.map(metadataFromGoogleFont)
      .filter((font): font is FontFamilyMetadata => font !== null);

    return metadata && metadata.length > 0 ? metadata : FALLBACK_FONT_METADATA;
  } catch {
    return FALLBACK_FONT_METADATA;
  }
}

export function ensureFontMetadataLoaded(): Promise<FontFamilyMetadata[]> {
  if (!metadataRequest) {
    metadataRequest = fetchGoogleFonts().then((metadata) => {
      seedMetadata(metadata);
      notifyMetadataListeners();
      return metadata;
    });
  }
  return metadataRequest;
}

export function toFontFamilyString(family: string): string {
  return `"${family}", sans-serif`;
}

export function extractFontFamilies(template: Template): string[] {
  return extractFontLoadRequests(template).map((request) => request.family);
}

export function extractFontLoadRequests(template: Template): FontLoadRequest[] {
  const requestMap = new Map<string, FontLoadRequest>();
  const contentStyles = [
    template.contentStyles.body,
    template.contentStyles.heading1,
    template.contentStyles.heading2,
    template.contentStyles.heading3,
  ];

  contentStyles.forEach((style) => {
    addWeight(
      requestMap,
      style.fontFamily,
      style.fontWeight,
      getStyleFromAdvanced(style.advanced),
    );
  });

  const bodyStyle = template.contentStyles.body;
  const bodyFamily = bodyStyle.fontFamily;
  const bodyWeight = parseCssWeight(bodyStyle.fontWeight);

  [template.listStyles.bulletedList.itemStyle, template.listStyles.orderedList.itemStyle].forEach((itemStyle) => {
    if (!itemStyle) return;
    addWeight(
      requestMap,
      itemStyle.fontFamily || bodyFamily,
      itemStyle.fontWeight || bodyWeight,
      getStyleFromAdvanced(itemStyle.advanced),
    );
  });

  const contentFamilies = Array.from(new Set(contentStyles.map((style) => style.fontFamily).filter(Boolean))) as string[];

  if (template.characterRules.bold.enabled) {
    const boldRule = template.characterRules.bold;
    if (boldRule.advanced?.fontFamily) {
      addWeight(requestMap, boldRule.advanced.fontFamily, boldRule.fontWeight, getStyleFromAdvanced(boldRule.advanced), 700);
    } else {
      mergeWeights(requestMap, bodyFamily, [parseCssWeight(boldRule.fontWeight, 700)], 'normal');
      contentFamilies.forEach((family) => {
        addWeight(requestMap, family, boldRule.fontWeight, 'normal', 700);
      });
    }
  }

  if (template.characterRules.italic.enabled) {
    const italicRule = template.characterRules.italic;
    if (italicRule.advanced?.fontFamily) {
      addWeight(
        requestMap,
        italicRule.advanced.fontFamily,
        italicRule.advanced.fontWeight,
        getStyleFromAdvanced(italicRule.advanced) === 'normal' ? 'normal' : 'italic',
      );
    } else {
      contentStyles.forEach((style) => {
        addWeight(requestMap, style.fontFamily, style.fontWeight, 'italic');
      });
    }
  }

  if (template.characterRules.underline.enabled) {
    const underlineAdvanced = template.characterRules.underline.advanced;
    if (underlineAdvanced?.fontFamily) {
      addWeight(
        requestMap,
        underlineAdvanced.fontFamily,
        underlineAdvanced.fontWeight,
        getStyleFromAdvanced(underlineAdvanced),
      );
    }
  }

  if (template.linkRules.advanced?.fontFamily) {
    addWeight(
      requestMap,
      template.linkRules.advanced.fontFamily,
      template.linkRules.advanced.fontWeight,
      getStyleFromAdvanced(template.linkRules.advanced),
    );
  }

  return Array.from(requestMap.values()).map((request) => ({
    family: request.family,
    styles: {
      normal: uniqueSortedWeights(request.styles.normal),
      italic: uniqueSortedWeights(request.styles.italic),
    },
  }));
}
