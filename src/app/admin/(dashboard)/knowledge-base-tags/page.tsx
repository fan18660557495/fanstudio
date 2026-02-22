"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableRow } from '@/components/ui/table'
import { TablePagination } from '@/components/admin/TablePagination'
import { ConfirmPopover } from '@/components/admin/ConfirmPopover'

interface KnowledgeBaseTag {
  id: string
  name: string
  articles: any[]
  createdAt: string
  updatedAt: string
}

interface TagFormData {
  name: string
}

const KnowledgeBaseTagsPage = () => {
  const [tags, setTags] = useState<KnowledgeBaseTag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentTag, setCurrentTag] = useState<KnowledgeBaseTag | null>(null)
  const [formData, setFormData] = useState<TagFormData>({
    name: ''
  })

  // 获取标签列表
  const fetchTags = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/knowledge-base/tags')
      if (!response.ok) {
        throw new Error('获取标签列表失败')
      }
      const data = await response.json()
      // 确保 data 是数组
      setTags(Array.isArray(data) ? data : [])
    } catch (err) {
      setError('获取标签列表失败')
      console.error(err)
      // 发生错误时设置为空数组
      setTags([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTags()
  }, [])

  // 处理表单输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // 重置表单
  const resetForm = () => {
    setFormData({
      name: ''
    })
    setCurrentTag(null)
  }

  // 打开创建对话框
  const openCreateDialog = () => {
    resetForm()
    setIsCreateDialogOpen(true)
  }

  // 打开编辑对话框
  const openEditDialog = (tag: KnowledgeBaseTag) => {
    setCurrentTag(tag)
    setFormData({
      name: tag.name
    })
    setIsEditDialogOpen(true)
  }

  // 提交表单（创建或更新）
  const submitForm = async () => {
    try {
      // 验证表单数据
      if (!formData.name.trim()) {
        throw new Error('标签名称不能为空')
      }

      const isUpdate = currentTag
      const url = isUpdate
        ? `/api/knowledge-base/tags/${currentTag.id}`
        : '/api/knowledge-base/tags'
      
      const response = await fetch(url, {
        method: isUpdate ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || (isUpdate ? '更新标签失败' : '创建标签失败')
        throw new Error(errorMessage)
      }

      // 重新获取标签列表
      await fetchTags()
      
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

  // 删除标签
  const deleteTag = async (tagId: string) => {
    try {
      const response = await fetch(`/api/knowledge-base/tags/${tagId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('删除标签失败')
      }

      // 重新获取标签列表
      await fetchTags()
    } catch (err) {
      setError('删除标签失败')
      console.error(err)
    }
  }

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
          <CardTitle className="text-2xl font-bold">知识库标签管理</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end mb-6">
            <Button onClick={openCreateDialog}>
              创建标签
            </Button>
          </div>

          <Table className="w-full">
            <thead>
              <tr>
                <th>标签名称</th>
                <th>关联文章数</th>
                <th>创建时间</th>
                <th className="text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {tags.map((tag) => (
                <tr key={tag.id}>
                  <td>{tag.name}</td>
                  <td>{tag.articles?.length || 0}</td>
                  <td>{new Date(tag.createdAt).toLocaleString()}</td>
                  <td className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(tag)}
                      >
                        编辑
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteTag(tag.id)}
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

      {/* 创建标签对话框 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建知识库标签</DialogTitle>
            <DialogDescription>
              填写标签名称
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">标签名称</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="请输入标签名称"
              />
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

      {/* 编辑标签对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑知识库标签</DialogTitle>
            <DialogDescription>
              修改标签名称
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">标签名称</Label>
              <Input
                id="edit-name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="请输入标签名称"
              />
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

export default KnowledgeBaseTagsPage
