import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/require-admin"
import prisma from "@/lib/prisma"

export const dynamic = "force-dynamic"

type Params = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, { params }: Params) {
  const check = await requireAdmin()
  if (!check.authorized) return check.response

  const { id } = await params
  const body = await request.json()
  const { name, slug } = body

  const existing = await prisma.category.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: "分类不存在" }, { status: 404 })
  }

  const updateData: Record<string, string> = {}
  if (name && typeof name === "string" && name.trim()) {
    updateData.name = name.trim()
  }
  if (slug && typeof slug === "string" && slug.trim()) {
    // 检查 slug 唯一性
    const slugConflict = await prisma.category.findFirst({
      where: { slug: slug.trim(), id: { not: id } },
    })
    if (slugConflict) {
      return NextResponse.json({ error: "该 Slug 已被使用" }, { status: 409 })
    }
    updateData.slug = slug.trim()
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "没有要更新的字段" }, { status: 400 })
  }

  const updated = await prisma.category.update({ where: { id }, data: updateData })
  return NextResponse.json(updated)
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const check = await requireAdmin()
  if (!check.authorized) return check.response

  const { id } = await params

  const existing = await prisma.category.findUnique({
    where: { id },
    include: {
      _count: { select: { post: true, work: true, videotutorial: true, tool: true } },
    },
  })
  if (!existing) {
    return NextResponse.json({ error: "分类不存在" }, { status: 404 })
  }

  const relatedCount = existing._count.post + existing._count.work + existing._count.videotutorial + existing._count.tool

  if (existing.type === "TOOL" && existing._count.tool > 0) {
    return NextResponse.json({ error: `该分类下有 ${existing._count.tool} 个工具，请先移动或删除这些工具` }, { status: 400 })
  }

  if (relatedCount > 0) {
    // 解除关联后再删除
    if (existing.type === "POST") {
      await prisma.post.updateMany({
        where: { categoryId: id },
        data: { categoryId: null },
      })
    } else if (existing.type === "TUTORIAL") {
      await prisma.videotutorial.updateMany({
        where: { categoryId: id },
        data: { categoryId: null },
      })
    } else {
      // DESIGN, DEVELOPMENT, WORK, KNOWLEDGE_BASE
      await prisma.work.updateMany({
        where: { categoryId: id },
        data: { categoryId: null },
      })
    }
  }

  await prisma.category.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
