import { useState, useEffect } from 'react'
import { Heart, Users, Calendar, ChevronRight, X } from 'lucide-react'

const GUIDE_KEY = 'love-ops-seen-guide'

interface Props {
  onClose: () => void
  personsCount: number
}

export default function OnboardingGuide({ onClose, personsCount }: Props) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const seen = localStorage.getItem(GUIDE_KEY)
    if (!seen && personsCount === 0) setShow(true)
  }, [personsCount])

  const handleClose = () => {
    localStorage.setItem(GUIDE_KEY, '1')
    setShow(false)
    onClose()
  }

  if (!show) return null

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card card">
        <button
          className="onboarding-close"
          onClick={handleClose}
          aria-label="关闭"
        >
          <X size={24} />
        </button>
        <div className="onboarding-header">
          <Heart size={48} className="onboarding-icon" />
          <h2>欢迎使用对象分析系统</h2>
          <p>记录每一次相亲约会，让选择更清晰</p>
        </div>
        <ul className="onboarding-steps">
          <li>
            <Users size={24} />
            <span><strong>人选</strong>：添加相亲对象的基本信息</span>
          </li>
          <li>
            <Calendar size={24} />
            <span><strong>约会记录</strong>：记录每次约会的行程、花费、感受</span>
          </li>
          <li>
            <ChevronRight size={24} />
            <span><strong>统计与导出</strong>：查看花费趋势，导出备份数据</span>
          </li>
        </ul>
        <button className="btn btn-primary onboarding-cta" onClick={handleClose}>
          开始使用
        </button>
      </div>
    </div>
  )
}
