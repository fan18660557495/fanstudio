"use client"
/** 后台侧栏：导航分组、主题切换、站点名、收起态；需包在 ThemeProvider 内。 */
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { defaultNav } from "@/lib/nav-config"
import { defaultSiteName } from "@/lib/page-copy"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { signOut } from "next-auth/react"

const navGroups = [
  {
    label: "概览",
    items: [
      { name: "仪表盘", href: "/admin", icon: "ri-dashboard-line" },
    ],
  },
  {
    label: "内容管理",
    items: [
      { name: "文章管理", href: "/admin/posts", icon: "ri-article-line" },
      { name: "知识库", href: "/admin/knowledge-base", icon: "ri-book-line" },
      { name: "设计作品", href: "/admin/works/design", icon: "ri-palette-line" },
      { name: "开发作品", href: "/admin/works/development", icon: "ri-code-s-slash-line" },
      { name: "视频教程", href: "/admin/tutorials", icon: "ri-video-line" },
      { name: "工具管理", href: "/admin/tools", icon: "ri-tools-line" },
    ],
  },
  {
    label: "系统",
    items: [
      { name: "订单管理", href: "/admin/orders", icon: "ri-shopping-cart-line" },
      { name: "分类标签", href: "/admin/categories", icon: "ri-price-tag-3-line" },
      { name: "网站设置", href: "/admin/settings", icon: "ri-settings-3-line" },
    ],
  },
]

function getFirstCharacter(text: string): string {
  const first = [...text.trim()][0]
  return first || "F"
}

/** 收起态右侧 Tooltip 包裹器，展开态直接渲染 children */
function SidebarTooltip({
  label,
  collapsed,
  children,
}: {
  label: string
  collapsed: boolean
  children: React.ReactNode
}) {
  if (!collapsed) return <>{children}</>
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        {label}
      </TooltipContent>
    </Tooltip>
  )
}

export function AdminSidebar({
  siteName,
  collapsed,
  width,
  onToggleCollapse,
}: {
  siteName: string
  collapsed: boolean
  width: number
  onToggleCollapse: () => void
}) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), [])
  const displayName = siteName.trim() || defaultSiteName
  const firstChar = getFirstCharacter(displayName)

  const themeLightLabel = defaultNav.themeLightLabel ?? "亮色模式"
  const themeDarkLabel = defaultNav.themeDarkLabel ?? "暗色模式"
  const themeLabel = mounted ? (theme === "dark" ? themeLightLabel : themeDarkLabel) : themeDarkLabel
  const themeIcon = mounted ? (theme === "dark" ? "ri-sun-line" : "ri-moon-line") : "ri-moon-line"
  const themeTooltip = mounted ? themeLabel : themeDarkLabel

  return (
    <TooltipProvider delayDuration={150}>
      <aside
        className="fixed inset-y-0 left-0 z-50 border-r border-border/50 bg-background/80 backdrop-blur-xl admin-sidebar"
        style={{ width, transition: "width 200ms" }}
      >
        <div className="flex h-full flex-col">
          {/* Logo / Site Name */}
          <div
            className={cn(
              "flex h-16 items-center border-b border-border/50 transition-[padding] duration-200",
              collapsed ? "justify-center px-0" : "px-6"
            )}
          >
            {collapsed ? (
              <SidebarTooltip label={displayName} collapsed={collapsed}>
                <Link
                  href="/admin"
                  className="flex size-10 items-center justify-center rounded-lg text-foreground hover:bg-accent/50"
                >
                  <span className="font-serif text-lg font-bold">{firstChar}</span>
                </Link>
              </SidebarTooltip>
            ) : (
              <Link href="/admin" className="flex items-baseline gap-2 group">
                <span className="font-serif text-xl font-bold tracking-tight text-foreground truncate leading-none">
                  {displayName}
                </span>
                <span className="text-sm text-muted-foreground shrink-0 leading-none translate-y-[-1px]">管理后台</span>
              </Link>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-4">
            {navGroups.map((group, groupIndex) => (
              <div key={group.label}>
                {/* Group label / divider */}
                {groupIndex > 0 && (
                  collapsed ? (
                    <div className="my-2 mx-auto w-6 border-t border-border/50" />
                  ) : (
                    <p className="mb-1.5 mt-1 px-3 text-[11px] font-medium uppercase tracking-widest text-muted-foreground/50">
                      {group.label}
                    </p>
                  )
                )}

                {/* Nav items */}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/admin" && pathname.startsWith(item.href))
                    return (
                      <SidebarTooltip key={item.href} label={item.name} collapsed={collapsed}>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                            collapsed ? "justify-center px-0" : "gap-3",
                            isActive
                              ? "bg-accent text-foreground"
                              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                          )}
                        >
                          <i className={`${item.icon} text-base shrink-0`} />
                          {!collapsed && (
                            <span className="tracking-wide truncate">{item.name}</span>
                          )}
                        </Link>
                      </SidebarTooltip>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Bottom actions */}
          <div
            className={cn(
              "border-t border-border/50 space-y-1 transition-[padding] duration-200",
              collapsed ? "p-2 flex flex-col items-center" : "p-4"
            )}
          >
            <SidebarTooltip label={themeTooltip} collapsed={collapsed}>
              <Button
                variant="ghost"
                size={collapsed ? "icon" : "default"}
                className={cn(
                  "text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-all duration-200",
                  collapsed
                    ? "size-9 shrink-0"
                    : "w-full justify-start gap-3 px-3 py-2.5 h-auto"
                )}
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                <i className={cn("text-base shrink-0", themeIcon)} />
                {!collapsed && <span className="tracking-wide">{themeLabel}</span>}
              </Button>
            </SidebarTooltip>

            <SidebarTooltip label="查看网站" collapsed={collapsed}>
              <Link
                href="/"
                className={cn(
                  "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-all duration-200",
                  collapsed ? "justify-center px-0" : "gap-3"
                )}
              >
                <i className="ri-global-line text-base shrink-0" />
                {!collapsed && <span className="tracking-wide">查看网站</span>}
              </Link>
            </SidebarTooltip>

            <SidebarTooltip label="退出登录" collapsed={collapsed}>
              <Button
                variant="ghost"
                size={collapsed ? "icon" : "default"}
                className={cn(
                  "w-full text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                  collapsed
                    ? "size-9 shrink-0 justify-center"
                    : "justify-start gap-3 px-3 py-2.5 h-auto"
                )}
                onClick={() => signOut({ callbackUrl: "/admin/login" })}
              >
                <i className="ri-logout-box-r-line text-base shrink-0" />
                {!collapsed && <span className="tracking-wide">退出登录</span>}
              </Button>
            </SidebarTooltip>

            <SidebarTooltip label={collapsed ? "展开导航" : "收起"} collapsed={collapsed}>
              <Button
                variant="ghost"
                size={collapsed ? "icon" : "default"}
                className={cn(
                  "text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-all duration-200",
                  collapsed
                    ? "size-9 shrink-0"
                    : "w-full justify-start gap-3 px-3 py-2.5 h-auto"
                )}
                onClick={onToggleCollapse}
              >
                <i
                  className={cn(
                    "shrink-0 transition-transform duration-200",
                    collapsed ? "ri-arrow-right-s-line text-base" : "ri-arrow-left-s-line text-base"
                  )}
                />
                {!collapsed && <span className="tracking-wide">收起</span>}
              </Button>
            </SidebarTooltip>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  )
}
