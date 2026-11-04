import type { ThemeKey } from '@parichay/shared';
import AuroraTheme from '@/components/themes/AuroraTheme';
import CreativeTheme from '@/components/themes/CreativeTheme';
import BentoTheme from '@/components/themes/BentoTheme';
import EditorialTheme from '@/components/themes/EditorialTheme';
import ExecutiveTheme from '@/components/themes/ExecutiveTheme';
import SidebarTheme from '@/components/themes/SidebarTheme';
import SoftTheme from '@/components/themes/SoftTheme';
import type { ThemeComponent } from '@/components/themes/types';

// Every theme at once, for the editor (the picker shows them all). A public page uses
// theme-loader.ts instead, so a visitor only gets the fonts of the one theme they see.
export const THEME_COMPONENTS: Record<ThemeKey, ThemeComponent> = {
  editorial: EditorialTheme,
  bento: BentoTheme,
  creative: CreativeTheme,
  soft: SoftTheme,
  executive: ExecutiveTheme,
  sidebar: SidebarTheme,
  aurora: AuroraTheme,
};
