import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/require-admin"
import prisma from "@/lib/prisma"

export const dynamic = "force-dynamic"

/**
 * GET: 获取工具列表，支持分类筛选
 * POST: 提交新工具（需管理员权限）
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const categoryId = searchParams.get("categoryId")
  const id = searchParams.get("id")

  // 如果提供了id参数，获取单个工具
  if (id) {
    const tool = await prisma.tool.findUnique({
      where: { id },
      include: { category: true }
    })
    return NextResponse.json(tool)
  }

  // 否则获取工具列表
  const where = categoryId ? { categoryId, isActive: true } : { isActive: true }

  const tools = await prisma.tool.findMany({
    where,
    include: { category: true },
    orderBy: { createdAt: "desc" }
  })

  return NextResponse.json(tools)
}

export async function POST(request: NextRequest) {
  const check = await requireAdmin()
  if (!check.authorized) return check.response

  try {
    const body = await request.json()
    const { name, description, link, categoryId } = body

    // 验证必填字段
    if (!name || !description || !link || !categoryId) {
      return NextResponse.json({ error: "请填写所有必填字段" }, { status: 400 })
    }

    // 验证分类是否存在
    const category = await prisma.category.findUnique({ where: { id: categoryId } })
    if (!category || category.type !== "TOOL") {
      return NextResponse.json({ error: "分类不存在或不是工具分类" }, { status: 400 })
    }

    // 创建工具
    const tool = await prisma.tool.create({
      data: {
        name: name.trim(),
        description: description.trim(),
        link: link.trim(),
        categoryId
      }
    })

    return NextResponse.json({ message: "工具提交成功", tool }, { status: 201 })
  } catch (error) {
    console.error("提交工具失败:", error)
    return NextResponse.json({ error: "提交失败，请重试" }, { status: 500 })
  }
}
