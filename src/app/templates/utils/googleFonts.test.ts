import { describe, expect, it } from 'vitest';

import {
  buildGoogleFontsCssUrl,
  getClosestAvailableWeight,
  parseGoogleFontVariants,
} from './googleFonts';

describe('googleFonts utilities', () => {
  it('parses regular and numeric normal variants', () => {
    expect(parseGoogleFontVariants(['regular', '700']).normal).toEqual([400, 700]);
  });

  it('parses italic variants', () => {
    expect(parseGoogleFontVariants(['italic', '700italic']).italic).toEqual([400, 700]);
  });

  it('selects the closest available weight for a family', () => {
    expect(getClosestAvailableWeight('Merriweather', 650, 'normal')).toBe(700);
    expect(getClosestAvailableWeight('Merriweather', 850, 'normal')).toBe(900);
  });

  it('builds Google Fonts CSS URLs with explicit normal weights', () => {
    expect(
      buildGoogleFontsCssUrl({
        family: 'Merriweather',
        styles: {
          normal: [400, 700, 900],
          italic: [],
        },
      }),
    ).toBe('https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700;900&display=swap');
  });

  it('builds Google Fonts CSS URLs with explicit italic weights', () => {
    expect(
      buildGoogleFontsCssUrl({
        family: 'Inter',
        styles: {
          normal: [400],
          italic: [700],
        },
      }),
    ).toBe('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;1,700&display=swap');
  });
});
