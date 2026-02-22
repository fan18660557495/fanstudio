/** 后台首页：统计卡片、快捷入口、最近订单、收入图表。VIEWER 不展示订单与收入数据。 */
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import DashboardContent from "@/components/admin/DashboardContent"
import type {
  DashboardStats,
  RecentOrder,
  DailyRevenue,
} from "@/components/admin/DashboardContent"

export default async function AdminDashboardPage() {
  const session = await auth()
  const isViewer = (session?.user as { role?: string })?.role === "VIEWER"

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [
    totalPosts,
    totalDesignWorks,
    totalDevWorks,
    totalTutorials,
    totalOrders,
    monthlyRevenueAgg,
    prevMonthRevenueAgg,
    monthPosts,
    monthDesignWorks,
    monthDevWorks,
    monthTutorials,
    monthOrders,
    recentOrdersRaw,
    chartOrdersLast30Days,
  ] = await Promise.all([
    prisma.post.count(),
    prisma.work.count({ where: { workType: "DESIGN" } }),
    prisma.work.count({ where: { workType: "DEVELOPMENT" } }),
    prisma.videotutorial.count(),
    isViewer ? 0 : prisma.order.count(),
    isViewer ? { _sum: { amount: null } } : prisma.order.aggregate({
      where: { status: "PAID", paidAt: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    isViewer ? { _sum: { amount: null } } : prisma.order.aggregate({
      where: { status: "PAID", paidAt: { gte: startOfPrevMonth, lt: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.post.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.work.count({ where: { workType: "DESIGN", createdAt: { gte: startOfMonth } } }),
    prisma.work.count({ where: { workType: "DEVELOPMENT", createdAt: { gte: startOfMonth } } }),
    prisma.videotutorial.count({ where: { createdAt: { gte: startOfMonth } } }),
    isViewer ? 0 : prisma.order.count({ where: { createdAt: { gte: startOfMonth } } }),
    isViewer ? [] : prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { work: { select: { title: true } } },
    }),
    isViewer ? [] : prisma.order.findMany({
      where: {
        status: { in: ["PAID", "PENDING"] },
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { status: true, createdAt: true, paidAt: true, amount: true },
      orderBy: { createdAt: "asc" },
    }),
  ])

  const monthlyRevenue = isViewer ? 0 : Number(monthlyRevenueAgg._sum?.amount ?? 0)
  const prevMonthRevenue = isViewer ? 0 : Number(prevMonthRevenueAgg._sum?.amount ?? 0)

  // ---- 构建 stats ----
  const stats: DashboardStats = {
    totalPosts,
    totalDesignWorks,
    totalDevWorks,
    totalTutorials,
    totalOrders: isViewer ? 0 : totalOrders,
    monthlyRevenue,
    prevMonthRevenue,
    monthPosts,
    monthDesignWorks,
    monthDevWorks,
    monthTutorials,
    monthOrders: isViewer ? 0 : monthOrders,
  }

  // ---- 构建最近订单（VIEWER 不展示） ----
  const recentOrders: RecentOrder[] = isViewer
    ? []
    : (recentOrdersRaw as { id: string; orderNo: string; status: string; amount: unknown; createdAt: Date; work: { title: string } }[]).map((o) => ({
        id: o.id,
        orderNo: o.orderNo,
        status: o.status,
        amount: Number(o.amount),
        createdAt: o.createdAt.toISOString(),
        workTitle: o.work.title,
      }))

  // ---- 构建近 30 天每日收入（VIEWER 全为 0） ----
  const dailyMap = new Map<string, { paid: number; pending: number }>()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const key = `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`
    dailyMap.set(key, { paid: 0, pending: 0 })
  }
  if (!isViewer) {
    for (const order of chartOrdersLast30Days as { status: string; createdAt: Date; paidAt: Date | null; amount: unknown }[]) {
      const refDate = order.status === "PAID" && order.paidAt ? order.paidAt : order.createdAt
      const d = new Date(refDate)
      const key = `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`
      const entry = dailyMap.get(key)
      if (entry) {
        const amt = Number(order.amount)
        if (order.status === "PAID") {
          entry.paid += amt
        } else {
          entry.pending += amt
        }
      }
    }
  }
  const dailyRevenue: DailyRevenue[] = Array.from(dailyMap.entries()).map(([date, data]) => ({
    date,
    paid: data.paid,
    pending: data.pending,
  }))

  return (
    <DashboardContent
      stats={stats}
      recentOrders={recentOrders}
      dailyRevenue={dailyRevenue}
      orderBlockForbidden={isViewer}
    />
  )
}
