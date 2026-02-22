import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const categoryId = searchParams.get('categoryId') || ''
    const tagId = searchParams.get('tagId') || ''

    const articles = await prisma.knowledgebasearticle.findMany({
      where: {
        AND: [
          query
            ? {
                OR: [
                  { title: { contains: query } },
                  { excerpt: { contains: query } },
                ],
              }
            : {},
          categoryId ? { categoryId } : {},
          tagId
            ? {
                tag: {
                  some: {
                    id: tagId,
                  },
                },
              }
            : {},
        ],
      },
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
    console.error('知识库搜索失败:', error)
    return NextResponse.json({ error: '知识库搜索失败' }, { status: 500 })
  }
}
