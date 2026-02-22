"use client"
/** 前台布局客户端：侧栏宽度、主题、设置 Provider、底部导航、滚动进度。 */
import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { BottomNav } from "@/components/frontend/bottom-nav"
import { MagazineSidebar } from "@/components/frontend/MagazineSidebar"
import { ScrollProgress } from "@/components/ui/ScrollProgress"
import { CustomCursor } from "@/components/ui/CustomCursor"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeColorProvider } from "@/components/ThemeColorProvider"
import { FrontendSettingsProvider } from "@/contexts/FrontendSettingsContext"
import type { FrontendSettings } from "@/lib/settings-server"

const STORAGE_KEY = "frontend-sidebar-width"
const MIN_WIDTH = 160
const MAX_WIDTH = 320
const DEFAULT_WIDTH = 200

export default function FrontendLayoutClient({
  initial,
  children,
}: {
  initial: FrontendSettings
  children: React.ReactNode
}) {
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH)
  const [isDragging, setIsDragging] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  const dragRef = useRef(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const w = parseInt(stored, 10)
      if (w >= MIN_WIDTH && w <= MAX_WIDTH) setSidebarWidth(w)
    }
  }, [])

  // 访问控制逻辑
  useEffect(() => {
    const checkAccess = async () => {
      try {
        // 检查是否设置了访问密码
        if (!initial?.accessPasswordSet) {
          setIsVerifying(false)
          return
        }

        // 检查本地存储中的验证状态
        const isVerified = localStorage.getItem("accessVerified") === "true"
        const verifiedAt = localStorage.getItem("accessVerifiedAt")
        
        // 验证状态有效期为30天
        const isVerificationValid = verifiedAt && 
          (Date.now() - parseInt(verifiedAt)) < 30 * 24 * 60 * 60 * 1000

        if (isVerified && isVerificationValid) {
          setIsVerifying(false)
          return
        }

        // 未验证或验证已过期，重定向到密码页面
        if (pathname !== "/password") {
          router.replace("/password")
        }
      } catch (error) {
        console.error("访问控制检查错误:", error)
      } finally {
        setIsVerifying(false)
      }
    }

    checkAccess()
  }, [initial, pathname, router])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragRef.current = true
    setIsDragging(true)

    const handleMouseMove = (ev: MouseEvent) => {
      if (!dragRef.current) return
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, ev.clientX))
      setSidebarWidth(newWidth)
    }

    const handleMouseUp = () => {
      dragRef.current = false
      setIsDragging(false)
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }

    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }, [])

  useEffect(() => {
    if (!isDragging) {
      localStorage.setItem(STORAGE_KEY, String(sidebarWidth))
    }
  }, [isDragging, sidebarWidth])

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      storageKey="frontend-theme"
      enableSystem
      disableTransitionOnChange
    >
      <ThemeColorProvider initial={initial.theme}>
      <FrontendSettingsProvider initial={initial}>
        <div className="relative min-h-screen bg-background transition-colors duration-300">
          <ScrollProgress />
          <CustomCursor />
          <div className="fixed inset-0 pointer-events-none z-0">
            <div className="absolute inset-0 grid-bg opacity-20 z-0" />
          </div>
          <MagazineSidebar width={sidebarWidth} />
          {/* Drag handle — desktop only */}
          <div
            className={cn(
              "hidden lg:block fixed top-0 bottom-0 z-50 w-1 cursor-col-resize transition-colors",
              isDragging ? "bg-primary/30" : "hover:bg-primary/20"
            )}
            style={{ left: sidebarWidth - 2 }}
            onMouseDown={handleMouseDown}
          />
          <main
            className="relative z-10"
            style={{
              marginLeft: undefined,
              transition: isDragging ? "none" : "margin-left 200ms",
            }}
          >
            {/* lg breakpoint: use sidebar width as margin */}
            <style>{`@media (min-width: 1024px) { .frontend-main-with-sidebar { margin-left: ${sidebarWidth}px; } }`}</style>
            <div className="frontend-main-with-sidebar min-w-0 overflow-x-hidden">
              {children}
            </div>
          </main>
          <div className="lg:hidden">
            <BottomNav />
          </div>
        </div>
      </FrontendSettingsProvider>
      </ThemeColorProvider>
    </ThemeProvider>
  )
}
