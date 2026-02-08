import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/require-admin"
import prisma from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const item = await prisma.videoTutorial.findUnique({
    where: { id },
    include: { tags: true },
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
  const { title, slug, description, videoUrl, thumbnail, sortOrder, categoryId, tagIds } = body

  const item = await prisma.videoTutorial.update({
    where: { id },
    data: {
      ...(title != null && { title }),
      ...(slug != null && { slug: slug.trim() }),
      ...(description != null && { description }),
      ...(videoUrl != null && { videoUrl: videoUrl.trim() }),
      ...(thumbnail != null && { thumbnail: thumbnail.trim() || null }),
      ...(typeof sortOrder === "number" && { sortOrder }),
      ...(categoryId !== undefined && { categoryId: categoryId || null }),
      ...(tagIds != null && {
        tags: { set: (tagIds as string[]).map((tid: string) => ({ id: tid })) },
      }),
    },
    include: { tags: true },
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
  await prisma.videoTutorial.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
