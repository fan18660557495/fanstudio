import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/require-admin"
import prisma from "@/lib/prisma"

export const dynamic = "force-dynamic"

const VALID_TYPES = ["POST", "DESIGN", "DEVELOPMENT", "TUTORIAL", "WORK", "TOOL", "KNOWLEDGE_BASE"] as const

/** 将名称转为 slug：小写、空格转连字符、去特殊字符。 */
function toSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\u4e00-\u9fff-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    || `cat-${Date.now()}`
}

type CategoryWithRelations = {
  type: string
  _count: { post: number; work: number; videotutorial: number; tool: number; knowledgebasearticle: number }
  post: { id: string; title: string }[]
  work: { id: string; title: string; workType: string }[]
  videotutorial: { id: string; title: string }[]
  tool: { id: string; name: string }[]
  knowledgebasearticle: { id: string; title: string }[]
}

function getCategoryCount(c: CategoryWithRelations): number {
  switch (c.type) {
    case "POST":
      return c._count.post
    case "DESIGN":
    case "DEVELOPMENT":
    case "WORK":
      return c._count.work
    case "TUTORIAL":
      return c._count.videotutorial
    case "TOOL":
      return c._count.tool
    case "KNOWLEDGE_BASE":
      return c._count.knowledgebasearticle
    default:
      return 0
  }
}

function getCategoryItems(c: CategoryWithRelations): { id: string; title: string; entityType: string }[] {
  switch (c.type) {
    case "POST":
      return c.post.map((p) => ({ id: p.id, title: p.title, entityType: "post" }))
    case "DESIGN":
    case "DEVELOPMENT":
    case "WORK":
      return c.work.map((w) => ({ id: w.id, title: w.title, entityType: w.workType === "DEVELOPMENT" ? "development" : "design" }))
    case "TUTORIAL":
      return c.videotutorial.map((t) => ({ id: t.id, title: t.title, entityType: "tutorial" }))
    case "TOOL":
      return c.tool.map((tool) => ({ id: tool.id, title: tool.name, entityType: "tool" }))
    case "KNOWLEDGE_BASE":
      return c.knowledgebasearticle.map((a) => ({ id: a.id, title: a.title, entityType: "knowledge_base" }))
    default:
      return []
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type")

  // 构建过滤条件
  let where: Record<string, unknown> | undefined
  if (type && VALID_TYPES.includes(type as typeof VALID_TYPES[number])) {
    where = { type }
  }

  const list = await prisma.category.findMany({
    where,
    orderBy: { name: "asc" },
    include: {
      _count: { select: { post: true, work: true, videotutorial: true, tool: true, knowledgebasearticle: true } },
      post: { select: { id: true, title: true }, take: 20 },
      work: { select: { id: true, title: true, workType: true }, take: 20 },
      videotutorial: { select: { id: true, title: true }, take: 20 },
      tool: { select: { id: true, name: true }, take: 20 },
      knowledgebasearticle: { select: { id: true, title: true }, take: 20 },
    },
  })

  return NextResponse.json(
    list.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      type: c.type,
      count: getCategoryCount(c),
      items: getCategoryItems(c),
    })),
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
  )
}

export async function POST(request: NextRequest) {
  const check = await requireAdmin()
  if (!check.authorized) return check.response

  const body = await request.json()
  const { name, type } = body

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "分类名称不能为空" }, { status: 400 })
  }
  if (!type || !VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: "无效的分类类型" }, { status: 400 })
  }

  // 生成唯一 slug
  let slug = toSlug(name)
  const existing = await prisma.category.findUnique({ where: { slug } })
  if (existing) {
    slug = `${slug}-${Date.now().toString(36)}`
  }

  const category = await prisma.category.create({
    data: { name: name.trim(), slug, type },
  })

  return NextResponse.json({ ...category, count: 0 }, { status: 201 })
}
