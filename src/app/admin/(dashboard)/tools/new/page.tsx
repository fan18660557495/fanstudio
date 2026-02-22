"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

type ToolCategory = {
  id: string
  name: string
  slug: string
}

export default function NewToolPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<ToolCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    link: '',
    categoryId: ''
  })

  // 获取分类列表
  async function loadCategories() {
    setLoading(true)
    try {
      const res = await fetch('/api/tool-categories', { credentials: 'include' })
      if (!res.ok) {
        router.push('/admin/login')
        return
      }
      const data = await res.json()
      setCategories(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('加载分类失败:', error)
      toast.error('加载分类失败')
    } finally {
      setLoading(false)
    }
  }

  // 处理表单提交
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    try {
      const form = new FormData()
      form.append('name', formData.name)
      form.append('description', formData.description)
      form.append('link', formData.link)
      form.append('categoryId', formData.categoryId)

      const res = await fetch('/api/admin/tools', {
        method: 'POST',
        credentials: 'include',
        body: form
      })

      if (res.ok) {
        toast.success('工具创建成功')
        router.push('/admin/tools')
      } else {
        const error = await res.json().catch(() => ({}))
        toast.error(error.error || '创建失败')
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
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // 处理分类选择
  function handleCategoryChange(value: string) {
    setFormData(prev => ({ ...prev, categoryId: value }))
  }

  useEffect(() => {
    loadCategories()
  }, [])

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">新增工具</h1>
        <p className="text-muted-foreground mt-1">添加新的工具到导航中</p>
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
                value={formData.name}
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
                value={formData.description}
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
                value={formData.link}
                onChange={handleInputChange}
                placeholder="请输入工具网址"
                required
              />
            </div>

            {/* 工具分类 */}
            <div className="space-y-2">
              <Label htmlFor="categoryId">工具分类 *</Label>
              <Select value={formData.categoryId} onValueChange={handleCategoryChange} required>
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
              {submitting ? '创建中...' : '保存工具'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
