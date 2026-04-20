import { useState, useMemo, useEffect } from 'react'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { 
  Plus, GripVertical, Trash2, ArrowUpWideNarrow, Clock,
  Filter, RotateCcw, Archive
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { GuidedTaskBuilder } from './GuidedTaskBuilder'
import { Button } from "@/components/ui/button"
import { ACTIONS, PRIORITY_MAP, CARD_COLORS } from '@/lib/constants'

interface KanbanBoardProps {
  columns: any[]
  cards: any[]
  stats?: any
  memos?: any[]
  onUpdateCard: (cardId: number, data: any) => void
  onDeleteCard: (cardId: number) => void
  onArchiveCard: (cardId: number) => void
  onAddCard: (title: string, column_id: number, color?: string, actionType?: string, priority?: number, dueDate?: string, description?: string, recurrence?: string) => void
  onCardClick?: (card: any) => void
  prefillTitle?: string | null
  onWizardClose?: () => void
}

export function KanbanBoard({ columns = [], cards = [], memos = [], onUpdateCard, onDeleteCard, onArchiveCard, onAddCard, onCardClick, prefillTitle, onWizardClose }: KanbanBoardProps) {
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [sortByPriority, setSortByPriority] = useState(false)
  const [filterType, setFilterType] = useState<string | null>(null)
  const [hiddenPriorities, setHiddenPriorities] = useState<number[]>([])

  useEffect(() => {
    if (prefillTitle) {
      setIsWizardOpen(true)
    }
  }, [prefillTitle])

  const filteredCards = useMemo(() => {
    let arr = Array.isArray(cards) ? cards : []
    if (filterType) arr = arr.filter(c => c && c.action_type === filterType)
    if (hiddenPriorities.length > 0) arr = arr.filter(c => c && !hiddenPriorities.includes(Number(c.priority) || 4))
    return arr
  }, [cards, filterType, hiddenPriorities])

  const togglePriority = (p: number) => {
    setHiddenPriorities(prev => 
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <div className="px-8 py-6 border-b border-border/50 flex flex-col gap-4 bg-card shrink-0">
        <div className="flex justify-between items-center flex-row-reverse">
          <div>
            <h2 className="text-xl font-serif font-medium tracking-tight text-foreground">Board</h2>
            <p className="text-[10px] text-muted-foreground font-medium">{cards.length} active tasks</p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => setIsWizardOpen(true)} className="rounded-xl h-9 px-5 gap-2 shadow-sm font-bold text-xs">
              <Plus size={16} /> New Task
            </Button>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-6 overflow-hidden max-w-[80%]">
            <div className="flex items-center gap-2 shrink-0">
               <Filter size={14} className="text-muted-foreground" />
               <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Type</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar flex-1">
                {(ACTIONS || []).map(action => {
                  const Icon = action.icon;
                  return (
                    <button 
                      key={action.id} 
                      onClick={() => setFilterType(filterType === action.id ? null : action.id)} 
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-tighter border transition-all flex items-center gap-1.5 shrink-0", 
                        filterType === action.id ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground hover:bg-muted border-border/50"
                      )}
                    >
                      {Icon && <Icon size={12} />} {action.label}
                    </button>
                  );
                })}
            </div>

            <div className="h-4 w-px bg-border/50 mx-2 shrink-0" />

            <div className="flex items-center gap-1.5 shrink-0">
              {[1, 2, 3, 4].map((p) => {
                const info = PRIORITY_MAP[p] || PRIORITY_MAP[4];
                return (
                  <button
                    key={p}
                    onClick={() => togglePriority(p)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-tighter border transition-all",
                      hiddenPriorities.includes(p) 
                        ? "bg-primary text-primary-foreground border-primary" 
                        : "bg-card text-muted-foreground hover:bg-muted border-border/50"
                    )}
                  >
                    {info.label}
                  </button>
                );
              })}
              
              {hiddenPriorities.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setHiddenPriorities([])}
                  className="size-8 text-muted-foreground hover:text-primary transition-all ml-1"
                  title="Show All"
                >
                  <RotateCcw size={14} />
                </Button>
              )}
            </div>
          </div>

          <Button 
            variant="outline"
            size="sm"
            onClick={() => setSortByPriority(!sortByPriority)} 
            className={cn(
              "h-8 gap-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ml-4", 
              sortByPriority && "bg-primary/5 border-primary/20 text-primary"
            )}
          >
            <ArrowUpWideNarrow size={14} /> {sortByPriority ? "Priority" : "Manual"}
          </Button>
        </div>
      </div>

      <div className="p-8 flex gap-8 overflow-x-auto flex-1 items-start justify-center custom-scrollbar bg-muted/20">
        {(columns || []).map((col) => (
          <DroppableColumn 
            key={col.id} 
            column={col} 
            cards={filteredCards.filter(c => c && c.column_id === col.id)} 
            memos={memos} 
            onDeleteCard={onDeleteCard} 
            onArchiveCard={onArchiveCard}
            onCardClick={onCardClick} 
            sortActive={sortByPriority} 
          />
        ))}
      </div>

      <GuidedTaskBuilder 
        isOpen={isWizardOpen} 
        onClose={() => { setIsWizardOpen(false); onWizardClose?.(); }} 
        initialTarget={prefillTitle || ''}
        onCreateTask={(title, color, actionType, priority, dueDate, description, recurrence) => {
          if (columns.length > 0) {
            onAddCard(title, (columns[0]?.id || 1), color, actionType, priority, dueDate, description, recurrence)
          }
        }}
      />
    </div>
  )
}

function DroppableColumn({ column, cards, memos, onDeleteCard, onArchiveCard, onCardClick, sortActive }: { column: any, cards: any[], memos: any[], onDeleteCard: (id: number) => void, onArchiveCard: (id: number) => void, onCardClick?: (card: any) => void, sortActive: boolean }) {
  if (!column?.id) return null;
  const { isOver, setNodeRef } = useDroppable({ id: `column-${column.id}` })
  const sortedCards = useMemo(() => {
    const arr = Array.isArray(cards) ? cards : []
    if (!sortActive) return arr
    return [...arr].sort((a, b) => (Number(a?.priority) || 4) - (Number(b?.priority) || 4))
  }, [cards, sortActive])

  return (
    <div ref={setNodeRef} className={cn("min-w-[400px] max-w-[500px] flex-1 flex flex-col gap-4 transition-all h-full max-h-full", isOver ? "opacity-80" : "opacity-100")}>
      <div className="flex items-center justify-between pb-2 border-b border-border/50">
        <h3 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-foreground/80">
          {column.name} <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-md font-mono text-[9px]">{cards.length}</span>
        </h3>
      </div>
      
      <div className="flex flex-col gap-4 overflow-y-auto flex-1 pr-2 custom-scrollbar">
        {sortedCards.map((card) => (
          card && (
            <div key={card.id} className="animate-in slide-in-from-bottom-2 fade-in duration-300">
              <DraggableCard 
                card={card} 
                memos={memos} 
                onDelete={() => onDeleteCard(card.id)} 
                onArchive={() => onArchiveCard(card.id)}
                onClick={() => onCardClick?.(card)} 
              />
            </div>
          )
        ))}
        {cards.length === 0 && !isOver && (
          <div className="h-24 border border-dashed border-border/50 rounded-xl flex items-center justify-center bg-transparent">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/30">No tasks</p>
          </div>
        )}
      </div>
    </div>
  )
}

function DraggableCard({ card, memos, onDelete, onArchive, onClick }: { card: any, memos: any[], onDelete: () => void, onArchive: () => void, onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: `card-${card.id}` })
  
  const temporalStatus = useMemo(() => {
    if (!card.due_date) return null;
    const today = new Date(); today.setHours(0,0,0,0);
    const due = new Date(card.due_date); due.setHours(0,0,0,0);
    if (due < today) return 'OVERDUE';
    if (due.getTime() === today.getTime()) return 'TODAY';
    return 'FUTURE';
  }, [card.due_date]);

  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 100 } : undefined
  if (isDragging) return <div ref={setNodeRef} className="h-24 rounded-xl border border-dashed border-primary/20 bg-primary/5" />
  
  const action = card.action_type ? ACTIONS.find(a => a.id === card.action_type) : null
  const ActionIcon = action?.icon || null
  const priorityInfo = PRIORITY_MAP[Number(card.priority)] || PRIORITY_MAP[4]
  const PriIcon = priorityInfo?.icon

  return (
    <div 
      ref={setNodeRef} style={style} {...listeners} {...attributes} onClick={onClick}
      className={cn(
        "p-5 rounded-xl border border-border/50 bg-card shadow-sm hover:shadow-md transition-all group relative cursor-grab active:cursor-grabbing select-none flex flex-col gap-4", 
        card.color ? CARD_COLORS[card.color] : "",
        temporalStatus === 'OVERDUE' && "border-red-100"
      )}
    >
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button 
          onPointerDown={(e) => e.stopPropagation()} 
          onClick={(e) => { e.stopPropagation(); onArchive(); }} 
          className="p-1.5 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-md transition-colors"
          title="Archive"
        >
          <Archive size={14} />
        </button>
        <button 
          onPointerDown={(e) => e.stopPropagation()} 
          onClick={(e) => { e.stopPropagation(); onDelete(); }} 
          className="p-1.5 hover:bg-red-50 text-muted-foreground hover:text-red-500 rounded-md transition-colors"
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
        <div className="p-1.5 text-muted-foreground/20 cursor-grab">
          <GripVertical size={14} />
        </div>
      </div>

      <div className="flex items-start gap-4">
        {ActionIcon && (
          <div className={cn("p-2.5 rounded-lg shrink-0 border border-border/50 bg-muted/30 text-muted-foreground/60")}>
            <ActionIcon size={16} />
          </div>
        )}
        <div className="flex flex-col gap-1.5 min-w-0 flex-1">
          <h4 className="font-semibold text-sm leading-tight text-foreground pr-8 break-words">
            {typeof card.title === 'string' && card.title.includes(' : ') ? (
              <>
                <span className="font-serif italic text-primary/70">{card.title.split(' : ')[0]}</span>
                <span className="text-muted-foreground/50 mx-1">/</span>
                {card.title.split(' : ')[1]}
              </>
            ) : (card.title || 'Untitled Task')}
          </h4>
          {card.description && <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{card.description}</p>}
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-2">
          <div className={cn("px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-tighter flex items-center gap-1.5 border border-border/50", priorityInfo.color)}>
            {PriIcon && <PriIcon size={12} />} {priorityInfo.label}
          </div>
          {card.due_date && (
            <div className={cn("px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-tighter flex items-center gap-1.5 border border-border/50", temporalStatus === 'OVERDUE' ? "bg-red-50 text-red-600 border-red-100" : temporalStatus === 'TODAY' ? "bg-orange-50 text-orange-600 border-orange-100" : "bg-muted text-muted-foreground")}>
              <Clock size={12} /> {new Date(card.due_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
            </div>
          )}
          {card.recurrence && (
            <div className="px-2.5 py-1 rounded-md text-[9px] font-bold bg-primary/5 text-primary/60 border border-primary/10 uppercase tracking-widest flex items-center gap-1.5">
              <RotateCcw size={10} /> {card.recurrence}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
