"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { Magnet } from "@/components/react-bits"
import { useNavConfig } from "@/hooks/useNavConfig"
import { defaultNav } from "@/lib/nav-config"
import { getBeijingVolShort } from "@/lib/date-util"

const navKeys = [
  { key: "blog" as const, href: "/blog", icon: "ri-quill-pen-line" },
  { key: "knowledgeBase" as const, href: "/knowledge-base", icon: "ri-book-line" },
  { key: "worksDesign" as const, href: "/works/design", icon: "ri-palette-line" },
  { key: "worksDev" as const, href: "/works/development", icon: "ri-code-s-slash-line" },
  { key: "tutorials" as const, href: "/tutorials", icon: "ri-video-line" },
  { key: "tools" as const, href: "/tools", icon: "ri-tools-line" },
  { key: "about" as const, href: "/about", icon: "ri-user-line" },
]

export function MagazineSidebar({ width = 200 }: { width?: number }) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { nav } = useNavConfig()
  const [mounted, setMounted] = useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), [])
  const themeDarkLabel = defaultNav.themeDarkLabel ?? "暗色模式"
  const themeLightLabel = defaultNav.themeLightLabel ?? "亮色模式"
  const themeLabel = mounted ? (theme === "dark" ? themeLightLabel : themeDarkLabel) : themeDarkLabel

  const logoText = nav.logoText ?? defaultNav.logoText ?? ""
  const parts = logoText.trim().split(".")
  const logoMain = parts[0] ?? logoText
  const logoRest = parts.length > 1 ? "." + parts.slice(1).join(".") : ""

  return (
    <aside
      className="hidden lg:flex fixed left-0 top-0 bottom-0 flex-col justify-between border-r border-border/50 bg-background/80 backdrop-blur-xl z-40 p-6"
      style={{ width, transition: "width 200ms" }}
    >
      <div>
        <Link href="/" className="group block mb-10">
          <Magnet strength={0.15}>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">
              {logoMain}
              {logoRest && <span className="text-muted-foreground">{logoRest}</span>}
            </h1>
            <div
              className="mt-1 h-[2px] w-8 bg-foreground/20 group-hover:w-full transition-all duration-500"
              style={{ backgroundImage: "var(--pride-gradient-h)" }}
            />
          </Magnet>
        </Link>

        <nav className="space-y-1">
          {navKeys.map((item) => {
            const label = nav[item.key] ?? defaultNav[item.key] ?? item.key
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 relative",
                  isActive
                    ? "text-foreground bg-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                <i className={`${item.icon} text-base`} />
                <span className="font-medium tracking-wide">{label}</span>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 w-[2px] h-5 rounded-r-full"
                    style={{
                      background: `linear-gradient(180deg, var(--color-pride-1), var(--color-pride-7))`,
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="space-y-4">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200 w-full"
        >
          <i className="ri-sun-line dark:hidden text-base" />
          <i className="ri-moon-line hidden dark:inline text-base" />
          <span className="font-medium tracking-wide">{themeLabel}</span>
        </button>

        <div className="pt-4 border-t border-border/50">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 font-mono">
            {getBeijingVolShort()}
          </p>
        </div>
      </div>
    </aside>
  )
}
