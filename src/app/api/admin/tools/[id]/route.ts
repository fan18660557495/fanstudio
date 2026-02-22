import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/require-admin"
import prisma from "@/lib/prisma"

export const dynamic = "force-dynamic"

/**
 * POST: 更新工具
 * DELETE: 删除工具
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const check = await requireAdmin()
  if (!check.authorized) return check.response

  const { id: toolId } = await params

  if (!toolId) {
    return NextResponse.json({ error: "工具ID不能为空" }, { status: 400 })
  }

  try {
    const formData = await request.formData()
    const _method = formData.get("_method") as string

    if (_method === "PUT") {
      // 更新工具
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

      // 更新工具
      await prisma.tool.update({
        where: { id: toolId },
        data: {
          name: name.trim(),
          description: description.trim(),
          link: link.trim(),
          categoryId
        }
      })

      // 返回成功响应
      return NextResponse.json({ message: "工具更新成功" }, { status: 200 })
    } else {
      return NextResponse.json({ error: "无效的请求方法" }, { status: 405 })
    }
  } catch (error) {
    console.error("更新工具失败:", error)
    return NextResponse.json({ error: "更新失败，请重试" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const check = await requireAdmin()
  if (!check.authorized) return check.response

  const { id: toolId } = await params

  if (!toolId) {
    return NextResponse.json({ error: "工具ID不能为空" }, { status: 400 })
  }

  try {
    // 检查工具是否存在
    const existingTool = await prisma.tool.findUnique({ where: { id: toolId } })
    if (!existingTool) {
      return NextResponse.json({ error: "工具不存在" }, { status: 404 })
    }

    // 删除工具
    await prisma.tool.delete({
      where: { id: toolId }
    })

    // 返回成功响应
    return NextResponse.json({ message: "工具删除成功" }, { status: 200 })
  } catch (error) {
    console.error("删除工具失败:", error)
    return NextResponse.json({ error: "删除失败，请重试" }, { status: 500 })
  }
}
