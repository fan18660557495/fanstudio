"use client"

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useTableControls } from '@/hooks/useTableControls'
import { TableToolbar, type ToolbarFilter, type BatchAction } from '@/components/admin/TableToolbar'
import { TablePagination } from '@/components/admin/TablePagination'
import { SortableTableHead } from '@/components/admin/SortableTableHead'
import { ConfirmPopover } from '@/components/admin/ConfirmPopover'
import { toast } from 'sonner'

type Tool = {
  id: string
  name: string
  description: string
  link: string
  category: { name: string }
  categoryId: string
  createdAt: string
}

type ToolCategory = {
  id: string
  name: string
  slug: string
}

export default function ToolsPage() {
  const router = useRouter()
  const [tools, setTools] = useState<Tool[]>([])
  const [categories, setCategories] = useState<ToolCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  /* ---- table controls ---- */
  const tc = useTableControls<Tool>({
    data: tools,
    searchFields: ["name", "description"],
    defaultPageSize: 20,
  })

  /* ---- filters config ---- */
  const toolbarFilters: ToolbarFilter[] = useMemo(() => {
    const filters: ToolbarFilter[] = []
    if (categories.length > 0) {
      filters.push({
        key: "category.name",
        label: "分类",
        options: categories.map((c) => ({ label: c.name, value: c.name })),
      })
    }
    return filters
  }, [categories])

  /* ---- batch actions ---- */
  const batchActions: BatchAction[] = useMemo(() => [
    {
      label: "删除",
      icon: "ri-delete-bin-line",
      variant: "destructive" as const,
      onClick: handleBatchDelete,
      needConfirm: true,
      confirmTitle: `确定删除选中的 ${tc.selectedIds.size} 个工具？`,
      confirmDescription: "删除后不可恢复",
    },
  ], [tc.selectedIds])

  // 获取工具列表
  async function loadTools() {
    setLoading(true)
    try {
      const [toolsRes, categoriesRes] = await Promise.all([
        fetch('/api/admin/tools', { credentials: 'include' }),
        fetch('/api/tool-categories', { credentials: 'include' })
      ])

      if (!toolsRes.ok || !categoriesRes.ok) {
        router.push('/admin/login')
        return
      }

      const toolsData = await toolsRes.json()
      const categoriesData = await categoriesRes.json()

      setTools(Array.isArray(toolsData) ? toolsData : [])
      setCategories(Array.isArray(categoriesData) ? categoriesData : [])
    } catch (error) {
      console.error('加载工具失败:', error)
      toast.error('加载工具失败')
    } finally {
      setLoading(false)
    }
  }

  // 删除工具
  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/tools/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (res.ok) {
        setTools(prev => prev.filter(tool => tool.id !== id))
        toast.success('工具删除成功')
      } else {
        const error = await res.json().catch(() => ({}))
        toast.error(error.error || '删除失败')
      }
    } catch (error) {
      console.error('删除工具失败:', error)
      toast.error('网络错误')
    } finally {
      setDeletingId(null)
    }
  }

  /* ---- batch operations ---- */
  async function handleBatchDelete() {
    const ids = Array.from(tc.selectedIds)
    if (ids.length === 0) return
    try {
      // 逐个删除工具，因为 API 可能不支持批量删除
      let successCount = 0
      for (const id of ids) {
        const res = await fetch(`/api/admin/tools/${id}`, {
          method: 'DELETE',
          credentials: 'include'
        })
        if (res.ok) successCount++
      }
      if (successCount > 0) {
        setTools((prev) => prev.filter((tool) => !ids.includes(tool.id)))
        tc.clearSelection()
        toast.success(`已删除 ${successCount} 个工具`)
      } else {
        toast.error('批量删除失败')
      }
    } catch {
      toast.error('网络错误')
    }
  }

  /* ---- helpers ---- */
  function formatDate(dateStr: string) {
    try {
      return new Date(dateStr).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
    } catch { return dateStr }
  }

  /* ---- render cells (shared between dnd and normal mode) ---- */
  function renderCells(tool: Tool) {
    return (
      <>
        <TableCell>
          <span className="font-medium truncate">{tool.name}</span>
        </TableCell>
        <TableCell>
          <Badge variant="outline">{tool.category.name}</Badge>
        </TableCell>
        <TableCell>
          <span className="text-sm text-gray-600">
            {tool.description.length > 50 
              ? `${tool.description.substring(0, 50)}...` 
              : tool.description
            }
          </span>
        </TableCell>
        <TableCell>
          <a 
            href={tool.link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            {tool.link.length > 30 
              ? `${tool.link.substring(0, 30)}...` 
              : tool.link
            }
          </a>
        </TableCell>
        <TableCell>{formatDate(tool.createdAt)}</TableCell>
        <TableCell>
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
              <a href={`/admin/tools/${tool.id}/edit`}><i className="ri-edit-line" /></a>
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
              <a href={tool.link} target="_blank"><i className="ri-eye-line" /></a>
            </Button>
            <ConfirmPopover
              title="确定删除该工具？"
              description="删除后不可恢复"
              confirmText="删除"
              onConfirm={() => handleDelete(tool.id)}
              align="end"
            >
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive h-8 w-8 p-0" disabled={deletingId === tool.id}>
                <i className={deletingId === tool.id ? "ri-loader-4-line animate-spin" : "ri-delete-bin-line"} />
              </Button>
            </ConfirmPopover>
          </div>
        </TableCell>
      </>
    )
  }

  useEffect(() => {
    loadTools()
  }, [])

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">工具管理</h1>
          <p className="text-muted-foreground mt-1">管理和维护工具导航中的工具</p>
        </div>
        <Button asChild>
          <a href="/admin/tools/new">新增工具</a>
        </Button>
      </div>

      {/* 工具列表 */}
      <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden p-4">
        <TableToolbar
          searchValue={tc.searchTerm}
          onSearchChange={tc.setSearchTerm}
          searchPlaceholder="搜索工具名称或描述…"
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
              筛选模式
            </span>
            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={tc.resetFilters}>
              清除筛选
            </Button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">加载中…</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={tc.isAllSelected}
                    onCheckedChange={() => tc.toggleSelectAll()}
                  />
                </TableHead>
                <TableHead>工具名称</TableHead>
                <TableHead>分类</TableHead>
                <TableHead>描述</TableHead>
                <TableHead>链接</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="w-[120px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tc.pagedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    暂无工具，点击「新增工具」添加
                  </TableCell>
                </TableRow>
              ) : tc.pagedData.map((tool) => (
                <TableRow key={tool.id}>
                  <TableCell className="w-[40px]">
                    <Checkbox
                      checked={tc.selectedIds.has(tool.id)}
                      onCheckedChange={() => tc.toggleSelect(tool.id)}
                    />
                  </TableCell>
                  {renderCells(tool)}
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
