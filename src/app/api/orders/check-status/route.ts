import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export const dynamic = "force-dynamic"

/** GET: 根据 orderNo 查询订单支付状态，前端轮询用。 */
export async function GET(request: NextRequest) {
  const orderNo = new URL(request.url).searchParams.get("orderNo")?.trim()
  if (!orderNo) {
    return NextResponse.json({ error: "缺少 orderNo" }, { status: 400 })
  }

  const order = await prisma.order.findUnique({
    where: { orderNo },
    select: {
      status: true,
      work: { select: { figmaUrl: true, deliveryUrl: true } },
      version: { select: { figmaUrl: true, deliveryUrl: true } },
    },
  })

  if (!order) {
    return NextResponse.json({ error: "订单不存在" }, { status: 404 })
  }

  const figmaUrl = order.version?.figmaUrl ?? order.work?.figmaUrl ?? null
  const deliveryUrl = order.version?.deliveryUrl ?? order.work?.deliveryUrl ?? null

  return NextResponse.json({
    status: order.status,
    figmaUrl: order.status === "PAID" ? figmaUrl : null,
    deliveryUrl: order.status === "PAID" ? deliveryUrl : null,
  })
}
