import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/require-admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      include: {
        knowledgebasearticle: true,
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(tags)
  } catch (error) {
    console.error('获取知识库标签列表失败:', error)
    return NextResponse.json({ error: '获取知识库标签列表失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const check = await requireAdmin()
  if (!check.authorized) return check.response

  try {
    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: '标签名称不能为空' }, { status: 400 })
    }

    const existing = await prisma.tag.findUnique({ where: { name: name.trim() } })
    if (existing) {
      return NextResponse.json({ error: '标签已存在' }, { status: 400 })
    }

    const tag = await prisma.tag.create({
      data: {
        name: name.trim(),
      },
    })

    return NextResponse.json(tag, { status: 201 })
  } catch (error) {
    console.error('创建知识库标签失败:', error)
    return NextResponse.json({ error: '创建知识库标签失败' }, { status: 500 })
  }
}
