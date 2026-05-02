import { useMemo, useState } from 'react'
import { Eye, EyeOff, Plus, Trash2 } from 'lucide-react'
import { MainShell } from '@/components/MainShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  NAV_REGISTRY,
  type NavKey,
} from '@/components/LeftNav'
import {
  useSettingsStore,
  type FilterField,
  type FilterMode,
  type FilterRule,
} from '@/stores/settings'

const FIELD_LABELS: Record<FilterField, string> = {
  tag: '标签',
  user: '用户',
  content: '内容',
}

const MODE_LABELS: Record<FilterMode, string> = {
  exact: '精准匹配',
  fuzzy: '模糊匹配',
  regex: '正则表达式',
}

const FIELD_HINT: Record<FilterField, string> = {
  tag: '匹配贴子中的 #话题# 名称（不要带 # 号）',
  user: '匹配作者的用户名或 UID',
  content: '匹配标题或正文文字',
}

export default function Settings() {
  // Tabs in this project are controlled-only (no `defaultValue` support);
  // wire up local state so children actually render.
  const [tab, setTab] = useState<'filters' | 'nav'>('filters')
  return (
    <MainShell>
      <div className="space-y-4">
        <header>
          <h1 className="text-xl font-semibold tracking-tight">设置</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            浏览器本地保存，不会上传到服务器。
          </p>
        </header>

        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as 'filters' | 'nav')}
          className="pt-2"
        >
          <TabsList>
            <TabsTrigger value="filters">内容过滤</TabsTrigger>
            <TabsTrigger value="nav">左侧菜单</TabsTrigger>
          </TabsList>
          <TabsContent value="filters">
            <FiltersPanel />
          </TabsContent>
          <TabsContent value="nav">
            <NavPanel />
          </TabsContent>
        </Tabs>
      </div>
    </MainShell>
  )
}

function FiltersPanel() {
  const filters = useSettingsStore((s) => s.filters)
  const addFilter = useSettingsStore((s) => s.addFilter)

  const [field, setField] = useState<FilterField>('tag')
  const [mode, setMode] = useState<FilterMode>('fuzzy')
  const [value, setValue] = useState('')
  const [regexError, setRegexError] = useState<string | null>(null)

  const onAdd = () => {
    const v = value.trim()
    if (!v) return
    if (mode === 'regex') {
      try {
        new RegExp(v, 'i')
      } catch (e) {
        setRegexError(e instanceof Error ? e.message : '正则格式不正确')
        return
      }
    }
    addFilter({ field, mode, value: v })
    setValue('')
    setRegexError(null)
  }

  return (
    <div className="space-y-4 pt-3">
      {/* Add form */}
      <div className="rounded-2xl bg-card p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.55)] dark:ring-1 dark:ring-white/[0.04]">
        <h2 className="text-sm font-semibold">新增过滤规则</h2>
        <p className="mt-1 text-xs text-muted-foreground">{FIELD_HINT[field]}</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-[120px_140px_1fr_auto]">
          <NativeSelect
            value={field}
            onChange={(v) => setField(v as FilterField)}
            options={[
              { value: 'tag', label: '标签' },
              { value: 'user', label: '用户' },
              { value: 'content', label: '内容' },
            ]}
            ariaLabel="过滤字段"
          />
          <NativeSelect
            value={mode}
            onChange={(v) => {
              setMode(v as FilterMode)
              setRegexError(null)
            }}
            options={[
              { value: 'exact', label: '精准匹配' },
              { value: 'fuzzy', label: '模糊匹配' },
              { value: 'regex', label: '正则表达式' },
            ]}
            ariaLabel="匹配方式"
          />
          <Input
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              if (regexError) setRegexError(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onAdd()
            }}
            placeholder={
              mode === 'regex'
                ? '例如  ^广告|赞助'
                : field === 'tag'
                  ? '例如  小米15'
                  : field === 'user'
                    ? '例如  酷安小编 或 1234567'
                    : '例如  限免'
            }
            aria-label="过滤值"
            aria-invalid={!!regexError}
          />
          <Button onClick={onAdd} disabled={!value.trim()}>
            <Plus className="mr-1 h-4 w-4" />
            添加
          </Button>
        </div>
        {regexError && (
          <p className="mt-2 text-xs text-destructive">
            正则编译失败：{regexError}
          </p>
        )}
      </div>

      {/* Existing rules */}
      <div className="rounded-2xl bg-card p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.55)] dark:ring-1 dark:ring-white/[0.04]">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold">
            已生效规则
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              {filters.length} 条
            </span>
          </h2>
          {filters.length > 0 && <ClearAllButton />}
        </div>
        {filters.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            还没有规则。命中规则的贴子将不会出现在首页 / 话题 /
            用户主页 / 搜索结果里。
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {filters.map((rule) => (
              <RuleRow key={rule.id} rule={rule} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function ClearAllButton() {
  const clearFilters = useSettingsStore((s) => s.clearFilters)
  const [confirming, setConfirming] = useState(false)
  if (!confirming) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="text-xs text-muted-foreground"
        onClick={() => setConfirming(true)}
      >
        清空全部
      </Button>
    )
  }
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-muted-foreground">确定？</span>
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs"
        onClick={() => setConfirming(false)}
      >
        取消
      </Button>
      <Button
        size="sm"
        className="h-7 bg-destructive text-xs text-white hover:bg-destructive/90"
        onClick={() => {
          clearFilters()
          setConfirming(false)
        }}
      >
        清空
      </Button>
    </div>
  )
}

function RuleRow({ rule }: { rule: FilterRule }) {
  const updateFilter = useSettingsStore((s) => s.updateFilter)
  const removeFilter = useSettingsStore((s) => s.removeFilter)
  const toggleFilter = useSettingsStore((s) => s.toggleFilter)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(rule.value)

  const save = () => {
    const v = draft.trim()
    if (!v) return
    if (rule.mode === 'regex') {
      try {
        new RegExp(v, 'i')
      } catch {
        return
      }
    }
    updateFilter(rule.id, { value: v })
    setEditing(false)
  }

  return (
    <li
      className={
        'flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2 ' +
        (rule.enabled ? '' : 'opacity-50')
      }
    >
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7"
        onClick={() => toggleFilter(rule.id)}
        aria-label={rule.enabled ? '禁用此规则' : '启用此规则'}
        title={rule.enabled ? '点击禁用' : '点击启用'}
      >
        {rule.enabled ? (
          <Eye className="h-4 w-4" />
        ) : (
          <EyeOff className="h-4 w-4" />
        )}
      </Button>
      <span className="inline-flex h-6 shrink-0 items-center rounded-full bg-muted px-2 text-xs">
        {FIELD_LABELS[rule.field]}
      </span>
      <span className="inline-flex h-6 shrink-0 items-center rounded-full bg-muted px-2 text-xs text-muted-foreground">
        {MODE_LABELS[rule.mode]}
      </span>
      {editing ? (
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save()
            if (e.key === 'Escape') {
              setDraft(rule.value)
              setEditing(false)
            }
          }}
          onBlur={save}
          autoFocus
          className="h-7 flex-1"
        />
      ) : (
        <button
          type="button"
          className="flex-1 truncate text-left font-mono text-sm hover:underline"
          onClick={() => {
            setDraft(rule.value)
            setEditing(true)
          }}
          title="点击编辑"
        >
          {rule.value}
        </button>
      )}
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 text-muted-foreground hover:text-destructive"
        onClick={() => removeFilter(rule.id)}
        aria-label="删除规则"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </li>
  )
}

function NavPanel() {
  const hidden = useSettingsStore((s) => s.hiddenNavKeys)
  const setNavHidden = useSettingsStore((s) => s.setNavHidden)
  const hiddenSet = useMemo(() => new Set(hidden), [hidden])

  // Settings entry itself is filtered out — hiding it would lock the
  // user out (no way back to this page from the nav).
  const togglable = NAV_REGISTRY.filter((e) => e.key !== 'settings')

  return (
    <div className="space-y-4 pt-3">
      <div className="rounded-2xl bg-card p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.55)] dark:ring-1 dark:ring-white/[0.04]">
        <h2 className="text-sm font-semibold">显示哪些菜单</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          取消勾选后，左侧导航将不再显示对应入口。设置入口始终保留。
        </p>
        <ul className="mt-3 space-y-1">
          {togglable.map((e) => {
            const isHidden = hiddenSet.has(e.key)
            return (
              <li key={e.key}>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted">
                  <input
                    type="checkbox"
                    checked={!isHidden}
                    onChange={(ev) =>
                      setNavHidden(e.key as NavKey, !ev.target.checked)
                    }
                    className="h-4 w-4 accent-foreground"
                  />
                  <e.icon className="h-[18px] w-[18px] text-muted-foreground" />
                  <span className="text-sm">{e.label}</span>
                </label>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

function NativeSelect({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  ariaLabel: string
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={ariaLabel}
      className="h-9 rounded-md border border-input bg-card px-3 text-sm shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}
