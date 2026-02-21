import { useState } from 'react'
import { X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

interface Props {
  onClose: () => void
}

export default function AuthModal({ onClose }: Props) {
  const { signInWithMagicLink, signInWithPassword, signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [usePassword, setUsePassword] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleMagicLink = async () => {
    if (!email.trim()) return
    setLoading(true)
    setMessage(null)
    try {
      const { error } = await signInWithMagicLink(email.trim())
      if (error) {
        setMessage({ type: 'error', text: error.message })
      } else {
        setMessage({ type: 'success', text: '已发送登录链接，请查收邮箱' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : '请求失败，请检查网络' })
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordAuth = async () => {
    if (!email.trim() || !password) return
    setLoading(true)
    setMessage(null)
    try {
      const fn = isSignUp ? signUp : signInWithPassword
      const { error } = await fn(email.trim(), password)
      if (error) {
        setMessage({ type: 'error', text: error.message })
      } else {
        if (isSignUp) {
          setMessage({ type: 'success', text: '注册成功，请查收邮箱验证' })
        } else {
          onClose()
        }
      }
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : '请求失败，请检查网络' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content card auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>云同步登录</h3>
          <button type="button" className="btn btn-ghost icon-btn" onClick={onClose} aria-label="关闭">
            <X size={20} />
          </button>
        </div>
        <div className="auth-modal-body">
          <div className="form-row">
            <label>邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              disabled={loading}
            />
          </div>
          {!usePassword ? (
            <>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleMagicLink}
                disabled={loading || !email.trim()}
              >
                {loading ? '发送中...' : '发送登录链接'}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setUsePassword(true)}
              >
                使用密码{isSignUp ? '注册' : '登录'}
              </button>
            </>
          ) : (
            <>
              <div className="form-row">
                <label>密码</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isSignUp ? '至少 6 位' : ''}
                  disabled={loading}
                />
              </div>
              <div className="auth-modal-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handlePasswordAuth}
                  disabled={loading || !email.trim() || !password}
                >
                  {loading ? '处理中...' : isSignUp ? '注册' : '登录'}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setIsSignUp(!isSignUp)}
                >
                  切换到{isSignUp ? '登录' : '注册'}
                </button>
              </div>
            </>
          )}
          {message && (
            <p className={`auth-modal-message auth-modal-message-${message.type}`}>
              {message.text}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
