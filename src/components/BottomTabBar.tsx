import type { LucideIcon } from 'lucide-react'

export type TabId = 'list' | 'stats' | 'calendar' | 'settings'

interface Tab {
  id: TabId
  icon: LucideIcon
  label: string
}

interface Props {
  tabs: Tab[]
  activeId: TabId
  onChange: (id: TabId) => void
}

export default function BottomTabBar({ tabs, activeId, onChange }: Props) {
  return (
    <nav className="bottom-tab-bar" role="tablist">
      {tabs.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={activeId === id}
          className={`bottom-tab-item ${activeId === id ? 'active' : ''}`}
          onClick={() => onChange(id)}
        >
          <Icon size={22} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}
