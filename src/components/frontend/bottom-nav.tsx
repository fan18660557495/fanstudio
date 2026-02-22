"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { useNavConfig } from "@/hooks/useNavConfig"
import { defaultNav } from "@/lib/nav-config"

const navItems = [
  { key: "worksDesign" as const, href: "/works/design", icon: "ri-palette-line", activeIcon: "ri-palette-fill" },
  { key: "worksDev" as const, href: "/works/development", icon: "ri-code-s-slash-line", activeIcon: "ri-code-s-slash-fill" },
  { key: "blog" as const, href: "/blog", icon: "ri-article-line", activeIcon: "ri-article-fill" },
  { key: "tutorials" as const, href: "/tutorials", icon: "ri-video-line", activeIcon: "ri-video-fill" },
  { key: "tools" as const, href: "/tools", icon: "ri-tools-line", activeIcon: "ri-tools-fill" },
  { key: "knowledgeBase" as const, href: "/knowledge-base", icon: "ri-book-line", activeIcon: "ri-book-fill" },
  { key: "about" as const, href: "/about", icon: "ri-user-line", activeIcon: "ri-user-fill" },
]

export function BottomNav() {
  const pathname = usePathname()
  const { nav } = useNavConfig()
  const { theme, setTheme } = useTheme()

  return (
    <nav className="bottom-nav">
      <div className="glass-strong rounded-full px-2 py-2 flex items-center gap-1 shadow-xl">
        {navItems.map((item) => {
          const label = nav[item.key] ?? (defaultNav as Record<string, string>)[item.key] ?? item.key
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={label}
              title={label}
              className={cn(
                "flex items-center justify-center p-3 rounded-full transition-all duration-200 active:scale-95",
                isActive
                  ? "bg-foreground/10 text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
              )}
            >
              <i className={`${isActive ? item.activeIcon : item.icon} text-xl`} />
            </Link>
          )
        })}
        <div className="w-px h-5 bg-foreground/15 mx-0.5" />
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex items-center justify-center p-3 rounded-full text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all duration-200 active:scale-95"
        >
          <i className="ri-sun-line dark:hidden text-xl" />
          <i className="ri-moon-line hidden dark:inline text-xl" />
        </button>
      </div>
    </nav>
  )
}
