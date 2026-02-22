"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { AdminThumbnail } from "@/components/admin/AdminThumbnail"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DndSortProvider, SortableTableBody } from "@/components/admin/SortableTable"
import { useTableControls } from "@/hooks/useTableControls"
import { TableToolbar, type ToolbarFilter, type BatchAction } from "@/components/admin/TableToolbar"
import { TablePagination } from "@/components/admin/TablePagination"
import { SortableTableHead } from "@/components/admin/SortableTableHead"
import { ConfirmPopover } from "@/components/admin/ConfirmPopover"

interface KnowledgeBaseArticle {
  id: string
  title: string
  slug: string
  coverImage: string | null
  status: string
  sortOrder: number
  category: {
    id: string
    name: string
  } | null
  tag: {
    id: string
    name: string
  }[]
  createdAt: string
  updatedAt: string
  publishedAt: string | null
}

const KnowledgeBasePage = () => {
  const router = useRouter()
  const { data: session } = useSession()
  const [articles, setArticles] = useState<KnowledgeBaseArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [categories, setCategories] = useState<string[]>([])

  /* ---- table controls ---- */
  const tc = useTableControls<KnowledgeBaseArticle>({
    data: articles,
    searchFields: ["title"],
    defaultPageSize: 20,
  })

  /* ---- filters config ---- */
  const toolbarFilters: ToolbarFilter[] = useMemo(() => {
    const filters: ToolbarFilter[] = [
      {
        key: "status",
        label: "状态",
        options: [
          { label: "已发布", value: "PUBLISHED" },
          { label: "草稿", value: "DRAFT" },
        ],
      },
    ]
    if (categories.length > 0) {
      filters.push({
        key: "category.name",
        label: "分类",
        options: categories.map((c) => ({ label: c, value: c })),
      })
    }
    return filters
  }, [categories])

  /* ---- batch actions ---- */
  const batchActions: BatchAction[] = useMemo(() => [
    {
      label: "发布",
      icon: "ri-check-line",
      onClick: () => handleBatchStatus("PUBLISHED"),
    },
    {
      label: "转草稿",
      icon: "ri-draft-line",
      onClick: () => handleBatchStatus("DRAFT"),
    },
    {
      label: "删除",
      icon: "ri-delete-bin-line",
      variant: "destructive" as const,
      onClick: handleBatchDelete,
      needConfirm: true,
      confirmTitle: `确定删除选中的 ${tc.selectedIds.size} 篇文章？`,
      confirmDescription: "删除后不可恢复",
    },
  ], [tc.selectedIds])

  /* ---- data loading ---- */
  async function loadArticles() {
    setLoading(true)
    try {
      const res = await fetch("/api/knowledge-base/articles", { credentials: "include" })
      if (!res.ok) { router.push("/admin/login"); return }
      const data = await res.json()
      const list: KnowledgeBaseArticle[] = Array.isArray(data) ? data : []
      setArticles(list)
      const cats = [...new Set(list.map((p) => p.category?.name).filter(Boolean))] as string[]
      setCategories(cats)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadArticles() }, [])

  /* ---- sort persistence ---- */
  async function saveSort(id: string, sortOrder: number) {
    try {
      const res = await fetch(`/api/knowledge-base/articles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sortOrder }),
      })
      if (!res.ok) toast.error("排序保存失败")
    } catch { toast.error("网络错误") }
  }

  function handleReorder(reordered: KnowledgeBaseArticle[]) {
    const prev = articles
    setArticles(reordered)
    const changed = reordered.filter((item, idx) => {
      const old = prev.find((p) => p.id === item.id)
      return old && old.sortOrder !== idx
    })
    changed.forEach((item) => saveSort(item.id, item.sortOrder))
  }

  /* ---- create ---- */
  async function createDraft() {
    if (!session?.user?.id) {
      toast.error("请先登录")
      return
    }
    setCreating(true)
    try {
      const res = await fetch("/api/knowledge-base/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ 
          title: "无标题文章", 
          slug: `draft-${Date.now()}`,
          content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "" }] }] },
          authorId: session.user.id
        }),
      })
      const data = await res.json()
      if (res.ok && data?.id) router.push(`/admin/knowledge-base/${data.id}/edit`)
      else toast.error(data?.error || "创建失败")
    } catch { toast.error("网络错误") }
    finally { setCreating(false) }
  }

  /* ---- single delete ---- */
  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/knowledge-base/articles/${id}`, { method: "DELETE", credentials: "include" })
      if (res.ok) setArticles((prev) => prev.filter((p) => p.id !== id))
      else { const err = await res.json().catch(() => ({})); toast.error(err.error || "删除失败") }
    } finally { setDeletingId(null) }
  }

  /* ---- batch operations ---- */
  async function handleBatchDelete() {
    const ids = Array.from(tc.selectedIds)
    if (ids.length === 0) return
    try {
      const res = await fetch("/api/knowledge-base/articles/batch", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ids }),
      })
      if (res.ok) {
        setArticles((prev) => prev.filter((p) => !ids.includes(p.id)))
        tc.clearSelection()
        toast.success(`已删除 ${ids.length} 篇文章`)
      } else toast.error("批量删除失败")
    } catch { toast.error("网络错误") }
  }

  async function handleBatchStatus(status: string) {
    const ids = Array.from(tc.selectedIds)
    if (ids.length === 0) return
    try {
      const res = await fetch("/api/knowledge-base/articles/batch", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ids, status }),
      })
      if (res.ok) {
        setArticles((prev) => prev.map((p) => ids.includes(p.id) ? { ...p, status } : p))
        tc.clearSelection()
        toast.success(`已更新 ${ids.length} 篇文章状态`)
      } else toast.error("批量更新失败")
    } catch { toast.error("网络错误") }
  }

  /* ---- helpers ---- */
  function formatDate(dateStr: string) {
    try {
      return new Date(dateStr).toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" })
    } catch { return dateStr }
  }

  /* ---- render cells (shared between dnd and normal mode) ---- */
  function renderCells(article: KnowledgeBaseArticle) {
    return (
      <>
        <TableCell>
          <div className="flex items-center gap-3">
            <AdminThumbnail src={article.coverImage} fallbackIcon="ri-article-line" className="w-10 h-10" />
            <span className="font-medium truncate">{article.title}</span>
          </div>
        </TableCell>
        <TableCell>{article.category?.name ?? "-"}</TableCell>
        <TableCell>
          <Badge variant={article.status === "PUBLISHED" ? "default" : "secondary"}>
            {article.status === "PUBLISHED" ? "已发布" : "草稿"}
          </Badge>
        </TableCell>
        <TableCell>{formatDate(article.createdAt)}</TableCell>
        <TableCell>
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
              <Link href={`/admin/knowledge-base/${article.id}/edit`}><i className="ri-edit-line" /></Link>
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
              <Link href={`/knowledge-base`} target="_blank"><i className="ri-eye-line" /></Link>
            </Button>
            <ConfirmPopover
              title="确定删除该文章？"
              description="删除后不可恢复"
              confirmText="删除"
              onConfirm={() => handleDelete(article.id)}
              align="end"
            >
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive h-8 w-8 p-0" disabled={deletingId === article.id}>
                <i className={deletingId === article.id ? "ri-loader-4-line animate-spin" : "ri-delete-bin-line"} />
              </Button>
            </ConfirmPopover>
          </div>
        </TableCell>
      </>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">
            知识库文章管理
          </h1>
          <p className="text-muted-foreground mt-1">管理你的知识库文章</p>
        </div>
        <Button onClick={createDraft} disabled={creating}>
          {creating ? "创建中…" : "创建文章"}
        </Button>
      </div>

      <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden p-4">
        <TableToolbar
          searchValue={tc.searchTerm}
          onSearchChange={tc.setSearchTerm}
          searchPlaceholder="搜索文章标题…"
          filters={toolbarFilters}
          filterValues={tc.filters}
          onFilterChange={tc.setFilter}
          selectedCount={tc.selectedIds.size}
          batchActions={batchActions}
          onClearSelection={tc.clearSelection}
        />

        {tc.isFiltering && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-muted-foreground">
              <i className="ri-filter-line mr-1" />
              筛选模式 · 拖拽排序已暂停
            </span>
            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={tc.resetFilters}>
              清除筛选
            </Button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">加载中…</div>
        ) : tc.isFiltering ? (
          /* ---- Filter/search mode: normal table with sorting + checkbox ---- */
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={tc.isAllSelected}
                    onCheckedChange={() => tc.toggleSelectAll()}
                  />
                </TableHead>
                <SortableTableHead column="title" currentSort={tc.sortColumn as string} currentDirection={tc.sortDirection} onToggle={(c) => tc.toggleSort(c as keyof KnowledgeBaseArticle)}>
                  标题
                </SortableTableHead>
                <SortableTableHead column="category.name" currentSort={tc.sortColumn as string} currentDirection={tc.sortDirection} onToggle={(c) => tc.toggleSort(c as keyof KnowledgeBaseArticle)}>
                  分类
                </SortableTableHead>
                <SortableTableHead column="status" currentSort={tc.sortColumn as string} currentDirection={tc.sortDirection} onToggle={(c) => tc.toggleSort(c as keyof KnowledgeBaseArticle)}>
                  状态
                </SortableTableHead>
                <SortableTableHead column="createdAt" currentSort={tc.sortColumn as string} currentDirection={tc.sortDirection} onToggle={(c) => tc.toggleSort(c as keyof KnowledgeBaseArticle)}>
                  创建时间
                </SortableTableHead>
                <TableHead className="w-[100px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tc.pagedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    无匹配结果
                  </TableCell>
                </TableRow>
              ) : tc.pagedData.map((article) => (
                <TableRow key={article.id}>
                  <TableCell className="w-[40px]">
                    <Checkbox
                      checked={tc.selectedIds.has(article.id)}
                      onCheckedChange={() => tc.toggleSelect(article.id)}
                    />
                  </TableCell>
                  {renderCells(article)}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          /* ---- DnD mode: drag to reorder ---- */
          <DndSortProvider items={articles} onReorder={handleReorder}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead className="w-[40px]">
                    <Checkbox checked={tc.isAllSelected} onCheckedChange={() => tc.toggleSelectAll()} />
                  </TableHead>
                  <TableHead>标题</TableHead>
                  <TableHead>分类</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="w-[100px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <SortableTableBody items={articles} columnCount={7} emptyText="暂无文章，点击「创建文章」添加">
                {(article) => (
                  <>
                    <TableCell className="w-[40px]">
                      <Checkbox checked={tc.selectedIds.has(article.id)} onCheckedChange={() => tc.toggleSelect(article.id)} />
                    </TableCell>
                    {renderCells(article)}
                  </>
                )}
              </SortableTableBody>
            </Table>
          </DndSortProvider>
        )}

        {tc.totalItems > 0 && (
          <TablePagination
            page={tc.page}
            pageSize={tc.pageSize}
            totalItems={tc.totalItems}
            totalPages={tc.totalPages}
            onPageChange={tc.setPage}
            onPageSizeChange={tc.setPageSize}
          />
        )}
      </div>
    </div>
  )
}

export default KnowledgeBasePage