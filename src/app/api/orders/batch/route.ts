import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/require-admin"
import prisma from "@/lib/prisma"

export const dynamic = "force-dynamic"

/** PATCH: 批量更新订单状态。body: { ids, status }，status 为 PAID/CANCELLED/REFUNDED，需管理员登录。 */
export async function PATCH(request: NextRequest) {
  const check = await requireAdmin()
  if (!check.authorized) return check.response
  const { ids, status } = await request.json()
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids required" }, { status: 400 })
  }
  if (!["PAID", "CANCELLED", "REFUNDED"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 })
  }
  const data: Record<string, unknown> = { status }
  if (status === "PAID") data.paidAt = new Date()
  await prisma.order.updateMany({
    where: { id: { in: ids } },
    data,
  })
  return NextResponse.json({ ok: true })
}

/** DELETE: 批量删除订单。body: { ids }，需管理员登录。 */
export async function DELETE(request: NextRequest) {
  const check = await requireAdmin()
  if (!check.authorized) return check.response
  const body = await request.json()
  const ids = body?.ids
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids required" }, { status: 400 })
  }
  await prisma.order.deleteMany({ where: { id: { in: ids } } })
  return NextResponse.json({ ok: true })
}
