/**
 * GET: 返回网站设置（nav、pageCopy 与默认值合并；无记录时返回默认）。
 * PATCH: 更新网站设置，需登录。
 */
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/require-admin"
import prisma from "@/lib/prisma"
import { getSettingsRow } from "@/lib/settings-db"
import { defaultNav, type NavConfig } from "@/lib/nav-config"
import { defaultPageCopy, defaultPersonalName, defaultSiteName, normalizeSiteName, type PageCopy } from "@/lib/page-copy"
import { defaultFooter, type FooterConfig } from "@/lib/version"
import bcrypt from "bcryptjs"

export const dynamic = "force-dynamic"

function mergeSettingsWithDefaults(
  row: { nav?: unknown; pageCopy?: unknown; footer?: unknown } | Record<string, unknown> | null
) {
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
  const footer: FooterConfig = {
    ...defaultFooter,
    ...(row?.footer && typeof row.footer === "object"
      ? (row.footer as FooterConfig)
      : {}),
  }
  return { nav, pageCopy, footer }
}

export async function GET() {
  try {
    const settings = await getSettingsRow()
    if (!settings) {
      const { nav, pageCopy, footer } = mergeSettingsWithDefaults(null)
      nav.logoText = defaultSiteName
      return NextResponse.json({
        siteName: defaultSiteName,
        avatar: null,
        socialLinks: null,
        about: { profileCard: { personalName: defaultPersonalName } },
        nav,
        pageCopy,
        footer,
      })
    }
    const { nav, pageCopy, footer } = mergeSettingsWithDefaults(settings)
    const siteNameNorm = normalizeSiteName(settings.siteName)
    nav.logoText = siteNameNorm
    return NextResponse.json({
      ...settings,
      siteName: siteNameNorm,
      nav,
      pageCopy,
      footer,
    }, {
      headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600" },
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : "请求失败"
    return NextResponse.json(
      { error: "请求失败", detail: message },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  const check = await requireAdmin()
  if (!check.authorized) return check.response
  try {
    const body = await request.json()
  const { siteName, avatar, socialLinks, about, nav, pageCopy, theme, footer, accessPassword } = body

    const existing = await prisma.settings.findUnique({
      where: { id: "settings" },
    })

    const updatePayload: Record<string, unknown> = {}
    if (siteName !== undefined) updatePayload.siteName = normalizeSiteName(siteName)
    if (avatar !== undefined) updatePayload.avatar = avatar
    if (socialLinks !== undefined) updatePayload.socialLinks = socialLinks
    if (about !== undefined) updatePayload.about = about
    if (nav !== undefined) updatePayload.nav = nav
    if (pageCopy !== undefined) {
      const existingPageCopy = existing?.pageCopy && typeof existing.pageCopy === "object"
        ? (existing.pageCopy as Record<string, unknown>)
        : {}
      updatePayload.pageCopy = { ...existingPageCopy, ...pageCopy }
    }
    if (theme !== undefined) updatePayload.theme = theme
    if (footer !== undefined) updatePayload.footer = footer
    if (accessPassword !== undefined) {
      updatePayload.accessPassword = accessPassword ? bcrypt.hashSync(accessPassword, 10) : null
    }

    if (existing) {
      const updateData: Record<string, unknown> = {}
      if (updatePayload.siteName !== undefined) updateData.siteName = updatePayload.siteName
      if (updatePayload.avatar !== undefined) updateData.avatar = updatePayload.avatar
      if (updatePayload.socialLinks !== undefined) updateData.socialLinks = updatePayload.socialLinks
      if (updatePayload.about !== undefined) updateData.about = updatePayload.about
      if (updatePayload.nav !== undefined) updateData.nav = updatePayload.nav
      if (updatePayload.pageCopy !== undefined) updateData.pageCopy = updatePayload.pageCopy
      if (updatePayload.theme !== undefined) updateData.theme = updatePayload.theme
      if (updatePayload.footer !== undefined) updateData.footer = updatePayload.footer
      if (updatePayload.accessPassword !== undefined) updateData.accessPassword = updatePayload.accessPassword
      if (Object.keys(updateData).length > 0) {
        await prisma.settings.update({
          where: { id: "settings" },
          data: updateData as Parameters<typeof prisma.settings.update>[0]["data"],
        })
      }
      const merged = { ...existing, ...updatePayload }
      const { nav: mergedNav, pageCopy: mergedPageCopy, footer: mergedFooter } = mergeSettingsWithDefaults(merged)
      return NextResponse.json({
        ...merged,
        siteName: normalizeSiteName(merged.siteName as string),
        nav: mergedNav,
        pageCopy: mergedPageCopy,
        footer: mergedFooter,
      })
    }

    await prisma.settings.create({
      data: {
        id: "settings",
        siteName: normalizeSiteName(siteName),
        avatar: avatar ?? null,
        socialLinks: socialLinks ?? null,
        about: about ?? null,
        nav: nav ?? undefined,
        pageCopy: pageCopy ?? undefined,
        theme: theme ?? undefined,
        footer: footer ?? undefined,
        accessPassword: accessPassword ? bcrypt.hashSync(accessPassword, 10) : null,
      },
    })
    const { nav: mergedNav, pageCopy: mergedPageCopy, footer: mergedFooter } = mergeSettingsWithDefaults({
      nav,
      pageCopy,
      footer,
    })
    return NextResponse.json({
      id: "settings",
      siteName: normalizeSiteName(siteName),
      avatar: avatar ?? null,
      socialLinks: socialLinks ?? null,
      about: about ?? null,
      nav: mergedNav,
      pageCopy: mergedPageCopy,
      footer: mergedFooter,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : "保存失败"
    return NextResponse.json(
      { error: "保存失败", detail: message },
      { status: 500 }
    )
  }
}
