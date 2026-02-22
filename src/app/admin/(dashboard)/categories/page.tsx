"use client"
/** 分类与标签管理：文章/设计/开发/教程分类及标签的增删改、批量删除。 */
import React, { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTableControls } from "@/hooks/useTableControls"
import { TableToolbar, type ToolbarFilter, type BatchAction } from "@/components/admin/TableToolbar"
import { TablePagination } from "@/components/admin/TablePagination"
import { SortableTableHead } from "@/components/admin/SortableTableHead"

type RelatedItem = { id: string; title: string; entityType: string }

type CategoryItem = {
  id: string
  name: string
  slug: string
  type: string
  count: number
  items: RelatedItem[]
}

type TagItem = {
  id: string
  name: string
  count: number
  items: RelatedItem[]
}

function getEditLink(item: RelatedItem): string {
  switch (item.entityType) {
    case "post":
      return `/admin/posts/${item.id}/edit`
    case "design":
    case "development":
      return `/admin/works/${item.id}/edit`
    case "tutorial":
      return `/admin/tutorials/${item.id}/edit`
    case "tool":
      return `/admin/tools/${item.id}/edit`
    default:
      return "#"
  }
}

function getEntityLabel(entityType: string): string {
  switch (entityType) {
    case "post": return "文章"
    case "design": return "设计"
    case "development": return "开发"
    case "tutorial": return "教程"
    case "tool": return "工具"
    default: return ""
  }
}

export default function CategoriesPage() {
  // ===== 分类状态 =====
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [loadingCats, setLoadingCats] = useState(true)
  const [createCatOpen, setCreateCatOpen] = useState(false)
  const [newCatName, setNewCatName] = useState("")
  const [newCatType, setNewCatType] = useState("POST")
  const [savingCat, setSavingCat] = useState(false)
  const [editCat, setEditCat] = useState<CategoryItem | null>(null)
  const [editCatName, setEditCatName] = useState("")
  const [editCatSlug, setEditCatSlug] = useState("")
  const [savingEditCat, setSavingEditCat] = useState(false)
  const [deleteCat, setDeleteCat] = useState<CategoryItem | null>(null)
  const [deletingCat, setDeletingCat] = useState(false)
  const [expandedCatId, setExpandedCatId] = useState<string | null>(null)
  const [catSearch, setCatSearch] = useState("")
  const [catTypeFilter, setCatTypeFilter] = useState("all")
  const [selectedCatIds, setSelectedCatIds] = useState<Set<string>>(new Set())

  // ===== 标签状态 =====
  const [tags, setTags] = useState<TagItem[]>([])
  const [loadingTags, setLoadingTags] = useState(true)
  const [createTagOpen, setCreateTagOpen] = useState(false)
  const [newTagName, setNewTagName] = useState("")
  const [savingTag, setSavingTag] = useState(false)
  const [editTag, setEditTag] = useState<TagItem | null>(null)
  const [editTagName, setEditTagName] = useState("")
  const [savingEditTag, setSavingEditTag] = useState(false)
  const [deleteTag, setDeleteTag] = useState<TagItem | null>(null)
  const [deletingTag, setDeletingTag] = useState(false)
  const [expandedTagId, setExpandedTagId] = useState<string | null>(null)
  const [tagSearch, setTagSearch] = useState("")

  // ===== 数据加载 =====
  const fetchCategories = useCallback(() => {
    setLoadingCats(true)
    return fetch("/api/categories", { credentials: "include", cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]))
      .finally(() => setLoadingCats(false))
  }, [])

  const fetchTags = useCallback(() => {
    setLoadingTags(true)
    return fetch("/api/tags", { credentials: "include", cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setTags(Array.isArray(data) ? data : []))
      .catch(() => setTags([]))
      .finally(() => setLoadingTags(false))
  }, [])

  useEffect(() => {
    fetchCategories()
    fetchTags()
  }, [fetchCategories, fetchTags])

  // ===== 分类操作 =====
  async function handleCreateCategory() {
    if (!newCatName.trim()) return
    setSavingCat(true)
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: newCatName.trim(), type: newCatType }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || "创建失败")
        return
      }
      setNewCatName("")
      setCreateCatOpen(false)
      toast.success("分类已创建")
      fetchCategories()
    } finally {
      setSavingCat(false)
    }
  }

  async function handleEditCategory() {
    if (!editCat || !editCatName.trim()) return
    setSavingEditCat(true)
    try {
      const res = await fetch(`/api/categories/${editCat.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: editCatName.trim(), slug: editCatSlug.trim() }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || "更新失败")
        return
      }
      setEditCat(null)
      toast.success("分类已更新")
      fetchCategories()
    } finally {
      setSavingEditCat(false)
    }
  }

  async function handleDeleteCategory() {
    if (!deleteCat) return
    setDeletingCat(true)
    try {
      const res = await fetch(`/api/categories/${deleteCat.id}`, {
        method: "DELETE",
        credentials: "include",
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || "删除失败")
        return
      }
      setDeleteCat(null)
      toast.success("分类已删除")
      fetchCategories()
    } finally {
      setDeletingCat(false)
    }
  }

  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      const matchSearch = !catSearch.trim() || cat.name.toLowerCase().includes(catSearch.toLowerCase())
      const matchType = catTypeFilter === "all" || cat.type === catTypeFilter
      return matchSearch && matchType
    })
  }, [categories, catSearch, catTypeFilter])

  function toggleSelectCat(id: string) {
    setSelectedCatIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const isAllCatsSelected = filteredCategories.length > 0 && filteredCategories.every((c) => selectedCatIds.has(c.id))

  function toggleSelectAllCats() {
    if (isAllCatsSelected) {
      setSelectedCatIds((prev) => {
        const next = new Set(prev)
        filteredCategories.forEach((c) => next.delete(c.id))
        return next
      })
    } else {
      setSelectedCatIds((prev) => {
        const next = new Set(prev)
        filteredCategories.forEach((c) => next.add(c.id))
        return next
      })
    }
  }

  async function handleBatchDeleteCategories() {
    const ids = Array.from(selectedCatIds)
    if (ids.length === 0) return
    try {
      const res = await fetch("/api/categories/batch", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ids }),
      })
      if (res.ok) {
        setSelectedCatIds(new Set())
        toast.success(`已删除 ${ids.length} 个分类`)
        await fetchCategories()
      } else toast.error("批量删除失败")
    } catch { toast.error("网络错误") }
  }

  const catBatchActions: BatchAction[] = selectedCatIds.size > 0
    ? [{
        label: "删除",
        icon: "ri-delete-bin-line",
        variant: "destructive" as const,
        onClick: handleBatchDeleteCategories,
        needConfirm: true,
        confirmTitle: `确定删除选中的 ${selectedCatIds.size} 个分类？`,
        confirmDescription: "其下内容将变为未分类",
      }]
    : []

  // ===== 标签操作 =====
  async function handleCreateTag() {
    if (!newTagName.trim()) return
    setSavingTag(true)
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: newTagName.trim() }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || "创建失败")
        return
      }
      setNewTagName("")
      setCreateTagOpen(false)
      toast.success("标签已创建")
      fetchTags()
    } finally {
      setSavingTag(false)
    }
  }

  async function handleEditTag() {
    if (!editTag || !editTagName.trim()) return
    setSavingEditTag(true)
    try {
      const res = await fetch(`/api/tags/${editTag.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: editTagName.trim() }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || "更新失败")
        return
      }
      setEditTag(null)
      toast.success("标签已更新")
      fetchTags()
    } finally {
      setSavingEditTag(false)
    }
  }

  async function handleDeleteTag() {
    if (!deleteTag) return
    setDeletingTag(true)
    try {
      const res = await fetch(`/api/tags/${deleteTag.id}`, {
        method: "DELETE",
        credentials: "include",
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || "删除失败")
        return
      }
      setDeleteTag(null)
      toast.success("标签已删除")
      fetchTags()
    } finally {
      setDeletingTag(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">
          分类与标签
        </h1>
        <p className="text-muted-foreground mt-1">管理文章和作品的分类与标签</p>
      </div>

      <Tabs defaultValue="categories" className="space-y-6">
        <TabsList>
          <TabsTrigger value="categories">分类管理</TabsTrigger>
          <TabsTrigger value="tags">标签管理</TabsTrigger>
        </TabsList>

        {/* ==================== 分类 Tab ==================== */}
        <TabsContent value="categories" className="space-y-6">
          <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden p-4">
            <TableToolbar
              searchValue={catSearch}
              onSearchChange={setCatSearch}
              searchPlaceholder="搜索分类名称…"
              filters={[{
                key: "type",
                label: "类型",
                options: [
                  { label: "文章", value: "POST" },
                  { label: "知识库", value: "KNOWLEDGE_BASE" },
                  { label: "设计作品", value: "DESIGN" },
                  { label: "开发作品", value: "DEVELOPMENT" },
                  { label: "视频教程", value: "TUTORIAL" },
                  { label: "工具", value: "TOOL" },
                ],
              }]}
              filterValues={{ type: catTypeFilter }}
              onFilterChange={(_, v) => setCatTypeFilter(v)}
              selectedCount={selectedCatIds.size}
              batchActions={catBatchActions}
              onClearSelection={() => setSelectedCatIds(new Set())}
              extra={<Button onClick={() => { setNewCatName(""); setCreateCatOpen(true) }}>新建分类</Button>}
            />

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox checked={isAllCatsSelected} onCheckedChange={toggleSelectAllCats} />
                  </TableHead>
                  <TableHead>名称</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>数量</TableHead>
                  <TableHead className="w-[100px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingCats ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">加载中…</TableCell>
                  </TableRow>
                ) : filteredCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      {categories.length === 0 ? "暂无分类" : "无匹配结果"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCategories.map((cat) => (
                    <React.Fragment key={cat.id}>
                      <TableRow>
                        <TableCell className="w-[40px]">
                          <Checkbox checked={selectedCatIds.has(cat.id)} onCheckedChange={() => toggleSelectCat(cat.id)} />
                        </TableCell>
                        <TableCell className="font-medium">{cat.name}</TableCell>
                        <TableCell className="text-muted-foreground font-mono text-sm">
                          {cat.slug}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {cat.type === "POST" ? "文章"
                              : cat.type === "KNOWLEDGE_BASE" ? "知识库"
                              : cat.type === "DESIGN" ? "设计作品"
                              : cat.type === "DEVELOPMENT" ? "开发作品"
                              : cat.type === "TUTORIAL" ? "视频教程"
                              : cat.type === "TOOL" ? "工具"
                              : "作品"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {cat.count > 0 ? (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 text-sm underline underline-offset-2 decoration-muted-foreground/40 hover:decoration-foreground cursor-pointer transition-colors"
                              onClick={() => setExpandedCatId(expandedCatId === cat.id ? null : cat.id)}
                            >
                              {cat.count}
                              <i className={`ri-arrow-${expandedCatId === cat.id ? "up" : "down"}-s-line text-xs text-muted-foreground`} />
                            </button>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">•••</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditCatName(cat.name)
                                  setEditCatSlug(cat.slug)
                                  setEditCat(cat)
                                }}
                              >
                                编辑
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setDeleteCat(cat)}
                              >
                                删除
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                      {expandedCatId === cat.id && cat.items.length > 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="bg-accent/20 px-6 py-3">
                            <div className="space-y-1">
                              {cat.items.map((item) => (
                                <div key={item.id} className="flex items-center gap-2 text-sm">
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                                    {getEntityLabel(item.entityType)}
                                  </Badge>
                                  <Link
                                    href={getEditLink(item)}
                                    className="text-foreground hover:underline underline-offset-2 truncate"
                                  >
                                    {item.title || "无标题"}
                                  </Link>
                                </div>
                              ))}
                              {cat.count > cat.items.length && (
                                <p className="text-xs text-muted-foreground pt-1">
                                  还有 {cat.count - cat.items.length} 项未显示
                                </p>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ==================== 标签 Tab ==================== */}
        <TabsContent value="tags" className="space-y-6">
          <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden p-4">
            <TagsTableSection
              tags={tags}
              loadingTags={loadingTags}
              tagSearch={tagSearch}
              setTagSearch={setTagSearch}
              expandedTagId={expandedTagId}
              setExpandedTagId={setExpandedTagId}
              setEditTagName={setEditTagName}
              setEditTag={setEditTag}
              setDeleteTag={setDeleteTag}
              setNewTagName={setNewTagName}
              setCreateTagOpen={setCreateTagOpen}
              fetchTags={fetchTags}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* ==================== 新建分类 Dialog ==================== */}
      <Dialog open={createCatOpen} onOpenChange={setCreateCatOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建分类</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="newCatName">分类名称</Label>
              <Input
                id="newCatName"
                placeholder="输入分类名称"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateCategory()}
              />
            </div>
            <div className="space-y-2">
              <Label>分类类型</Label>
              <Select value={newCatType} onValueChange={setNewCatType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="POST">文章</SelectItem>
                  <SelectItem value="KNOWLEDGE_BASE">知识库</SelectItem>
                  <SelectItem value="DESIGN">设计作品</SelectItem>
                  <SelectItem value="DEVELOPMENT">开发作品</SelectItem>
                  <SelectItem value="TUTORIAL">视频教程</SelectItem>
                  <SelectItem value="TOOL">工具</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleCreateCategory} disabled={savingCat || !newCatName.trim()}>
              {savingCat ? "创建中…" : "创建"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ==================== 编辑分类 Dialog ==================== */}
      <Dialog open={!!editCat} onOpenChange={(open) => !open && setEditCat(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑分类</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="editCatName">分类名称</Label>
              <Input
                id="editCatName"
                value={editCatName}
                onChange={(e) => setEditCatName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editCatSlug">Slug</Label>
              <Input
                id="editCatSlug"
                value={editCatSlug}
                onChange={(e) => setEditCatSlug(e.target.value)}
                className="font-mono"
              />
            </div>
            <Button className="w-full" onClick={handleEditCategory} disabled={savingEditCat || !editCatName.trim()}>
              {savingEditCat ? "保存中…" : "保存"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ==================== 删除分类确认 ==================== */}
      {deleteCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-xl border p-6 shadow-lg max-w-sm w-full mx-4 space-y-4">
            <h3 className="text-lg font-semibold">确认删除分类</h3>
            <p className="text-sm text-muted-foreground">
              确定要删除分类「{deleteCat.name}」吗？
              {deleteCat.count > 0 && (
                <span className="text-amber-600 dark:text-amber-400">
                  {" "}该分类下有 {deleteCat.count} 个内容，删除后这些内容将变为未分类。
                </span>
              )}
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteCat(null)}>取消</Button>
              <Button variant="destructive" size="sm" onClick={handleDeleteCategory} disabled={deletingCat}>
                {deletingCat ? "删除中…" : "确认删除"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 新建标签 Dialog ==================== */}
      <Dialog open={createTagOpen} onOpenChange={setCreateTagOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建标签</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="newTagName">标签名称</Label>
              <Input
                id="newTagName"
                placeholder="输入标签名称"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateTag()}
              />
            </div>
            <Button className="w-full" onClick={handleCreateTag} disabled={savingTag || !newTagName.trim()}>
              {savingTag ? "创建中…" : "创建"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ==================== 编辑标签 Dialog ==================== */}
      <Dialog open={!!editTag} onOpenChange={(open) => !open && setEditTag(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑标签</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="editTagName">标签名称</Label>
              <Input
                id="editTagName"
                value={editTagName}
                onChange={(e) => setEditTagName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleEditTag()}
              />
            </div>
            <Button className="w-full" onClick={handleEditTag} disabled={savingEditTag || !editTagName.trim()}>
              {savingEditTag ? "保存中…" : "保存"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ==================== 删除标签确认 ==================== */}
      {deleteTag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-xl border p-6 shadow-lg max-w-sm w-full mx-4 space-y-4">
            <h3 className="text-lg font-semibold">确认删除标签</h3>
            <p className="text-sm text-muted-foreground">
              确定要删除标签「{deleteTag.name}」吗？
              {deleteTag.count > 0 && (
                <span className="text-amber-600 dark:text-amber-400">
                  {" "}该标签已被 {deleteTag.count} 篇文章使用，删除后将自动解除关联。
                </span>
              )}
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteTag(null)}>取消</Button>
              <Button variant="destructive" size="sm" onClick={handleDeleteTag} disabled={deletingTag}>
                {deletingTag ? "删除中…" : "确认删除"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


function TagsTableSection({
  tags,
  loadingTags,
  tagSearch,
  setTagSearch,
  expandedTagId,
  setExpandedTagId,
  setEditTagName,
  setEditTag,
  setDeleteTag,
  setNewTagName,
  setCreateTagOpen,
  fetchTags,
}: {
  tags: TagItem[]
  loadingTags: boolean
  tagSearch: string
  setTagSearch: (v: string) => void
  expandedTagId: string | null
  setExpandedTagId: (v: string | null) => void
  setEditTagName: (v: string) => void
  setEditTag: (v: TagItem) => void
  setDeleteTag: (v: TagItem) => void
  setNewTagName: (v: string) => void
  setCreateTagOpen: (v: boolean) => void
  fetchTags: () => void
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    const term = tagSearch.trim().toLowerCase()
    if (!term) return tags
    return tags.filter((t) => t.name.toLowerCase().includes(term))
  }, [tags, tagSearch])

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const isAllSelected = filtered.length > 0 && filtered.every((t) => selectedIds.has(t.id))

  function toggleSelectAll() {
    if (isAllSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        filtered.forEach((t) => next.delete(t.id))
        return next
      })
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        filtered.forEach((t) => next.add(t.id))
        return next
      })
    }
  }

  async function handleBatchDeleteTags() {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    try {
      const res = await fetch("/api/tags/batch", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ids }),
      })
      if (res.ok) {
        setSelectedIds(new Set())
        toast.success(`已删除 ${ids.length} 个标签`)
        await fetchTags()
      } else toast.error("批量删除失败")
    } catch { toast.error("网络错误") }
  }

  const batchActions: BatchAction[] = selectedIds.size > 0
    ? [{
        label: "删除", icon: "ri-delete-bin-line", variant: "destructive" as const, onClick: handleBatchDeleteTags,
        needConfirm: true, confirmTitle: `确定删除选中的 ${selectedIds.size} 个标签？`, confirmDescription: "删除后不可恢复",
      }]
    : []

  return (
    <>
      <TableToolbar
        searchValue={tagSearch}
        onSearchChange={setTagSearch}
        searchPlaceholder="搜索标签名称…"
        selectedCount={selectedIds.size}
        batchActions={batchActions}
        onClearSelection={() => setSelectedIds(new Set())}
        extra={<Button onClick={() => { setNewTagName(""); setCreateTagOpen(true) }}>新建标签</Button>}
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]">
              <Checkbox checked={isAllSelected} onCheckedChange={toggleSelectAll} />
            </TableHead>
            <TableHead>名称</TableHead>
            <TableHead>数量</TableHead>
            <TableHead className="w-[100px]">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loadingTags ? (
            <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">加载中…</TableCell></TableRow>
          ) : filtered.length === 0 ? (
            <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">{tags.length === 0 ? "暂无标签" : "无匹配标签"}</TableCell></TableRow>
          ) : filtered.map((tag) => (
            <React.Fragment key={tag.id}>
              <TableRow>
                <TableCell className="w-[40px]">
                  <Checkbox checked={selectedIds.has(tag.id)} onCheckedChange={() => toggleSelect(tag.id)} />
                </TableCell>
                <TableCell className="font-medium">{tag.name}</TableCell>
                <TableCell>
                  {tag.count > 0 ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-sm underline underline-offset-2 decoration-muted-foreground/40 hover:decoration-foreground cursor-pointer transition-colors"
                      onClick={() => setExpandedTagId(expandedTagId === tag.id ? null : tag.id)}
                    >
                      {tag.count}
                      <i className={`ri-arrow-${expandedTagId === tag.id ? "up" : "down"}-s-line text-xs text-muted-foreground`} />
                    </button>
                  ) : (
                    <span className="text-muted-foreground">0</span>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">•••</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setEditTagName(tag.name); setEditTag(tag) }}>编辑</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTag(tag)}>删除</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
              {expandedTagId === tag.id && tag.items.length > 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="bg-accent/20 px-6 py-3">
                    <div className="space-y-1">
                      {tag.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-2 text-sm">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">{getEntityLabel(item.entityType)}</Badge>
                          <Link href={getEditLink(item)} className="text-foreground hover:underline underline-offset-2 truncate">{item.title || "无标题"}</Link>
                        </div>
                      ))}
                      {tag.count > tag.items.length && (
                        <p className="text-xs text-muted-foreground pt-1">还有 {tag.count - tag.items.length} 项未显示</p>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </>
  )
}
