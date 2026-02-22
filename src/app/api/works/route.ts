import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { requireAdmin } from "@/lib/require-admin"
import prisma from "@/lib/prisma"
import { sanitizeWorkForPublic } from "@/lib/sanitize-work"
import { normalizeCoverRatio } from "@/lib/cover-ratio"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const session = await auth()
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get("slug")
  const all = searchParams.get("all") === "1"
  const typeParam = searchParams.get("type")

  const isAdminRole = (session?.user as { role?: string })?.role === "ADMIN"

  if (slug) {
    const work = await prisma.work.findUnique({
    where: { slug },
    include: { category: true, tag: true },
  })
    if (!work) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    if (work.status !== "PUBLISHED" && !isAdminRole) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    const row = {
      ...work,
      price: work.price ? Number(work.price) : null,
      images: (work.images as string[]) || [],
    }
    return NextResponse.json(isAdminRole ? row : sanitizeWorkForPublic(row))
  }

  const isAdmin = isAdminRole
  const workTypeFilter =
    typeParam === "design"
      ? "DESIGN"
      : typeParam === "development"
        ? "DEVELOPMENT"
        : undefined
  const where: { workType?: "DESIGN" | "DEVELOPMENT"; status?: "PUBLISHED" } = {
    ...(workTypeFilter && { workType: workTypeFilter }),
    ...(isAdmin && all ? {} : { status: "PUBLISHED" }),
  }
  const list = await prisma.work.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: { category: true, tag: true },
  })
  const rows = list.map((w) => {
    const row = {
      ...w,
      price: w.price ? Number(w.price) : null,
      images: (w.images as string[]) || [],
    }
    return isAdmin ? row : sanitizeWorkForPublic(row)
  })
  const headers = isAdmin ? undefined : { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" }
  return NextResponse.json(rows, { headers })
}

export async function POST(request: NextRequest) {
  const check = await requireAdmin()
  if (!check.authorized) return check.response
  const body = await request.json()
  const {
    title,
    slug,
    workType,
    description,
    content,
    coverImage,
    coverRatio,
    images,
    price,
    isFree,
    figmaUrl,
    deliveryUrl,
    demoUrl,
    demoQrCode,
    status,
    categoryId,
  } = body

  if (!title || !slug) {
    return NextResponse.json(
      { error: "缺少 title 或 slug" },
      { status: 400 }
    )
  }

  const existing = await prisma.work.findUnique({ where: { slug } })
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

  const work = await prisma.work.create({
    data: {
      title,
      slug: slug.trim(),
      workType:
        workType === "DEVELOPMENT" ? "DEVELOPMENT" : "DESIGN",
      description: description || null,
      content: content ?? undefined,
      coverImage: coverImage || "",
      coverRatio: normalizeCoverRatio(coverRatio),
      images: images ?? [],
      price: price != null ? price : null,
      isFree: !!isFree,
      figmaUrl: figmaUrl || null,
      deliveryUrl: deliveryUrl || null,
      demoUrl: demoUrl || null,
      demoQrCode: demoQrCode || null,
      status: status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
      categoryId: categoryId || null,
      authorId: check.userId,
    },
  })
  return NextResponse.json(work)
}
