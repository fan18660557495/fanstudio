import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/require-admin"
import prisma from "@/lib/prisma"

export const dynamic = "force-dynamic"

/**
 * GET: 获取所有工具（包括非活跃的）
 * POST: 创建新工具
 */
export async function GET(_request: NextRequest) {
  const check = await requireAdmin()
  if (!check.authorized) return check.response

  const tools = await prisma.tool.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" }
  })

  return NextResponse.json(tools)
}

export async function POST(request: NextRequest) {
  const check = await requireAdmin()
  if (!check.authorized) return check.response

  try {
    const formData = await request.formData()
    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const link = formData.get("link") as string
    const categoryId = formData.get("categoryId") as string

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
    await prisma.tool.create({
      data: {
        name: name.trim(),
        description: description.trim(),
        link: link.trim(),
        categoryId
      }
    })

    // 返回成功响应
    return NextResponse.json({ message: "工具创建成功" }, { status: 201 })
  } catch (error) {
    console.error("创建工具失败:", error)
    return NextResponse.json({ error: "创建失败，请重试" }, { status: 500 })
  }
}
