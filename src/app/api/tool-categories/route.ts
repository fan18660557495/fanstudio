import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export const dynamic = "force-dynamic"

/**
 * GET: 获取工具分类列表
 */
export async function GET() {
  const categories = await prisma.category.findMany({
    where: {
      type: "TOOL"
    },
    include: {
      _count: {
        select: { tool: true }
      }
    },
    orderBy: { name: "asc" }
  })

  return NextResponse.json(categories)
}
