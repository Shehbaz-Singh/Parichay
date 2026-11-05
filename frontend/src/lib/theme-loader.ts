import type { ThemeKey } from '@parichay/shared';
import type { ThemeComponent } from '@/components/themes/types';

// Loads one theme on demand. Each theme brings its own fonts (next/font), and importing only the
// theme in use means a public page preloads only those.
interface ThemeModule {
  default: ThemeComponent;
  fontClass: string; // the class that sets the theme's fonts
}
const loaders: Record<ThemeKey, () => Promise<ThemeModule>> = {
  index: () => import('@/components/themes/IndexTheme'),
  editorial: () => import('@/components/themes/EditorialTheme'),
  bento: () => import('@/components/themes/BentoTheme'),
  creative: () => import('@/components/themes/CreativeTheme'),
  soft: () => import('@/components/themes/SoftTheme'),
  executive: () => import('@/components/themes/ExecutiveTheme'),
  sidebar: () => import('@/components/themes/SidebarTheme'),
  aurora: () => import('@/components/themes/AuroraTheme'),
};

export async function loadTheme(key: ThemeKey): Promise<ThemeComponent> {
  return (await loaders[key]()).default;
}

// The class that sets a theme's fonts, for pages that are not the theme itself but should look like
// it (the Writing pages).
export async function loadThemeFonts(key: ThemeKey): Promise<string> {
  return (await loaders[key]()).fontClass;
}
