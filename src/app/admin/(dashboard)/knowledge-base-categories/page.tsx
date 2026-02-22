"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableRow } from '@/components/ui/table'
import { TablePagination } from '@/components/admin/TablePagination'
import { ConfirmPopover } from '@/components/admin/ConfirmPopover'
import { cn } from '@/lib/utils'

interface KnowledgeBaseCategory {
  id: string
  name: string
  slug: string
  parentId: string | null
  parent: KnowledgeBaseCategory | null
  other_knowledgebasecategory: KnowledgeBaseCategory[]
  createdAt: string
  updatedAt: string
  level?: number
}

interface CategoryFormData {
  name: string
  slug: string
  parentId: string | null
}

const KnowledgeBaseCategoriesPage = () => {
  const [categories, setCategories] = useState<KnowledgeBaseCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentCategory, setCurrentCategory] = useState<KnowledgeBaseCategory | null>(null)
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    slug: '',
    parentId: null
  })

  // 获取分类列表
  const fetchCategories = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/knowledge-base/categories')
      if (!response.ok) {
        throw new Error('获取分类列表失败')
      }
      const data = await response.json()
      // 确保 data 是数组
      setCategories(Array.isArray(data) ? data : [])
    } catch (err) {
      setError('获取分类列表失败')
      console.error(err)
      // 发生错误时设置为空数组
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  // 处理表单输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // 处理选择变化
  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, parentId: value === 'null' ? null : value }))
  }

  // 重置表单
  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      parentId: null
    })
    setCurrentCategory(null)
  }

  // 打开创建对话框
  const openCreateDialog = () => {
    resetForm()
    setIsCreateDialogOpen(true)
  }

  // 打开编辑对话框
  const openEditDialog = (category: KnowledgeBaseCategory) => {
    setCurrentCategory(category)
    setFormData({
      name: category.name,
      slug: category.slug,
      parentId: category.parentId
    })
    setIsEditDialogOpen(true)
  }

  // 提交表单（创建或更新）
  const submitForm = async () => {
    try {
      // 验证表单数据
      if (!formData.name.trim()) {
        throw new Error('分类名称不能为空')
      }
      if (!formData.slug.trim()) {
        throw new Error('分类别名不能为空')
      }

      const isUpdate = currentCategory
      const url = isUpdate
        ? `/api/knowledge-base/categories/${currentCategory.id}`
        : '/api/knowledge-base/categories'
      
      const response = await fetch(url, {
        method: isUpdate ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || (isUpdate ? '更新分类失败' : '创建分类失败')
        throw new Error(errorMessage)
      }

      // 重新获取分类列表
      await fetchCategories()
      
      // 关闭对话框
      if (isUpdate) {
        setIsEditDialogOpen(false)
      } else {
        setIsCreateDialogOpen(false)
      }
      
      // 重置表单
      resetForm()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '操作失败'
      setError(errorMessage)
      console.error(err)
    }
  }

  // 删除分类
  const deleteCategory = async (categoryId: string) => {
    try {
      const response = await fetch(`/api/knowledge-base/categories/${categoryId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('删除分类失败')
      }

      // 重新获取分类列表
      await fetchCategories()
    } catch (err) {
      setError('删除分类失败')
      console.error(err)
    }
  }

  // 生成分类选项（不包括当前编辑的分类及其子分类）
  const getCategoryOptions = (excludeId?: string) => {
    const options: { value: string; label: string }[] = [
      { value: 'null', label: '无父分类' }
    ]

    const buildOptions = (cats: KnowledgeBaseCategory[], prefix = '') => {
      cats.forEach(cat => {
        if (cat.id !== excludeId) {
          options.push({
            value: cat.id,
            label: `${prefix}${cat.name}`
          })
          if (cat.other_knowledgebasecategory.length > 0) {
            buildOptions(cat.other_knowledgebasecategory, `${prefix}└─ `)
          }
        }
      })
    }

    buildOptions(categories)
    return options
  }

  // 扁平化分类列表用于表格展示
  const flattenedCategories = (() => {
    const result: KnowledgeBaseCategory[] = []
    
    const flatten = (cats: KnowledgeBaseCategory[], level = 0) => {
      cats.forEach(cat => {
        result.push({ ...cat, level })
        if (cat.other_knowledgebasecategory.length > 0) {
          flatten(cat.other_knowledgebasecategory, level + 1)
        }
      })
    }
    
    flatten(categories)
    return result
  })()

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p>加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">知识库分类管理</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end mb-6">
            <Button onClick={openCreateDialog}>
              创建分类
            </Button>
          </div>

          <Table className="w-full">
            <thead>
              <tr>
                <th>分类名称</th>
                <th>别名</th>
                <th>父分类</th>
                <th>创建时间</th>
                <th className="text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {flattenedCategories.map((category) => (
                <tr key={category.id}>
                  <td>
                    <span className={cn(
                      "inline-block",
                      { 'pl-4': category.level && category.level > 0 }
                    )}>
                      {category.name}
                    </span>
                  </td>
                  <td>{category.slug}</td>
                  <td>{category.parent?.name || '无'}</td>
                  <td>{new Date(category.createdAt).toLocaleString()}</td>
                  <td className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(category)}
                      >
                        编辑
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteCategory(category.id)}
                      >
                        删除
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          <div className="mt-4 flex justify-center">
            <Button
              variant="ghost"
              size="sm"
            >
              1
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 创建分类对话框 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建知识库分类</DialogTitle>
            <DialogDescription>
              填写分类信息，支持多级嵌套分类
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">分类名称</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="请输入分类名称"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">别名 (slug)</Label>
              <Input
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                placeholder="请输入别名"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parentId">父分类</Label>
              <Select value={formData.parentId === null ? 'null' : formData.parentId} onValueChange={handleSelectChange}>
                <SelectTrigger>
                  <SelectValue placeholder="选择父分类" />
                </SelectTrigger>
                <SelectContent>
                  {getCategoryOptions().map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsCreateDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={submitForm}>
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑分类对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑知识库分类</DialogTitle>
            <DialogDescription>
              修改分类信息
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">分类名称</Label>
              <Input
                id="edit-name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="请输入分类名称"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-slug">别名 (slug)</Label>
              <Input
                id="edit-slug"
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                placeholder="请输入别名"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-parentId">父分类</Label>
              <Select value={formData.parentId === null ? 'null' : formData.parentId} onValueChange={handleSelectChange}>
                <SelectTrigger>
                  <SelectValue placeholder="选择父分类" />
                </SelectTrigger>
                <SelectContent>
                  {getCategoryOptions(currentCategory?.id).map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={submitForm}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default KnowledgeBaseCategoriesPage
