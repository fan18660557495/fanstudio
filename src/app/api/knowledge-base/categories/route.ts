import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/require-admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { type: 'KNOWLEDGE_BASE' },
      orderBy: { name: 'asc' },
      include: {
        knowledgebasearticle: true,
      },
    })
    return NextResponse.json(categories)
  } catch (error) {
    console.error('获取知识库分类列表失败:', error)
    return NextResponse.json({ error: '获取知识库分类列表失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const check = await requireAdmin()
  if (!check.authorized) return check.response

  try {
    const body = await request.json()
    const { name, slug } = body

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        type: 'KNOWLEDGE_BASE',
      },
      include: {
        knowledgebasearticle: true,
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('创建知识库分类失败:', error)
    return NextResponse.json({ error: '创建知识库分类失败' }, { status: 500 })
  }
}
