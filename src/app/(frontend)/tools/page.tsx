"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Search } from 'lucide-react'

// 类型定义
interface SettingsData {
  nav?: {
    tools?: string
  }
  pageCopy?: {
    toolsDesc?: string
  }
}

// 类型定义
interface ToolCategory {
  id: string
  name: string
  slug: string
  _count: { tools: number }
}

interface Tool {
  id: string
  name: string
  description: string
  link: string
  category: { name: string }
  categoryId: string
}

export default function ToolsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [toolCategories, setToolCategories] = useState<ToolCategory[]>([])
  const [tools, setTools] = useState<Tool[]>([])
  const [settings, setSettings] = useState<SettingsData>({})
  const [loading, setLoading] = useState(true)

  // 获取工具分类
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/tool-categories')
        const data = await response.json()
        setToolCategories(data)
      } catch (error) {
        console.error('获取分类失败:', error)
      }
    }
    fetchCategories()
  }, [])

  // 获取工具列表
  useEffect(() => {
    const fetchTools = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/tools')
        const data = await response.json()
        setTools(data)
      } catch (error) {
        console.error('获取工具失败:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchTools()
  }, [])

  // 获取设置数据
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings')
        const data = await response.json()
        setSettings(data)
      } catch (error) {
        console.error('获取设置失败:', error)
      }
    }
    fetchSettings()
  }, [])

  // 搜索和筛选工具
  const filteredTools = tools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        tool.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || tool.categoryId === selectedCategory
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">AI工具导航</h1>
          <p className="text-gray-600 text-lg">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* 页面标题 */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">{settings.nav?.tools || '工具导航'}</h1>
        <p className="text-gray-600 text-lg">{settings.pageCopy?.toolsDesc || '发现和使用最优质的工具资源'}</p>
      </div>

      {/* 搜索和分类 */}
      <div className="mb-12">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              type="text"
              placeholder="搜索AI工具..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2"
            />
          </div>
          <Button 
            onClick={() => setSearchTerm('')}
            className="w-full md:w-auto"
          >
            清空搜索
          </Button>
        </div>

        {/* 分类标签页 */}
        <Tabs defaultValue="all" className="mt-8" onValueChange={setSelectedCategory}>
          <TabsList className={`grid w-full ${toolCategories.length > 4 ? 'grid-cols-6' : 'grid-cols-5'}`}>
            <TabsTrigger value="all">全部</TabsTrigger>
            {toolCategories.map(category => (
              <TabsTrigger key={category.id} value={category.id}>
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* 工具展示 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredTools.length > 0 ? (
          filteredTools.map(tool => (
            <Card key={tool.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-semibold">{tool.name}</CardTitle>
                  <Badge variant="outline" className="text-xs">{tool.category.name}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  {tool.description}
                </CardDescription>
                <Button 
                  asChild
                  className="w-full"
                >
                  <a href={tool.link} target="_blank" rel="noopener noreferrer">
                    访问工具
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">未找到匹配的工具</p>
          </div>
        )}
      </div>


    </div>
  )
}
