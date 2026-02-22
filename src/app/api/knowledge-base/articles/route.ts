import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/require-admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const q = searchParams.get('q')
    
    const where = q ? {
      OR: [
        { title: { contains: q } },
        { excerpt: { contains: q } },
      ],
    } : {}
    
    const articles = await prisma.knowledgebasearticle.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: {
        category: true,
        tag: true,
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    })
    return NextResponse.json(articles)
  } catch (error) {
    console.error('获取知识库文章列表失败:', error)
    return NextResponse.json({ error: '获取知识库文章列表失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const check = await requireAdmin()
  if (!check.authorized) return check.response

  try {
    const body = await request.json()
    const { title, slug, content, excerpt, coverImage, coverRatio, status, categoryId, tagIds, authorId, sortOrder, publishedAt } = body

    if (!title || !slug || !content || !authorId) {
      return NextResponse.json({ error: '缺少必需字段' }, { status: 400 })
    }

    const article = await prisma.knowledgebasearticle.create({
      data: {
        title,
        slug,
        content,
        excerpt,
        coverImage,
        coverRatio,
        status,
        categoryId,
        authorId,
        sortOrder,
        publishedAt: publishedAt ? new Date(publishedAt) : null,
        tag: tagIds ? { connect: tagIds.map((id: string) => ({ id })) } : undefined,
      },
      include: {
        category: true,
        tag: true,
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    })

    return NextResponse.json(article, { status: 201 })
  } catch (error) {
    console.error('创建知识库文章失败:', error)
    return NextResponse.json({ error: '创建知识库文章失败' }, { status: 500 })
  }
}
