import { NextRequest, NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { requireAdmin } from "@/lib/require-admin"
import prisma from "@/lib/prisma"
import { sendOrderEmail } from "@/lib/email"
import { normalizeSiteName } from "@/lib/page-copy"

export const dynamic = "force-dynamic"

/** 生成唯一订单号：ORD + 时间戳 + 6 位随机字符。 */
function generateOrderNo(): string {
  const now = new Date()
  const ts = now.toISOString().replace(/[-:T.Z]/g, "").slice(0, 14)
  const rand = randomBytes(3).toString("hex")
  return `ORD${ts}${rand}`
}

/** POST: 创建订单。支持免费直接完成、付费新购、付费升级（versionId + upgradeAmount）。 */
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { workId, buyerEmail, buyerName, versionId, upgradeFromId, upgradeAmount } = body

  if (!workId || typeof workId !== "string") {
    return NextResponse.json({ error: "缺少 workId" }, { status: 400 })
  }
  if (!buyerEmail || typeof buyerEmail !== "string" || !buyerEmail.includes("@")) {
    return NextResponse.json({ error: "请输入有效的邮箱地址" }, { status: 400 })
  }

  const work = await prisma.work.findUnique({
    where: { id: workId },
    include: { workversion: { orderBy: { createdAt: "desc" }, take: 1 } },
  })
  if (!work || work.status !== "PUBLISHED") {
    return NextResponse.json({ error: "作品不存在或未发布" }, { status: 404 })
  }

  const targetVersionId = versionId || work.workversion[0]?.id || null
  const targetVersion = targetVersionId
    ? await prisma.workversion.findUnique({ where: { id: targetVersionId } })
    : null

  const hasDelivery = targetVersion?.figmaUrl || targetVersion?.deliveryUrl || work.figmaUrl || work.deliveryUrl
  if (!hasDelivery) {
    return NextResponse.json({ error: "该作品暂无交付资源" }, { status: 400 })
  }

  const normalizedEmail = buyerEmail.trim().toLowerCase()
  const existingPaidOrder = await prisma.order.findFirst({
    where: {
      buyerEmail: normalizedEmail,
      workId,
      versionId: targetVersionId,
      status: "PAID",
    },
  })
  if (existingPaidOrder) {
    return NextResponse.json({
      error: "您已赞助过此版本",
      figmaUrl: targetVersion?.figmaUrl || work.figmaUrl || null,
      deliveryUrl: targetVersion?.deliveryUrl || work.deliveryUrl || null,
    }, { status: 409 })
  }

  let amount: number
  if (work.isFree) {
    amount = 0
  } else if (upgradeAmount != null && upgradeFromId) {
    // 升级订单：使用前端传来的差价（已由 check API 计算）
    amount = Math.max(0, Number(upgradeAmount))
  } else {
    // 新购：使用目标版本价格或作品价格
    amount = targetVersion ? Number(targetVersion.price) : (work.price ? Number(work.price) : 0)
  }

  const orderNo = generateOrderNo()

  if (work.isFree || amount === 0) {
    const order = await prisma.order.create({
      data: {
        orderNo,
        workId,
        versionId: targetVersionId,
        upgradeFromId: upgradeFromId || null,
        amount,
        status: "PAID",
        buyerEmail: buyerEmail.trim().toLowerCase(),
        buyerName: buyerName?.trim() || null,
        paidAt: new Date(),
      },
    })

    const fUrl = targetVersion?.figmaUrl || work.figmaUrl || null
    const dUrl = targetVersion?.deliveryUrl || work.deliveryUrl || null

    const settings = await prisma.settings.findUnique({ where: { id: "settings" } })
    const socialLinks = (settings?.socialLinks as Record<string, string> | null) || {}
    sendOrderEmail({
      to: order.buyerEmail,
      siteName: normalizeSiteName(settings?.siteName),
      workTitle: work.title,
      orderNo: order.orderNo,
      isFree: true,
      figmaUrl: fUrl,
      deliveryUrl: dUrl,
      currentVersion: targetVersion?.version || work.currentVersion,
      wechat: socialLinks.wechat || null,
    }).catch(() => {})

    return NextResponse.json({
      id: order.id,
      orderNo: order.orderNo,
      status: order.status,
      figmaUrl: fUrl,
      deliveryUrl: dUrl,
    })
  }

  const order = await prisma.order.create({
    data: {
      orderNo,
      workId,
      versionId: targetVersionId,
      upgradeFromId: upgradeFromId || null,
      amount,
      status: "PENDING",
      buyerEmail: buyerEmail.trim().toLowerCase(),
      buyerName: buyerName?.trim() || null,
    },
  })
  return NextResponse.json({
    id: order.id,
    orderNo: order.orderNo,
    status: order.status,
    amount,
  })
}

/** GET: ?orderNo= 查单笔；?all=1 管理员查全部。仅 ADMIN 可访问，VIEWER 返回 403。 */
export async function GET(request: NextRequest) {
  const check = await requireAdmin()
  if (!check.authorized) return check.response

  const { searchParams } = new URL(request.url)
  const orderNo = searchParams.get("orderNo")
  const all = searchParams.get("all") === "1"

  if (orderNo) {
    const order = await prisma.order.findUnique({
      where: { orderNo },
      include: { work: { select: { title: true, coverImage: true } } },
    })
    if (!order) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 })
    }
    return NextResponse.json({
      id: order.id,
      orderNo: order.orderNo,
      status: order.status,
      amount: Number(order.amount),
      work: order.work,
      createdAt: order.createdAt,
    })
  }

  const statusFilter = searchParams.get("status")
  const search = searchParams.get("search")?.trim()

  const where: Record<string, unknown> = {}
  if (statusFilter && statusFilter !== "all") {
    where.status = statusFilter
  }
  if (search) {
    const s = search.trim()
    where.OR = [
      { orderNo: { contains: s } },
      { buyerEmail: { contains: s } },
    ]
  }

  const orders = await prisma.order.findMany({
    where: all ? where : { ...where },
    orderBy: { createdAt: "desc" },
    include: {
      work: { select: { id: true, title: true } },
    },
    take: 100,
  })

  return NextResponse.json(
    orders.map((o) => ({
      id: o.id,
      orderNo: o.orderNo,
      workTitle: o.work.title,
      workId: o.work.id,
      buyerEmail: o.buyerEmail,
      buyerName: o.buyerName,
      amount: Number(o.amount),
      status: o.status,
      paidAt: o.paidAt,
      createdAt: o.createdAt,
    })),
  )
}
