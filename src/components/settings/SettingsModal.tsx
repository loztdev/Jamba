import { useState } from 'react'
import { X, Eye, EyeOff, Check, AlertCircle, Loader, KeyRound, Palette } from 'lucide-react'
import { useSettingsStore } from '../../store/settingsStore'
import { fetchModels } from '../../api/openrouter'
import { THEME_SWATCHES } from '../../types'
import type { ThemeName, IdleAnimation, CustomThemeVars } from '../../types'
import clsx from 'clsx'

interface SettingsModalProps {
  onClose: () => void
}

type TestStatus = 'idle' | 'loading' | 'ok' | 'error'

interface ApiKeyFieldProps {
  label: string
  helper: React.ReactNode
  value: string
  onSave: (key: string) => void
  placeholder?: string
}

function ApiKeyField({ label, helper, value, onSave, placeholder }: ApiKeyFieldProps) {
  const [draft, setDraft] = useState(value)
  const [show, setShow] = useState(false)
  const [status, setStatus] = useState<TestStatus>('idle')
  const [message, setMessage] = useState('')

  async function handleTest() {
    if (!draft.trim()) { setMessage('Enter a key first.'); setStatus('error'); return }
    setStatus('loading'); setMessage('')
    try {
      const models = await fetchModels(draft.trim())
      setStatus('ok')
      setMessage(`Connected! ${models.length} models available.`)
    } catch (e) {
      setStatus('error')
      setMessage((e as Error).message)
    }
  }

  return (
    <section>
      <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
        <KeyRound size={13} />
        {label}
      </h3>
      <div className="flex gap-2 mb-2">
        <div
          className="flex items-center flex-1 rounded-lg border border-subtle overflow-hidden"
          style={{ background: 'var(--bg-tertiary)' }}
        >
          <input
            type={show ? 'text' : 'password'}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={placeholder ?? 'sk-or-v1-…'}
            className="flex-1 bg-transparent outline-none px-3 py-2 text-sm font-mono"
            style={{ color: 'var(--text-primary)' }}
            onKeyDown={(e) => e.key === 'Enter' && onSave(draft.trim())}
          />
          <button onClick={() => setShow((v) => !v)} className="px-2 py-2 btn-ghost" title={show ? 'Hide' : 'Show'}>
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        <button onClick={() => onSave(draft.trim())} className="btn-primary text-sm px-3">Save</button>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleTest}
          disabled={status === 'loading'}
          className="flex items-center gap-1.5 text-xs btn-ghost border border-subtle px-3 py-1.5 rounded-lg"
        >
          {status === 'loading' ? <Loader size={12} className="animate-spin" /> : <span>Test Connection</span>}
        </button>
        {status === 'ok' && <span className="flex items-center gap-1 text-xs" style={{ color: '#22c55e' }}><Check size={12} /> {message}</span>}
        {status === 'error' && <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--danger)' }}><AlertCircle size={12} /> {message}</span>}
      </div>
      <div className="text-xs text-muted mt-2">{helper}</div>
    </section>
  )
}

const THEME_CUSTOM_FIELDS: { key: keyof CustomThemeVars; label: string }[] = [
  { key: 'bgPrimary', label: 'Background' },
  { key: 'bgSecondary', label: 'Sidebar / panels' },
  { key: 'bgTertiary', label: 'Input / tertiary' },
  { key: 'textPrimary', label: 'Primary text' },
  { key: 'textSecondary', label: 'Secondary text' },
  { key: 'accent', label: 'Accent color' },
  { key: 'border', label: 'Border color' },
  { key: 'surface', label: 'Message surface' },
  { key: 'userBubble', label: 'User bubble' },
  { key: 'danger', label: 'Danger / red' },
]

const IDLE_OPTIONS: { value: IdleAnimation; label: string }[] = [
  { value: 'random', label: '🎲 Random' },
  { value: 'starfield', label: '✨ Starfield' },
  { value: 'shooting', label: '🌠 Shooting Stars' },
  { value: 'aurora', label: '🌌 Aurora' },
]

export function SettingsModal({ onClose }: SettingsModalProps) {
  const apiKey = useSettingsStore((s) => s.apiKey)
  const builderApiKey = useSettingsStore((s) => s.builderApiKey)
  const theme = useSettingsStore((s) => s.theme)
  const idleAnimation = useSettingsStore((s) => s.idleAnimation)
  const customThemeVars = useSettingsStore((s) => s.customThemeVars)
  const setApiKey = useSettingsStore((s) => s.setApiKey)
  const setBuilderApiKey = useSettingsStore((s) => s.setBuilderApiKey)
  const setTheme = useSettingsStore((s) => s.setTheme)
  const setIdleAnimation = useSettingsStore((s) => s.setIdleAnimation)
  const setCustomThemeVars = useSettingsStore((s) => s.setCustomThemeVars)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl fade-in overflow-hidden max-h-[90vh] flex flex-col"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-subtle shrink-0">
          <h2 className="font-bold text-base">⚙️ Settings</h2>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg"><X size={16} /></button>
        </div>

        <div className="p-5 flex flex-col gap-6 overflow-y-auto">
          <ApiKeyField
            label="OpenRouter API Key"
            value={apiKey}
            onSave={setApiKey}
            helper={<>Get your key at <span className="accent-text">openrouter.ai/keys</span>. Stored locally in your browser only.</>}
          />

          <ApiKeyField
            label="Builder API Key (optional)"
            value={builderApiKey}
            onSave={setBuilderApiKey}
            helper={<>If set, AI Character Builder uses this key. Leave blank to fall back to your main key.</>}
          />

          {/* Theme */}
          <section>
            <h3 className="font-semibold text-sm mb-3">Theme</h3>
            <div className="grid grid-cols-4 gap-2">
              {THEME_SWATCHES.map((s) => (
                <ThemeSwatchBtn key={s.name} swatch={s} active={theme === s.name} onSelect={setTheme} />
              ))}
              {/* Custom theme swatch */}
              <button
                onClick={() => setTheme('custom')}
                className={clsx(
                  'relative rounded-xl overflow-hidden border-2 transition-all aspect-square flex flex-col',
                  theme === 'custom' ? 'scale-105' : 'border-transparent hover:scale-105'
                )}
                style={{ borderColor: theme === 'custom' ? customThemeVars.accent : 'transparent' }}
                title="Custom"
              >
                <div className="flex-1 flex">
                  <div className="flex-1" style={{ background: customThemeVars.bgPrimary }} />
                  <div className="flex-1" style={{ background: customThemeVars.bgSecondary }} />
                </div>
                <div className="h-4" style={{ background: customThemeVars.accent }} />
                <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold" style={{ color: '#ffffff', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                  Custom
                </span>
                {theme === 'custom' && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: customThemeVars.accent }}>
                    <Check size={10} color="white" />
                  </span>
                )}
              </button>
            </div>
          </section>

          {/* Custom theme editor */}
          {theme === 'custom' && (
            <section>
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Palette size={13} /> Custom Theme Colors
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {THEME_CUSTOM_FIELDS.map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-3">
                    <input
                      type="color"
                      value={customThemeVars[key]}
                      onChange={(e) => setCustomThemeVars({ [key]: e.target.value })}
                      className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                      style={{ background: 'none' }}
                    />
                    <span className="text-xs flex-1" style={{ color: 'var(--text-secondary)' }}>{label}</span>
                    <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>{customThemeVars[key]}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Idle Animation */}
          <section>
            <h3 className="font-semibold text-sm mb-3">Idle Animation</h3>
            <div className="flex flex-wrap gap-2">
              {IDLE_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setIdleAnimation(value)}
                  className={clsx(
                    'text-xs px-3 py-1.5 rounded-lg border transition-all',
                    idleAnimation === value ? 'border-accent accent-text' : 'border-subtle btn-ghost'
                  )}
                  style={idleAnimation === value ? { borderColor: 'var(--accent)' } : undefined}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted mt-2">Appears after 15 seconds of inactivity. Click to dismiss.</p>
          </section>
        </div>
      </div>
    </div>
  )
}

function ThemeSwatchBtn({
  swatch,
  active,
  onSelect,
}: {
  swatch: { name: ThemeName; label: string; bg: string; accent: string }
  active: boolean
  onSelect: (t: ThemeName) => void
}) {
  return (
    <button
      onClick={() => onSelect(swatch.name)}
      className={clsx(
        'relative rounded-xl overflow-hidden border-2 transition-all aspect-square flex flex-col',
        active ? 'scale-105' : 'border-transparent hover:scale-105'
      )}
      style={{ borderColor: active ? swatch.accent : 'transparent' }}
      title={swatch.label}
    >
      <div className="flex-1" style={{ background: swatch.bg }} />
      <div className="h-4" style={{ background: swatch.accent }} />
      <span
        className="absolute inset-0 flex items-center justify-center text-xs font-semibold"
        style={{ color: swatch.bg === '#f5f5f5' ? '#1a1a1a' : '#ffffff', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
      >
        {swatch.label}
      </span>
      {active && (
        <span className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: swatch.accent }}>
          <Check size={10} color="white" />
        </span>
      )}
    </button>
  )
}
