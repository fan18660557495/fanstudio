import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/require-admin"
import prisma from "@/lib/prisma"
import { normalizeCoverRatio } from "@/lib/cover-ratio"

export const dynamic = "force-dynamic"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const item = await prisma.videotutorial.findUnique({
    where: { id },
    include: { tag: true },
  })
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json(item)
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
    description,
    videoUrl,
    thumbnail,
    coverRatio,
    sortOrder,
    categoryId,
    tagIds,
  } = body

  const item = await prisma.videotutorial.update({
    where: { id },
    data: {
      ...(title != null && { title }),
      ...(slug != null && { slug: slug.trim() }),
      ...(description != null && { description }),
      ...(videoUrl != null && { videoUrl: videoUrl.trim() }),
      ...(thumbnail != null && { thumbnail: thumbnail.trim() || null }),
      ...(coverRatio != null && { coverRatio: normalizeCoverRatio(coverRatio) }),
      ...(typeof sortOrder === "number" && { sortOrder }),
      ...(categoryId !== undefined && { categoryId: categoryId || null }),
      ...(tagIds != null && {
        tag: { set: (tagIds as string[]).map((tid: string) => ({ id: tid })) },
      }),
    },
    include: { tag: true },
  })
  return NextResponse.json(item)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await requireAdmin()
  if (!check.authorized) return check.response
  const { id } = await params
  await prisma.videotutorial.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
