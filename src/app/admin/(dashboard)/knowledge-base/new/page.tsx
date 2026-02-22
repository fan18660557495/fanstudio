"use client"
/** 新建知识库：先 POST 创建草稿再跳转编辑页。 */
import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useSession } from "next-auth/react"

export default function NewKnowledgeBasePage() {
  const router = useRouter()
  const { data: session } = useSession()
  const creating = useRef(false)

  useEffect(() => {
    if (creating.current) return
    creating.current = true

    if (!session?.user?.id) {
      toast.error("请先登录")
      router.replace("/admin/knowledge-base")
      return
    }

    fetch("/api/knowledge-base/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        title: "无标题知识库",
        slug: `knowledge-${Date.now()}`,
        content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "" }] }] },
        authorId: session.user.id
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.id) {
          router.replace(`/admin/knowledge-base/${data.id}/edit`)
        } else {
          toast.error(data?.error || "创建失败")
          router.replace("/admin/knowledge-base")
        }
      })
      .catch(() => {
        toast.error("网络错误")
        router.replace("/admin/knowledge-base")
      })
  }, [router, session])

  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex items-center gap-3 text-muted-foreground">
        <i className="ri-loader-4-line animate-spin text-lg" />
        <span className="text-sm">正在创建知识库…</span>
      </div>
    </div>
  )
}
