import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { requireAdmin } from "@/lib/require-admin"
import prisma from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const session = await auth()
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get("slug")
  const all = searchParams.get("all") === "1"

  if (slug) {
    const post = await prisma.post.findUnique({
      where: { slug },
      include: { category: true, tags: true, author: true },
    })
    if (!post) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    if (post.status !== "PUBLISHED" && !session?.user?.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    return NextResponse.json(post)
  }

  const isAdmin = !!session?.user?.id
  const list = await prisma.post.findMany({
    where: isAdmin && all ? undefined : { status: "PUBLISHED" },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: { category: true, tags: true, author: true },
  })
  const headers = isAdmin ? undefined : { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" }
  return NextResponse.json(list, { headers })
}

export async function POST(request: NextRequest) {
  const check = await requireAdmin()
  if (!check.authorized) return check.response
  const body = await request.json()
  const { title, slug, content, excerpt, coverImage, status, categoryId } = body

  if (!title || !slug) {
    return NextResponse.json(
      { error: "缺少 title 或 slug" },
      { status: 400 }
    )
  }

  const existing = await prisma.post.findUnique({ where: { slug } })
  if (existing) {
    return NextResponse.json({ error: "slug 已存在" }, { status: 400 })
  }

  const authorExists = await prisma.user.findUnique({ where: { id: check.userId } })
  if (!authorExists) {
    return NextResponse.json(
      { error: "当前登录用户在本数据库中不存在，请退出登录后重新登录" },
      { status: 401 }
    )
  }

  const post = await prisma.post.create({
    data: {
      title,
      slug: slug.trim(),
      content: content ?? {},
      excerpt: excerpt || null,
      coverImage: coverImage || null,
      status: status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
      categoryId: categoryId || null,
      authorId: check.userId,
    },
  })
  return NextResponse.json(post)
}
