"use client"

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTheme } from 'next-themes'
import { Search, ChevronDown, ChevronRight, FileText, Sun, Moon } from 'lucide-react'

// 类型定义
interface KnowledgeBaseCategory {
  id: string
  name: string
  slug: string
  type: string
  knowledgebasearticle: KnowledgeBaseArticle[]
}

interface KnowledgeBaseTag {
  id: string
  name: string
}

interface KnowledgeBaseArticle {
  id: string
  title: string
  excerpt: string
  content: unknown
  coverImage: string | null
  coverRatio: string
  category: {
    id: string
    name: string
  } | null
  tag: KnowledgeBaseTag[]
  user: {
    id: string
    name: string
    avatar: string | null
  }
  publishedAt: string | null
  createdAt: string
}

interface SettingsData {
  nav?: {
    knowledgeBase?: string
  }
  pageCopy?: {
    knowledgeBaseDesc?: string
  }
  theme?: {
    base?: string
    accent?: string
  }
}

interface OutlineItem {
  id: string
  text: string
  level: number
  children?: OutlineItem[]
}

export default function KnowledgeBasePage() {
  const { theme, setTheme } = useTheme()
  const [searchTerm, setSearchTerm] = useState('')
  const [categories, setCategories] = useState<KnowledgeBaseCategory[]>([])
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeBaseArticle | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [settings, setSettings] = useState<SettingsData>({})
  const [loading, setLoading] = useState(true)
  const [articleLoading, setArticleLoading] = useState(false)
  const [showNav, setShowNav] = useState(true)
  const [showOutline, setShowOutline] = useState(true)

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

  // 获取分类列表
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/knowledge-base/categories')
        const data = await response.json()
        // 确保 data 是数组
        setCategories(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('获取分类失败:', error)
        // 发生错误时设置为空数组
        setCategories([])
      } finally {
        setLoading(false)
      }
    }
    fetchCategories()
  }, [])

  // 搜索功能
  const handleSearch = () => {
    // 实现搜索逻辑
  }


  // 切换分类展开/折叠
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  // 加载文章详情
  const loadArticleDetails = async (articleId: string) => {
    setArticleLoading(true)
    try {
      const response = await fetch(`/api/knowledge-base/articles/${articleId}`)
      const data = await response.json()
      setSelectedArticle(data)
    } catch (error) {
      console.error('获取文章详情失败:', error)
    } finally {
      setArticleLoading(false)
    }
  }

interface OutlineContent {
  type?: string
  content?: OutlineContent[]
  attrs?: { level?: number }
  text?: string
}

  // 生成文章大纲
  const generateOutline = (content: unknown): OutlineItem[] => {
    const outline: OutlineItem[] = []
    const contentObj = content as OutlineContent | null
    if (!contentObj || !contentObj.content) return outline

    const processContent = (items: OutlineContent[], currentLevel: number = 0, parent: OutlineItem | null = null) => {
      items.forEach((item, index) => {
        if (item.type === 'heading') {
          const headingItem: OutlineItem = {
            id: `heading-${currentLevel}-${index}`,
            text: item.content?.map((c) => c.text || '').join('') || '',
            level: item.attrs?.level || 1,
            children: []
          }

          if (parent) {
            parent.children?.push(headingItem)
          } else {
            outline.push(headingItem)
          }

          processContent(item.content || [], currentLevel + 1, headingItem)
        } else if (item.content) {
          processContent(item.content, currentLevel, parent)
        }
      })
    }

    processContent(contentObj.content)
    return outline
  }

  // 渲染分类树
  const renderCategoryTree = (categories: KnowledgeBaseCategory[], level: number = 0) => {
    // 获取主题强调色，默认使用橙色
    const accentColor = settings.theme?.accent || 'fanmihua'

    return categories.map(category => {
      const categoryArticles = category.knowledgebasearticle
      const isExpanded = expandedCategories.has(category.id)

      return (
        <div key={category.id} className="mb-2">
          <div 
            className={`flex items-center gap-2 cursor-pointer py-1 px-${level * 4} hover:bg-muted rounded`}
            onClick={() => toggleCategory(category.id)}
          >
            {isExpanded ? (
              <ChevronDown size={16} className="text-muted-foreground" />
            ) : (
              <ChevronRight size={16} className="text-muted-foreground" />
            )}
            <span className="font-medium">{category.name}</span>
            {categoryArticles.length > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {categoryArticles.length}
              </Badge>
            )}
          </div>

          {/* 渲染分类下的文章 */}
          {isExpanded && categoryArticles.length > 0 && (
            <div className={`ml-${level * 4 + 6} mt-1 space-y-1`}>
              {categoryArticles.map(article => {
                const isSelected = selectedArticle?.id === article.id
                return (
                  <div 
                    key={article.id}
                    className={`flex items-center gap-2 py-1 px-2 hover:bg-muted rounded cursor-pointer ${isSelected ? 'bg-blue-50' : ''}`}
                    onClick={() => loadArticleDetails(article.id)}
                    style={{ 
                      color: isSelected ? accentColor : undefined
                    }}
                  >
                    <FileText size={14} className="text-muted-foreground" />
                    <span className="text-sm font-medium">{article.title}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )
    })
  }

  // 渲染大纲
  const renderOutline = (outline: OutlineItem[], level: number = 0) => {
    return outline.map((item, index) => (
      <div key={item.id} className="mb-1">
        <div 
          className={`pl-${level * 4} text-sm hover:text-blue-600 cursor-pointer ${selectedArticle?.id === item.id ? 'text-blue-600 font-medium' : ''}`}
          onClick={() => {
            const element = document.getElementById(item.id)
            if (element) {
              element.scrollIntoView({ behavior: 'smooth' })
            }
          }}
        >
          {item.text}
        </div>
        {item.children && item.children.length > 0 && (
          <div className="mt-1">
            {renderOutline(item.children, level + 1)}
          </div>
        )}
      </div>
    ))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">{settings.nav?.knowledgeBase || '知识库'}</h1>
            <p className="text-muted-foreground">加载中...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* 顶部导航栏 */}
      <div className="sticky top-0 z-10 bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{settings.nav?.knowledgeBase || '知识库'}</h1>
            <p className="text-sm text-muted-foreground">{settings.pageCopy?.knowledgeBaseDesc || '发现和学习优质的知识内容'}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                type="text"
                placeholder="搜索知识库内容..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 w-64"
              />
            </div>
            <Button 
              onClick={() => setSearchTerm('')}
              size="sm"
            >
              清空
            </Button>
            <Button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              size="sm"
              variant="ghost"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </Button>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row w-full h-[calc(100vh-160px)] border border-border">
          {/* 左侧分类导航 (15%) */}
          {showNav && (
            <div className="lg:w-[15%] bg-card p-4 overflow-y-auto border-r border-border relative">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">分类导航</h2>
                <button 
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => setShowNav(false)}
                >
                  ✕
                </button>
              </div>
              {categories.length > 0 ? (
                renderCategoryTree(categories)
              ) : (
                <p className="text-muted-foreground text-sm">暂无分类</p>
              )}
            </div>
          )}
          {!showNav && (
            <div className="lg:w-[2%] bg-card flex items-center justify-center border-r border-border cursor-pointer"
                 onClick={() => setShowNav(true)}>
              <span className="text-muted-foreground hover:text-foreground">≡</span>
            </div>
          )}

          {/* 中间文章内容 (根据导航和大纲的显示状态调整宽度) */}
          <div className={`bg-card p-6 overflow-y-auto ${showNav ? (showOutline ? 'lg:w-[70%]' : 'lg:w-[85%]') : (showOutline ? 'lg:w-[83%]' : 'lg:w-[98%]')}`}>
            {selectedArticle ? (
              articleLoading ? (
                <div className="flex items-center justify-center h-40">
                  <p className="text-muted-foreground">加载文章中...</p>
                </div>
              ) : (
                <div>
                  <h2 className="text-2xl font-bold mb-4">{selectedArticle.title}</h2>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {selectedArticle.category && (
                      <Badge variant="outline">{selectedArticle.category.name}</Badge>
                    )}
                    {selectedArticle.tag.map(tag => (
                      <Badge key={tag.id} variant="secondary" className="text-xs">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                  <div className="prose max-w-none prose-invert:prose-invert">
                    {/* 这里应该渲染文章内容，根据实际的 content 结构实现 */}
                    <p>{selectedArticle.excerpt}</p>
                    {/* 简化处理，实际应该根据 content 结构渲染富文本 */}
                    <p className="text-muted-foreground text-sm mt-8">
                      作者: {selectedArticle.user.name} · 
                      {selectedArticle.publishedAt ? new Date(selectedArticle.publishedAt).toLocaleDateString() : new Date(selectedArticle.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-96 border border-dashed border-border">
                <FileText size={48} className="text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">请选择一篇文章</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  从左侧分类导航中选择一篇文章查看详细内容和大纲
                </p>
              </div>
            )}
          </div>

          {/* 右侧文章大纲 (15%) */}
          {showOutline && (
            <div className="lg:w-[15%] bg-card p-4 overflow-y-auto border-l border-border relative">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">文章大纲</h3>
                <button 
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => setShowOutline(false)}
                >
                  ✕
                </button>
              </div>
              {selectedArticle ? (
                <div className="space-y-1">
                  {renderOutline(generateOutline(selectedArticle.content))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">选择文章后显示大纲</p>
              )}
            </div>
          )}
          {!showOutline && (
            <div className="lg:w-[2%] bg-card flex items-center justify-center border-l border-border cursor-pointer"
                 onClick={() => setShowOutline(true)}>
              <span className="text-muted-foreground hover:text-foreground">≡</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
