"use client"
/**
 * 为 prose 正文区域中的图片添加点击全屏灯箱查看功能。
 * 用法：包裹 dangerouslySetInnerHTML 的容器即可。
 */
import { useState, useCallback, useEffect, useRef } from "react"

interface ProseImageLightboxProps {
  children: React.ReactNode
}

export function ProseImageLightbox({ children }: ProseImageLightboxProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [images, setImages] = useState<string[]>([])
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  /** 扫描容器内所有 img 元素，收集 src 并绑定点击事件 */
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const imgElements = container.querySelectorAll<HTMLImageElement>("img")
    const srcList: string[] = []

    imgElements.forEach((img) => {
      const src = img.getAttribute("src")
      if (!src) return
      srcList.push(src)
      img.style.cursor = "zoom-in"
    })
    setImages(srcList)

    const handleClick = (e: Event) => {
      const target = e.target as HTMLElement
      if (target.tagName !== "IMG") return
      const src = target.getAttribute("src")
      if (!src) return
      const idx = srcList.indexOf(src)
      if (idx === -1) return
      e.preventDefault()
      e.stopPropagation()
      setCurrentIndex(idx)
      setLightboxOpen(true)
    }

    container.addEventListener("click", handleClick)
    return () => container.removeEventListener("click", handleClick)
  }, [])

  const closeLightbox = useCallback(() => setLightboxOpen(false), [])

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
  }, [images.length])

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
  }, [images.length])

  /** 键盘导航 */
  useEffect(() => {
    if (!lightboxOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox()
      else if (e.key === "ArrowLeft") goToPrev()
      else if (e.key === "ArrowRight") goToNext()
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [lightboxOpen, closeLightbox, goToPrev, goToNext])

  /** 禁止全屏时 body 滚动 */
  useEffect(() => {
    if (lightboxOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [lightboxOpen])

  /** 触摸滑动 */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchEndX.current = e.touches[0].clientX
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX
  }, [])

  const handleTouchEnd = useCallback(() => {
    const diff = touchStartX.current - touchEndX.current
    if (Math.abs(diff) > 50) {
      if (diff > 0) goToNext()
      else goToPrev()
    }
  }, [goToNext, goToPrev])

  return (
    <>
      <div ref={containerRef}>{children}</div>

      {lightboxOpen && images.length > 0 && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* 计数器 */}
          {images.length > 1 && (
            <div className="absolute top-4 left-4 z-10 text-white/70 text-sm font-medium
              bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
              {currentIndex + 1} / {images.length}
            </div>
          )}

          {/* 左箭头 */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); goToPrev() }}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center
                rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors
                hidden sm:flex"
            >
              <i className="ri-arrow-left-s-line text-xl" />
            </button>
          )}

          {/* 右箭头 */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); goToNext() }}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center
                rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors
                hidden sm:flex"
            >
              <i className="ri-arrow-right-s-line text-xl" />
            </button>
          )}

          {/* 图片 */}
          <div
            className="w-full h-full flex items-center justify-center p-4 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[currentIndex]}
              alt={`图片 ${currentIndex + 1}`}
              className="max-w-full max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-4rem)] w-auto h-auto object-contain select-none"
            />
          </div>

          {/* 移动端底部圆点指示器 */}
          {images.length > 1 && (
            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-1.5 sm:hidden">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx) }}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    idx === currentIndex ? "bg-white" : "bg-white/30"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
