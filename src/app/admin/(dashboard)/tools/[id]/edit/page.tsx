"use client"

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

type Tool = {
  id: string
  name: string
  description: string
  link: string
  categoryId: string
}

type ToolCategory = {
  id: string
  name: string
  slug: string
}

export default function EditToolPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const toolId = params.id

  const [tool, setTool] = useState<Tool | null>(null)
  const [categories, setCategories] = useState<ToolCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // 获取工具详情和分类列表
  async function loadToolData() {
    setLoading(true)
    try {
      const [toolRes, categoriesRes] = await Promise.all([
        fetch(`/api/tools?id=${toolId}`, { credentials: 'include' }),
        fetch('/api/tool-categories', { credentials: 'include' })
      ])

      if (!toolRes.ok || !categoriesRes.ok) {
        router.push('/admin/login')
        return
      }

      const toolData = await toolRes.json()
      const categoriesData = await categoriesRes.json()

      if (!toolData) {
        setTool(null)
        return
      }

      setTool(toolData)
      setCategories(Array.isArray(categoriesData) ? categoriesData : [])
    } catch (error) {
      console.error('加载工具数据失败:', error)
      toast.error('加载工具数据失败')
    } finally {
      setLoading(false)
    }
  }

  // 处理表单提交
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!tool) return

    setSubmitting(true)
    try {
      const form = new FormData()
      form.append('_method', 'PUT')
      form.append('name', tool.name)
      form.append('description', tool.description)
      form.append('link', tool.link)
      form.append('categoryId', tool.categoryId)

      const res = await fetch(`/api/admin/tools/${toolId}`, {
        method: 'POST',
        credentials: 'include',
        body: form
      })

      if (res.ok) {
        toast.success('工具更新成功')
        router.push('/admin/tools')
      } else {
        const error = await res.json().catch(() => ({}))
        toast.error(error.error || '更新失败')
      }
    } catch (error) {
      console.error('提交失败:', error)
      toast.error('网络错误')
    } finally {
      setSubmitting(false)
    }
  }

  // 处理表单输入变化
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    if (!tool) return
    const { name, value } = e.target
    setTool(prev => prev ? { ...prev, [name]: value } : null)
  }

  // 处理分类选择
  function handleCategoryChange(value: string) {
    if (!tool) return
    setTool(prev => prev ? { ...prev, categoryId: value } : null)
  }

  useEffect(() => {
    loadToolData()
  }, [toolId])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">编辑工具</h1>
          <p className="text-muted-foreground mt-1">修改工具的详细信息</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">加载中…</p>
        </div>
      </div>
    )
  }

  if (!tool) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">编辑工具</h1>
          <p className="text-muted-foreground mt-1">修改工具的详细信息</p>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">工具不存在或已被删除</p>
          <Button onClick={() => router.push('/admin/tools')}>
            返回工具管理
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">编辑工具</h1>
        <p className="text-muted-foreground mt-1">修改工具的详细信息</p>
      </div>

      {/* 表单 */}
      <div className="max-w-2xl space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* 工具名称 */}
            <div className="space-y-2">
              <Label htmlFor="name">工具名称 *</Label>
              <Input
                id="name"
                name="name"
                value={tool.name}
                onChange={handleInputChange}
                placeholder="请输入工具名称"
                required
              />
            </div>

            {/* 工具描述 */}
            <div className="space-y-2">
              <Label htmlFor="description">工具描述 *</Label>
              <Textarea
                id="description"
                name="description"
                value={tool.description}
                onChange={handleInputChange}
                placeholder="请描述工具的功能和特点"
                rows={4}
                required
              />
            </div>

            {/* 工具链接 */}
            <div className="space-y-2">
              <Label htmlFor="link">工具链接 *</Label>
              <Input
                id="link"
                name="link"
                type="url"
                value={tool.link}
                onChange={handleInputChange}
                placeholder="请输入工具网址"
                required
              />
            </div>

            {/* 工具分类 */}
            <div className="space-y-2">
              <Label htmlFor="categoryId">工具分类 *</Label>
              <Select 
                value={tool.categoryId} 
                onValueChange={handleCategoryChange} 
                required
              >
                <SelectTrigger id="categoryId">
                  <SelectValue placeholder="请选择分类" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 表单操作 */}
          <div className="flex items-center gap-4">
            <Button 
              type="button" 
              variant="ghost"
              onClick={() => router.push('/admin/tools')}
            >
              取消
            </Button>
            <Button 
              type="submit" 
              disabled={submitting}
            >
              {submitting ? '更新中...' : '更新工具'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
