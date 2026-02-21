import { Moon, Sun, Cloud, CloudOff, Download, LogOut } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'

type SyncInfo = {
  syncing: boolean
  lastSyncedAt: string | null
  error: string | null
  syncNow: () => Promise<void>
}

interface Props {
  sync: SyncInfo
  onNavigateToExport: () => void
  onLoginClick: () => void
  onLogoutClick: () => void
}

export default function SettingsView({
  sync,
  onNavigateToExport,
  onLoginClick,
  onLogoutClick,
}: Props) {
  const { theme, setTheme } = useTheme()
  const { user, isConfigured } = useAuth()

  return (
    <div className="settings-page page">
      <h2>设置</h2>

      <div className="settings-section">
        <h3>外观</h3>
        <button
          type="button"
          className="settings-item"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          <span>主题：{theme === 'dark' ? '暗色' : '亮色'}</span>
        </button>
      </div>

      {isConfigured && (
        <div className="settings-section">
          <h3>云同步</h3>
          {user ? (
            <>
              <div className="settings-item settings-item-static">
                <div className="settings-item-icon">
                  {sync.syncing ? (
                    <Cloud size={20} className="sync-spin" />
                  ) : (
                    <Cloud size={20} />
                  )}
                </div>
                <div className="settings-item-content">
                  <span>已登录</span>
                  {sync.lastSyncedAt && (
                    <span className="settings-item-muted">
                      最后同步：{format(new Date(sync.lastSyncedAt), 'M月d日 HH:mm', { locale: zhCN })}
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                className="settings-item"
                onClick={() => sync.syncNow()}
                disabled={sync.syncing}
              >
                <Cloud size={20} />
                <span>{sync.syncing ? '同步中…' : '立即同步'}</span>
              </button>
              {sync.error && (
                <div className="settings-error">同步失败：{sync.error}</div>
              )}
            </>
          ) : (
            <button
              type="button"
              className="settings-item"
              onClick={onLoginClick}
            >
              <CloudOff size={20} />
              <span>点击登录</span>
            </button>
          )}
        </div>
      )}

      <div className="settings-section">
        <h3>数据</h3>
        <button type="button" className="settings-item" onClick={onNavigateToExport}>
          <Download size={20} />
          <span>导出 / 导入</span>
        </button>
      </div>

      {isConfigured && user && (
        <div className="settings-section">
          <h3>账号</h3>
          <button
            type="button"
            className="settings-item settings-item-danger"
            onClick={onLogoutClick}
          >
            <LogOut size={20} />
            <span>退出登录</span>
          </button>
        </div>
      )}
    </div>
  )
}
