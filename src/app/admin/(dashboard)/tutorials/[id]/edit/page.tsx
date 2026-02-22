"use client"
/** 教程编辑页：标题、封面、分类/标签、视频链接、简介。 */
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CoverImageUpload } from "@/components/admin/CoverImageUpload"
import { MiniEditor } from "@/components/admin/MiniEditor"
import { CategoryCombobox } from "@/components/admin/CategoryCombobox"
import { TagCombobox } from "@/components/admin/TagCombobox"
import {
  DEFAULT_COVER_RATIO,
  coverRatioToCss,
  getCoverRatioRecommendText,
  normalizeCoverRatio,
  type CoverRatioId,
} from "@/lib/cover-ratio"

function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
    .replace(/[\u4e00-\u9fff]+/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    || `tutorial-${Date.now()}`
}

export default function EditTutorialPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [thumbnail, setThumbnail] = useState("")
  const [moduleCoverRatio, setModuleCoverRatio] = useState<CoverRatioId>(DEFAULT_COVER_RATIO)
  const [categoryId, setCategoryId] = useState("")
  const [tagIds, setTagIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [originalSlug, setOriginalSlug] = useState("")
  const fetchedRef = useRef(false)

  useEffect(() => {
    if (!id || fetchedRef.current) return
    fetchedRef.current = true
    fetch(`/api/tutorials/${id}`, { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error("Not found")
        return r.json()
      })
      .then((item) => {
        setTitle(item.title ?? "")
        setSlug(item.slug ?? "")
        setOriginalSlug(item.slug ?? "")
        setDescription(item.description ?? "")
        setVideoUrl(item.videoUrl ?? "")
        setThumbnail(item.thumbnail ?? "")
        setCategoryId(item.categoryId ?? "")
        setTagIds(Array.isArray(item.tag) ? item.tag.map((t: { id: string }) => t.id) : [])
      })
      .catch(() => router.push("/admin/tutorials"))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    fetch("/api/settings", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const copy = data?.pageCopy && typeof data.pageCopy === "object"
          ? (data.pageCopy as Record<string, unknown>)
          : {}
        setModuleCoverRatio(normalizeCoverRatio(copy.coverRatioTutorials))
      })
      .catch(() => {})
  }, [])

  async function handleSave() {
    if (!title.trim() || !slug.trim() || !videoUrl.trim()) {
      toast.error("请填写标题、slug 和视频链接")
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/tutorials/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim(),
          description: description.trim() || null,
          videoUrl: videoUrl.trim(),
          thumbnail: thumbnail.trim() || null,
          categoryId: categoryId || null,
          tagIds,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || "保存失败")
        return
      }
      router.push("/admin/tutorials")
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        加载中…
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {/* 吸顶头部 */}
      <div className="sticky top-0 z-10 -mx-6 md:-mx-8 lg:-mx-12 -mt-8 px-6 md:px-8 lg:px-12 bg-background/95 backdrop-blur-sm border-b border-border/40">
        <div className="flex items-center justify-between py-3">
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">
            编辑视频教程
          </h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/admin/tutorials">取消</Link>
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "保存中…" : "保存"}
            </Button>
          </div>
        </div>
      </div>

      {/* 两列布局 */}
      <div className="grid gap-6 lg:grid-cols-3 pt-6">
        <div className="lg:col-span-2">
          <Card className="rounded-2xl border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label htmlFor="title">标题</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => {
                    const newTitle = e.target.value
                    setTitle(newTitle)
                    if (/^tutorial-\d+$/.test(slug) && newTitle.trim()) {
                      setSlug(titleToSlug(newTitle))
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">URL 别名（slug）</Label>
                <Input
                  id="slug"
                  placeholder="如 figma-auto-layout"
                  value={slug}
                  onChange={(e) => {
                    const filtered = e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]+/g, "-")
                      .replace(/-+/g, "-")
                      .replace(/^-/, "")
                    setSlug(filtered)
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  仅支持小写英文、数字和短横线
                  {slug && (
                    <> · 前台地址：<span className="font-mono text-foreground/70">/tutorials/{slug}</span></>
                  )}
                </p>
                {slug !== originalSlug && originalSlug && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20">
                    <i className="ri-alert-line text-amber-500 shrink-0" />
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      修改已发布教程的 URL 别名会导致旧链接失效，请谨慎操作。
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="videoUrl">视频链接</Label>
                <Input
                  id="videoUrl"
                  placeholder="填写视频链接（B站、YouTube 等平台链接）"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  支持 Bilibili、YouTube 链接自动嵌入播放，其他链接将显示跳转按钮。
                </p>
              </div>
              <div className="space-y-2">
                <Label>简介</Label>
                <MiniEditor
                  value={description}
                  onChange={setDescription}
                  placeholder="视频教程的简要介绍..."
                  minHeight="min-h-[100px]"
                />
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>分类</Label>
                  <CategoryCombobox
                    type="TUTORIAL"
                    value={categoryId}
                    onChange={setCategoryId}
                  />
                </div>
                <div className="space-y-2">
                  <Label>标签</Label>
                  <TagCombobox
                    value={tagIds}
                    onChange={setTagIds}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card className="rounded-2xl border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader><CardTitle>封面图</CardTitle></CardHeader>
            <CardContent>
              <CoverImageUpload
                value={thumbnail}
                onChange={setThumbnail}
                entityType="TUTORIAL"
                entityId={id}
                aspectRatio={coverRatioToCss(moduleCoverRatio)}
                recommendText={getCoverRatioRecommendText(moduleCoverRatio)}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
