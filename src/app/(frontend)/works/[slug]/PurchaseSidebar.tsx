"use client"
/** 作品详情页右侧购买侧栏：价格、购买/升级、邮箱、订单校验与支付跳转。 */
import { CardDescriptionHtml } from "@/components/frontend/CardDescriptionHtml"
import { htmlToPlainText } from "@/lib/content-format"
import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { GlowBorder } from "@/components/react-bits"
import { HoverPopover } from "@/components/ui/hover-popover"

interface PurchaseSidebarProps {
  workId: string
  title: string
  description: string
  categoryName: string
  tags?: { id: string; name: string }[]
  price: number | null
  isFree: boolean
  hasDeliveryUrl: boolean
  updatedAt: string | null
  currentVersion: string | null
  demoUrl?: string | null
  demoQrCode?: string | null
}

interface CheckResult {
  purchased: boolean
  hasLatest?: boolean
  figmaUrl?: string | null
  deliveryUrl?: string | null
  paidVersion?: string | null
  paidAmount?: number
  paidVersions?: { version: string; figmaUrl: string | null; deliveryUrl: string | null }[]
  upgradePrice?: number
  currentPrice?: number
  currentVersion?: string | null
  latestVersionId?: string
  isFree?: boolean
}

export function PurchaseSidebar({
  workId,
  title,
  description,
  categoryName,
  tags,
  price,
  isFree,
  hasDeliveryUrl,
  updatedAt,
  currentVersion,
  demoUrl,
  demoQrCode,
}: PurchaseSidebarProps) {
  // ===== 共享状态 =====
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [figmaUrl, setFigmaUrl] = useState<string | null>(null)
  const [deliveryUrl, setDeliveryUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [paidVersions, setPaidVersions] = useState<{ version: string; figmaUrl: string | null; deliveryUrl: string | null }[]>([])

  // ===== 查询弹窗 =====
  const [queryOpen, setQueryOpen] = useState(false)
  const [queryError, setQueryError] = useState("")

  // ===== 购买弹窗 =====
  const [buyOpen, setBuyOpen] = useState(false)
  const [buyError, setBuyError] = useState("")
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null)
  const [orderNo, setOrderNo] = useState<string | null>(null)
  const [wechatQrDataUrl, setWechatQrDataUrl] = useState<string | null>(null)
  const [wechatCreateError, setWechatCreateError] = useState<string | null>(null)
  const [wechatCreateLoading, setWechatCreateLoading] = useState(false)

  // ---------- 查询逻辑 ----------
  function openQueryDialog() {
    setQueryOpen(true)
    setQueryError("")
  }

  async function handleQuery() {
    if (!email.trim() || !email.includes("@")) {
      setQueryError("请输入有效的邮箱地址")
      return
    }
    setLoading(true)
    setQueryError("")
    try {
      const res = await fetch(
        `/api/orders/check?email=${encodeURIComponent(email.trim())}&workId=${workId}`,
      )
      const data: CheckResult = await res.json()
      if (!res.ok) {
        setQueryError((data as { error?: string }).error || "查询失败")
        return
      }

      if (!data.purchased) {
        setQueryError("该邮箱暂无购买记录")
        return
      }

      // 已购最新版本
      if (data.hasLatest && (data.figmaUrl || data.deliveryUrl)) {
        if (data.figmaUrl) setFigmaUrl(data.figmaUrl)
        if (data.deliveryUrl) setDeliveryUrl(data.deliveryUrl)
        setQueryOpen(false)
        return
      }

      // 已购旧版本
      if (data.paidVersions && data.paidVersions.length > 0) {
        setPaidVersions(data.paidVersions)
        setQueryOpen(false)
        return
      }

      // 兜底
      setQueryError("未找到可用的交付资源")
    } catch {
      setQueryError("网络错误，请重试")
    } finally {
      setLoading(false)
    }
  }

  // ---------- 购买逻辑 ----------
  function openBuyDialog() {
    setBuyOpen(true)
    setBuyError("")
    setCheckResult(null)
    setOrderNo(null)
    setWechatQrDataUrl(null)
    setWechatCreateError(null)
  }

  // 待支付时请求微信 Native 下单，获取二维码
  useEffect(() => {
    if (!orderNo || wechatQrDataUrl || wechatCreateError !== null) return
    let cancelled = false
    setWechatCreateLoading(true)
    setWechatCreateError(null)
    fetch("/api/payment/wechat/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderNo }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        if (data.qr_data_url) {
          setWechatQrDataUrl(data.qr_data_url)
        } else {
          setWechatCreateError(data.error || "获取支付二维码失败")
        }
      })
      .catch(() => {
        if (!cancelled) setWechatCreateError("网络错误，请重试")
      })
      .finally(() => {
        if (!cancelled) setWechatCreateLoading(false)
      })
    return () => { cancelled = true }
  }, [orderNo, wechatQrDataUrl, wechatCreateError])

  // 展示二维码期间，轮询订单支付状态（每 3 秒）
  const hasAnyDelivery = !!(figmaUrl || deliveryUrl)
  useEffect(() => {
    if (!orderNo || !wechatQrDataUrl || hasAnyDelivery) return
    let cancelled = false
    const poll = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/orders/check-status?orderNo=${encodeURIComponent(orderNo)}`,
        )
        if (!res.ok || cancelled) return
        const data: { status: string; figmaUrl?: string | null; deliveryUrl?: string | null } =
          await res.json()
        if (cancelled) return
        if (data.status === "PAID") {
          if (data.figmaUrl) setFigmaUrl(data.figmaUrl)
          if (data.deliveryUrl) setDeliveryUrl(data.deliveryUrl)
          // 如果两个都没有也标记完成（防止卡住）
          if (!data.figmaUrl && !data.deliveryUrl) {
            setFigmaUrl("")
            setDeliveryUrl("")
          }
        }
      } catch {
        // 静默忽略网络错误，下次继续轮询
      }
    }, 3000)
    return () => { cancelled = true; clearInterval(poll) }
  }, [orderNo, wechatQrDataUrl, hasAnyDelivery])

  async function handleBuy() {
    if (!email.trim() || !email.includes("@")) {
      setBuyError("请输入有效的邮箱地址")
      return
    }
    setLoading(true)
    setBuyError("")
    try {
      // 先查询购买状态
      const checkRes = await fetch(
        `/api/orders/check?email=${encodeURIComponent(email.trim())}&workId=${workId}`,
      )
      const checkData: CheckResult = await checkRes.json()
      if (!checkRes.ok) {
        setBuyError((checkData as { error?: string }).error || "查询失败")
        return
      }

      // 已购最新版本 -> 直接给交付链接
      if (checkData.purchased && checkData.hasLatest && (checkData.figmaUrl || checkData.deliveryUrl)) {
        if (checkData.figmaUrl) setFigmaUrl(checkData.figmaUrl)
        if (checkData.deliveryUrl) setDeliveryUrl(checkData.deliveryUrl)
        if (checkData.paidVersions?.length) setPaidVersions(checkData.paidVersions)
        return
      }

      // 已购旧版本 -> 显示升级信息
      if (checkData.purchased && !checkData.hasLatest) {
        setCheckResult(checkData)
        if (checkData.paidVersions?.length) setPaidVersions(checkData.paidVersions)
        return
      }

      // 未购买 -> 直接创建订单
      const body: Record<string, unknown> = {
        workId,
        buyerEmail: email.trim(),
      }
      if (checkData.latestVersionId) {
        body.versionId = checkData.latestVersionId
      }
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const orderData = await orderRes.json()
      if (!orderRes.ok) {
        setBuyError(orderData.error || "创建订单失败")
        return
      }
      if (orderData.figmaUrl) setFigmaUrl(orderData.figmaUrl)
      if (orderData.deliveryUrl) setDeliveryUrl(orderData.deliveryUrl)
      setOrderNo(orderData.orderNo)
      setWechatQrDataUrl(null)
      setWechatCreateError(null)
    } catch {
      setBuyError("网络错误，请重试")
    } finally {
      setLoading(false)
    }
  }

  async function handleUpgrade() {
    if (!checkResult) return
    setLoading(true)
    setBuyError("")
    try {
      const body: Record<string, unknown> = {
        workId,
        buyerEmail: email.trim(),
      }
      if (checkResult.latestVersionId) body.versionId = checkResult.latestVersionId
      body.upgradeFromId = checkResult.paidVersion || "previous"
      body.upgradeAmount = checkResult.upgradePrice ?? 0

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setBuyError(data.error || "创建订单失败")
        return
      }
      if (data.figmaUrl) setFigmaUrl(data.figmaUrl)
      if (data.deliveryUrl) setDeliveryUrl(data.deliveryUrl)
      setOrderNo(data.orderNo)
      setWechatQrDataUrl(null)
      setWechatCreateError(null)
    } catch {
      setBuyError("网络错误，请重试")
    } finally {
      setLoading(false)
    }
  }

  // ⚠️ 测试用：模拟支付成功
  async function handleSimulatePay() {
    if (!orderNo) return
    setLoading(true)
    setBuyError("")
    try {
      const res = await fetch("/api/orders/simulate-pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNo }),
      })
      const data = await res.json()
      if (!res.ok) {
        setBuyError(data.error || "模拟支付失败")
        return
      }
      if (data.figmaUrl) setFigmaUrl(data.figmaUrl)
      if (data.deliveryUrl) setDeliveryUrl(data.deliveryUrl)
    } catch {
      setBuyError("网络错误，请重试")
    } finally {
      setLoading(false)
    }
  }

  const hasAnyUrl = !!(figmaUrl || deliveryUrl)

  function handleCopyLink(url: string) {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const displayPrice = isFree ? 0 : (price ?? 0)

  return (
    <>
      <GlowBorder className="lg:sticky lg:top-12 rounded-2xl border border-border bg-card/50 backdrop-blur-sm">
        <div className="p-6 lg:p-8">
          {(categoryName || (tags && tags.length > 0)) && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {categoryName && (
                <span className="tag w-fit flex items-center gap-1">
                  <i className="ri-folder-line" /> {categoryName}
                </span>
              )}
              {tags?.map((tag) => (
                <span key={tag.id} className="tag w-fit">{tag.name}</span>
              ))}
            </div>
          )}

          <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-3">
            {title}
          </h1>

          {description && (
            <CardDescriptionHtml
              html={description}
              lines={false}
              className="text-muted-foreground text-sm leading-relaxed mb-6"
            />
          )}

          {/* 在线体验入口 */}
          {(demoUrl || demoQrCode) && (
            <div className="flex items-center gap-3 mb-6">
              {demoUrl && (
                <a
                  href={demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 rounded-xl border border-border bg-accent/50 hover:bg-accent text-foreground font-medium text-sm flex items-center justify-center gap-2 transition-all"
                >
                  <i className="ri-external-link-line" />
                  在线体验
                </a>
              )}
              {demoQrCode && (
                <HoverPopover
                  content={
                    <div className="flex flex-col items-center gap-2 p-1">
                      <img
                        src={demoQrCode}
                        alt="扫码体验"
                        className="w-40 h-40 rounded-lg object-contain"
                      />
                      <span className="text-xs text-muted-foreground">扫码体验</span>
                    </div>
                  }
                  side="left"
                >
                  <button
                    type="button"
                    className="shrink-0 w-10 h-10 rounded-xl border border-border bg-accent/50 hover:bg-accent flex items-center justify-center transition-all"
                    title="扫码体验"
                  >
                    <i className="ri-qr-code-line text-lg" />
                  </button>
                </HoverPopover>
              )}
            </div>
          )}

          <div className="border-t border-border mb-6" />

          <div className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-5xl font-bold tracking-tight text-foreground">
                <span className="text-2xl font-normal text-muted-foreground mr-0.5">¥</span>
                {displayPrice}
              </span>
              {!isFree && (
                <span className="text-sm text-muted-foreground">一次购买，永久使用</span>
              )}
            </div>

            {/* 主按钮 */}
            {hasAnyUrl ? (
              <div className="space-y-2">
                {figmaUrl && (
                  <button
                    onClick={() => window.open(figmaUrl, "_blank")}
                    className="w-full py-3 rounded-xl bg-foreground text-background font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2"
                  >
                    <i className="ri-figma-line" />
                    在 Figma 中打开
                  </button>
                )}
                {deliveryUrl && (
                  <div className="flex items-center gap-2 p-3 rounded-xl border border-green-500/30 bg-green-500/5">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground mb-0.5">自定义链接</p>
                      <p className="text-sm text-foreground truncate" title={deliveryUrl}>{deliveryUrl}</p>
                    </div>
                    <button
                      onClick={() => handleCopyLink(deliveryUrl)}
                      className="shrink-0 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition-all flex items-center gap-1"
                    >
                      <i className={copied ? "ri-check-line" : "ri-file-copy-line"} />
                      {copied ? "已复制" : "复制"}
                    </button>
                  </div>
                )}
              </div>
            ) : hasDeliveryUrl ? (
              <button
                onClick={openBuyDialog}
                className="w-full py-3 rounded-xl bg-foreground text-background font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                <i className={isFree ? "ri-gift-line" : "ri-shopping-cart-line"} />
                {isFree ? "开源获取" : "立即购买"}
              </button>
            ) : (
              <div className="w-full py-3 rounded-xl bg-muted text-muted-foreground font-medium flex items-center justify-center gap-2 text-sm">
                <i className="ri-eye-line" />
                仅供预览
              </div>
            )}

            {/* 已购版本列表 */}
            {paidVersions.length > 0 && !hasAnyUrl && (
              <div className="space-y-2">
                {paidVersions.map((pv, i) => (
                  <div key={i} className="space-y-1.5">
                    <p className="text-xs font-medium text-green-600 flex items-center gap-1">
                      <i className="ri-checkbox-circle-fill" />
                      V{pv.version}（已购）
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {pv.figmaUrl && (
                        <button
                          onClick={() => window.open(pv.figmaUrl!, "_blank")}
                          className="w-full py-2 rounded-lg border border-border bg-accent/50 text-foreground text-sm font-medium hover:bg-accent transition-all flex items-center justify-center gap-2"
                        >
                          <i className="ri-figma-line" />
                          在 Figma 中打开
                        </button>
                      )}
                      {pv.deliveryUrl && (
                        <div className="flex items-center gap-2 p-2 rounded-lg border border-border bg-accent/30">
                          <p className="flex-1 min-w-0 text-xs text-foreground/70 truncate" title={pv.deliveryUrl}>{pv.deliveryUrl}</p>
                          <button
                            onClick={() => handleCopyLink(pv.deliveryUrl!)}
                            className="shrink-0 px-2 py-1 rounded bg-foreground/10 text-foreground text-xs hover:bg-foreground/20 transition-all"
                          >
                            <i className="ri-file-copy-line" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 查询入口 */}
            {hasDeliveryUrl && !hasAnyUrl && paidVersions.length === 0 && !isFree && (
              <button
                onClick={openQueryDialog}
                className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1"
              >
                <i className="ri-search-line text-xs" />
                已购买？查询购买记录
              </button>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-border space-y-3 text-sm">
            {currentVersion && (
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <i className="ri-price-tag-3-line" /> 版本
                </span>
                <span className="text-foreground/70">V{currentVersion}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <i className="ri-calendar-line" /> 更新时间
              </span>
              <span className="text-foreground/70">
                {updatedAt ? new Date(updatedAt).toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" }) : "-"}
              </span>
            </div>
          </div>
        </div>
      </GlowBorder>

      {/* ========== 查询弹窗 ========== */}
      {queryOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => { if (!loading) setQueryOpen(false) }}
          >
            <div
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">查询购买记录</h2>
                  <button
                    onClick={() => setQueryOpen(false)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    disabled={loading}
                  >
                    <i className="ri-close-line text-xl" />
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    购买邮箱
                  </label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleQuery() }}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground/70 leading-relaxed">
                    请输入购买时使用的邮箱，用于查询已获取的资源记录。
                  </p>
                </div>

                {queryError && (
                  <div className="rounded-lg bg-destructive/10 text-destructive px-3 py-2 text-sm">
                    {queryError}
                  </div>
                )}

                <button
                  onClick={handleQuery}
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-foreground text-background font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <i className="ri-loader-4-line animate-spin" />
                      查询中…
                    </>
                  ) : (
                    <>
                      <i className="ri-search-line" />
                      查询
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* ========== 购买弹窗 ========== */}
      {buyOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => { if (!loading) setBuyOpen(false) }}
          >
            <div
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">
                    {hasAnyUrl ? "获取资源" : orderNo ? "等待支付" : checkResult?.purchased ? "版本升级" : isFree ? "开源获取" : "购买作品"}
                  </h2>
                  <button
                    onClick={() => { if (!loading) setBuyOpen(false) }}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    disabled={loading}
                  >
                    <i className="ri-close-line text-xl" />
                  </button>
                </div>

                {/* === 感谢购买 / 获取资源 === */}
                {hasAnyUrl ? (
                  <div className="space-y-4">
                    <div className="flex flex-col items-center text-center py-4">
                      <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                        <i className={isFree ? "ri-gift-fill text-green-500 text-3xl" : "ri-heart-3-fill text-green-500 text-3xl"} />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-1">
                        {isFree ? "获取成功" : "感谢您的支持"}
                      </h3>
                      {!isFree && orderNo && (
                        <p className="text-sm text-muted-foreground">
                          订单号: {orderNo}
                        </p>
                      )}
                    </div>

                    {/* Figma 跳转按钮 */}
                    {figmaUrl && (
                      <button
                        onClick={() => window.open(figmaUrl, "_blank")}
                        className="w-full py-3 rounded-xl bg-foreground text-background font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2"
                      >
                        <i className="ri-figma-line" />
                        在 Figma 中打开
                      </button>
                    )}

                    {/* 自定义链接复制 */}
                    {deliveryUrl && (
                      <div className="rounded-xl border border-border bg-accent/30 p-3 space-y-2">
                        <p className="text-xs text-muted-foreground">自定义链接</p>
                        <div className="flex items-center gap-2">
                          <p className="flex-1 min-w-0 text-sm text-foreground break-all line-clamp-2" title={deliveryUrl}>{deliveryUrl}</p>
                          <button
                            onClick={() => handleCopyLink(deliveryUrl)}
                            className="shrink-0 px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-all flex items-center gap-1.5"
                          >
                            <i className={copied ? "ri-check-line" : "ri-file-copy-line"} />
                            {copied ? "已复制" : "复制链接"}
                          </button>
                        </div>
                      </div>
                    )}

                    {!isFree && (
                      <p className="text-xs text-muted-foreground text-center">
                        请妥善保管您的邮箱，后续可通过邮箱查询购买记录。
                      </p>
                    )}
                  </div>
                ) : orderNo ? (
                  /* === 待支付 === */
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <i className="ri-time-line text-amber-500 text-xl" />
                      <div>
                        <p className="text-sm font-medium text-foreground">等待支付</p>
                        <p className="text-xs text-muted-foreground">订单号: {orderNo}</p>
                      </div>
                    </div>
                    {wechatCreateLoading ? (
                      <div className="flex flex-col items-center justify-center py-8 gap-3">
                        <i className="ri-loader-4-line animate-spin text-2xl text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">正在生成支付二维码…</p>
                      </div>
                    ) : wechatQrDataUrl ? (
                      <>
                        <div className="flex flex-col items-center gap-3 py-2">
                          <img
                            src={wechatQrDataUrl}
                            alt="微信扫码支付"
                            className="w-[260px] h-[260px] rounded-xl border border-border bg-white p-2"
                          />
                          <p className="text-sm font-medium text-foreground">请使用微信扫码支付</p>
                          <p className="text-xs text-muted-foreground">
                            支付成功后将发邮件到您的邮箱，也可通过「查询购买记录」获取资源
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground text-center">
                          {wechatCreateError ?? "微信支付功能即将上线，敬请期待"}
                        </p>
                        {/* ⚠️ 测试按钮：未配置微信或开发环境可用 */}
                        <div className="border-t border-dashed border-border pt-4">
                          <p className="text-xs text-muted-foreground/60 text-center mb-2">— 测试模式 —</p>
                          <button
                            onClick={handleSimulatePay}
                            disabled={loading}
                            className="w-full py-3 rounded-xl bg-amber-500 text-white font-medium hover:bg-amber-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {loading ? (
                              <><i className="ri-loader-4-line animate-spin" /> 处理中…</>
                            ) : (
                              <><i className="ri-test-tube-line" /> 模拟支付成功</>
                            )}
                          </button>
                        </div>
                      </>
                    )}
                    {buyError && (
                      <div className="rounded-lg bg-destructive/10 text-destructive px-3 py-2 text-sm">
                        {buyError}
                      </div>
                    )}
                  </div>
                ) : checkResult?.purchased && !checkResult.hasLatest ? (
                  /* === 已购旧版本：升级 === */
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <i className="ri-arrow-up-circle-fill text-amber-500 text-xl" />
                      <div>
                        <p className="text-sm font-medium text-foreground">发现新版本可升级</p>
                        <p className="text-xs text-muted-foreground">
                          {checkResult.paidVersion && `已购: V${checkResult.paidVersion} · `}
                          已支付: ¥{checkResult.paidAmount ?? 0}
                        </p>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-accent/50 border border-border/50 space-y-3">
                      <span className="text-sm font-medium text-foreground">
                        升级到 V{checkResult.currentVersion}
                      </span>
                      <div className="flex items-baseline gap-2">
                        {(checkResult.upgradePrice ?? 0) > 0 ? (
                          <>
                            <span className="text-2xl font-bold text-foreground">¥{checkResult.upgradePrice}</span>
                            <span className="text-sm text-muted-foreground line-through">¥{checkResult.currentPrice}</span>
                            <span className="text-xs bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full">补差价</span>
                          </>
                        ) : (
                          <span className="text-2xl font-bold text-green-600">开源升级</span>
                        )}
                      </div>
                    </div>
                    {buyError && (
                      <div className="rounded-lg bg-destructive/10 text-destructive px-3 py-2 text-sm">{buyError}</div>
                    )}
                    <button
                      onClick={handleUpgrade}
                      disabled={loading}
                      className="w-full py-3 rounded-xl bg-foreground text-background font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loading ? (
                        <><i className="ri-loader-4-line animate-spin" /> 处理中…</>
                      ) : (checkResult.upgradePrice ?? 0) > 0 ? (
                        <><i className="ri-arrow-up-circle-line" /> 升级 ¥{checkResult.upgradePrice}</>
                      ) : (
                        <><i className="ri-gift-line" /> 开源升级</>
                      )}
                    </button>
                  </div>
                ) : (
                  /* === 邮箱输入 + 购买 === */
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/50 border border-border/50">
                      <i className="ri-palette-line text-xl text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{title}</p>
                        <p className="text-xs text-muted-foreground">
                          ¥{displayPrice}
                          {currentVersion && ` · V${currentVersion}`}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        邮箱地址 <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleBuy() }}
                        className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
                        disabled={loading}
                      />
                      <p className="text-xs text-muted-foreground/70 leading-relaxed">
                        本站为个人网站，不提供账户系统与在线订单查询。邮件将作为您获取资源的唯一凭证，请务必填写常用邮箱。
                      </p>
                    </div>
                    {buyError && (
                      <div className="rounded-lg bg-destructive/10 text-destructive px-3 py-2 text-sm">{buyError}</div>
                    )}
                    <button
                      onClick={handleBuy}
                      disabled={loading}
                      className="w-full py-3 rounded-xl bg-foreground text-background font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loading ? (
                        <><i className="ri-loader-4-line animate-spin" /> 处理中…</>
                      ) : isFree ? (
                        <><i className="ri-gift-line" /> 开源获取</>
                      ) : (
                        <><i className="ri-shopping-cart-line" /> 确认购买 ¥{displayPrice}</>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
