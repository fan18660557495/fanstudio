/**
 * 媒体文件存储封装 — 本地磁盘存储。
 * 文件保存在 public/uploads/{entityType}/{entityId}/ 目录下，
 * 由 Next.js / Nginx 静态文件服务直接返回。
 *
 * 图片上传时自动使用 sharp 压缩为 WebP 格式（GIF 除外），
 * 长边限制 1920px，质量 80，兼顾清晰度与体积。
 */
import { writeFile, mkdir, unlink } from "fs/promises"
import path from "path"
import { randomBytes } from "crypto"
import sharp from "sharp"

const UPLOAD_DIR = "public/uploads"

const MAX_DIMENSION = 1920
const WEBP_QUALITY = 80

export type MediaEntityType = "POST" | "WORK_DESIGN" | "WORK_DEVELOPMENT" | "TUTORIAL" | "KNOWLEDGE_BASE"

export interface SaveFileResult {
  /** 可直接在 <img src> 中使用的 URL，如 /uploads/POST/abc/xxx.webp */
  url: string
  /** 存储路径 key，如 POST/abc123/xxxx-image.webp */
  key: string
}

/** 保存文件到本地；图片（非 GIF）自动压缩为 WebP 并限制尺寸。 */
export async function saveFile(
  buffer: Buffer,
  entityType: MediaEntityType,
  entityId: string,
  originalName: string,
  mimeType: string
): Promise<SaveFileResult> {
  let finalBuffer = buffer
  let finalExt = getExtension(originalName, mimeType)

  // 图片自动压缩为 WebP（GIF 保留原格式以支持动图）
  if (mimeType.startsWith("image/") && mimeType !== "image/gif") {
    finalBuffer = await sharp(buffer)
      .resize(MAX_DIMENSION, MAX_DIMENSION, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer()
    finalExt = ".webp"
  }

  const safeName = sanitizeFileName(originalName) || "file"
  const nameWithoutExt = safeName.replace(/\.[^.]+$/, "")
  const baseName = `${randomBytes(8).toString("hex")}-${nameWithoutExt}`
  const fileName = `${baseName}${finalExt}`
  const key = `${entityType}/${entityId}/${fileName}`

  const absolutePath = path.join(process.cwd(), UPLOAD_DIR, key)
  const dir = path.dirname(absolutePath)
  await mkdir(dir, { recursive: true })
  await writeFile(absolutePath, finalBuffer, { flag: "wx" })

  const url = `/uploads/${key.replace(/\\/g, "/")}`
  return { url, key }
}

/** 根据 URL 删除本地上传文件；非 /uploads/ 或文件不存在时静默忽略。 */
export async function deleteFile(url: string): Promise<void> {
  if (!url || !url.startsWith("/uploads/")) return
  try {
    const relativePath = url.replace(/^\/uploads\//, "")
    const absolutePath = path.join(process.cwd(), UPLOAD_DIR, relativePath)
    await unlink(absolutePath)
  } catch {
    // ignore
  }
}

function getExtension(originalName: string, mimeType: string): string {
  const fromName = path.extname(originalName)
  if (fromName) return fromName
  const mimeToExt: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
  }
  return mimeToExt[mimeType] ?? ""
}

function sanitizeFileName(name: string): string {
  return name
    .replace(/[^\w\u4e00-\u9fa5.-]/g, "_")
    .slice(0, 80)
}

export function getMediaTypeFromMime(mime: string): "image" | "video" | "file" {
  if (mime.startsWith("image/")) return "image"
  if (mime.startsWith("video/")) return "video"
  return "file"
}

export const saveFileToLocal = saveFile
