/** 各页页头介绍与首页 Hero 文案，与后台「网站设置」、前台共用默认值。 */
export type PageCopy = {
  worksDesignDesc?: string
  worksDevDesc?: string
  blogDesc?: string
  tutorialsDesc?: string
  aboutDesc?: string
  toolsDesc?: string
  knowledgeBaseDesc?: string
  heroGreeting?: string
  heroPrefix?: string
  heroDesc?: string
  siteDescription?: string
  aboutWorkTitle?: string
  aboutEducationTitle?: string
  aboutSkillsTitle?: string
  coverRatioWorksDesign?: string
  coverRatioWorksDev?: string
  coverRatioBlog?: string
  coverRatioTutorials?: string
  coverRatioKnowledgeBase?: string
}

export const defaultPageCopy: PageCopy = {
  worksDesignDesc: "精选设计作品，部分支持赞助下载源文件",
  worksDevDesc: "开源项目与开发作品展示",
  blogDesc: "分享设计思考、工具技巧与行业见解",
  tutorialsDesc: "视频类教材合集，包含 B 站、YouTube 等",
  aboutDesc: "",
  toolsDesc: "实用工具导航，分类整理各类在线工具",
  knowledgeBaseDesc: "分享专业知识，帮助你快速成长",
  heroGreeting: "Hey,",
  heroPrefix: "You're in ",
  heroDesc: "Welcome to my world.",
  siteDescription: "UI/UX 设计师，专注于用户体验与视觉设计。",
  aboutWorkTitle: "工作经历",
  aboutEducationTitle: "学习经历",
  aboutSkillsTitle: "技能",
  coverRatioWorksDesign: "4:3",
  coverRatioWorksDev: "4:3",
  coverRatioBlog: "4:3",
  coverRatioTutorials: "4:3",
  coverRatioKnowledgeBase: "4:3",
}

/** 默认网站描述（SEO meta description） */
export const defaultSiteDescription = defaultPageCopy.siteDescription!

/** 网站名称默认值（API、后台、前台 fallback 共用） */
export const defaultSiteName = "Fan's Studio"

/** 个人信息展示默认值（Hero、关于页、作者 fallback 共用） */
export const defaultPersonalName = "范米花儿"

/** 站点名归一化：空或无效时返回默认站点名 */
export function normalizeSiteName(s: string | null | undefined): string {
  const t = s?.trim()
  if (!t || t === "Fan's Portfolio") return defaultSiteName
  return t
}
