import { useState } from 'react'
import { X, Eye, EyeOff, Check, AlertCircle, Loader } from 'lucide-react'
import { useSettingsStore } from '../../store/settingsStore'
import { fetchModels } from '../../api/openrouter'
import { THEME_SWATCHES } from '../../types'
import type { ThemeName } from '../../types'
import clsx from 'clsx'

interface SettingsModalProps {
  onClose: () => void
}

type TestStatus = 'idle' | 'loading' | 'ok' | 'error'

export function SettingsModal({ onClose }: SettingsModalProps) {
  const apiKey = useSettingsStore((s) => s.apiKey)
  const theme = useSettingsStore((s) => s.theme)
  const setApiKey = useSettingsStore((s) => s.setApiKey)
  const setTheme = useSettingsStore((s) => s.setTheme)

  const [keyDraft, setKeyDraft] = useState(apiKey)
  const [showKey, setShowKey] = useState(false)
  const [testStatus, setTestStatus] = useState<TestStatus>('idle')
  const [testMessage, setTestMessage] = useState('')

  async function handleTest() {
    if (!keyDraft.trim()) { setTestMessage('Enter an API key first.'); setTestStatus('error'); return }
    setTestStatus('loading')
    setTestMessage('')
    try {
      const models = await fetchModels(keyDraft.trim())
      setTestStatus('ok')
      setTestMessage(`Connected! ${models.length} models available.`)
    } catch (e) {
      setTestStatus('error')
      setTestMessage((e as Error).message)
    }
  }

  function handleSaveKey() {
    setApiKey(keyDraft.trim())
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl fade-in overflow-hidden"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-subtle">
          <h2 className="font-bold text-base">⚙️ Settings</h2>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-6">
          {/* API Key section */}
          <section>
            <h3 className="font-semibold text-sm mb-3">OpenRouter API Key</h3>
            <div className="flex gap-2 mb-2">
              <div
                className="flex items-center flex-1 rounded-lg border border-subtle overflow-hidden"
                style={{ background: 'var(--bg-tertiary)' }}
              >
                <input
                  type={showKey ? 'text' : 'password'}
                  value={keyDraft}
                  onChange={(e) => setKeyDraft(e.target.value)}
                  placeholder="sk-or-v1-…"
                  className="flex-1 bg-transparent outline-none px-3 py-2 text-sm font-mono"
                  style={{ color: 'var(--text-primary)' }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveKey()}
                />
                <button
                  onClick={() => setShowKey((v) => !v)}
                  className="px-2 py-2 btn-ghost"
                  title={showKey ? 'Hide key' : 'Show key'}
                >
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <button onClick={handleSaveKey} className="btn-primary text-sm px-3">
                Save
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleTest}
                disabled={testStatus === 'loading'}
                className="flex items-center gap-1.5 text-xs btn-ghost border border-subtle px-3 py-1.5 rounded-lg"
              >
                {testStatus === 'loading' ? (
                  <Loader size={12} className="animate-spin" />
                ) : (
                  <span>Test Connection</span>
                )}
              </button>
              {testStatus === 'ok' && (
                <span className="flex items-center gap-1 text-xs" style={{ color: '#22c55e' }}>
                  <Check size={12} /> {testMessage}
                </span>
              )}
              {testStatus === 'error' && (
                <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--danger)' }}>
                  <AlertCircle size={12} /> {testMessage}
                </span>
              )}
            </div>

            <p className="text-xs text-muted mt-2">
              Get your key at{' '}
              <span className="accent-text">openrouter.ai/keys</span>. Stored locally in your browser only.
            </p>
          </section>

          {/* Theme section */}
          <section>
            <h3 className="font-semibold text-sm mb-3">Theme</h3>
            <div className="grid grid-cols-4 gap-2">
              {THEME_SWATCHES.map((s) => (
                <ThemeSwatch
                  key={s.name}
                  swatch={s}
                  active={theme === s.name}
                  onSelect={(t) => setTheme(t)}
                />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function ThemeSwatch({
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
        <span
          className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center"
          style={{ background: swatch.accent }}
        >
          <Check size={10} color="white" />
        </span>
      )}
    </button>
  )
}
