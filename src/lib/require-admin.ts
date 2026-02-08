/** 权限检查：确保当前用户已登录且为 ADMIN 角色。VIEWER 返回 403。 */
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

type AuthResult =
  | { authorized: true; userId: string }
  | { authorized: false; response: NextResponse }

/** 检查登录 + ADMIN 角色。未登录返回 401，VIEWER 返回 403。 */
export async function requireAdmin(): Promise<AuthResult> {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "未登录" }, { status: 401 }),
    }
  }

  const role = (session.user as { role?: string }).role
  if (role === "VIEWER") {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "体验账户仅可查看，无法修改" },
        { status: 403 },
      ),
    }
  }

  return { authorized: true, userId: session.user.id }
}
