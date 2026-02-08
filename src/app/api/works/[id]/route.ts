import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { requireAdmin } from "@/lib/require-admin"
import prisma from "@/lib/prisma"
import { sanitizeWorkForPublic } from "@/lib/sanitize-work"

export const dynamic = "force-dynamic"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const { id } = await params
  const work = await prisma.work.findUnique({
    where: { id },
    include: { category: true, tags: true },
  })
  if (!work) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  if (work.status !== "PUBLISHED" && !session?.user?.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  const row = {
    ...work,
    price: work.price ? Number(work.price) : null,
    images: (work.images as string[]) || [],
  }
  return NextResponse.json(session?.user?.id ? row : sanitizeWorkForPublic(row))
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await requireAdmin()
  if (!check.authorized) return check.response
  const { id } = await params
  const body = await request.json()
  const {
    title,
    slug,
    workType,
    description,
    content,
    coverImage,
    images,
    price,
    isFree,
    figmaUrl,
    deliveryUrl,
    demoUrl,
    demoQrCode,
    status,
    categoryId,
    sortOrder,
    tagIds,
  } = body

  const work = await prisma.work.update({
    where: { id },
    data: {
      ...(title != null && { title }),
      ...(slug != null && { slug: slug.trim() }),
      ...(workType != null && {
        workType: workType === "DEVELOPMENT" ? "DEVELOPMENT" : "DESIGN",
      }),
      ...(description != null && { description }),
      ...(content != null && { content }),
      ...(coverImage != null && { coverImage }),
      ...(images != null && { images }),
      ...(price != null && { price }),
      ...(typeof isFree === "boolean" && { isFree }),
      ...(figmaUrl !== undefined && { figmaUrl: figmaUrl || null }),
      ...(deliveryUrl !== undefined && { deliveryUrl: deliveryUrl || null }),
      ...(demoUrl !== undefined && { demoUrl: demoUrl || null }),
      ...(demoQrCode !== undefined && { demoQrCode: demoQrCode || null }),
      ...(status != null && {
        status: status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
      }),
      ...(categoryId != null && { categoryId: categoryId || null }),
      ...(sortOrder != null && { sortOrder: parseInt(String(sortOrder), 10) || 0 }),
      ...(tagIds != null && {
        tags: { set: (tagIds as string[]).map((tid: string) => ({ id: tid })) },
      }),
    },
    include: { tags: true },
  })
  return NextResponse.json(work)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await requireAdmin()
  if (!check.authorized) return check.response
  const { id } = await params
  const orderCount = await prisma.order.count({ where: { workId: id } })
  if (orderCount > 0) {
    return NextResponse.json(
      { error: `该作品有 ${orderCount} 笔关联订单，无法删除。请先处理相关订单。` },
      { status: 409 }
    )
  }
  await prisma.work.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
