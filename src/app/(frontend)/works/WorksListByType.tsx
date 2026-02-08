"use client"
/** 设计/开发作品列表组件：按 type 拉取作品并展示卡片网格，文案来自 nav/pageCopy。 */
import Link from "next/link"
import { useState, useEffect } from "react"
import { FadeContent, GlowBorder } from "@/components/react-bits"
import { CoverImage } from "@/components/frontend/CoverImage"
import { CardDescriptionHtml } from "@/components/frontend/CardDescriptionHtml"
import { defaultNav } from "@/lib/nav-config"
import { defaultPageCopy, defaultSiteName } from "@/lib/page-copy"
import { useNavConfig } from "@/hooks/useNavConfig"

type Work = {
  id: string
  title: string
  slug: string
  description: string | null
  coverImage: string
  price: number | null
  isFree: boolean
  category?: { name: string } | null
  tags?: { id: string; name: string }[]
  createdAt: string
}

type WorksListByTypeProps = {
  type: "design" | "development"
  navKey: "worksDesign" | "worksDev"
  descKey: "worksDesignDesc" | "worksDevDesc"
}

export function WorksListByType({
  type,
  navKey,
  descKey,
}: WorksListByTypeProps) {
  const { nav, pageCopy, siteName } = useNavConfig()
  const sectionLabel = nav[navKey] ?? (type === "design" ? (defaultNav.worksDesign ?? "") : (defaultNav.worksDev ?? ""))
  const sectionDesc =
    pageCopy[descKey] ??
    (type === "design" ? (defaultPageCopy.worksDesignDesc ?? "") : (defaultPageCopy.worksDevDesc ?? ""))
  const [works, setWorks] = useState<Work[]>([])
  const [loading, setLoading] = useState(true)
  const fallbackIcon = type === "design" ? "ri-palette-line" : "ri-code-s-slash-line"

  useEffect(() => {
    fetch(`/api/works?type=${type}`)
      .then((r) => r.json())
      .then((data) => setWorks(Array.isArray(data) ? data : []))
      .catch(() => setWorks([]))
      .finally(() => setLoading(false))
  }, [type])

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
        <div className="mb-12">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-3">
            {sectionLabel}
          </h1>
          <p className="text-muted-foreground text-lg">
            {sectionDesc}
          </p>
        </div>
      </FadeContent>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 animate-pulse">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/50 bg-card/50 overflow-hidden">
              <div className="aspect-[3/4] bg-muted" />
              <div className="p-4 space-y-2.5">
                <div className="h-4 w-3/4 bg-muted rounded" />
                <div className="h-3 w-full bg-muted rounded" />
                <div className="h-5 w-10 bg-muted rounded mt-3" />
              </div>
            </div>
          ))}
        </div>
      ) : works.length === 0 ? (
        <div className="text-muted-foreground py-12">暂无{sectionLabel}</div>
      ) : (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-5">
          {works.map((work, index) => (
            <FadeContent key={work.id} delay={0.1 + index * 0.05} className="break-inside-avoid mb-5">
              <Link href={`/works/${work.slug}`} className="block transition-transform duration-300 hover:scale-[1.1]">
                <GlowBorder className="group rounded-xl overflow-hidden border border-border/50 bg-card/50 backdrop-blur-sm flex flex-col">
                  <div className="aspect-[3/4] overflow-hidden bg-muted shrink-0 relative">
                    <CoverImage src={work.coverImage} alt={work.title} fallbackIcon={fallbackIcon} />
                    {work.isFree && (
                      <span className="absolute top-2 left-2 z-10 text-xs font-medium px-2.5 py-1 rounded-md bg-emerald-500/90 text-white backdrop-blur-sm">
                        开源
                      </span>
                    )}
                  </div>
                  <div className="p-4 flex flex-col">
                    <h3 className="text-base font-semibold text-foreground truncate group-hover:text-foreground/80 transition-colors">
                      {work.title}
                    </h3>
                    {work.description && (
                      <CardDescriptionHtml html={work.description} className="mt-1" />
                    )}
                    <div className="pt-3 flex flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-1">
                        {work.category?.name && (
                          <span className="text-[10px] leading-tight px-1.5 py-0.5 rounded bg-primary/5 text-primary/70 font-medium whitespace-nowrap" title={work.category.name}>{work.category.name}</span>
                        )}
                        {(work.tags ?? []).slice(0, 3).map((tag) => (
                          <span key={tag.id} className="text-[10px] leading-tight px-1.5 py-0.5 rounded bg-muted text-muted-foreground whitespace-nowrap" title={tag.name}>{tag.name}</span>
                        ))}
                        {(work.tags?.length ?? 0) > 3 && (
                          <span className="text-[10px] leading-tight px-1.5 py-0.5 rounded bg-muted/80 text-muted-foreground whitespace-nowrap">+{(work.tags?.length ?? 0) - 3}</span>
                        )}
                      </div>
                      {type === "design" && (
                        <span className="font-serif text-xl font-bold tracking-tight text-foreground leading-none">
                          <span className="text-xs font-normal text-muted-foreground mr-0.5">¥</span>{work.isFree ? 0 : (work.price ?? 0)}
                        </span>
                      )}
                    </div>
                  </div>
                </GlowBorder>
              </Link>
            </FadeContent>
          ))}
        </div>
      )}
    </div>
  )
}
