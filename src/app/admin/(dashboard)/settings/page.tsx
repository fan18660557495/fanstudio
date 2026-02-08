"use client"
/** 网站设置页：基本设置、关于我、导航与页面文案、社交链接、外观主题。 */
import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { MiniEditor } from "@/components/admin/MiniEditor"
import { SOCIAL_LINK_ENTRIES, isImageUrl, type SocialLinks } from "@/lib/social-links"
import {
  normalizeAboutModules,
  type AboutModules,
  type WorkExperienceItem,
  type EducationItem,
  type SkillItem,
} from "@/lib/about-types"
import { compressImageToDataUrl } from "@/lib/avatar-compress"
import { defaultNav } from "@/lib/nav-config"
import { defaultPageCopy, defaultSiteName, defaultPersonalName, normalizeSiteName } from "@/lib/page-copy"
import { defaultFooter, type FooterConfig } from "@/lib/version"
import {
  BASE_PRESETS,
  ACCENT_PRESETS,
  DEFAULT_THEME,
  type ThemeConfig,
  type BaseColorId,
  type AccentColorId,
} from "@/lib/theme-presets"
import { useThemeColor } from "@/components/ThemeColorProvider"
import { cn } from "@/lib/utils"

type NavData = {
  logoText?: string
  worksDesign?: string
  worksDev?: string
  blog?: string
  about?: string
  tutorials?: string
}

type PageCopyData = {
  worksDesignDesc?: string
  worksDevDesc?: string
  blogDesc?: string
  tutorialsDesc?: string
  aboutDesc?: string
  heroGreeting?: string
  heroPrefix?: string
  heroDesc?: string
  siteDescription?: string
  aboutWorkTitle?: string
  aboutEducationTitle?: string
  aboutSkillsTitle?: string
}

export default function SettingsPage() {
  const [siteName, setSiteName] = useState(defaultSiteName)
  const [avatar, setAvatar] = useState("")
  const [wechat, setWechat] = useState("")
  const [xiaohongshu, setXiaohongshu] = useState("")
  const [officialAccount, setOfficialAccount] = useState("")
  const [bilibili, setBilibili] = useState("")
  const [figma, setFigma] = useState("")
  const [youshe, setYoushe] = useState("")
  const [x, setX] = useState("")
  const [github, setGithub] = useState("")
  const [email, setEmail] = useState("")
  const [aboutIntro, setAboutIntro] = useState("")
  const [aboutStudioName, setAboutStudioName] = useState("")
  const [aboutPersonalName, setAboutPersonalName] = useState(defaultPersonalName)
  const [aboutPersonalTitle, setAboutPersonalTitle] = useState("")
  const [workExperience, setWorkExperience] = useState<WorkExperienceItem[]>([])
  const [education, setEducation] = useState<EducationItem[]>([])
  const [aboutSkills, setAboutSkills] = useState<SkillItem[]>([])
  const avatarFileInputRef = useRef<HTMLInputElement>(null)
  const [navWorksDesign, setNavWorksDesign] = useState(defaultNav.worksDesign ?? "")
  const [navWorksDev, setNavWorksDev] = useState(defaultNav.worksDev ?? "")
  const [navBlog, setNavBlog] = useState(defaultNav.blog ?? "")
  const [navAbout, setNavAbout] = useState(defaultNav.about ?? "")
  const [navTutorials, setNavTutorials] = useState(defaultNav.tutorials ?? "")
  const [worksDesignDesc, setWorksDesignDesc] = useState(defaultPageCopy.worksDesignDesc ?? "")
  const [worksDevDesc, setWorksDevDesc] = useState(defaultPageCopy.worksDevDesc ?? "")
  const [blogDesc, setBlogDesc] = useState(defaultPageCopy.blogDesc ?? "")
  const [tutorialsDesc, setTutorialsDesc] = useState(defaultPageCopy.tutorialsDesc ?? "")
  const [aboutDesc, setAboutDesc] = useState(defaultPageCopy.aboutDesc ?? "")
  const [heroGreeting, setHeroGreeting] = useState(defaultPageCopy.heroGreeting ?? "")
  const [heroPrefix, setHeroPrefix] = useState(defaultPageCopy.heroPrefix ?? "")
  const [heroDesc, setHeroDesc] = useState(defaultPageCopy.heroDesc ?? "")
  const [siteDescription, setSiteDescription] = useState(defaultPageCopy.siteDescription ?? "")
  const [aboutWorkTitle, setAboutWorkTitle] = useState(defaultPageCopy.aboutWorkTitle ?? "")
  const [aboutEducationTitle, setAboutEducationTitle] = useState(defaultPageCopy.aboutEducationTitle ?? "")
  const [aboutSkillsTitle, setAboutSkillsTitle] = useState(defaultPageCopy.aboutSkillsTitle ?? "")
  const [themeBase, setThemeBase] = useState<BaseColorId>(DEFAULT_THEME.base)
  const [themeAccent, setThemeAccent] = useState<AccentColorId>(DEFAULT_THEME.accent)
  const [footerCopyrightText, setFooterCopyrightText] = useState(defaultFooter.copyrightText ?? "")
  const [footerVersion, setFooterVersion] = useState(defaultFooter.version ?? "")
  const [savingTheme, setSavingTheme] = useState(false)
  const { setThemeConfig } = useThemeColor()
  const [loading, setLoading] = useState(true)
  const [savingGeneral, setSavingGeneral] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingNavPage, setSavingNavPage] = useState(false)

  useEffect(() => {
    fetch("/api/settings", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        setSiteName(normalizeSiteName(data.siteName))
        setAvatar(data.avatar ?? "")
        const links = (data.socialLinks as SocialLinks) || {}
        setWechat(links.wechat ?? "")
        setXiaohongshu(links.xiaohongshu ?? "")
        setOfficialAccount(links.officialAccount ?? "")
        setBilibili(links.bilibili ?? "")
        setFigma(links.figma ?? "")
        setYoushe(links.youshe ?? "")
        setX(links.x ?? "")
        setGithub(links.github ?? "")
        setEmail(links.email ?? "")
        const normalized = normalizeAboutModules(data.about as AboutModules | null)
        setAboutIntro(normalized.intro ?? "")
        const pc = normalized.profileCard
        setAboutStudioName(pc?.studioName ?? "")
        setAboutPersonalName(pc?.personalName ?? defaultPersonalName)
        setAboutPersonalTitle(pc?.personalTitle ?? "")
        setWorkExperience(normalized.workExperience ?? [])
        setEducation(normalized.education ?? [])
        setAboutSkills(normalized.skills ?? [])
        const nav = (data.nav as NavData) || {}
        setNavWorksDesign(nav.worksDesign ?? defaultNav.worksDesign ?? "")
        setNavWorksDev(nav.worksDev ?? defaultNav.worksDev ?? "")
        setNavBlog(nav.blog ?? defaultNav.blog ?? "")
        setNavAbout(nav.about ?? defaultNav.about ?? "")
        setNavTutorials(nav.tutorials ?? defaultNav.tutorials ?? "")
        const copy = (data.pageCopy as PageCopyData) || {}
        setWorksDesignDesc(copy.worksDesignDesc ?? defaultPageCopy.worksDesignDesc ?? "")
        setWorksDevDesc(copy.worksDevDesc ?? defaultPageCopy.worksDevDesc ?? "")
        setBlogDesc(copy.blogDesc ?? defaultPageCopy.blogDesc ?? "")
        setTutorialsDesc(copy.tutorialsDesc ?? defaultPageCopy.tutorialsDesc ?? "")
        setAboutDesc(copy.aboutDesc ?? defaultPageCopy.aboutDesc ?? "")
        setHeroGreeting(copy.heroGreeting ?? defaultPageCopy.heroGreeting ?? "")
        setHeroPrefix(copy.heroPrefix ?? defaultPageCopy.heroPrefix ?? "")
        setHeroDesc(copy.heroDesc ?? defaultPageCopy.heroDesc ?? "")
        setSiteDescription(copy.siteDescription ?? defaultPageCopy.siteDescription ?? "")
        setAboutWorkTitle(copy.aboutWorkTitle ?? defaultPageCopy.aboutWorkTitle ?? "")
        setAboutEducationTitle(copy.aboutEducationTitle ?? defaultPageCopy.aboutEducationTitle ?? "")
        setAboutSkillsTitle(copy.aboutSkillsTitle ?? defaultPageCopy.aboutSkillsTitle ?? "")
        const ft = data.footer as FooterConfig | undefined
        if (ft && typeof ft === "object") {
          setFooterCopyrightText(ft.copyrightText ?? defaultFooter.copyrightText ?? "")
          setFooterVersion(ft.version ?? defaultFooter.version ?? "")
        }
        const theme = data.theme as ThemeConfig | undefined
        if (theme && typeof theme === "object") {
          setThemeBase(theme.base ?? DEFAULT_THEME.base)
          setThemeAccent(theme.accent ?? DEFAULT_THEME.accent)
        }
      })
      .catch(() => toast.error("加载设置失败"))
      .finally(() => setLoading(false))
  }, [])

  async function saveGeneral() {
    setSavingGeneral(true)
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          siteName: siteName.trim() || defaultSiteName,
          socialLinks: {
            wechat: wechat.trim() || undefined,
            xiaohongshu: xiaohongshu.trim() || undefined,
            officialAccount: officialAccount.trim() || undefined,
            bilibili: bilibili.trim() || undefined,
            figma: figma.trim() || undefined,
            youshe: youshe.trim() || undefined,
            x: x.trim() || undefined,
            github: github.trim() || undefined,
            email: email.trim() || undefined,
          },
          footer: {
            copyrightText: footerCopyrightText.trim() || undefined,
            version: footerVersion.trim() || undefined,
          },
          pageCopy: {
            siteDescription: siteDescription.trim() || undefined,
          },
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        const detail = (data.detail as string) || (data.error as string) || "保存失败"
        toast.error(detail)
        return
      }
      toast.success("已保存")
    } finally {
      setSavingGeneral(false)
    }
  }

  async function saveNavAndPage() {
    setSavingNavPage(true)
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          nav: {
            worksDesign: navWorksDesign.trim() || (defaultNav.worksDesign ?? ""),
            worksDev: navWorksDev.trim() || (defaultNav.worksDev ?? ""),
            blog: navBlog.trim() || (defaultNav.blog ?? ""),
            about: navAbout.trim() || (defaultNav.about ?? ""),
            tutorials: navTutorials.trim() || (defaultNav.tutorials ?? ""),
          },
          pageCopy: {
            worksDesignDesc: worksDesignDesc.trim() || undefined,
            worksDevDesc: worksDevDesc.trim() || undefined,
            blogDesc: blogDesc.trim() || undefined,
            tutorialsDesc: tutorialsDesc.trim() || undefined,
            aboutDesc: aboutDesc.trim() || undefined,
            heroGreeting: heroGreeting.trim() || undefined,
            heroPrefix: heroPrefix.trim() ? heroPrefix : undefined,
            heroDesc: heroDesc.trim() || undefined,
            aboutWorkTitle: aboutWorkTitle.trim() || undefined,
            aboutEducationTitle: aboutEducationTitle.trim() || undefined,
            aboutSkillsTitle: aboutSkillsTitle.trim() || undefined,
          },
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        const detail = (data.detail as string) || (data.error as string) || "保存失败"
        toast.error(detail)
        return
      }
      toast.success("已保存")
    } finally {
      setSavingNavPage(false)
    }
  }

  async function saveProfile() {
    setSavingProfile(true)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        signal: controller.signal,
        body: JSON.stringify({
          avatar: avatar.trim() || null,
          about: {
            intro: aboutIntro.trim() || undefined,
            profileCard: {
              studioName: aboutStudioName.trim() || undefined,
              personalName: aboutPersonalName.trim() || undefined,
              personalTitle: aboutPersonalTitle.trim() || undefined,
            },
            workExperience: workExperience.filter(
              (item) =>
                [item.company, item.role, item.period, item.description].some((v) => v?.trim())
            ),
            education: education.filter((item) =>
              [item.school, item.degree, item.period].some((v) => v?.trim())
            ),
            skills: aboutSkills.filter((item) => (item.name ?? "").trim()),
          },
        }),
      })
      clearTimeout(timeoutId)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        const detail = (data.detail as string) || (data.error as string) || "保存失败"
        toast.error(detail)
        return
      }
      toast.success("已保存")
    } catch (err) {
      clearTimeout(timeoutId)
      const isAbort = err instanceof Error && err.name === "AbortError"
      const msg = err instanceof Error ? err.message : "网络错误或请求失败"
      toast.error(
        isAbort
          ? "请求超时，请检查网络或稍后重试；若使用本地上传头像，可改为填写图片链接或换小图"
          : msg.includes("body") || msg.includes("payload")
            ? "请求体过大，请使用图片链接代替本地上传，或换一张更小的图片"
            : msg,
      )
    } finally {
      setSavingProfile(false)
    }
  }

  async function saveTheme() {
    setSavingTheme(true)
    try {
      const themePayload: ThemeConfig = { base: themeBase, accent: themeAccent }
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ theme: themePayload }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error((data.detail as string) || (data.error as string) || "保存失败")
        return
      }
      setThemeConfig(themePayload)
      toast.success("主题已保存，刷新前台即可看到效果")
    } finally {
      setSavingTheme(false)
    }
  }

  /** 实时预览：更改主题选项后立即更新 Provider */
  function handleThemeBaseChange(id: BaseColorId) {
    setThemeBase(id)
    setThemeConfig({ base: id, accent: themeAccent })
  }

  function handleThemeAccentChange(id: AccentColorId) {
    setThemeAccent(id)
    setThemeConfig({ base: themeBase, accent: id })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        加载中…
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">
          网站设置
        </h1>
        <p className="text-muted-foreground mt-1">
          管理你的网站配置，前台页面将显示这里的内容
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">基本设置</TabsTrigger>
          <TabsTrigger value="navpage">导航与页面</TabsTrigger>
          <TabsTrigger value="profile">关于我 / 头像</TabsTrigger>
          <TabsTrigger value="theme">外观主题</TabsTrigger>
          <TabsTrigger value="security">账户安全</TabsTrigger>
        </TabsList>

        {/* ==================== 基本设置 ==================== */}
        <TabsContent value="general" className="space-y-6">
          <Card className="rounded-2xl border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>网站信息</CardTitle>
              <CardDescription>网站名称会用于首页、导航、关于页等</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="siteName">网站名称</Label>
                <Input
                  id="siteName"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="siteDescription">网站描述</Label>
                <Input
                  id="siteDescription"
                  placeholder={defaultPageCopy.siteDescription}
                  value={siteDescription}
                  onChange={(e) => setSiteDescription(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  用于浏览器标签页和搜索引擎展示
                </p>
              </div>

              <Separator />

              <p className="text-sm font-semibold text-foreground">页脚版权信息</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="footerCopyrightText">版权文字</Label>
                  <Input
                    id="footerCopyrightText"
                    placeholder={defaultFooter.copyrightText}
                    value={footerCopyrightText}
                    onChange={(e) => setFooterCopyrightText(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    显示为 © {new Date().getFullYear()} {footerCopyrightText || defaultFooter.copyrightText}，年份由系统自动生成
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="footerVersion">版本号</Label>
                  <Input
                    id="footerVersion"
                    placeholder={defaultFooter.version}
                    value={footerVersion}
                    onChange={(e) => setFooterVersion(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    显示为 v{footerVersion || defaultFooter.version}
                  </p>
                </div>
              </div>

              <Button onClick={saveGeneral} disabled={savingGeneral}>
                {savingGeneral ? "保存中…" : "保存"}
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>社交链接</CardTitle>
              <CardDescription>将显示在页脚或关于页</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {SOCIAL_LINK_ENTRIES.map(({ key, label, type }) => {
                  const socialValues: Partial<Record<keyof SocialLinks, string>> = {
                    wechat,
                    xiaohongshu,
                    officialAccount,
                    bilibili,
                    figma,
                    youshe,
                    x,
                    github,
                    email,
                  }
                  const socialSetters: Partial<Record<keyof SocialLinks, (v: string) => void>> = {
                    wechat: setWechat,
                    xiaohongshu: setXiaohongshu,
                    officialAccount: setOfficialAccount,
                    bilibili: setBilibili,
                    figma: setFigma,
                    youshe: setYoushe,
                    x: setX,
                    github: setGithub,
                    email: setEmail,
                  }
                  const currentVal = socialValues[key] ?? ""
                  const setter = socialSetters[key]
                  const isEmail = key === "email"
                  const isText = type === "text" && !isEmail
                  const showQrPreview = isText && isImageUrl(currentVal)

                  return (
                    <div key={key} className="space-y-2">
                      <Label htmlFor={key}>{label}</Label>
                      {isEmail ? (
                        <Input
                          id={key}
                          type="email"
                          placeholder="example@email.com"
                          value={currentVal}
                          onChange={(e) => setter?.(e.target.value)}
                        />
                      ) : isText ? (
                        <>
                          {showQrPreview ? (
                            <div className="flex items-center gap-3">
                              <img
                                src={currentVal}
                                alt={`${label}二维码`}
                                className="h-24 w-24 rounded-lg border border-border object-contain"
                              />
                              <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">已上传{label}二维码</p>
                                <div className="flex gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="text-xs"
                                    onClick={() => {
                                      const input = document.createElement("input")
                                      input.type = "file"
                                      input.accept = "image/*"
                                      input.onchange = () => {
                                        const file = input.files?.[0]
                                        if (!file || !file.type.startsWith("image/")) return
                                        compressImageToDataUrl(file)
                                          .then((dataUrl) => setter?.(dataUrl))
                                          .catch(() => toast.error("图片压缩失败"))
                                      }
                                      input.click()
                                    }}
                                  >
                                    <i className="ri-refresh-line mr-1" /> 更换
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs text-destructive hover:text-destructive"
                                    onClick={() => setter?.("")}
                                  >
                                    <i className="ri-delete-bin-line mr-1" /> 移除
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2">
                                <Input
                                  id={key}
                                  placeholder={`${label}号 / 名称`}
                                  value={currentVal}
                                  onChange={(e) => setter?.(e.target.value)}
                                  className="flex-1"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="shrink-0"
                                  onClick={() => {
                                    const input = document.createElement("input")
                                    input.type = "file"
                                    input.accept = "image/*"
                                    input.onchange = () => {
                                      const file = input.files?.[0]
                                      if (!file || !file.type.startsWith("image/")) return
                                      compressImageToDataUrl(file)
                                        .then((dataUrl) => setter?.(dataUrl))
                                        .catch(() => toast.error("图片压缩失败"))
                                    }
                                    input.click()
                                  }}
                                >
                                  <i className="ri-qr-code-line mr-1" /> 上传二维码
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                填写{label}号/名称，或上传二维码图片
                              </p>
                            </>
                          )}
                        </>
                      ) : (
                        <Input
                          id={key}
                          placeholder="https://..."
                          value={currentVal}
                          onChange={(e) => setter?.(e.target.value)}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
              <Button onClick={saveGeneral} disabled={savingGeneral}>
                {savingGeneral ? "保存中…" : "保存"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== 导航与页面（按页面分组） ==================== */}
        <TabsContent value="navpage" className="space-y-6">
          <Card className="rounded-2xl border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>导航与页面文案</CardTitle>
              <CardDescription>
                按页面分组设置导航名称和页面介绍文案，一次保存全部生效
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 首页 */}
              <div className="space-y-4">
                <p className="text-sm font-semibold text-foreground">首页</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="heroGreeting">Hero 第一行（如 Hello,）</Label>
                    <Input
                      id="heroGreeting"
                      placeholder="Hello,"
                      value={heroGreeting}
                      onChange={(e) => setHeroGreeting(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="heroPrefix">Hero 第二行前缀（如 I&apos;m）</Label>
                    <Input
                      id="heroPrefix"
                      placeholder="I'm "
                      value={heroPrefix}
                      onChange={(e) => setHeroPrefix(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="heroDesc">Hero 介绍（下方长文案）</Label>
                  <Textarea
                    id="heroDesc"
                    placeholder="UI/UX Designer & Developer — crafting digital experiences with care."
                    className="min-h-[80px]"
                    value={heroDesc}
                    onChange={(e) => setHeroDesc(e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              {/* 设计作品 */}
              <div className="space-y-4">
                <p className="text-sm font-semibold text-foreground">设计作品</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="navWorksDesign">导航名称</Label>
                    <Input id="navWorksDesign" value={navWorksDesign} onChange={(e) => setNavWorksDesign(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="worksDesignDesc">页面介绍</Label>
                    <Input
                      id="worksDesignDesc"
                      placeholder="精选设计作品，部分支持购买下载源文件"
                      value={worksDesignDesc}
                      onChange={(e) => setWorksDesignDesc(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* 开发作品 */}
              <div className="space-y-4">
                <p className="text-sm font-semibold text-foreground">开发作品</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="navWorksDev">导航名称</Label>
                    <Input id="navWorksDev" value={navWorksDev} onChange={(e) => setNavWorksDev(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="worksDevDesc">页面介绍</Label>
                    <Input
                      id="worksDevDesc"
                      placeholder="开源项目与开发作品展示"
                      value={worksDevDesc}
                      onChange={(e) => setWorksDevDesc(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* 文章/笔记 */}
              <div className="space-y-4">
                <p className="text-sm font-semibold text-foreground">文章 / 笔记</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="navBlog">导航名称</Label>
                    <Input id="navBlog" value={navBlog} onChange={(e) => setNavBlog(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="blogDesc">页面介绍</Label>
                    <Input
                      id="blogDesc"
                      placeholder="分享设计思考、工具技巧与行业见解"
                      value={blogDesc}
                      onChange={(e) => setBlogDesc(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* 视频教程 */}
              <div className="space-y-4">
                <p className="text-sm font-semibold text-foreground">视频教程</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="navTutorials">导航名称</Label>
                    <Input id="navTutorials" value={navTutorials} onChange={(e) => setNavTutorials(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tutorialsDesc">页面介绍</Label>
                    <Input
                      id="tutorialsDesc"
                      placeholder="视频类教材合集，包含 B 站、YouTube 等"
                      value={tutorialsDesc}
                      onChange={(e) => setTutorialsDesc(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* 关于 */}
              <div className="space-y-4">
                <p className="text-sm font-semibold text-foreground">关于</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="navAbout">导航名称</Label>
                    <Input id="navAbout" value={navAbout} onChange={(e) => setNavAbout(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="aboutDesc">页面介绍（可选副标题）</Label>
                    <Input
                      id="aboutDesc"
                      placeholder="留空则不显示"
                      value={aboutDesc}
                      onChange={(e) => setAboutDesc(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="aboutWorkTitle">工作经历标题</Label>
                    <Input
                      id="aboutWorkTitle"
                      placeholder={defaultPageCopy.aboutWorkTitle}
                      value={aboutWorkTitle}
                      onChange={(e) => setAboutWorkTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="aboutEducationTitle">学习经历标题</Label>
                    <Input
                      id="aboutEducationTitle"
                      placeholder={defaultPageCopy.aboutEducationTitle}
                      value={aboutEducationTitle}
                      onChange={(e) => setAboutEducationTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="aboutSkillsTitle">技能标题</Label>
                    <Input
                      id="aboutSkillsTitle"
                      placeholder={defaultPageCopy.aboutSkillsTitle}
                      value={aboutSkillsTitle}
                      onChange={(e) => setAboutSkillsTitle(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <Button onClick={saveNavAndPage} disabled={savingNavPage}>
                {savingNavPage ? "保存中…" : "保存"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== 外观主题 ==================== */}
        <TabsContent value="theme" className="space-y-6">
          <Card className="rounded-2xl border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>基底灰度</CardTitle>
              <CardDescription>
                选择整体灰度基调，影响背景、卡片、边框等中性色
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-3">
                {BASE_PRESETS.map((preset) => {
                  const isActive = preset.id === themeBase
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleThemeBaseChange(preset.id as BaseColorId)}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all",
                        isActive
                          ? "border-primary bg-accent shadow-sm"
                          : "border-border/50 hover:border-border hover:bg-accent/50",
                      )}
                    >
                      <div className="flex gap-1">
                        <div
                          className="h-6 w-6 rounded-full border border-border/50"
                          style={{ background: preset.light["--background"] }}
                        />
                        <div
                          className="h-6 w-6 rounded-full border border-border/50"
                          style={{ background: preset.dark["--background"] }}
                        />
                      </div>
                      <span className="text-xs font-medium">{preset.name}</span>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>强调色</CardTitle>
              <CardDescription>
                选择强调色主题，影响按钮、链接、装饰渐变等
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                {ACCENT_PRESETS.map((preset) => {
                  const isActive = preset.id === themeAccent
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleThemeAccentChange(preset.id as AccentColorId)}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all",
                        isActive
                          ? "border-primary bg-accent shadow-sm"
                          : "border-border/50 hover:border-border hover:bg-accent/50",
                      )}
                    >
                      {preset.id === "fanmihua" ? (
                        <div
                          className="h-8 w-8 rounded-full border border-border/50"
                          style={{
                            background: `linear-gradient(135deg, ${preset.gradient.join(", ")})`,
                          }}
                        />
                      ) : (
                        <div
                          className="h-8 w-8 rounded-full border border-border/50"
                          style={{ background: preset.preview }}
                        />
                      )}
                      <span className="text-xs font-medium">{preset.name}</span>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>预览</CardTitle>
              <CardDescription>当前主题效果实时预览</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div
                    className="h-3 flex-1 rounded-full"
                    style={{ background: "var(--pride-gradient-h)" }}
                  />
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <div
                      key={i}
                      className="h-8 w-8 rounded-lg border border-border/30"
                      style={{ background: `var(--color-pride-${i})` }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <Button size="sm">主按钮</Button>
                  <Button size="sm" variant="secondary">次要按钮</Button>
                  <Button size="sm" variant="outline">边框按钮</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button onClick={saveTheme} disabled={savingTheme}>
            {savingTheme ? "保存中…" : "保存主题"}
          </Button>
        </TabsContent>

        {/* ==================== 关于我 / 头像 ==================== */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="rounded-2xl border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>头像</CardTitle>
              <CardDescription>用于关于页、首页 Hero 区域展示</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {avatar ? (
                <div className="flex items-center gap-4">
                  <img
                    src={avatar}
                    alt="头像预览"
                    className="h-20 w-20 rounded-full object-cover border"
                  />
                  <div className="flex flex-col gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => avatarFileInputRef.current?.click()}
                    >
                      更换
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setAvatar("")}
                    >
                      移除
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => avatarFileInputRef.current?.click()}
                  >
                    <i className="ri-user-line mr-1.5" />
                    上传头像
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    上传后自动压缩为 512px 以内、JPEG 格式保存。
                  </p>
                </div>
              )}
              <input
                ref={avatarFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file || !file.type.startsWith("image/")) return
                  e.target.value = ""
                  compressImageToDataUrl(file)
                    .then(setAvatar)
                    .catch(() => toast.error("图片压缩失败，请换一张图"))
                }}
              />
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>关于页左侧信息</CardTitle>
              <CardDescription>头像下方的主标题与两个标签，用于关于页左侧栏</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="aboutStudioName">品牌 / 工作室名</Label>
                <Input
                  id="aboutStudioName"
                  placeholder="如 Fan's Studio，留空则使用「基本设置」中的网站名称"
                  value={aboutStudioName}
                  onChange={(e) => setAboutStudioName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="aboutPersonalName">个人名称（标签）</Label>
                <Input
                  id="aboutPersonalName"
                  placeholder="如 张三"
                  value={aboutPersonalName}
                  onChange={(e) => setAboutPersonalName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="aboutPersonalTitle">个人职位（标签）</Label>
                <Input
                  id="aboutPersonalTitle"
                  placeholder="如 UI/UX Designer"
                  value={aboutPersonalTitle}
                  onChange={(e) => setAboutPersonalTitle(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>关于我</CardTitle>
              <CardDescription>分模块填写，将显示在前台「关于」页面</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>个人介绍</Label>
                <MiniEditor
                  value={aboutIntro}
                  onChange={setAboutIntro}
                  placeholder="介绍你自己、设计理念、联系方式等..."
                  minHeight="min-h-[140px]"
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <Label>工作经历</Label>
                {workExperience.map((item, index) => (
                  <div
                    key={index}
                    className="grid gap-2 rounded-lg border border-border/50 p-4 sm:grid-cols-2"
                  >
                    <Input
                      placeholder="公司 / 组织"
                      value={item.company ?? ""}
                      onChange={(e) => {
                        const next = [...workExperience]
                        next[index] = { ...next[index], company: e.target.value }
                        setWorkExperience(next)
                      }}
                    />
                    <Input
                      placeholder="职位"
                      value={item.role ?? ""}
                      onChange={(e) => {
                        const next = [...workExperience]
                        next[index] = { ...next[index], role: e.target.value }
                        setWorkExperience(next)
                      }}
                    />
                    <Input
                      placeholder="时间段，如 2020 - 至今"
                      value={item.period ?? ""}
                      onChange={(e) => {
                        const next = [...workExperience]
                        next[index] = { ...next[index], period: e.target.value }
                        setWorkExperience(next)
                      }}
                    />
                    <div className="sm:col-span-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground">工作描述（可选）</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                          onClick={() =>
                            setWorkExperience(workExperience.filter((_, i) => i !== index))
                          }
                        >
                          <i className="ri-delete-bin-line mr-1" /> 删除
                        </Button>
                      </div>
                      <MiniEditor
                        value={item.description ?? ""}
                        onChange={(html) => {
                          const next = [...workExperience]
                          next[index] = { ...next[index], description: html }
                          setWorkExperience(next)
                        }}
                        placeholder="描述你的工作职责、成果..."
                        minHeight="min-h-[80px]"
                      />
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setWorkExperience([...workExperience, { company: "", role: "", period: "", description: "" }])
                  }
                >
                  <i className="ri-add-line mr-1" /> 添加工作经历
                </Button>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label>学习经历</Label>
                {education.map((item, index) => (
                  <div
                    key={index}
                    className="flex flex-wrap items-center gap-2 rounded-lg border border-border/50 p-4"
                  >
                    <Input
                      placeholder="学校"
                      value={item.school ?? ""}
                      onChange={(e) => {
                        const next = [...education]
                        next[index] = { ...next[index], school: e.target.value }
                        setEducation(next)
                      }}
                      className="w-full sm:w-48"
                    />
                    <Input
                      placeholder="学历 / 专业"
                      value={item.degree ?? ""}
                      onChange={(e) => {
                        const next = [...education]
                        next[index] = { ...next[index], degree: e.target.value }
                        setEducation(next)
                      }}
                      className="w-full sm:w-40"
                    />
                    <Input
                      placeholder="时间段"
                      value={item.period ?? ""}
                      onChange={(e) => {
                        const next = [...education]
                        next[index] = { ...next[index], period: e.target.value }
                        setEducation(next)
                      }}
                      className="w-full sm:w-32"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-destructive hover:text-destructive"
                      onClick={() => setEducation(education.filter((_, i) => i !== index))}
                    >
                      <i className="ri-delete-bin-line" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setEducation([...education, { school: "", degree: "", period: "" }])
                  }
                >
                  <i className="ri-add-line mr-1" /> 添加学习经历
                </Button>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label>技能</Label>
                {aboutSkills.map((item, index) => (
                  <div
                    key={index}
                    className="flex flex-wrap items-center gap-2 rounded-lg border border-border/50 p-3"
                  >
                    <Input
                      placeholder="技能名称"
                      value={item.name ?? ""}
                      onChange={(e) => {
                        const next = [...aboutSkills]
                        next[index] = { ...next[index], name: e.target.value }
                        setAboutSkills(next)
                      }}
                      className="w-full sm:w-40"
                    />
                    <Input
                      placeholder="熟练度（可选）"
                      value={item.level ?? ""}
                      onChange={(e) => {
                        const next = [...aboutSkills]
                        next[index] = { ...next[index], level: e.target.value }
                        setAboutSkills(next)
                      }}
                      className="w-full sm:w-28"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-destructive hover:text-destructive"
                      onClick={() => setAboutSkills(aboutSkills.filter((_, i) => i !== index))}
                    >
                      <i className="ri-delete-bin-line" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAboutSkills([...aboutSkills, { name: "", level: "" }])}
                >
                  <i className="ri-add-line mr-1" /> 添加技能
                </Button>
              </div>

              <Button onClick={saveProfile} disabled={savingProfile}>
                {savingProfile ? "保存中…" : "保存"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== 账户安全 ==================== */}
        <TabsContent value="security" className="space-y-6">
          <ChangePasswordCard />
        </TabsContent>
      </Tabs>
    </div>
  )
}

/** 密码输入框（带显示/隐藏切换眼睛按钮）。 */
function PasswordInput(props: React.ComponentProps<typeof Input> & { value: string }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <Input {...props} type={visible ? "text" : "password"} className="pr-10" />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible(!visible)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <i className={visible ? "ri-eye-off-line" : "ri-eye-line"} />
      </button>
    </div>
  )
}

/** 修改密码卡片组件。 */
function ChangePasswordCard() {
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [saving, setSaving] = useState(false)

  async function handleChangePassword() {
    if (!oldPassword.trim()) {
      toast.error("请输入当前密码")
      return
    }
    if (newPassword.length < 6) {
      toast.error("新密码至少 6 位")
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error("两次输入的新密码不一致")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/user/change-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "修改失败")
        return
      }
      toast.success("密码修改成功")
      setOldPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch {
      toast.error("网络错误")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="rounded-2xl border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>修改密码</CardTitle>
        <CardDescription>修改当前登录账户的密码</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 max-w-md">
        <div className="space-y-2">
          <Label>当前密码</Label>
          <PasswordInput
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            placeholder="请输入当前密码"
          />
        </div>
        <Separator />
        <div className="space-y-2">
          <Label>新密码</Label>
          <PasswordInput
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="至少 6 位"
          />
          <p className="text-xs text-muted-foreground">密码长度至少 6 位，建议包含字母和数字</p>
        </div>
        <div className="space-y-2">
          <Label>确认新密码</Label>
          <PasswordInput
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="再次输入新密码"
            onKeyDown={(e) => { if (e.key === "Enter") handleChangePassword() }}
          />
        </div>
        <Button onClick={handleChangePassword} disabled={saving}>
          {saving ? "保存中…" : "修改密码"}
        </Button>
      </CardContent>
    </Card>
  )
}
