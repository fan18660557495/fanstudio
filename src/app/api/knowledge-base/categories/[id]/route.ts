import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/require-admin'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        knowledgebasearticle: true,
      },
    })

    if (!category || category.type !== 'KNOWLEDGE_BASE') {
      return NextResponse.json({ error: '知识库分类不存在' }, { status: 404 })
    }

    return NextResponse.json(category)
  } catch (error) {
    console.error('获取知识库分类详情失败:', error)
    return NextResponse.json({ error: '获取知识库分类详情失败' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const check = await requireAdmin()
  if (!check.authorized) return check.response

  try {
    const body = await request.json()
    const { name, slug } = body

    const existing = await prisma.category.findUnique({ where: { id } })
    if (!existing || existing.type !== 'KNOWLEDGE_BASE') {
      return NextResponse.json({ error: '知识库分类不存在' }, { status: 404 })
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name,
        slug,
      },
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('更新知识库分类失败:', error)
    return NextResponse.json({ error: '更新知识库分类失败' }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const check = await requireAdmin()
  if (!check.authorized) return check.response

  try {
    const existing = await prisma.category.findUnique({ where: { id } })
    if (!existing || existing.type !== 'KNOWLEDGE_BASE') {
      return NextResponse.json({ error: '知识库分类不存在' }, { status: 404 })
    }

    await prisma.category.delete({
      where: { id },
    })

    return NextResponse.json({ message: '知识库分类删除成功' })
  } catch (error) {
    console.error('删除知识库分类失败:', error)
    return NextResponse.json({ error: '删除知识库分类失败' }, { status: 500 })
  }
}
