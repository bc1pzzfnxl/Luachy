import { useState, Suspense, lazy, useEffect } from 'react'
import { 
  DndContext, DragOverlay, DragEndEvent, PointerSensor, useSensor, 
  useSensors, DragStartEvent, KeyboardSensor
} from '@dnd-kit/core'

import { useLuachy } from './hooks/use-luachy'
import { Sidebar, ViewType } from './components/layout/Sidebar'
import { MemoTimeline } from './components/memos/MemoTimeline'
import { KanbanBoard } from './components/kanban/KanbanBoard'
import { ActivityCalendar } from './components/calendar/ActivityCalendar'
import { ConfirmDialog } from './components/ui/ConfirmDialog'
import { SettingsDialog } from './components/ui/SettingsDialog'
import { CardDetailDialog } from './components/kanban/CardDetailDialog'
import { ArchiveView } from './components/archive/ArchiveView'
import { DailyFocus } from './components/focus/DailyFocus'
import { SearchOverlay } from './components/ui/SearchOverlay'
import { StatsView } from './components/stats/StatsView'

export default function App() {
  const luachy = useLuachy()
  const { 
    memos = [], cards = [], columns = [], stats = {}, kanbanStats = null,
    loading = false, addMemo, updateMemo, deleteMemo, searchMemos,
    addCard, updateCard, moveCard, deleteCard, archiveCard, cleanupCards,
    uploadFile
  } = luachy

  const [activeView, setActiveView] = useState<ViewType>('focus')
  const [activeItem, setActiveItem] = useState<{ id: string, type: 'memo' | 'card', data: any } | null>(null)
  const [scrollTarget, setScrollTarget] = useState<string | null>(null)
  const [deleteConfig, setDeleteConfig] = useState<{ id: number, type: 'memo' | 'card' } | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [detailCard, setDetailCard] = useState<any | null>(null)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [prefillTask, setPrefillTask] = useState<string | null>(null)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('luachy-theme')
      if (saved === 'light' || saved === 'dark') return saved
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
  })

  useEffect(() => {
    const root = window.document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    localStorage.setItem('luachy-theme', theme)
  }, [theme])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  )

  const onDragStart = (event: DragStartEvent) => {
    const { active } = event
    const idParts = String(active.id).split('-')
    const type = idParts[0] as 'memo' | 'card'
    const id = parseInt(idParts[1])
    
    const data = type === 'memo' ? memos.find(m => m.id === id) : cards.find(c => c.id === id)
    if (data) setActiveItem({ id: String(active.id), type, data })
  }

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveItem(null)
    if (!over) return

    const activeIdParts = String(active.id).split('-')
    const activeType = activeIdParts[0]
    const activeId = parseInt(activeIdParts[1])

    if (activeType === 'card' && String(over.id).startsWith('column-')) {
      const columnId = parseInt(String(over.id).split('-')[1])
      const card = cards.find(c => c.id === activeId)
      if (card && card.column_id !== columnId) {
        moveCard(activeId, columnId)
      }
    }
  }

  const handleNavigateToDate = (date: string) => {
    setScrollTarget(date)
    setActiveView('memos')
    setTimeout(() => setScrollTarget(null), 1000)
  }

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light'
    if (typeof document.startViewTransition === 'function') {
      document.startViewTransition(() => {
        setTheme(nextTheme)
      })
    } else {
      document.documentElement.classList.add('theme-transitioning')
      setTheme(nextTheme)
      setTimeout(() => {
        document.documentElement.classList.remove('theme-transitioning')
      }, 800)
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="flex h-screen w-screen bg-background overflow-hidden font-sans text-foreground selection:bg-primary/10 selection:text-primary transition-colors">
        <Sidebar 
          activeView={activeView} 
          onViewChange={setActiveView} 
          onOpenSettings={() => setIsSettingsOpen(true)} 
          onOpenSearch={() => setIsSearchOpen(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        <main className="flex-1 flex overflow-hidden bg-background">
          {activeView === 'memos' && (
            <div className="w-[380px] min-w-[380px] max-w-[380px] flex shrink-0 h-full border-r border-border/50 bg-muted/10 transition-all">
              <ActivityCalendar stats={stats} cards={cards} onDayClick={handleNavigateToDate} isSidebar={true} />
            </div>
          )}

          <section className="flex-1 flex flex-col overflow-hidden bg-muted/20">
            {activeView === 'focus' && (
              <DailyFocus 
                memos={memos} 
                cards={cards} 
                columns={columns}
                onUpdateMemo={updateMemo} 
                onDeleteMemo={(id) => setDeleteConfig({ id, type: 'memo' })} 
                onToggleTask={(cardId, columnId) => moveCard(cardId, columnId)}
                onBacklinkClick={(t) => { 
                  const c = cards.find(x => x.title === t); 
                  if (c) setDetailCard(c); 
                  else { setPrefillTask(t); setActiveView('kanban'); }
                }}
                stats={stats}
                onViewStats={() => setActiveView('stats')}
              />
            )}

            {activeView === 'memos' && (
              <MemoTimeline 
                memos={memos} cards={cards} loading={loading} 
                onAddMemo={addMemo} onUpdateMemo={updateMemo} onDeleteMemo={(id) => setDeleteConfig({ id, type: 'memo' })}
                onSearchMemos={searchMemos} onBacklinkClick={(t) => { 
                  const c = cards.find(x => x.title === t); 
                  if (c) setDetailCard(c); 
                  else { setPrefillTask(t); setActiveView('kanban'); }
                }}
                onUploadFile={uploadFile} scrollToDate={scrollTarget}
              />
            )}

            {activeView === 'kanban' && (
              <KanbanBoard 
                cards={cards} columns={columns} memos={memos}
                onUpdateCard={updateCard} onDeleteCard={(id) => setDeleteConfig({ id, type: 'card' })}
                onArchiveCard={archiveCard}
                onCardClick={setDetailCard}
                onAddCard={addCard}
                prefillTitle={prefillTask}
                onWizardClose={() => setPrefillTask(null)}
              />
            )}

            {activeView === 'archive' && (
              <ArchiveView 
                API_URL="/api"
                onRefresh={luachy.refresh}
                onBack={() => setActiveView('focus')}
              />
            )}

            {activeView === 'stats' && (
              <StatsView 
                kanbanStats={kanbanStats}
              />
            )}
          </section>
        </main>

        <ConfirmDialog 
          isOpen={!!deleteConfig}
          onClose={() => setDeleteConfig(null)}
          onConfirm={() => {
            if (deleteConfig?.type === 'memo') deleteMemo(deleteConfig.id)
            else if (deleteConfig?.type === 'card') deleteCard(deleteConfig.id)
          }}
          title={`Delete ${deleteConfig?.type === 'memo' ? 'Note' : 'Task'}`}
          description="This action cannot be undone. The item will be permanently removed."
        />

        <SettingsDialog 
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onRunArchive={cleanupCards}
        />

        <SearchOverlay 
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          memos={memos}
          cards={cards}
          onSelectMemo={handleNavigateToDate}
          onSelectCard={(c) => { setActiveView('kanban'); setDetailCard(c); }}
        />

        <CardDetailDialog 
          card={detailCard}
          isOpen={!!detailCard}
          onClose={() => setDetailCard(null)}
          onUpdate={updateCard}
          memos={memos}
          onSelectMemo={handleNavigateToDate}
        />

        <DragOverlay>
          {activeItem ? (
            <div className="p-4 bg-card border border-primary shadow-2xl rounded-xl w-64 rotate-3 opacity-90">
              <p className="text-sm font-medium truncate">
                {activeItem.type === 'memo' ? activeItem.data.content : activeItem.data.title}
              </p>
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  )
}
