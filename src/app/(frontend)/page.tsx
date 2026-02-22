"use client"
/** 前台首页：Hero、设计/开发作品、笔记、教程等区块，文案来自设置与默认配置。 */
import Link from "next/link"
import Image from "next/image"
import { useRef, useState, useEffect } from "react"
import { motion, useInView } from "framer-motion"
import { SplitText, BlurText, GlowBorder, FadeContent, AuroraBackground } from "@/components/react-bits"
import { useNavConfig } from "@/hooks/useNavConfig"
import { CardDescriptionHtml } from "@/components/frontend/CardDescriptionHtml"
import { getBeijingVolLabel } from "@/lib/date-util"
import { defaultNav } from "@/lib/nav-config"
import { defaultPageCopy, defaultPersonalName, defaultSiteName } from "@/lib/page-copy"
import { ALL_SOCIAL_ENTRIES, SOCIAL_LINK_ENTRIES, normalizeSocialUrl, isImageUrl } from "@/lib/social-links"
import { HoverPopover } from "@/components/ui/hover-popover"
import { CoverImage } from "@/components/frontend/CoverImage"
import type { AboutModules } from "@/lib/about-types"
import { APP_AUTHOR, APP_VERSION, type FooterConfig } from "@/lib/version"
import { coverRatioToCss } from "@/lib/cover-ratio"

type PageCopy = {
  heroGreeting?: string
  heroPrefix?: string
  heroDesc?: string
}

type Settings = {
  siteName?: string
  avatar?: string | null
  about?: AboutModules | null
  socialLinks?: { wechat?: string; xiaohongshu?: string; officialAccount?: string; bilibili?: string; figma?: string; youshe?: string; x?: string; github?: string; email?: string; weibo?: string; dribbble?: string; behance?: string } | null
  pageCopy?: PageCopy | null
  nav?: { logoText?: string; worksDesign?: string; worksDev?: string; blog?: string; tutorials?: string } | null
  footer?: FooterConfig | null
}

type TagItem = { id: string; name: string }

type WorkItem = {
  id: string
  title: string
  slug: string
  description?: string | null
  coverImage?: string | null
  category?: { name: string } | null
  tags?: TagItem[]
  isFree?: boolean
  price?: number | null
}

type PostItem = {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  coverImage?: string | null
  createdAt: string
  category?: { name: string } | null
  tags?: TagItem[]
}

type TutorialItem = {
  id: string
  title: string
  slug: string
  description: string | null
  thumbnail?: string | null
  videoUrl: string
  sortOrder: number
  category?: { name: string } | null
  tags?: TagItem[]
}

export default function HomePage() {
  const { nav, pageCopy, siteName, socialLinks: contextSocialLinks } = useNavConfig()
  const [settings, setSettings] = useState<Settings | null>(null)
  const [designWorks, setDesignWorks] = useState<WorkItem[]>([])
  const [devWorks, setDevWorks] = useState<WorkItem[]>([])
  const [posts, setPosts] = useState<PostItem[]>([])
  const [tutorials, setTutorials] = useState<TutorialItem[]>([])
  const [knowledgeBaseArticles, setKnowledgeBaseArticles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch("/api/settings", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/works?type=design", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/works?type=development", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/posts", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/tutorials", { cache: "no-store" }).then((r) => (r.ok ? r.json() : [])),
      fetch("/api/knowledge-base/articles", { cache: "no-store" }).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([s, designW, devW, p, t, kb]) => {
        console.log("Settings response:", s);
        if (s && typeof s === "object" && !("error" in s)) {
          setSettings(s);
          console.log("Settings set successfully:", s);
        } else {
          console.error("Failed to get settings data:", s);
        }
        setDesignWorks(Array.isArray(designW) ? designW : []);
        setDevWorks(Array.isArray(devW) ? devW : []);
        setPosts(Array.isArray(p) ? p : []);
        setTutorials(Array.isArray(t) ? t : []);
        setKnowledgeBaseArticles(Array.isArray(kb) ? kb : []);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      })
      .finally(() => setLoading(false))
  }, [])

  const articles = posts.slice(0, 4).map((p) => ({
    title: p.title,
    excerpt: p.excerpt ?? null,
    coverImage: p.coverImage ?? null,
    date: new Date(p.createdAt).toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\//g, "."),
    slug: p.slug,
    category: p.category,
    tags: p.tags,
  }))

  const knowledgeBaseItems = knowledgeBaseArticles.slice(0, 4).map((article) => ({
    id: article.id,
    title: article.title,
    excerpt: article.excerpt ?? null,
    coverImage: article.coverImage ?? null,
    slug: article.slug,
    category: article.category,
    tags: article.tags,
  }))

  const designTitle = nav.worksDesign ?? defaultNav.worksDesign ?? ""
  const devTitle = nav.worksDev ?? defaultNav.worksDev ?? ""
  const notesTitle = nav.blog ?? defaultNav.blog ?? ""
  const tutorialsTitle = nav.tutorials ?? defaultNav.tutorials ?? ""
  const knowledgeBaseTitle = "知识库"
  const designCoverRatio = pageCopy.coverRatioWorksDesign
  const devCoverRatio = pageCopy.coverRatioWorksDev
  const blogCoverRatio = pageCopy.coverRatioBlog
  const tutorialsCoverRatio = pageCopy.coverRatioTutorials
  const knowledgeBaseCoverRatio = pageCopy.coverRatioKnowledgeBase
  const footerLogoText = (nav.logoText ?? defaultNav.logoText ?? "").trim() || (defaultNav.logoText ?? "")
  const heroDisplayName =
    settings?.siteName ??
    siteName ??
    settings?.about?.profileCard?.personalName ??
    nav.logoText ??
    defaultSiteName

  return (
    <div className="min-h-screen">
      <HeroSection
        settings={settings}
        pageCopy={pageCopy}
        siteName={heroDisplayName}
        fallbackSocialLinks={contextSocialLinks}
        aboutLabel={nav.about ?? defaultNav.about ?? ""}
      />
      <KnowledgeBaseSection title={knowledgeBaseTitle} items={knowledgeBaseItems} coverRatio={knowledgeBaseCoverRatio} loading={loading} />
      <NotesSection title={notesTitle} articles={articles} coverRatio={blogCoverRatio} loading={loading} />
      <WorksGridSection
        title={designTitle}
        allLinkHref="/works/design"
        works={designWorks.slice(0, 4)}
        fallbackIcon="ri-palette-line"
        coverRatio={designCoverRatio}
        loading={loading}
      />
      <WorksGridSection
        title={devTitle}
        allLinkHref="/works/development"
        works={devWorks.slice(0, 4)}
        fallbackIcon="ri-code-s-slash-line"
        coverRatio={devCoverRatio}
        loading={loading}
      />
      <FooterSection
        settings={settings}
        logoText={footerLogoText}
        socialLinks={settings?.socialLinks ?? contextSocialLinks ?? undefined}
        version={settings?.footer?.version ?? APP_VERSION}
        author={settings?.footer?.copyrightText ?? APP_AUTHOR}
      />
    </div>
  )
}

type PageCopyForHero = {
  heroGreeting?: string
  heroPrefix?: string
  heroDesc?: string
}

const SPLIT_DURATION = 0.05

function HeroBrandName({
  name,
  prefixLength,
  prefixDelay,
}: {
  name: string
  prefixLength: number
  prefixDelay: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })
  const chars = name.split("")
  const startDelay = prefixDelay + prefixLength * SPLIT_DURATION

  return (
    <span ref={ref} className="inline-block text-foreground italic">
      {chars.map((char, index) => (
        <motion.span
          key={`${char}-${index}`}
          className="inline-block"
          initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
          animate={
            isInView
              ? { opacity: 1, y: 0, filter: "blur(0px)" }
              : { opacity: 0, y: 20, filter: "blur(4px)" }
          }
          transition={{
            duration: 0.4,
            delay: startDelay + index * SPLIT_DURATION,
            ease: [0.2, 0.65, 0.3, 0.9],
          }}
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </span>
  )
}

function HeroSection({
  settings,
  pageCopy,
  siteName: heroSiteName,
  fallbackSocialLinks,
  aboutLabel,
}: {
  settings: Settings | null
  pageCopy?: PageCopyForHero
  siteName?: string
  fallbackSocialLinks?: Record<string, string | undefined> | null
  aboutLabel?: string
}) {
  const name = heroSiteName ?? defaultSiteName
  const copy = settings?.pageCopy ?? pageCopy
  const heroGreeting = copy?.heroGreeting ?? defaultPageCopy.heroGreeting ?? ""
  const heroPrefix = copy?.heroPrefix ?? defaultPageCopy.heroPrefix ?? ""
  const desc =
    copy?.heroDesc ?? (defaultPageCopy.heroDesc ?? "")
  const avatar = settings?.avatar || ""
  const links = settings?.socialLinks ?? fallbackSocialLinks ?? {}

  return (
    <section className="relative min-h-[85vh] flex flex-col justify-center px-6 md:px-12 lg:px-16 py-20 overflow-x-visible overflow-y-hidden">
      <AuroraBackground className="opacity-20 dark:opacity-30" />

      <div className="relative z-10 max-w-4xl overflow-visible">
        <FadeContent delay={0}>
          <div className="flex items-center gap-3 mb-8">
            <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-mono border border-border/50 px-3 py-1 rounded-full">
              {getBeijingVolLabel()}
            </span>
            <div className="h-[1px] w-12 bg-border" />
          </div>
        </FadeContent>

        <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold leading-[0.95] tracking-tight mb-6 overflow-visible">
          <SplitText text={heroGreeting} className="block text-foreground" delay={0.2} />
          <span className="block mt-2 md:whitespace-nowrap overflow-visible">
            <SplitText text={heroPrefix} className="text-foreground" delay={0.5} duration={SPLIT_DURATION} />
            <HeroBrandName name={name} prefixLength={heroPrefix.length} prefixDelay={0.5} />
          </span>
        </h1>

        <div className="mb-8">
          <BlurText
            text={desc}
            className="text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed"
            delay={0.8}
          />
        </div>

        <FadeContent delay={1.0}>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-border ring-2 ring-background relative shrink-0">
              {avatar ? (
                <Image
                  src={avatar}
                  alt={name}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              ) : (
                <div className="w-full h-full bg-accent flex items-center justify-center text-muted-foreground">
                  <i className="ri-user-line text-xl" />
                </div>
              )}
            </div>
            <Link href="/about" className="pride-underline text-sm font-medium text-foreground">
              {aboutLabel || "关于"}
            </Link>
            <span className="text-border">·</span>
            {SOCIAL_LINK_ENTRIES.map(({ key, label, icon, type }) => {
              const value = links[key]
              if (!value?.trim()) return null
              if (type === "text") {
                const trimmed = value.trim()
                return (
                  <HoverPopover
                    key={key}
                    content={
                      isImageUrl(trimmed) ? (
                        <div className="flex flex-col items-center gap-2">
                          <img src={trimmed} alt={`${label}二维码`} className="w-36 h-36 rounded-lg object-contain" />
                          <span className="text-xs text-muted-foreground">{label}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <i className={`${icon} text-base text-muted-foreground`} />
                          <span className="text-sm text-foreground font-medium">{trimmed}</span>
                          <button type="button" className="ml-1 p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="复制" onClick={() => navigator.clipboard.writeText(trimmed)}>
                            <i className="ri-file-copy-line text-sm" />
                          </button>
                        </div>
                      )
                    }
                  >
                    <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-default">
                      {label}
                    </span>
                  </HoverPopover>
                )
              }
              return (
                <a key={key} href={normalizeSocialUrl(value)} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {label}
                </a>
              )
            })}
          </div>
        </FadeContent>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-border/50" />
    </section>
  )
}

function SectionHeader({ title, linkHref, linkText = "查看全部" }: { title: string; linkHref: string; linkText?: string }) {
  return (
    <FadeContent>
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            {title}
          </h2>
          <div className="hidden md:block h-[1px] w-16 bg-border mt-2" />
        </div>
        <Link
          href={linkHref}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 pride-underline"
        >
          {linkText} <i className="ri-arrow-right-line text-xs" />
        </Link>
      </div>
    </FadeContent>
  )
}

function WorkPriceIndicator({ isFree, price }: { isFree?: boolean; price?: number | null }) {
  const displayPrice = isFree ? 0 : (price ?? 0)
  return (
    <span className="font-serif text-2xl font-bold tracking-tight text-foreground leading-none">
      <span className="text-sm font-normal text-muted-foreground mr-0.5">¥</span>{displayPrice}
    </span>
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border/50 bg-card/50 overflow-hidden animate-pulse">
      <div className="aspect-[3/4] bg-muted" />
      <div className="p-4 space-y-2.5">
        <div className="h-4 w-3/4 bg-muted rounded" />
        <div className="h-3 w-full bg-muted rounded" />
        <div className="h-5 w-10 bg-muted rounded mt-3" />
        <div className="flex gap-1.5 mt-2">
          <div className="h-4 w-12 bg-muted rounded" />
          <div className="h-4 w-10 bg-muted rounded" />
        </div>
      </div>
    </div>
  )
}

function SkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={i === 0 ? "col-span-2 md:col-span-3" : "col-span-1"}>
          <SkeletonCard />
        </div>
      ))}
    </div>
  )
}

function WorksGridSection({
  title,
  allLinkHref,
  works,
  fallbackIcon,
  coverRatio,
  loading,
}: {
  title: string
  allLinkHref: string
  works: WorkItem[]
  fallbackIcon: string
  coverRatio?: string
  loading?: boolean
}) {
  return (
    <section className="px-6 md:px-12 lg:px-16 py-16 md:py-24 border-t border-border/40 first:border-t-0">
      <SectionHeader title={title} linkHref={allLinkHref} />

      {loading ? (
        <SkeletonGrid />
      ) : works.length === 0 ? (
        <p className="text-muted-foreground text-sm py-4">暂无{title}</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-5">
          {works.map((work, index) => (
            <FadeContent
              key={work.id}
              delay={0.1 + index * 0.05}
              className={index === 0 ? "col-span-2 md:col-span-3" : "col-span-1"}
            >
              <Link href={`/works/${work.slug}`} className="block transition-transform duration-300 hover:scale-[1.1]">
                <GlowBorder className="group rounded-xl overflow-hidden border border-border/50 bg-card/50 backdrop-blur-sm flex flex-col">
                  <div
                    className="overflow-hidden bg-muted shrink-0 relative"
                    style={{ aspectRatio: coverRatioToCss(coverRatio) }}
                  >
                    <CoverImage src={work.coverImage} alt={work.title} fallbackIcon={fallbackIcon} />
                    {work.isFree && (
                      <span className="absolute top-2 left-2 z-10 text-xs font-medium px-2.5 py-1 rounded-md bg-emerald-500/90 text-white backdrop-blur-sm">
                        开源
                      </span>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="text-base font-semibold text-foreground truncate group-hover:text-foreground/80 transition-colors">
                      {work.title}
                    </h3>
                    {work.description && (
                      <CardDescriptionHtml html={work.description} className="mt-1" />
                    )}
                    <div className="mt-auto pt-3 flex items-end justify-between gap-2">
                      <div className="flex flex-nowrap items-center gap-1.5 min-w-0 overflow-hidden">
                        {work.category?.name && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/5 text-primary/70 font-medium shrink-0 max-w-[3.5rem] truncate" title={work.category.name}>{work.category.name}</span>
                        )}
                        {(work.tags ?? []).slice(0, 3).map((tag) => (
                          <span key={tag.id} className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0 max-w-[3.5rem] truncate" title={tag.name}>{tag.name}</span>
                        ))}
                        {(work.tags?.length ?? 0) > 3 && (
                          <span className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded bg-muted/80 text-muted-foreground shrink-0">+{(work.tags?.length ?? 0) - 3}</span>
                        )}
                      </div>
                      <WorkPriceIndicator isFree={work.isFree} price={work.price} />
                    </div>
                  </div>
                </GlowBorder>
              </Link>
            </FadeContent>
          ))}
        </div>
      )}
    </section>
  )
}


function NotesSection({
  title,
  articles,
  coverRatio,
  loading,
}: {
  title: string
  articles: { title: string; excerpt: string | null; coverImage: string | null; date: string; slug: string; category?: { name: string } | null; tags?: TagItem[] }[]
  coverRatio?: string
  loading?: boolean
}) {
  return (
    <section className="px-6 md:px-12 lg:px-16 py-16 md:py-24 border-t border-border/40">
      <SectionHeader title={title} linkHref="/blog" />

      {loading ? (
        <SkeletonGrid />
      ) : articles.length === 0 ? (
        <p className="text-muted-foreground text-sm py-4">暂无{title}</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-5">
          {articles.map((article, index) => (
            <FadeContent
              key={article.slug}
              delay={0.1 + index * 0.05}
              className={index === 0 ? "col-span-2 md:col-span-3" : "col-span-1"}
            >
              <Link href={`/blog/${article.slug}`} className="block transition-transform duration-300 hover:scale-[1.1]">
                <GlowBorder className="group rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden flex flex-col">
                  <div
                    className="overflow-hidden bg-muted shrink-0"
                    style={{ aspectRatio: coverRatioToCss(coverRatio) }}
                  >
                    <CoverImage src={article.coverImage} alt={article.title} fallbackIcon="ri-article-line" />
                  </div>
                  <div className="p-4 flex-1">
                    <h3 className="text-base font-semibold text-foreground line-clamp-2 group-hover:text-foreground/80 transition-colors mb-1">
                      {article.title}
                    </h3>
                    {article.excerpt && (
                      <CardDescriptionHtml html={article.excerpt} className="mt-1.5" />
                    )}
                    <div className="flex items-center gap-2 mt-2 min-w-0">
                      <span className="text-xs font-mono text-muted-foreground/60 shrink-0">{article.date}</span>
                      {(article.category?.name || (article.tags && article.tags.length > 0)) && (
                        <div className="flex flex-nowrap items-center gap-1.5 min-w-0 overflow-hidden">
                          {article.category?.name && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/5 text-primary/70 font-medium shrink-0 max-w-[3.5rem] truncate" title={article.category.name}>{article.category.name}</span>
                          )}
                          {(article.tags ?? []).slice(0, 3).map((tag) => (
                            <span key={tag.id} className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0 max-w-[3.5rem] truncate" title={tag.name}>{tag.name}</span>
                          ))}
                          {(article.tags?.length ?? 0) > 3 && (
                            <span className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded bg-muted/80 text-muted-foreground shrink-0">+{(article.tags?.length ?? 0) - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </GlowBorder>
              </Link>
            </FadeContent>
          ))}
        </div>
      )}
    </section>
  )
}


function TutorialsSection({
  title,
  items,
  coverRatio,
  loading,
}: {
  title: string
  items: TutorialItem[]
  coverRatio?: string
  loading?: boolean
}) {
  const playOverlay = (
    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/20">
      <i className="ri-play-circle-fill text-4xl text-white/90" />
    </div>
  )

  return (
    <section className="px-6 md:px-12 lg:px-16 py-16 md:py-24 border-t border-border/40">
      <SectionHeader title={title} linkHref="/tutorials" />

      {loading ? (
        <SkeletonGrid />
      ) : items.length === 0 ? (
        <p className="text-muted-foreground text-sm py-4">暂无{title}</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-5">
          {items.map((item, index) => (
            <FadeContent
              key={item.id}
              delay={0.1 + index * 0.05}
              className={index === 0 ? "col-span-2 md:col-span-3" : "col-span-1"}
            >
              <a href={item.videoUrl} target="_blank" rel="noopener noreferrer" className="block transition-transform duration-300 hover:scale-[1.1]">
                <GlowBorder className="group rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden flex flex-col">
                  <div
                    className="overflow-hidden bg-muted relative shrink-0"
                    style={{ aspectRatio: coverRatioToCss(coverRatio) }}
                  >
                    <CoverImage src={item.thumbnail} alt={item.title} fallbackIcon="ri-video-line" />
                    {playOverlay}
                  </div>
                  <div className="p-4 flex-1">
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
              </a>
            </FadeContent>
          ))}
        </div>
      )}
    </section>
  )
}


function KnowledgeBaseSection({ title, items, coverRatio, loading }: { title: string; items: any[]; coverRatio?: string; loading?: boolean }) {
  return (
    <section className="px-6 md:px-12 lg:px-16 py-16 md:py-24 border-t border-border/40">
      <SectionHeader title={title} linkHref="/knowledge-base" />

      {loading ? (
        <SkeletonGrid />
      ) : items.length === 0 ? (
        <p className="text-muted-foreground text-sm py-4">暂无{title}</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-5">
          {items.map((item, index) => (
            <FadeContent
              key={item.id}
              delay={0.1 + index * 0.05}
              className={index === 0 ? "col-span-2 md:col-span-3" : "col-span-1"}
            >
              <Link href={`/knowledge-base?article=${item.slug}`} className="block transition-transform duration-300 hover:scale-[1.1]">
                <GlowBorder className="group rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden flex flex-col">
                  <div
                    className="overflow-hidden bg-muted shrink-0"
                    style={{ aspectRatio: coverRatioToCss(coverRatio) }}
                  >
                    <CoverImage src={item.coverImage} alt={item.title} fallbackIcon="ri-book-line" />
                  </div>
                  <div className="p-4 flex-1">
                    <h3 className="text-base font-semibold text-foreground line-clamp-2 group-hover:text-foreground/80 transition-colors mb-1">
                      {item.title}
                    </h3>
                    {item.excerpt && (
                      <CardDescriptionHtml html={item.excerpt} className="mt-1.5" />
                    )}
                    {(item.category?.name || (item.tags && item.tags.length > 0)) && (
                      <div className="flex flex-nowrap items-center gap-1.5 mt-2 overflow-hidden">
                        {item.category?.name && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/5 text-primary/70 font-medium shrink-0 max-w-[3.5rem] truncate" title={item.category.name}>{item.category.name}</span>
                        )}
                        {(item.tags ?? []).slice(0, 3).map((tag: any) => (
                          <span key={tag.id} className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0 max-w-[3.5rem] truncate" title={tag.name}>{tag.name}</span>
                        ))}
                        {(item.tags?.length ?? 0) > 3 && (
                          <span className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded bg-muted/80 text-muted-foreground shrink-0">+{(item.tags?.length ?? 0) - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                </GlowBorder>
              </Link>
            </FadeContent>
          ))}
        </div>
      )}
    </section>
  )
}


function FooterSection({
  settings,
  logoText,
  socialLinks,
  version,
  author,
}: {
  settings: Settings | null
  logoText: string
  socialLinks?: Record<string, string | undefined> | null
  version: string
  author: string
}) {
  const links = socialLinks ?? settings?.socialLinks ?? {}
  const year = new Date().getFullYear()

  return (
    <footer className="px-6 md:px-12 lg:px-16 py-12 border-t border-border/40">
      <FadeContent>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <p className="font-serif text-lg font-bold text-foreground tracking-tight">
              {logoText}
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              © {year} {author} · v{version}
            </p>
          </div>

          <div
            className="h-[2px] w-32 rounded-full opacity-30"
            style={{
              background: "var(--pride-gradient-h)",
            }}
          />

          <div className="flex items-center gap-3 flex-wrap">
            {ALL_SOCIAL_ENTRIES.map(({ key, label, icon, type }) => {
              const value = links[key]
              if (!value?.trim()) return null
              if (type === "text") {
                const trimmed = value.trim()
                return (
                  <HoverPopover
                    key={key}
                    content={
                      isImageUrl(trimmed) ? (
                        <div className="flex flex-col items-center gap-2">
                          <img src={trimmed} alt={`${label}二维码`} className="w-36 h-36 rounded-lg object-contain" />
                          <span className="text-xs text-muted-foreground">{label}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <i className={`${icon} text-base text-muted-foreground`} />
                          <span className="text-sm text-foreground font-medium">{trimmed}</span>
                          <button type="button" className="ml-1 p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="复制" onClick={() => navigator.clipboard.writeText(trimmed)}>
                            <i className="ri-file-copy-line text-sm" />
                          </button>
                        </div>
                      )
                    }
                  >
                    <span className="text-xs text-muted-foreground/50 hover:text-foreground transition-colors cursor-default">
                      {label}
                    </span>
                  </HoverPopover>
                )
              }
              return (
                <a
                  key={key}
                  href={normalizeSocialUrl(value)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground/50 hover:text-foreground transition-colors"
                >
                  {label}
                </a>
              )
            })}
          </div>
        </div>
      </FadeContent>

      <div className="h-20 lg:hidden" />
    </footer>
  )
}
