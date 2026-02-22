"use client"
/** 后台布局壳：可收起的侧栏、主内容区宽度拖拽、站点名。 */
import { useState, useCallback, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { AdminSidebar } from "@/components/admin/sidebar"

const STORAGE_KEY = "admin-sidebar-width"
const MIN_WIDTH = 200
const MAX_WIDTH = 400
const DEFAULT_WIDTH = 256
const COLLAPSED_WIDTH = 64

export function AdminDashboardClient({
  children,
  siteName,
}: {
  children: React.ReactNode
  siteName: string
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH)
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const w = parseInt(stored, 10)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (w >= MIN_WIDTH && w <= MAX_WIDTH) setSidebarWidth(w)
    }
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (collapsed) return
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
  }, [collapsed])

  useEffect(() => {
    if (!isDragging) {
      localStorage.setItem(STORAGE_KEY, String(sidebarWidth))
    }
  }, [isDragging, sidebarWidth])

  const currentWidth = collapsed ? COLLAPSED_WIDTH : sidebarWidth

  return (
    <>
      <AdminSidebar
        siteName={siteName}
        collapsed={collapsed}
        width={currentWidth}
        onToggleCollapse={() => setCollapsed((prev) => !prev)}
      />
      {/* Drag handle */}
      {!collapsed && (
        <div
          className={cn(
            "fixed top-0 bottom-0 z-50 w-1 cursor-col-resize transition-colors",
            isDragging ? "bg-primary/30" : "hover:bg-primary/20"
          )}
          style={{ left: currentWidth - 2 }}
          onMouseDown={handleMouseDown}
        />
      )}
      <main
        className="relative z-10 admin-main h-screen overflow-y-auto"
        style={{
          paddingLeft: currentWidth,
          transition: isDragging ? "none" : "padding-left 200ms",
        }}
      >
        <div className="px-6 md:px-8 lg:px-12 py-8 admin-content">{children}</div>
      </main>
    </>
  )
}
