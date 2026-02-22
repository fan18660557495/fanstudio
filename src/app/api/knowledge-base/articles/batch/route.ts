import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/require-admin'

export const dynamic = 'force-dynamic'

export async function DELETE(request: NextRequest) {
  const check = await requireAdmin()
  if (!check.authorized) return check.response

  try {
    const body = await request.json()
    const { ids } = body

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: '无效的文章ID列表' }, { status: 400 })
    }

    await prisma.knowledgebasearticle.deleteMany({
      where: {
        id: {
          in: ids
        }
      }
    })

    return NextResponse.json({ message: '批量删除知识库文章成功' })
  } catch (error) {
    console.error('批量删除知识库文章失败:', error)
    return NextResponse.json({ error: '批量删除知识库文章失败' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const check = await requireAdmin()
  if (!check.authorized) return check.response

  try {
    const body = await request.json()
    const { ids, status } = body

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: '无效的文章ID列表' }, { status: 400 })
    }

    if (!status) {
      return NextResponse.json({ error: '必须指定状态' }, { status: 400 })
    }

    const articles = await prisma.knowledgebasearticle.updateMany({
      where: {
        id: {
          in: ids
        }
      },
      data: {
        status
      }
    })

    return NextResponse.json({ message: '批量更新知识库文章状态成功', count: articles.count })
  } catch (error) {
    console.error('批量更新知识库文章状态失败:', error)
    return NextResponse.json({ error: '批量更新知识库文章状态失败' }, { status: 500 })
  }
}