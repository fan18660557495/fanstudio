import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/require-admin"
import prisma from "@/lib/prisma"
import {
  saveFile,
  getMediaTypeFromMime,
  type MediaEntityType,
} from "@/lib/media-storage"

export const dynamic = "force-dynamic"

const ENTITY_TYPES: MediaEntityType[] = [
  "POST",
  "WORK_DESIGN",
  "WORK_DEVELOPMENT",
  "TUTORIAL",
]

function isEntityType(s: string): s is MediaEntityType {
  return ENTITY_TYPES.includes(s as MediaEntityType)
}

export async function GET(request: NextRequest) {
  try {
    const check = await requireAdmin()
    if (!check.authorized) return check.response

    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get("entityType")

    if (!entityType || !isEntityType(entityType)) {
      return NextResponse.json(
        { error: "缺少或无效的 entityType" },
        { status: 400 }
      )
    }

    let list: Awaited<ReturnType<typeof prisma.media.findMany>> = []
    try {
      list = await prisma.media.findMany({
        where: { entityType },
        orderBy: { createdAt: "desc" },
      })
    } catch {
      list = []
    }

    const byEntity = new Map<string, typeof list>()
    for (const m of list) {
      if (!byEntity.has(m.entityId)) byEntity.set(m.entityId, [])
      byEntity.get(m.entityId)!.push(m)
    }

    let entities: { id: string; title: string }[] = []
    if (entityType === "POST") {
      const posts = await prisma.post.findMany({
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true },
      })
      entities = posts.map((p) => ({ id: p.id, title: p.title }))
    }
    if (entityType === "WORK_DESIGN" || entityType === "WORK_DEVELOPMENT") {
      const workType = entityType === "WORK_DESIGN" ? "DESIGN" : "DEVELOPMENT"
      const works = await prisma.work.findMany({
        where: { workType },
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true },
      })
      entities = works.map((w) => ({ id: w.id, title: w.title }))
    }
    if (entityType === "TUTORIAL") {
      const tutorials = await prisma.videotutorial.findMany({
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        select: { id: true, title: true },
      })
      entities = tutorials.map((t) => ({ id: t.id, title: t.title }))
    }

    const groups = entities.map(({ id: entityId, title: entityTitle }) => ({
      entityId,
      entityTitle,
      items: byEntity.get(entityId) ?? [],
    }))

    return NextResponse.json({ groups }, {
      headers: { "Cache-Control": "no-store" },
    })
  } catch (e) {
    console.error("[GET /api/media]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "服务器错误" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const check = await requireAdmin()
  if (!check.authorized) return check.response

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: "无效的请求体" }, { status: 400 })
  }

  const file = formData.get("file") as File | null
  const entityTypeRaw = formData.get("entityType") as string | null
  const entityId = (formData.get("entityId") as string)?.trim()

  if (!file || typeof file.arrayBuffer !== "function") {
    return NextResponse.json({ error: "请选择要上传的文件" }, { status: 400 })
  }
  if (!entityTypeRaw || !isEntityType(entityTypeRaw)) {
    return NextResponse.json({ error: "请指定有效的 entityType（POST / WORK_DESIGN / WORK_DEVELOPMENT / TUTORIAL）" }, { status: 400 })
  }
  if (!entityId) {
    return NextResponse.json({ error: "请指定 entityId" }, { status: 400 })
  }

  const entityType = entityTypeRaw as MediaEntityType
  const buffer = Buffer.from(await file.arrayBuffer())
  const mimeType = file.type || "application/octet-stream"
  const mediaType = getMediaTypeFromMime(mimeType)

  try {
    const { url } = await saveFile(
      buffer,
      entityType,
      entityId,
      file.name,
      mimeType
    )

    const media = await prisma.media.create({
      data: {
        name: file.name,
        url,
        type: mediaType,
        size: buffer.length,
        width: null,
        height: null,
        entityType,
        entityId,
      },
    })

    return NextResponse.json(media)
  } catch (e) {
    console.error("[media upload]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "上传失败" },
      { status: 500 }
    )
  }
}
