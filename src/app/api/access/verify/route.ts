import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json({ success: false, message: "请输入密码" }, { status: 400 })
    }

    // 获取网站设置
    const settings = await prisma.settings.findUnique({
      where: { id: "settings" },
    })

    if (!settings?.accessPassword) {
      // 未设置访问密码，直接通过
      return NextResponse.json({ success: true })
    }

    // 验证密码
    const isValid = bcrypt.compareSync(password, settings.accessPassword)

    if (isValid) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ success: false, message: "密码错误" }, { status: 401 })
    }
  } catch (error) {
    console.error("密码验证错误:", error)
    return NextResponse.json({ success: false, message: "验证失败" }, { status: 500 })
  }
}
