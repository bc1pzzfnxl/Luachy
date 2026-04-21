import { useState, useRef, useEffect, useMemo } from 'react'
import { 
  Plus, ShoppingCart, Lightbulb, 
  PenTool, BadgeEuro, Zap, CalendarDays, Search, X, Loader2, StickyNote, Download, Home, Church
} from 'lucide-react'
import { MemoCard } from './MemoCard'
import { cn } from '@/lib/utils'
import { useToast } from '../ui/ToastProvider'

const QUICK_PREFIXES = [
  { label: 'Buy', value: 'Buy : ', icon: ShoppingCart },
  { label: 'Sell', value: 'Sell : ', icon: BadgeEuro },
  { label: 'Learn', value: 'Learn : ', icon: Lightbulb },
  { label: 'Write', value: 'Write : ', icon: PenTool },
  { label: 'Idea', value: 'Idea : ', icon: Zap },
  { label: 'Install', value: 'Install : ', icon: Download },
  { label: 'Home', value: 'Home : ', icon: Home },
  { label: 'Theology', value: 'Theology : ', icon: Church },
]

interface MemoTimelineProps {
  memos: any[]
  cards?: any[]
  loading: boolean
  onAddMemo: (content: string, images?: string[]) => void
  onUpdateMemo: (id: number, content: string) => void
  onDeleteMemo: (id: number) => void
  onSearchMemos: (query: string) => void
  onBacklinkClick?: (title: string) => void
  onUploadFile: (file: File) => Promise<string | null>
  scrollToDate?: string | null
}

export function MemoTimeline({ 
  memos = [], 
  cards = [], 
  loading, 
  onAddMemo, 
  onUpdateMemo, 
  onDeleteMemo, 
  onSearchMemos, 
  onBacklinkClick, 
  onUploadFile, 
  scrollToDate 
}: MemoTimelineProps) {
  const { toast } = useToast()
  const [input, setInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showBacklinks, setShowBacklinks] = useState(false)
  const [pendingImages, setPendingImages] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [editingMemoId, setEditingMemoId] = useState<number | null>(null)
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0)
  
  const backlinkRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)

  const suggestion = useMemo(() => {
    if (!input || input.includes(':')) return null
    return QUICK_PREFIXES.find(p => p.label.toLowerCase().startsWith(input.toLowerCase())) || null
  }, [input])

  const groupedMemos = useMemo(() => {
    const groups: Record<string, any[]> = {}
    const memoArray = Array.isArray(memos) ? memos : []
    if (memoArray.length === 0) return groups
    const sorted = [...memoArray].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    sorted.forEach(memo => {
      if (!memo || !memo.created_at) return
      const d = new Date(memo.created_at)
      const key = `${d.getFullYear()}-W${getWeekNumber(d)}`
      if (!groups[key]) groups[key] = []
      groups[key].push(memo)
    })
    return groups
  }, [memos])

  const backlinkSuggestions = useMemo(() => {
    const lastOpen = input.lastIndexOf('[[');
    if (lastOpen === -1) return [];
    const query = input.substring(lastOpen + 2).toLowerCase();
    if (input.substring(lastOpen).includes(']]')) return [];
    return (cards || []).filter(c => c.title.toLowerCase().includes(query)).slice(0, 5);
  }, [input, cards]);

  useEffect(() => {
    const lastTwo = input.slice(-2);
    const isOpen = lastTwo === '[[' || (input.includes('[[') && !input.substring(input.lastIndexOf('[[')).includes(']]'));
    setShowBacklinks(isOpen);
    if (isOpen) setActiveSuggestionIndex(0);
  }, [input]);

  useEffect(() => {
    const timer = setTimeout(() => { onSearchMemos(searchQuery) }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    if (scrollToDate) {
      const element = document.getElementById(`memo-date-${scrollToDate}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        element.classList.add('animate-soft-pulse', 'rounded-2xl')
        setTimeout(() => element.classList.remove('animate-soft-pulse'), 2500)
      }
    }
  }, [scrollToDate])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [input])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (backlinkRef.current && !backlinkRef.current.contains(event.target as Node)) setShowBacklinks(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleAdd = () => {
    if (!input.trim() || loading || isUploading) return
    onAddMemo(input, pendingImages)
    setInput('')
    setPendingImages([])
  }

  const insertBacklink = (title: string) => {
    const lastOpen = input.lastIndexOf('[[');
    const newInput = input.substring(0, lastOpen) + `[[${title}]] `;
    setInput(newInput);
    setShowBacklinks(false);
    textareaRef.current?.focus();
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showBacklinks && backlinkSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveSuggestionIndex(prev => (prev + 1) % backlinkSuggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveSuggestionIndex(prev => (prev - 1 + backlinkSuggestions.length) % backlinkSuggestions.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertBacklink(backlinkSuggestions[activeSuggestionIndex].title);
        return;
      }
      if (e.key === 'Escape') {
        setShowBacklinks(false);
        return;
      }
    }

    if ((e.key === 'Tab' || e.key === 'ArrowRight') && suggestion && !input.includes(':')) {
      e.preventDefault()
      setInput(suggestion.value)
    }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAdd()
  }

  return (
    <section className="flex flex-col bg-background shrink-0 h-full w-full">
      <div className="max-w-4xl mx-auto w-full flex flex-col h-full">
        <header className="px-8 py-10 flex justify-between items-end border-b border-border/50">
          <div>
            <h2 className="text-2xl font-serif font-medium tracking-tight">Journal</h2>
            <p className="text-xs text-muted-foreground mt-1 font-medium">{memos.length} notes captured</p>
          </div>
        </header>
        
        <div 
          className="p-6 flex flex-col gap-8 overflow-y-auto flex-1 custom-scrollbar" 
          ref={timelineRef} 
          onDragOver={(e) => e.preventDefault()} 
          onDrop={async (e) => {
            e.preventDefault();
            const files = Array.from(e.dataTransfer.files);
            if (files.length > 0) {
              setIsUploading(true);
              for (const file of files) {
                if (file.type.startsWith('image/')) {
                  const filename = await onUploadFile(file);
                  if (filename) setPendingImages(prev => [...prev, filename]);
                }
              }
              setIsUploading(false);
            }
          }}
        >
          <div className="relative group/search">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input 
              placeholder="Search notes..." 
              className="w-full pl-11 pr-4 py-3 bg-muted/30 border-none rounded-xl text-sm outline-none focus:ring-1 focus:ring-border transition-all" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
          </div>

          <div className="flex flex-col gap-2 relative">
            <div className="flex gap-2 flex-wrap mb-2">
              {QUICK_PREFIXES.map((p) => (
                <button 
                  key={p.label} 
                  onClick={() => setInput(p.value)} 
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium border border-border/50 transition-all", 
                    suggestion?.label === p.label ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground hover:bg-muted"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="relative group">
              <textarea 
                ref={textareaRef} 
                placeholder="Write a new note..." 
                className="w-full min-h-[120px] p-5 pb-16 rounded-2xl border border-border bg-card resize-none focus:ring-1 focus:ring-primary outline-none transition-all disabled:opacity-50 overflow-hidden text-sm leading-relaxed" 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                onKeyDown={handleKeyDown} 
              />
              
              {showBacklinks && backlinkSuggestions.length > 0 && (
                <div ref={backlinkRef} className="absolute bottom-full left-0 mb-2 w-full bg-card border border-border shadow-xl rounded-xl p-2 z-50">
                   <div className="px-2 py-1 mb-2 flex items-center justify-between border-b border-border/50">
                     <span className="text-xs font-semibold text-muted-foreground">Link a task</span>
                     <kbd className="text-[10px] px-1.5 bg-muted rounded border border-border/50 font-mono">TAB</kbd>
                   </div>
                   {backlinkSuggestions.map((card, i) => (
                     <button 
                       key={card.id} 
                       onClick={() => insertBacklink(card.title)} 
                       onMouseEnter={() => setActiveSuggestionIndex(i)}
                       className={cn(
                         "w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors truncate",
                         activeSuggestionIndex === i ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-muted"
                       )}
                     >
                       {card.title}
                     </button>
                   ))}
                </div>
              )}

              {pendingImages.length > 0 && (
                <div className="flex gap-3 p-3 bg-muted/30 border-t border-border/50">
                  {pendingImages.map((img, i) => (
                    <div key={i} className="relative group/img w-16 h-16 rounded-xl overflow-hidden border border-border/50">
                      <img src={`/assets/${img}`} className="w-full h-full object-cover" />
                      <button 
                        onClick={() => setPendingImages(prev => prev.filter((_, idx) => idx !== i))} 
                        className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <button 
                onClick={handleAdd} 
                disabled={!input.trim() || isUploading} 
                className="absolute bottom-4 right-4 p-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
              >
                {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-12 mt-4">
            {Object.entries(groupedMemos).length === 0 && !loading && (
               <div className="py-16 text-center text-muted-foreground flex flex-col items-center gap-3">
                 <StickyNote size={32} className="opacity-10" />
                 <p className="text-sm font-medium uppercase tracking-widest">{searchQuery ? "No results found" : "Journal is empty"}</p>
               </div>
            )}
            {Object.entries(groupedMemos).map(([weekKey, weekMemos]) => (
              <div key={weekKey} className="flex flex-col gap-8">
                <div className="flex items-center gap-4">
                  <div className="h-px bg-border/50 flex-1" />
                  <div className="flex items-center gap-2">
                    <CalendarDays size={14} className="text-muted-foreground" />
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Week {weekKey.split('W')[1]}</span>
                  </div>
                  <div className="h-px bg-border/50 flex-1" />
                </div>
                {groupMemosByDay(weekMemos).map(({ dayLabel, dateKey, items }) => (
                  <div key={dateKey} id={`memo-date-${dateKey}`} className="flex flex-col gap-5">
                     <h3 className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest pl-2">{dayLabel}</h3>
                     <div className="flex flex-col gap-4">
                        {items.map(memo => (
                          <MemoCard 
                            key={memo.id} memo={memo} 
                            cards={cards}
                            onDelete={(id) => onDeleteMemo(id)} 
                            onUpdate={(id, content) => onUpdateMemo(id, content)}
                            onBacklinkClick={onBacklinkClick}
                            isEditingExternally={editingMemoId === memo.id}
                            onEditingChange={(isEditing) => setEditingMemoId(isEditing ? memo.id : null)}
                          />
                        ))}
                     </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function getWeekNumber(d: Date) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

function groupMemosByDay(memos: any[]) {
  const groups: Record<string, any[]> = {}
  memos.forEach(m => {
    if (!m || !m.created_at) return
    const d = new Date(m.created_at)
    const key = d.toISOString().split('T')[0]
    if (!groups[key]) groups[key] = []
    groups[key].push(m)
  })
  return Object.entries(groups).map(([dateKey, items]) => {
    const d = new Date(dateKey)
    const dayLabel = d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    return { dayLabel, dateKey, items }
  }).sort((a, b) => b.dateKey.localeCompare(a.dateKey))
}
