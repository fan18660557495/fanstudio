import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { requireAdmin } from "@/lib/require-admin"
import prisma from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const { id } = await params
  const post = await prisma.post.findUnique({
    where: { id },
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await requireAdmin()
  if (!check.authorized) return check.response
  const { id } = await params
  const body = await request.json()
  const { title, slug, content, excerpt, coverImage, status, categoryId, sortOrder, tagIds } = body

  const post = await prisma.post.update({
    where: { id },
    data: {
      ...(title != null && { title }),
      ...(slug != null && { slug: slug.trim() }),
      ...(content != null && { content }),
      ...(excerpt != null && { excerpt }),
      ...(coverImage != null && { coverImage }),
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
  return NextResponse.json(post)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await requireAdmin()
  if (!check.authorized) return check.response
  const { id } = await params
  await prisma.post.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
