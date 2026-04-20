import { useState, useMemo, useEffect, useRef } from 'react'
import { Search, StickyNote, Layout as KanbanIcon, ArrowRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchOverlayProps {
  isOpen: boolean
  onClose: () => void
  memos: any[]
  cards: any[]
  onSelectMemo: (date: string) => void
  onSelectCard: (card: any) => void
}

export function SearchOverlay({ isOpen, onClose, memos, cards, onSelectMemo, onSelectCard }: SearchOverlayProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const results = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    
    const memoResults = memos
      .filter(m => m.content.toLowerCase().includes(q))
      .map(m => ({ type: 'memo', id: m.id, content: m.content, date: m.created_at.split('T')[0] }))
    
    const cardResults = cards
      .filter(c => c.title.toLowerCase().includes(q))
      .map(c => ({ type: 'card', id: c.id, title: c.title, card: c }))
    
    return [...memoResults, ...cardResults].slice(0, 10)
  }, [query, memos, cards])

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % Math.max(results.length, 1))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + results.length) % Math.max(results.length, 1))
      }
      if (e.key === 'Enter' && results[selectedIndex]) {
        const res = results[selectedIndex] as any
        if (res.type === 'memo') onSelectMemo(res.date)
        else onSelectCard(res.card)
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [results, selectedIndex, onClose, onSelectMemo, onSelectCard])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-card border shadow-2xl rounded-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-top-4 duration-300 flex flex-col max-h-[60vh]">
        <div className="p-4 border-b flex items-center gap-4 bg-muted/20">
          <Search className="text-muted-foreground" size={20} />
          <input 
            ref={inputRef}
            className="flex-1 bg-transparent border-none outline-none text-base font-medium placeholder:text-muted-foreground/50"
            placeholder="Search notes and tasks..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
          />
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-xl text-muted-foreground transition-colors"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
          {results.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground/30 flex flex-col items-center gap-2">
              <Search size={32} strokeWidth={1.5} />
              <p className="text-sm font-medium">{query.trim() ? `No results found for "${query}"` : 'Type to search...'}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {results.map((res: any, i) => (
                <button
                  key={`${res.type}-${res.id}`}
                  onClick={() => {
                    if (res.type === 'memo') onSelectMemo(res.date)
                    else onSelectCard(res.card)
                    onClose()
                  }}
                  className={cn(
                    "w-full p-4 rounded-xl flex items-center justify-between text-left transition-all border border-transparent",
                    selectedIndex === i ? "bg-primary/5 border-primary/10 shadow-sm" : "hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={cn(
                      "p-2 rounded-lg border",
                      res.type === 'memo' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-indigo-50 text-indigo-600 border-indigo-100"
                    )}>
                      {res.type === 'memo' ? <StickyNote size={16} /> : <KanbanIcon size={16} />}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold truncate text-foreground">
                        {res.type === 'memo' ? res.content.substring(0, 60) + (res.content.length > 60 ? '...' : '') : res.title}
                      </span>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                        {res.type === 'memo' ? `Note • ${res.date}` : `Task • ${res.card.action_type || 'General'}`}
                      </span>
                    </div>
                  </div>
                  {selectedIndex === i && <ArrowRight size={16} className="text-primary animate-in slide-in-from-left-2 duration-200" />}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-3 border-t bg-muted/30 flex justify-between items-center px-6">
          <div className="flex gap-4">
             <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase">
                <span className="px-1 py-0.5 bg-muted border rounded text-[8px]">↑↓</span> Navigate
             </div>
             <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase">
                <span className="px-1 py-0.5 bg-muted border rounded text-[8px]">↵</span> Select
             </div>
          </div>
          <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">{results.length} Results</p>
        </div>
      </div>
    </div>
  )
}
