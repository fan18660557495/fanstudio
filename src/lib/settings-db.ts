import prisma from "@/lib/prisma"

export type SettingsRow = {
  id: string
  siteName: string
  avatar: string | null
  socialLinks: unknown
  about: unknown
  nav: unknown
  pageCopy: unknown
  theme: unknown
  footer: unknown
  accessPassword: string | null
  updatedAt: Date
}

/** 读取全局设置单行（id 固定为 "settings"）。 */
export async function getSettingsRow(): Promise<SettingsRow | null> {
  const row = await prisma.settings.findUnique({
    where: { id: "settings" },
  })
  return row as SettingsRow | null
}
