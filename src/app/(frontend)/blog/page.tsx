"use client"
/** 博客列表页：文章卡片网格，支持分类/标签筛选，文案来自设置。 */
import { CardDescriptionHtml } from "@/components/frontend/CardDescriptionHtml"
import { defaultNav } from "@/lib/nav-config"
import { defaultPageCopy, defaultSiteName } from "@/lib/page-copy"
import Link from "next/link"
import { useState, useEffect } from "react"
import { FadeContent, GlowBorder } from "@/components/react-bits"
import { CoverImage } from "@/components/frontend/CoverImage"
import { useNavConfig } from "@/hooks/useNavConfig"

type Post = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  coverImage: string | null
  createdAt: string
  category?: { name: string } | null
  tags?: { id: string; name: string }[]
}

export default function BlogPage() {
  const { nav, pageCopy, siteName } = useNavConfig()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState("全部")
  const sectionLabel = nav.blog ?? defaultNav.blog ?? ""
  const sectionDesc = pageCopy.blogDesc ?? defaultPageCopy.blogDesc ?? ""

  useEffect(() => {
    fetch("/api/posts")
      .then((r) => r.json())
      .then((data) => setPosts(Array.isArray(data) ? data : []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false))
  }, [])

  const categories = ["全部", ...Array.from(new Set(posts.map((p) => p.category?.name).filter(Boolean)))] as string[]
  const filteredPosts =
    activeCategory === "全部"
      ? posts
      : posts.filter((p) => p.category?.name === activeCategory)

  function formatDate(dateStr: string) {
    try {
      return new Date(dateStr).toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    } catch {
      return dateStr
    }
  }

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
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/50 bg-card/50 overflow-hidden">
              <div className="aspect-[3/4] bg-muted" />
              <div className="p-4 space-y-2.5">
                <div className="h-4 w-3/4 bg-muted rounded" />
                <div className="h-3 w-full bg-muted rounded" />
                <div className="h-3 w-1/3 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-muted-foreground py-12">暂无{sectionLabel}</div>
      ) : (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-5">
          {filteredPosts.map((post, index) => (
            <FadeContent key={post.id} delay={0.1 + index * 0.05} className="break-inside-avoid mb-5">
              <Link href={`/blog/${post.slug}`} className="block transition-transform duration-300 hover:scale-[1.1]">
                <GlowBorder className="group rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden flex flex-col">
                  <div className="aspect-[3/4] overflow-hidden bg-muted shrink-0">
                    <CoverImage src={post.coverImage} alt={post.title} fallbackIcon="ri-article-line" />
                  </div>
                  <div className="p-4">
                    <h2 className="text-base font-semibold text-foreground line-clamp-2 group-hover:text-foreground/80 transition-colors">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <CardDescriptionHtml html={post.excerpt} className="mt-1.5" />
                    )}
                    <div className="flex items-center gap-2 mt-2 min-w-0">
                      <time className="text-xs font-mono text-muted-foreground/60 shrink-0">
                        {formatDate(post.createdAt)}
                      </time>
                      {(post.category?.name || (post.tags && post.tags.length > 0)) && (
                        <div className="flex flex-nowrap items-center gap-1.5 min-w-0 overflow-hidden">
                          {post.category?.name && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/5 text-primary/70 font-medium shrink-0 max-w-[3.5rem] truncate" title={post.category.name}>{post.category.name}</span>
                          )}
                          {(post.tags ?? []).slice(0, 3).map((tag) => (
                            <span key={tag.id} className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0 max-w-[3.5rem] truncate" title={tag.name}>{tag.name}</span>
                          ))}
                          {(post.tags?.length ?? 0) > 3 && (
                            <span className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded bg-muted/80 text-muted-foreground shrink-0">+{(post.tags?.length ?? 0) - 3}</span>
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
    </div>
  )
}
