"use client"
/** 后台首页内容：统计卡片、快捷入口、最近订单、收入图表。 */
import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { ChartContainer } from "@/components/ui/chart"

export interface DashboardStats {
  totalPosts: number
  totalDesignWorks: number
  totalDevWorks: number
  totalTutorials: number
  totalOrders: number
  monthlyRevenue: number
  monthPosts: number
  monthDesignWorks: number
  monthDevWorks: number
  monthTutorials: number
  monthOrders: number
  prevMonthRevenue: number
}

export interface RecentOrder {
  id: string
  orderNo: string
  status: string
  amount: number | string
  createdAt: string
  workTitle: string
}

export interface DailyRevenue {
  date: string     // "MM/DD"
  paid: number
  pending: number
}

interface DashboardContentProps {
  stats: DashboardStats
  recentOrders: RecentOrder[]
  dailyRevenue: DailyRevenue[]
  /** 为 true 时在「最近订单」区块显示无权限提示（如体验账户） */
  orderBlockForbidden?: boolean
}

const quickActions = [
  { title: "写文章", desc: "发布新的笔记或文章", href: "/admin/posts/new", icon: "ri-article-line" },
  { title: "设计作品", desc: "添加新的设计作品", href: "/admin/works/new?type=design", icon: "ri-palette-line" },
  { title: "开发作品", desc: "添加新的开发作品", href: "/admin/works/new?type=development", icon: "ri-code-s-slash-line" },
  { title: "视频教程", desc: "添加新的视频教程", href: "/admin/tutorials/new", icon: "ri-video-line" },
]

const statusLabels: Record<string, { text: string; className: string; dotColor: string }> = {
  PAID:      { text: "已支付", className: "text-emerald-600 dark:text-emerald-400", dotColor: "bg-emerald-500" },
  PENDING:   { text: "待支付", className: "text-amber-600 dark:text-amber-400",     dotColor: "bg-amber-500" },
  CANCELLED: { text: "已取消", className: "text-zinc-400 dark:text-zinc-500",        dotColor: "bg-zinc-400" },
  REFUNDED:  { text: "已退款", className: "text-rose-600 dark:text-rose-400",        dotColor: "bg-rose-500" },
}

const revenueChartConfig = {
  paid:    { label: "已支付", color: "var(--color-foreground)" },
  pending: { label: "未支付", color: "var(--color-foreground)" },
}

function formatCurrency(n: number) {
  return `¥${n.toLocaleString("zh-CN")}`
}

function calcTrend(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  href,
}: {
  title: string
  value: string
  subtitle: string
  icon: string
  trend?: number
  href?: string
}) {
  const content = (
    <div className="flex items-start justify-between">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
        <div className="flex items-center gap-1.5 text-xs">
          {trend !== undefined && trend !== 0 && (
            <span
              className={
                trend > 0
                  ? "inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400"
                  : "inline-flex items-center gap-0.5 text-rose-600 dark:text-rose-400"
              }
            >
              <i className={trend > 0 ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"} />
              {Math.abs(trend)}%
            </span>
          )}
          <span className="text-muted-foreground">{subtitle}</span>
        </div>
      </div>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/60">
        <i className={`${icon} text-lg text-muted-foreground`} />
      </div>
    </div>
  )

  const cls = "group rounded-2xl border border-border/40 bg-card/80 backdrop-blur-sm p-5 transition-all duration-200 hover:bg-accent/30"

  if (href) {
    return <Link href={href} className={`${cls} block`}>{content}</Link>
  }
  return <div className={cls}>{content}</div>
}

function RevenueTooltipContent({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color?: string; strokeDasharray?: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  const nameMap: Record<string, string> = { paid: "已支付", pending: "未支付" }
  return (
    <div className="rounded-lg border border-border/50 bg-background/95 backdrop-blur-sm px-3 py-2 text-xs shadow-xl">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: p.color }}
          />
          <span className="text-muted-foreground">
            {nameMap[p.name] || p.name}:
          </span>
          <span className="font-medium text-foreground">
            {formatCurrency(p.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function DashboardContent({
  stats,
  recentOrders,
  dailyRevenue,
  orderBlockForbidden = false,
}: DashboardContentProps) {
  const [chartMounted, setChartMounted] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChartMounted(true)
  }, [])

  const revenueTrend = calcTrend(stats.monthlyRevenue, stats.prevMonthRevenue)

  const today = new Date()
  const dateStr = today.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  })

  return (
    <div className="space-y-8">
      {/* ---- header ---- */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            仪表盘
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            欢迎回来，这是你的网站概览
          </p>
        </div>
        <p className="text-xs text-muted-foreground tabular-nums">{dateStr}</p>
      </div>

      {/* ---- stats cards ---- */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          title="文章"
          value={String(stats.totalPosts)}
          subtitle={`+${stats.monthPosts} 本月`}
          icon="ri-article-line"
          href="/admin/posts"
        />
        <StatCard
          title="设计作品"
          value={String(stats.totalDesignWorks)}
          subtitle={`+${stats.monthDesignWorks} 本月`}
          icon="ri-palette-line"
          href="/admin/works/design"
        />
        <StatCard
          title="开发作品"
          value={String(stats.totalDevWorks)}
          subtitle={`+${stats.monthDevWorks} 本月`}
          icon="ri-code-s-slash-line"
          href="/admin/works/development"
        />
        <StatCard
          title="视频教程"
          value={String(stats.totalTutorials)}
          subtitle={`+${stats.monthTutorials} 本月`}
          icon="ri-video-line"
          href="/admin/tutorials"
        />
        <StatCard
          title="订单"
          value={String(stats.totalOrders)}
          subtitle={`+${stats.monthOrders} 本月`}
          icon="ri-shopping-cart-line"
          href="/admin/orders"
        />
        <StatCard
          title="本月收入"
          value={formatCurrency(stats.monthlyRevenue)}
          subtitle="较上月"
          icon="ri-money-cny-circle-line"
          trend={revenueTrend}
        />
      </div>

      {/* ---- chart + quick actions row ---- */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* revenue chart */}
        <div className="lg:col-span-2 rounded-2xl border border-border/40 bg-card/80 backdrop-blur-sm p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-serif text-lg font-semibold text-foreground">收入趋势</h2>
              <p className="text-xs text-muted-foreground mt-0.5">近 30 天每日收入</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-4 border-t-2 border-foreground" />
                已支付
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-4 border-t-2 border-foreground border-dashed" />
                未支付
              </span>
            </div>
          </div>

          <ChartContainer config={revenueChartConfig} className="aspect-auto h-[260px] w-full">
            {chartMounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyRevenue} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fillPaid" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-foreground)" stopOpacity={0.12} />
                      <stop offset="100%" stopColor="var(--color-foreground)" stopOpacity={0.01} />
                    </linearGradient>
                    <linearGradient id="fillPending" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-foreground)" stopOpacity={0.05} />
                      <stop offset="100%" stopColor="var(--color-foreground)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/30" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000}k` : String(v))}
                  />
                  <Tooltip content={<RevenueTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="paid"
                    name="paid"
                    stroke="var(--color-foreground)"
                    strokeWidth={2}
                    fill="url(#fillPaid)"
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 2, fill: "var(--color-background)" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="pending"
                    name="pending"
                    stroke="var(--color-foreground)"
                    strokeWidth={1.5}
                    strokeDasharray="5 3"
                    fill="url(#fillPending)"
                    dot={false}
                    activeDot={{ r: 3, strokeWidth: 2, fill: "var(--color-background)" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : null}
          </ChartContainer>
        </div>

        {/* quick actions */}
        <div className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-sm p-5">
          <h2 className="font-serif text-lg font-semibold text-foreground">快速操作</h2>
          <p className="text-xs text-muted-foreground mt-0.5 mb-4">常用功能入口</p>

          <div className="space-y-2">
            {quickActions.map((action) => (
              <Link key={action.href} href={action.href}>
                <div className="group flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-accent/50">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/60 transition-colors group-hover:bg-accent">
                    <i className={`${action.icon} text-base text-muted-foreground group-hover:text-foreground transition-colors`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{action.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{action.desc}</p>
                  </div>
                  <i className="ri-arrow-right-s-line text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ---- recent orders ---- */}
      <div className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-sm">
        <div className="flex items-center justify-between p-5 pb-0">
          <div>
            <h2 className="font-serif text-lg font-semibold text-foreground">最近订单</h2>
            <p className="text-xs text-muted-foreground mt-0.5">最新 5 笔订单记录</p>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            查看全部 <i className="ri-arrow-right-s-line" />
          </Link>
        </div>

        {orderBlockForbidden ? (
          <div className="p-5 text-center text-sm text-muted-foreground">无权限查看订单</div>
        ) : recentOrders.length === 0 ? (
          <div className="p-5 text-center text-sm text-muted-foreground">暂无订单</div>
        ) : (
          <div className="p-5">
            {/* desktop table header */}
            <div className="hidden sm:grid sm:grid-cols-[1fr_140px_100px_100px] gap-4 text-xs font-medium text-muted-foreground pb-3 border-b border-border/30 mb-1">
              <span>作品 / 订单号</span>
              <span>时间</span>
              <span className="text-right">金额</span>
              <span className="text-right">状态</span>
            </div>

            <div className="divide-y divide-border/30">
              {recentOrders.map((order) => {
                const sl = statusLabels[order.status] || {
                  text: order.status,
                  className: "text-muted-foreground",
                  dotColor: "bg-zinc-400",
                }
                const amt = Number(order.amount)
                return (
                  <div
                    key={order.id}
                    className="py-3 first:pt-2 last:pb-0"
                  >
                    {/* mobile layout */}
                    <div className="sm:hidden flex items-center justify-between">
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <p className="font-medium text-sm text-foreground truncate">{order.workTitle}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.orderNo} · {new Date(order.createdAt).toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" })}
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className="font-medium text-sm text-foreground">
                          {amt > 0 ? formatCurrency(amt) : "开源"}
                        </p>
                        <p className={`text-xs ${sl.className}`}>{sl.text}</p>
                      </div>
                    </div>
                    {/* desktop layout */}
                    <div className="hidden sm:grid sm:grid-cols-[1fr_140px_100px_100px] gap-4 items-center">
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">{order.workTitle}</p>
                        <p className="text-xs text-muted-foreground truncate">{order.orderNo}</p>
                      </div>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {new Date(order.createdAt).toLocaleString("zh-CN", {
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="text-sm font-medium text-foreground text-right tabular-nums">
                        {amt > 0 ? formatCurrency(amt) : "开源"}
                      </p>
                      <div className="flex items-center justify-end gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${sl.dotColor}`} />
                        <span className={`text-xs ${sl.className}`}>{sl.text}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
