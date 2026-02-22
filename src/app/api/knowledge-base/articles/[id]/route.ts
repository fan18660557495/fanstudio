import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/require-admin'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const article = await prisma.knowledgebasearticle.findUnique({
      where: { id }, 
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

    if (!article) {
      return NextResponse.json({ error: '知识库文章不存在' }, { status: 404 })
    }

    return NextResponse.json(article)
  } catch (error) {
    console.error('获取知识库文章详情失败:', error)
    return NextResponse.json({ error: '获取知识库文章详情失败' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const check = await requireAdmin()
  if (!check.authorized) return check.response

  try {
    const body = await request.json()
    const { title, slug, content, excerpt, coverImage, coverRatio, status, categoryId, tagIds, sortOrder, publishedAt } = body

    const article = await prisma.knowledgebasearticle.update({
      where: { id }, 
      data: {
        title,
        slug,
        content,
        excerpt,
        coverImage,
        coverRatio,
        status,
        categoryId,
        sortOrder,
        publishedAt: publishedAt ? new Date(publishedAt) : null,
        tag: tagIds ? { set: tagIds.map((id: string) => ({ id })) } : undefined,
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

    return NextResponse.json(article)
  } catch (error) {
    console.error('更新知识库文章失败:', error)
    return NextResponse.json({ error: '更新知识库文章失败' }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const check = await requireAdmin()
  if (!check.authorized) return check.response

  try {
    await prisma.knowledgebasearticle.delete({
      where: { id }, 
    })

    return NextResponse.json({ message: '知识库文章删除成功' })
  } catch (error) {
    console.error('删除知识库文章失败:', error)
    return NextResponse.json({ error: '删除知识库文章失败' }, { status: 500 })
  }
}
