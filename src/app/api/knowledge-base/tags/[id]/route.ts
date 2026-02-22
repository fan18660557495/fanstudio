import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/require-admin'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const tag = await prisma.tag.findUnique({
      where: { id },
      include: {
        knowledgebasearticle: true,
      },
    })

    if (!tag) {
      return NextResponse.json({ error: '知识库标签不存在' }, { status: 404 })
    }

    return NextResponse.json(tag)
  } catch (error) {
    console.error('获取知识库标签详情失败:', error)
    return NextResponse.json({ error: '获取知识库标签详情失败' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const check = await requireAdmin()
  if (!check.authorized) return check.response

  try {
    const body = await request.json()
    const { name } = body

    const tag = await prisma.tag.update({
      where: { id },
      data: {
        name,
      },
      include: {
        knowledgebasearticle: true,
      },
    })

    return NextResponse.json(tag)
  } catch (error) {
    console.error('更新知识库标签失败:', error)
    return NextResponse.json({ error: '更新知识库标签失败' }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const check = await requireAdmin()
  if (!check.authorized) return check.response

  try {
    await prisma.tag.delete({
      where: { id },
    })

    return NextResponse.json({ message: '知识库标签删除成功' })
  } catch (error) {
    console.error('删除知识库标签失败:', error)
    return NextResponse.json({ error: '删除知识库标签失败' }, { status: 500 })
  }
}
