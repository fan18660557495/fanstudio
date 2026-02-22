/** 博客文章详情页：标题、封面、正文（BlockNote/Tiptap 转 HTML）、SEO。 */
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { getBaseUrl } from "@/lib/utils"
import { CardDescriptionHtml } from "@/components/frontend/CardDescriptionHtml"
import { contentToHtml, jsonToPlainText } from "@/lib/render-content"
import { defaultNav } from "@/lib/nav-config"
import { defaultPersonalName, defaultSiteName } from "@/lib/page-copy"
import { ProseImageLightbox } from "@/components/frontend/ProseImageLightbox"

interface RelatedPost {
  id: string
  slug: string
  title: string
  status: string
  categoryId: string | null
  createdAt: string
  excerpt?: string
}

interface BlogPostPageProps {
  params: Promise<{ slug: string }>
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params
  const base = getBaseUrl()
  const [postRes, settingsRes] = await Promise.all([
    fetch(`${base}/api/posts?slug=${encodeURIComponent(slug)}`, { cache: "no-store" }),
    fetch(`${base}/api/settings`, { cache: "no-store" }),
  ])
  if (!postRes.ok) notFound()
  const post = await postRes.json()
  const settings = settingsRes.ok ? await settingsRes.json() : {}
  const nav = { ...defaultNav, ...(settings.nav && typeof settings.nav === "object" ? settings.nav : {}) }
  const sectionLabel = nav.blog ?? defaultNav.blog

  const contentHtml = contentToHtml(post.content)
  const bodyPlain = jsonToPlainText(post.content)
  const categoryName = post.category?.name ?? ""
  const publishedAt = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" })
    : post.createdAt
      ? new Date(post.createdAt).toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" })
      : ""

  // 从后台 Settings 获取作者信息（头像、名称、职位）
  const about = settings.about && typeof settings.about === "object" ? settings.about : {}
  const profileCard = about.profileCard && typeof about.profileCard === "object" ? about.profileCard : {}
  const authorAvatar = settings.avatar || post.author?.avatar || ""
  const authorName = profileCard.personalName || post.author?.name || defaultPersonalName
  const authorTitle = profileCard.personalTitle || ""

  // 获取相关文章
  const relatedPostsRes = await fetch(`${base}/api/posts`, { cache: "no-store" })
  const allPosts = relatedPostsRes.ok ? await relatedPostsRes.json() : []
  
  // 优先选择同分类的文章，最多4篇，排除当前文章
  const relatedPosts = (allPosts as RelatedPost[])
    .filter((p) => p.slug !== slug && p.status === "PUBLISHED")
    .sort((a, b) => {
      // 同分类的文章排在前面
      const aSameCategory = a.categoryId === post.categoryId ? 1 : 0
      const bSameCategory = b.categoryId === post.categoryId ? 1 : 0
      if (aSameCategory !== bSameCategory) {
        return bSameCategory - aSameCategory
      }
      // 其次按创建时间排序
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
    .slice(0, 4)

  return (
    <div className="min-h-screen px-6 md:px-12 lg:px-16 py-12 pb-28 lg:pb-16">
      <div className="max-w-3xl mx-auto">
        <nav className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground mb-10">
          <Link href="/" className="hover:text-foreground transition-colors flex items-center gap-1 min-w-0 max-w-[30vw] sm:max-w-none truncate">
            <i className="ri-home-4-line shrink-0" /> <span className="truncate">{settings.siteName || defaultSiteName}</span>
          </Link>
          <i className="ri-arrow-right-s-line text-muted-foreground/60 shrink-0" />
          <Link href="/blog" className="hover:text-foreground transition-colors shrink-0">{sectionLabel}</Link>
          <i className="ri-arrow-right-s-line text-muted-foreground/60 shrink-0" />
          <span className="text-foreground truncate min-w-0 max-w-[50vw] sm:max-w-[200px]">{post.title}</span>
        </nav>

        <article>
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            {categoryName && <span className="tag">{categoryName}</span>}
            {post.tags?.map((tag: { id: string; name: string }) => (
              <span key={tag.id} className="tag">{tag.name}</span>
            ))}
            {publishedAt && (
              <time className="text-sm text-muted-foreground flex items-center gap-1">
                <i className="ri-calendar-line" /> {publishedAt}
              </time>
            )}
          </div>

          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 leading-tight tracking-tight">
            {post.title}
          </h1>

          {post.excerpt && (
            <CardDescriptionHtml
              html={post.excerpt}
              lines={false}
              className="text-lg text-muted-foreground mb-8 leading-relaxed"
            />
          )}

          <div className="flex items-center gap-3 mb-10 pb-10 border-b border-border">
            {authorAvatar ? (
              <div className="w-10 h-10 rounded-full overflow-hidden border border-border relative">
                <Image
                  src={authorAvatar}
                  alt={authorName}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-muted-foreground text-sm">
                {authorName.slice(0, 1)}
              </div>
            )}
            <div>
              <p className="font-medium text-foreground">{authorName}</p>
              {authorTitle && (
                <p className="text-sm text-muted-foreground">{authorTitle}</p>
              )}
            </div>
          </div>

          {(contentHtml || bodyPlain) && (
            <div className="min-w-0 overflow-x-hidden">
              <ProseImageLightbox>
                <div
                  className="prose prose-neutral dark:prose-invert prose-lg max-w-none
                    prose-headings:font-serif prose-headings:text-foreground prose-headings:font-semibold prose-headings:tracking-tight
                    prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
                    prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
                    prose-p:text-foreground/70 prose-p:leading-relaxed
                    prose-li:text-foreground/70
                    prose-strong:text-foreground
                    prose-theme prose-a:no-underline hover:prose-a:underline
                    prose-code:bg-accent prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                    prose-pre:bg-accent prose-pre:border prose-pre:border-border
                    prose-blockquote:text-muted-foreground
                    prose-img:rounded-lg prose-img:my-4
                    prose-mark:bg-yellow-200/80 prose-mark:dark:bg-yellow-900/40
                    [&_.tiptap-img]:rounded-lg
                    [&_figure]:my-6 [&_figure]:overflow-hidden [&_figure]:!max-w-full [&_figure_img]:my-0 [&_figcaption]:text-center [&_figcaption]:text-sm [&_figcaption]:text-muted-foreground [&_figcaption]:mt-2
                    [&_.checklist]:list-none [&_.checklist]:pl-0 [&_.checklist_li]:flex [&_.checklist_li]:items-start [&_.checklist_li]:gap-2
                    [&_img]:!max-w-full [&_img]:h-auto [&_img]:object-contain [&_img]:rounded-lg
                    [&_video]:!max-w-full [&_video]:h-auto [&_video]:rounded-lg
                  "
                >
                {contentHtml ? (
                  <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
                ) : (
                  bodyPlain.split("\n").map((line, i) => (
                    <p key={i}>{line || "\u00A0"}</p>
                  ))
                )}
                </div>
              </ProseImageLightbox>
            </div>
          )}

          <div className="mt-16 pt-8 border-t border-border flex items-center justify-between">
            <Link
              href="/blog"
              className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 pride-underline"
            >
              <i className="ri-arrow-left-line" /> 返回文章列表
            </Link>
          </div>
        </article>

        {/* 相关文章推荐 */}
        {relatedPosts.length > 0 && (
          <div className="mt-16 pt-10 border-t border-border">
            <h2 className="font-serif text-2xl font-bold text-foreground mb-6">相关文章</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {relatedPosts.map((relatedPost) => (
                <Link
                  key={relatedPost.id}
                  href={`/blog/${relatedPost.slug}`}
                  className="group block p-4 rounded-lg border border-border hover:border-foreground/20 transition-colors"
                >
                  <h3 className="font-medium text-foreground mb-2 group-hover:text-primary transition-colors">
                    {relatedPost.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {relatedPost.excerpt || ""}
                  </p>
                  <time className="text-xs text-muted-foreground/60">
                    {new Date(relatedPost.createdAt).toLocaleDateString("zh-CN", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit"
                    })}
                  </time>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
