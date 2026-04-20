import { Layout, Calendar as CalendarIcon, Kanban as KanbanIcon, Settings, Archive, Sun, Moon, Sparkles, StickyNote, Search, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ViewType = 'focus' | 'memos' | 'kanban' | 'archive' | 'stats'

interface SidebarProps {
  activeView: ViewType
  onViewChange: (view: ViewType) => void
  onOpenSettings: () => void
  onOpenSearch: () => void
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

export function Sidebar({ activeView, onViewChange, onOpenSettings, onOpenSearch, theme, onToggleTheme }: SidebarProps) {
  return (
    <nav className="w-16 border-r flex flex-col items-center py-6 gap-6 bg-background shrink-0 z-50 transition-colors">
      <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-bold font-serif text-lg shadow-sm">
        L
      </div>
      
      <div className="flex flex-col gap-4 mt-4">
        <SidebarButton active={false} onClick={onOpenSearch} icon={<Search size={20} />} title="Search (⌘K)" />
        <div className="h-px bg-border/50 mx-3 my-2" />
        <SidebarButton active={activeView === 'focus'} onClick={() => onViewChange('focus')} icon={<Sparkles size={20} />} title="Daily Focus" />
        <SidebarButton active={activeView === 'memos'} onClick={() => onViewChange('memos')} icon={<StickyNote size={20} />} title="Journal" />
        <SidebarButton active={activeView === 'kanban'} onClick={() => onViewChange('kanban')} icon={<KanbanIcon size={20} />} title="Kanban" />
        <SidebarButton active={activeView === 'stats'} onClick={() => onViewChange('stats')} icon={<BarChart3 size={20} />} title="Statistics" />
        <SidebarButton active={activeView === 'archive'} onClick={() => onViewChange('archive')} icon={<Archive size={20} />} title="Archive" />
      </div>

      <div className="mt-auto flex flex-col gap-4">
        <button 
          onClick={onToggleTheme}
          className="p-2.5 rounded-xl transition-all group relative flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          <span className="absolute left-full ml-4 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-[-4px] group-hover:translate-x-0 z-[100] whitespace-nowrap shadow-sm">
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </span>
        </button>
        <SidebarButton active={false} onClick={onOpenSettings} icon={<Settings size={20} />} title="Settings" />
      </div>
    </nav>
  )
}

function SidebarButton({ active, onClick, icon, title }: { active: boolean, onClick: () => void, icon: React.ReactNode, title: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "p-2.5 rounded-xl transition-all group relative flex items-center justify-center", 
        active 
          ? "bg-primary text-primary-foreground shadow-sm scale-100" 
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {icon}
      <span className="absolute left-full ml-4 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-[-4px] group-hover:translate-x-0 z-[100] whitespace-nowrap shadow-sm">
        {title}
      </span>
    </button>
  )
}
