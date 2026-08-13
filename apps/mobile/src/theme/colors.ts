// Mirrors apps/customer/src/index.css's --color-* tokens so the mobile app
// reads as the same brand (violet primary, blue accent) in both themes.
export interface Palette {
  gray50: string;
  gray100: string;
  gray200: string;
  gray300: string;
  gray400: string;
  gray500: string;
  gray600: string;
  gray700: string;
  gray800: string;
  gray900: string;
  surface: string;
  surfaceHover: string;
  primary: string;
  accent: string;
  rose300: string;
  rose400: string;
  emerald400: string;
  amber300: string;
  amber400: string;
  overlay: string;
}

export const lightPalette: Palette = {
  gray50: '#faf9fc',
  gray100: '#f2eef8',
  gray200: '#e5def2',
  gray300: '#d3c9e8',
  gray400: '#9186a8',
  gray500: '#6e6485',
  gray600: '#554b6c',
  gray700: '#3d3450',
  gray800: '#261e37',
  gray900: '#17111f',
  surface: '#ffffff',
  surfaceHover: '#f7f4fb',
  primary: '#7c3aed',
  accent: '#3b82f6',
  rose300: '#f43f5e',
  rose400: '#e11d48',
  emerald400: '#059669',
  amber300: '#92400e',
  amber400: '#b45309',
  overlay: 'rgba(23, 17, 31, 0.45)',
};

export const darkPalette: Palette = {
  gray50: '#0d0b12',
  gray100: '#1c1926',
  gray200: '#2a2536',
  gray300: '#3a3348',
  gray400: '#6b6480',
  gray500: '#8b8299',
  gray600: '#a89fbd',
  gray700: '#c3bcd6',
  gray800: '#ded8ea',
  gray900: '#f6f4fa',
  surface: '#17141f',
  surfaceHover: '#1e1a29',
  primary: '#7c3aed',
  accent: '#3b82f6',
  rose300: '#fda4af',
  rose400: '#fb7185',
  emerald400: '#34d399',
  amber300: '#fcd34d',
  amber400: '#fbbf24',
  overlay: 'rgba(0, 0, 0, 0.6)',
};

export function paletteFor(resolved: 'light' | 'dark'): Palette {
  return resolved === 'dark' ? darkPalette : lightPalette;
}
