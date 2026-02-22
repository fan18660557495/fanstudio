import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export const dynamic = "force-dynamic"

/** GET: 查询邮箱对某作品的购买状态（purchased、hasLatest、交付链接等）。 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get("email")?.trim().toLowerCase()
  const workId = searchParams.get("workId")

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "请输入有效的邮箱" }, { status: 400 })
  }
  if (!workId) {
    return NextResponse.json({ error: "缺少 workId" }, { status: 400 })
  }

  const work = await prisma.work.findUnique({
    where: { id: workId },
    include: {
      workversion: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  })
  if (!work || work.status !== "PUBLISHED") {
    return NextResponse.json({ error: "作品不存在" }, { status: 404 })
  }

  const latestVersion = work.workversion[0] ?? null
  const currentPrice = latestVersion ? Number(latestVersion.price) : (work.price ? Number(work.price) : 0)
  const currentVersionLabel = work.currentVersion || latestVersion?.version || null

  const latestOrder = await prisma.order.findFirst({
    where: {
      workId,
      buyerEmail: email,
      status: "PAID",
    },
    orderBy: { createdAt: "desc" },
    include: {
      workversion: true,
    },
  })

  if (!latestOrder) {
    return NextResponse.json({
      purchased: false,
      currentPrice,
      currentVersion: currentVersionLabel,
      isFree: work.isFree,
    })
  }

  // 判断是否已购买最新版本
  const paidVersionId = latestOrder.versionId
  const paidVersionLabel = latestOrder.workversion?.version || null

  // 如果没有版本系统（无 WorkVersion 记录）或已购买最新版本
  const hasLatest =
    !latestVersion || // 没有版本记录，老数据直接有权限
    paidVersionId === latestVersion.id // 购买的就是最新版本

  if (hasLatest) {
    return NextResponse.json({
      purchased: true,
      hasLatest: true,
      figmaUrl: latestVersion?.figmaUrl || work.figmaUrl || null,
      deliveryUrl: latestVersion?.deliveryUrl || work.deliveryUrl || null,
      paidVersion: paidVersionLabel,
      currentVersion: currentVersionLabel,
    })
  }

  const allPaidOrders = await prisma.order.findMany({
    where: {
      workId,
      buyerEmail: email,
      status: "PAID",
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, amount: true, versionId: true, workversion: { select: { version: true, figmaUrl: true, deliveryUrl: true } } },
  })
  const totalPaid = allPaidOrders.reduce((sum, o) => sum + Number(o.amount), 0)
  const upgradePrice = Math.max(0, currentPrice - totalPaid)

  // 构建所有已购版本的交付列表（去重，同一版本只保留最新订单）
  const seenVersions = new Set<string>()
  const paidVersions: { version: string; figmaUrl: string | null; deliveryUrl: string | null }[] = []
  for (const o of allPaidOrders) {
    const vLabel = o.workversion?.version || null
    const key = vLabel || o.versionId || "_no_version"
    if (!seenVersions.has(key)) {
      seenVersions.add(key)
      paidVersions.push({
        version: vLabel || "旧版",
        figmaUrl: o.workversion?.figmaUrl || null,
        deliveryUrl: o.workversion?.deliveryUrl || null,
      })
    }
  }

  return NextResponse.json({
    purchased: true,
    hasLatest: false,
    paidVersion: paidVersionLabel,
    paidAmount: totalPaid,
    paidVersions,
    upgradePrice,
    currentPrice,
    currentVersion: currentVersionLabel,
    latestVersionId: latestVersion.id,
    isFree: work.isFree,
  })
}
