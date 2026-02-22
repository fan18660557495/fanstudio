"use client"
/** 视频教程列表页：教程卡片网格，文案来自设置。 */
import { CardDescriptionHtml } from "@/components/frontend/CardDescriptionHtml"
import Link from "next/link"
import { useState, useEffect } from "react"
import { FadeContent, GlowBorder } from "@/components/react-bits"
import { CoverImage } from "@/components/frontend/CoverImage"
import { defaultNav } from "@/lib/nav-config"
import { defaultPageCopy, defaultSiteName } from "@/lib/page-copy"
import { useNavConfig } from "@/hooks/useNavConfig"
import { coverRatioToCss } from "@/lib/cover-ratio"

type Tutorial = {
  id: string
  title: string
  slug: string
  description: string | null
  videoUrl: string
  thumbnail: string | null
  sortOrder: number
  category?: { name: string } | null
  tags?: { id: string; name: string }[]
}

function isBilibili(url: string): boolean {
  return /bilibili\.com|b23\.tv/i.test(url)
}

function isYoutube(url: string): boolean {
  return /youtube\.com|youtu\.be/i.test(url)
}

function getEmbedUrl(url: string): string | null {
  if (isBilibili(url)) {
    const bvMatch = url.match(/bv([a-zA-Z0-9]+)/i)
    if (bvMatch) {
      return `https://player.bilibili.com/player.html?bvid=BV${bvMatch[1]}`
    }
    const aidMatch = url.match(/av(\d+)/i)
    if (aidMatch) {
      return `https://player.bilibili.com/player.html?aid=${aidMatch[1]}`
    }
  }
  if (isYoutube(url)) {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}`
    }
  }
  return null
}


function TutorialExpandCard({ item, embedUrl, moduleCoverRatio }: { item: Tutorial; embedUrl: string; moduleCoverRatio: string | undefined }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div>
      <button type="button" className="block w-full text-left transition-transform duration-300 hover:scale-[1.1]" onClick={() => setExpanded(!expanded)}>
        <GlowBorder className="group rounded-xl overflow-hidden border border-border/50 bg-card/50 backdrop-blur-sm flex flex-col">
          <div
            className="overflow-hidden bg-muted relative shrink-0"
            style={{ aspectRatio: coverRatioToCss(moduleCoverRatio) }}
          >
            <CoverImage src={item.thumbnail} alt={item.title} fallbackIcon="ri-video-line" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/20">
              <i className={`${expanded ? "ri-close-circle-fill" : "ri-play-circle-fill"} text-4xl text-white/90`} />
            </div>
          </div>
          <div className="p-4">
            <h3 className="text-base font-medium text-foreground line-clamp-2 group-hover:text-foreground/80 transition-colors">
              {item.title}
            </h3>
            {item.description && (
              <CardDescriptionHtml html={item.description} className="mt-1.5" />
            )}
            {(item.category?.name || (item.tags && item.tags.length > 0)) && (
              <div className="flex flex-nowrap items-center gap-1.5 mt-2 overflow-hidden">
                {item.category?.name && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/5 text-primary/70 font-medium shrink-0 max-w-[3.5rem] truncate" title={item.category.name}>{item.category.name}</span>
                )}
                {(item.tags ?? []).slice(0, 3).map((tag) => (
                  <span key={tag.id} className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0 max-w-[3.5rem] truncate" title={tag.name}>{tag.name}</span>
                ))}
                {(item.tags?.length ?? 0) > 3 && (
                  <span className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded bg-muted/80 text-muted-foreground shrink-0">+{(item.tags?.length ?? 0) - 3}</span>
                )}
              </div>
            )}
          </div>
        </GlowBorder>
      </button>
      {expanded && (
        <div className="mt-2 rounded-xl overflow-hidden border border-border bg-muted">
          <iframe
            src={embedUrl}
            title={item.title}
            className="w-full aspect-video"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      )}
    </div>
  )
}

export default function TutorialsPage() {
  const { nav, pageCopy, siteName } = useNavConfig()
  const sectionLabel = nav.tutorials ?? defaultNav.tutorials ?? ""
  const sectionDesc = pageCopy.tutorialsDesc ?? defaultPageCopy.tutorialsDesc ?? ""
  const moduleCoverRatio = pageCopy.coverRatioTutorials
  const [list, setList] = useState<Tutorial[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState("全部")

  useEffect(() => {
    fetch("/api/tutorials")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setList(Array.isArray(data) ? data : []))
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }, [])

  // 计算所有可用的分类
  const categories = ["全部", ...Array.from(new Set(list.map((t) => t.category?.name).filter(Boolean)))] as string[]
  
  // 根据分类筛选教程
  const filteredList = activeCategory === "全部" 
    ? list 
    : list.filter((t) => t.category?.name === activeCategory)

  return (
    <div className="min-h-screen px-6 md:px-12 lg:px-16 py-12 pb-28 lg:pb-16">
      <FadeContent>
        <nav className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground mb-10">
          <Link href="/" className="hover:text-foreground transition-colors flex items-center gap-1 min-w-0 max-w-[40vw] sm:max-w-none truncate">
            <i className="ri-home-4-line shrink-0" /> <span className="truncate">{siteName || defaultSiteName}</span>
          </Link>
          <i className="ri-arrow-right-s-line text-muted-foreground/60 shrink-0" />
          <span className="text-foreground shrink-0">{sectionLabel}</span>
        </nav>
      </FadeContent>

      <FadeContent delay={0.1}>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-3">
              {sectionLabel}
            </h1>
            <p className="text-muted-foreground text-lg">
              {sectionDesc}
            </p>
          </div>

          {categories.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`tag transition-all ${
                    activeCategory === cat
                      ? "bg-foreground/10 border-foreground/20 text-foreground"
                      : ""
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </FadeContent>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/50 bg-card/50 overflow-hidden">
              <div className="aspect-[3/4] bg-muted relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-muted-foreground/10" />
                </div>
              </div>
              <div className="p-4 space-y-2.5">
                <div className="h-4 w-3/4 bg-muted rounded" />
                <div className="h-3 w-full bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredList.length === 0 ? (
        <div className="text-muted-foreground py-12">暂无{sectionLabel}</div>
      ) : (
        <>
          {/* 瀑布流卡片列表 */}
          <div className="columns-2 md:columns-3 lg:columns-4 gap-5">
            {filteredList.map((item, index) => {
              const embedUrl = getEmbedUrl(item.videoUrl)
              return (
                <FadeContent key={item.id} delay={0.1 + index * 0.05} className="break-inside-avoid mb-5">
                  <section id={item.slug} className="scroll-mt-8">
                    {embedUrl ? (
                      /* 可嵌入的视频 - 点击展开 */
                      <TutorialExpandCard item={item} embedUrl={embedUrl} moduleCoverRatio={moduleCoverRatio} />
                    ) : (
                      /* 外部链接 - 跳转 */
                      <a href={item.videoUrl} target="_blank" rel="noopener noreferrer" className="block transition-transform duration-300 hover:scale-[1.1]">
                        <GlowBorder className="group rounded-xl overflow-hidden border border-border/50 bg-card/50 backdrop-blur-sm flex flex-col">
                          <div
                            className="overflow-hidden bg-muted relative shrink-0"
                            style={{ aspectRatio: coverRatioToCss(moduleCoverRatio) }}
                          >
                            <CoverImage src={item.thumbnail} alt={item.title} fallbackIcon="ri-video-line" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/20">
                              <i className="ri-play-circle-fill text-4xl text-white/90" />
                            </div>
                          </div>
                          <div className="p-4">
                            <h3 className="text-base font-medium text-foreground line-clamp-2 group-hover:text-foreground/80 transition-colors">
                              {item.title}
                            </h3>
                            {item.description && (
                              <CardDescriptionHtml html={item.description} className="mt-1.5" />
                            )}
                            {(item.category?.name || (item.tags && item.tags.length > 0)) && (
                              <div className="flex flex-nowrap items-center gap-1.5 mt-2 overflow-hidden">
                                {item.category?.name && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/5 text-primary/70 font-medium shrink-0 max-w-[3.5rem] truncate" title={item.category.name}>{item.category.name}</span>
                                )}
                                {(item.tags ?? []).slice(0, 3).map((tag) => (
                                  <span key={tag.id} className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0 max-w-[3.5rem] truncate" title={tag.name}>{tag.name}</span>
                                ))}
                                {(item.tags?.length ?? 0) > 3 && (
                                  <span className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded bg-muted/80 text-muted-foreground shrink-0">+{(item.tags?.length ?? 0) - 3}</span>
                                )}
                              </div>
                            )}
                            <span className="text-xs text-muted-foreground/70 flex items-center gap-1 mt-2">
                              <i className="ri-external-link-line" /> 前往观看
                            </span>
                          </div>
                        </GlowBorder>
                      </a>
                    )}
                  </section>
                </FadeContent>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
