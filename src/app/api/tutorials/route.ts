import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/require-admin"
import prisma from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get("slug")

    if (slug) {
      const item = await prisma.videoTutorial.findUnique({
        where: { slug },
        include: { category: true, tags: true },
      })
      if (!item) {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
      }
      return NextResponse.json(item)
    }

    const list = await prisma.videoTutorial.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: { category: true, tags: true },
    })
    return NextResponse.json(list, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : "请求失败"
    return NextResponse.json(
      { error: "请求失败", detail: message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const check = await requireAdmin()
  if (!check.authorized) return check.response
  const body = await request.json()
  const { title, slug, description, videoUrl, thumbnail, sortOrder } = body

  if (!title || !slug) {
    return NextResponse.json(
      { error: "缺少 title 或 slug" },
      { status: 400 }
    )
  }

  const existing = await prisma.videoTutorial.findUnique({ where: { slug } })
  if (existing) {
    return NextResponse.json({ error: "slug 已存在" }, { status: 400 })
  }

  const item = await prisma.videoTutorial.create({
    data: {
      title,
      slug: slug.trim(),
      description: description || null,
      videoUrl: videoUrl?.trim() || "",
      thumbnail: thumbnail?.trim() || null,
      sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
    },
  })
  return NextResponse.json(item)
}
