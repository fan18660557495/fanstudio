"use client"
/** BlockNote 富文本格式化工具栏：加粗/斜体/标题/颜色等，与编辑器状态同步。 */
import type { CSSProperties } from "react"
import { useCallback, useEffect, useState } from "react"
import type { BlockNoteEditor } from "@blocknote/core"
import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"

const BLOCKNOTE_COLORS = [
  "default", "gray", "brown", "red", "orange",
  "yellow", "green", "blue", "purple", "pink",
] as const

type BNColor = (typeof BLOCKNOTE_COLORS)[number]

/** 颜色 → CSS 值映射（与 BlockNote 内置保持一致） */
const COLOR_MAP: Record<BNColor, { text: string; bg: string }> = {
  default:  { text: "var(--bn-colors-default-text)",       bg: "var(--bn-colors-default-background)" },
  gray:     { text: "#9b9a97",  bg: "#ebeced" },
  brown:    { text: "#64473a",  bg: "#e9e5e3" },
  red:      { text: "#e03e3e",  bg: "#fbe4e4" },
  orange:   { text: "#d9730d",  bg: "#faebdd" },
  yellow:   { text: "#dfab01",  bg: "#fbf3db" },
  green:    { text: "#4d6461",  bg: "#ddedea" },
  blue:     { text: "#0b6e99",  bg: "#ddebf1" },
  purple:   { text: "#6940a5",  bg: "#eae4f2" },
  pink:     { text: "#ad1a72",  bg: "#f4dfeb" },
}

interface ToolbarState {
  bold: boolean
  italic: boolean
  underline: boolean
  strike: boolean
  code: boolean
  blockType: string
  headingLevel: number
  textAlignment: string
  textColor: string
  backgroundColor: string
}

const INITIAL_STATE: ToolbarState = {
  bold: false,
  italic: false,
  underline: false,
  strike: false,
  code: false,
  blockType: "paragraph",
  headingLevel: 0,
  textAlignment: "left",
  textColor: "default",
  backgroundColor: "default",
}

/* ---------- 渲染辅助组件 ---------- */

const ToolbarBtn = ({
  icon,
  title,
  active,
  onClick,
  className: extraCls,
}: {
  icon: string
  title: string
  active?: boolean
  onClick: () => void
  className?: string
}) => (
  <button
    type="button"
    title={title}
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    className={cn(
      "flex items-center justify-center h-7 w-7 rounded text-sm transition-colors",
      active
        ? "bg-accent text-foreground"
        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
      extraCls,
    )}
  >
    <i className={icon} />
  </button>
)

const ToolbarSep = () => <div className="w-px h-4 bg-border/50 mx-0.5 shrink-0" />

const ToolbarColorGrid = ({
  label,
  activeColor,
  onSelect,
  mode,
}: {
  label: string
  activeColor: string
  onSelect: (c: string) => void
  mode: "text" | "bg"
}) => (
  <div>
    <p className="text-xs text-muted-foreground mb-1.5">{label}</p>
    <div className="grid grid-cols-5 gap-0.5">
      {BLOCKNOTE_COLORS.map((c) => {
        const isDefault = c === "default"
        const colorStyle: CSSProperties =
          mode === "text"
            ? { color: isDefault ? "var(--foreground)" : COLOR_MAP[c].text }
            : {
                color: "var(--foreground)",
                backgroundColor: isDefault ? undefined : COLOR_MAP[c].bg,
              }
        return (
          <button
            key={c}
            type="button"
            title={c}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onSelect(c)}
            className={cn(
              "w-9 h-9 rounded-md text-base font-medium flex items-center justify-center transition-all",
              activeColor === c
                ? "bg-accent outline-2 outline-primary -outline-offset-2"
                : "hover:bg-accent/50",
            )}
            style={colorStyle}
          >
            A
          </button>
        )
      })}
    </div>
  </div>
)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function StaticFormattingToolbar({ editor }: { editor: BlockNoteEditor<any, any, any> }) {
  const [state, setState] = useState<ToolbarState>(INITIAL_STATE)
  const [linkUrl, setLinkUrl] = useState("")
  const [showLinkInput, setShowLinkInput] = useState(false)

  const syncState = useCallback(() => {
    try {
      const styles = editor.getActiveStyles()
      const cursor = editor.getTextCursorPosition()
      const block = cursor.block

      setState({
        bold: !!styles.bold,
        italic: !!styles.italic,
        underline: !!styles.underline,
        strike: !!styles.strike,
        code: !!styles.code,
        blockType: block.type,
        headingLevel:
          block.type === "heading"
            ? ((block.props as Record<string, unknown>).level as number) ?? 0
            : 0,
        textAlignment:
          ((block.props as Record<string, unknown>).textAlignment as string) ?? "left",
        textColor: (styles.textColor as string) ?? "default",
        backgroundColor: (styles.backgroundColor as string) ?? "default",
      })
    } catch {
      /* editor 可能尚未挂载 */
    }
  }, [editor])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    syncState()
    const unsubSel = editor.onSelectionChange(syncState)
    const unsubChange = editor.onChange(syncState)
    return () => {
      unsubSel()
      unsubChange()
    }
  }, [editor, syncState])

  /* ---------- 操作函数 ---------- */

  const toggleStyle = useCallback(
    (style: string) => {
      editor.focus()
      editor.toggleStyles({ [style]: true })
    },
    [editor],
  )

  const setBlockType = useCallback(
    (type: string, props?: Record<string, unknown>) => {
      editor.focus()
      const block = editor.getTextCursorPosition().block
      editor.updateBlock(block, { type: type as never, props: props as never })
    },
    [editor],
  )

  const setAlignment = useCallback(
    (alignment: string) => {
      editor.focus()
      const block = editor.getTextCursorPosition().block
      editor.updateBlock(block, {
        props: { textAlignment: alignment } as never,
      })
    },
    [editor],
  )

  const applyTextColor = useCallback(
    (color: string) => {
      editor.focus()
      if (color === "default") {
        editor.removeStyles({ textColor: "" as never })
      } else {
        editor.addStyles({ textColor: color as never })
      }
    },
    [editor],
  )

  const applyBgColor = useCallback(
    (color: string) => {
      editor.focus()
      if (color === "default") {
        editor.removeStyles({ backgroundColor: "" as never })
      } else {
        editor.addStyles({ backgroundColor: color as never })
      }
    },
    [editor],
  )

  const applyLink = useCallback(() => {
    if (!linkUrl.trim()) return
    editor.focus()
    editor.createLink(linkUrl.trim())
    setLinkUrl("")
    setShowLinkInput(false)
  }, [editor, linkUrl])

  /* ---------- 主渲染 ---------- */

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border/60 bg-muted/20 px-2 py-1">
      {/* 文字样式 */}
      <ToolbarBtn icon="ri-bold" title="加粗" active={state.bold} onClick={() => toggleStyle("bold")} />
      <ToolbarBtn icon="ri-italic" title="斜体" active={state.italic} onClick={() => toggleStyle("italic")} />
      <ToolbarBtn icon="ri-underline" title="下划线" active={state.underline} onClick={() => toggleStyle("underline")} />
      <ToolbarBtn icon="ri-strikethrough" title="删除线" active={state.strike} onClick={() => toggleStyle("strike")} />
      <ToolbarBtn icon="ri-code-line" title="行内代码" active={state.code} onClick={() => toggleStyle("code")} />

      <ToolbarSep />

      {/* 区块类型 */}
      <ToolbarBtn
        icon="ri-text"
        title="正文"
        active={state.blockType === "paragraph"}
        onClick={() => setBlockType("paragraph")}
      />
      <ToolbarBtn
        icon="ri-h-1"
        title="标题 1"
        active={state.blockType === "heading" && state.headingLevel === 1}
        onClick={() => setBlockType("heading", { level: 1 })}
      />
      <ToolbarBtn
        icon="ri-h-2"
        title="标题 2"
        active={state.blockType === "heading" && state.headingLevel === 2}
        onClick={() => setBlockType("heading", { level: 2 })}
      />
      <ToolbarBtn
        icon="ri-h-3"
        title="标题 3"
        active={state.blockType === "heading" && state.headingLevel === 3}
        onClick={() => setBlockType("heading", { level: 3 })}
      />

      <ToolbarSep />

      {/* 列表 */}
      <ToolbarBtn
        icon="ri-list-unordered"
        title="无序列表"
        active={state.blockType === "bulletListItem"}
        onClick={() => setBlockType("bulletListItem")}
      />
      <ToolbarBtn
        icon="ri-list-ordered"
        title="有序列表"
        active={state.blockType === "numberedListItem"}
        onClick={() => setBlockType("numberedListItem")}
      />
      <ToolbarBtn
        icon="ri-checkbox-line"
        title="待办列表"
        active={state.blockType === "checkListItem"}
        onClick={() => setBlockType("checkListItem")}
      />

      <ToolbarSep />

      {/* 对齐 */}
      <ToolbarBtn
        icon="ri-align-left"
        title="左对齐"
        active={state.textAlignment === "left"}
        onClick={() => setAlignment("left")}
      />
      <ToolbarBtn
        icon="ri-align-center"
        title="居中对齐"
        active={state.textAlignment === "center"}
        onClick={() => setAlignment("center")}
      />
      <ToolbarBtn
        icon="ri-align-right"
        title="右对齐"
        active={state.textAlignment === "right"}
        onClick={() => setAlignment("right")}
      />

      <ToolbarSep />

      {/* 链接 */}
      <Popover open={showLinkInput} onOpenChange={setShowLinkInput}>
        <PopoverTrigger asChild>
          <button
            type="button"
            title="插入链接"
            onMouseDown={(e) => e.preventDefault()}
            className={cn(
              "flex items-center justify-center h-7 w-7 rounded text-sm transition-colors",
              showLinkInput
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
            )}
          >
            <i className="ri-link" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-3" align="start">
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="https://..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyLink()}
              className="flex-1 h-8 rounded-md border border-input bg-background px-2 text-sm outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              type="button"
              onClick={applyLink}
              className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90"
            >
              确定
            </button>
          </div>
        </PopoverContent>
      </Popover>

      <ToolbarSep />

      {/* 颜色 */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            title="文字和背景颜色"
            onMouseDown={(e) => e.preventDefault()}
            className="flex items-center justify-center h-7 w-7 rounded text-sm transition-colors text-muted-foreground hover:bg-accent/50 hover:text-foreground"
          >
            <i className="ri-palette-line" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[220px] p-2 space-y-3" align="start">
          <ToolbarColorGrid
            label="文字颜色"
            activeColor={state.textColor}
            onSelect={applyTextColor}
            mode="text"
          />
          <ToolbarColorGrid
            label="背景颜色"
            activeColor={state.backgroundColor}
            onSelect={applyBgColor}
            mode="bg"
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
