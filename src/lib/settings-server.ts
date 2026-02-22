import { getSettingsRow } from "@/lib/settings-db"
import { defaultNav, type NavConfig } from "@/lib/nav-config"
import { defaultPageCopy, normalizeSiteName, type PageCopy } from "@/lib/page-copy"
import type { SocialLinks } from "@/lib/social-links"
import { DEFAULT_THEME, type ThemeConfig } from "@/lib/theme-presets"

export type FrontendSettings = {
  nav: NavConfig
  pageCopy: PageCopy
  siteName?: string | null
  socialLinks?: SocialLinks | null
  theme: ThemeConfig
  accessPasswordSet: boolean
}

/** 服务端获取前台所需配置（nav、pageCopy、siteName、socialLinks），供 layout 首屏注入。 */
export async function getFrontendSettings(): Promise<FrontendSettings> {
  const row = await getSettingsRow()
  const nav: NavConfig = {
    ...defaultNav,
    ...(row?.nav && typeof row.nav === "object" ? (row.nav as NavConfig) : {}),
  }
  const pageCopy: PageCopy = {
    ...defaultPageCopy,
    ...(row?.pageCopy && typeof row.pageCopy === "object"
      ? (row.pageCopy as PageCopy)
      : {}),
  }
  const siteName = normalizeSiteName(row?.siteName)
  nav.logoText = siteName
  const socialLinks =
    row?.socialLinks && typeof row.socialLinks === "object"
      ? (row.socialLinks as SocialLinks)
      : null
  const theme: ThemeConfig =
    row?.theme && typeof row.theme === "object"
      ? { ...DEFAULT_THEME, ...(row.theme as Partial<ThemeConfig>) }
      : DEFAULT_THEME
  const accessPasswordSet = !!row?.accessPassword
  return { nav, pageCopy, siteName, socialLinks, theme, accessPasswordSet }
}
