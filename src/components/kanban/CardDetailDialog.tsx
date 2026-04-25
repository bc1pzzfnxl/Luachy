import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, MessageSquare, Clock, AlertCircle, Save, Check, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CardDetailDialogProps {
  card: any | null
  memos: any[]
  isOpen: boolean
  onClose: () => void
  onUpdate: (id: number, data: any) => void
  onSelectMemo?: (date: string) => void
}

const PRIORITIES = [
  { id: 1, label: 'Urgent', color: 'bg-red-50 text-red-600 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/50' },
  { id: 2, label: 'High', color: 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/50' },
  { id: 3, label: 'Medium', color: 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50' },
  { id: 4, label: 'Low', color: 'bg-muted text-muted-foreground border-border' },
]

export function CardDetailDialog({ card, memos, isOpen, onClose, onUpdate, onSelectMemo }: CardDetailDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState(4)
  const [dueDate, setDueDate] = useState('')
  const [recurrence, setRecurrence] = useState<'daily' | 'weekly' | ''>('')
  const [selectedDay, setSelectedDay] = useState<number>(0)
  const [isSaved, setIsSaved] = useState(false)

  const DAYS = [
    { id: 1, label: 'Mon' },
    { id: 2, label: 'Tue' },
    { id: 3, label: 'Wed' },
    { id: 4, label: 'Thu' },
    { id: 5, label: 'Fri' },
    { id: 6, label: 'Sat' },
    { id: 0, label: 'Sun' },
  ]

  useEffect(() => {
    if (card && isOpen) {
      setTitle(card.title || '')
      setDescription(card.description || '')
      setPriority(card.priority || 4)
      setDueDate(card.due_date ? card.due_date.split('T')[0] : '')
      setRecurrence(card.recurrence || '')
      const day = card.due_date ? new Date(card.due_date).getDay() : new Date().getDay()
      setSelectedDay(day)
      setIsSaved(false)
    }
  }, [card, isOpen])

  if (!card || !isOpen) return null

  const handleSave = async () => {
    let finalDueDate = dueDate || null
    if (recurrence === 'weekly' && !dueDate) {
      const d = new Date()
      const currentDay = d.getDay()
      const diff = selectedDay - currentDay
      d.setDate(d.getDate() + diff)
      finalDueDate = d.toISOString().split('T')[0]
    }

    await onUpdate(card.id, {
      title,
      description,
      priority,
      due_date: finalDueDate,
      recurrence: recurrence || null
    })
    setIsSaved(true)
    setTimeout(() => {
      setIsSaved(false)
      onClose()
    }, 500)
  }

  const linkedMemos = memos.filter(m => m.content && m.content.includes(`[[${card.title}]]`))

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-card border shadow-xl rounded-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        <div className="p-8 border-b bg-muted/10 flex justify-between items-start">
          <div className="flex flex-col gap-2 flex-1">
            <div className="flex items-center gap-2">
               <span className="text-xs font-semibold bg-muted text-muted-foreground px-2 py-0.5 rounded-md uppercase tracking-widest">Task Detail</span>
               <span className="text-xs font-medium text-muted-foreground opacity-60">ID: {card.id}</span>
            </div>
            <input 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-2xl font-serif font-medium tracking-tight text-foreground bg-transparent border-b border-transparent focus:border-border outline-none transition-all w-full pr-12 mt-1"
              placeholder="Task Title"
            />
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-xl transition-colors text-muted-foreground">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-10 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="flex flex-col gap-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2"><AlertCircle size={14}/> Priority</span>
                <div className="flex gap-2">
                   {PRIORITIES.map((p) => (
                     <button
                       key={p.id}
                       onClick={() => setPriority(p.id)}
                       className={cn(
                         "flex-1 py-2 rounded-xl border text-xs font-medium transition-all shadow-sm",
                         priority === p.id ? cn(p.color, "ring-1 ring-primary border-primary") : "bg-card text-muted-foreground border-border hover:bg-muted"
                       )}
                     >
                       {p.label}
                     </button>
                   ))}
                </div>
             </div>
             <div className="flex flex-col gap-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2"><Clock size={14}/> Due Date</span>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full p-2 bg-muted/20 border rounded-xl outline-none focus:ring-1 focus:ring-primary text-sm font-medium transition-all shadow-sm text-foreground [color-scheme:light] dark:[color-scheme:dark]" />
             </div>
          </div>

          <div className="flex flex-col gap-3">
             <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">Repeat</span>
             <div className="flex gap-2">
                {[
                  { id: '', label: 'One-time' },
                  { id: 'daily', label: 'Daily' },
                  { id: 'weekly', label: 'Weekly' },
                ].map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setRecurrence(r.id as any)}
                    className={cn(
                      "flex-1 py-2 rounded-xl border text-xs font-medium transition-all shadow-sm",
                      recurrence === r.id ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:bg-muted"
                    )}
                  >
                    {r.label}
                  </button>
                ))}
             </div>
             
             {recurrence === 'weekly' && (
               <div className="flex gap-1.5 flex-wrap mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                 {DAYS.map((day) => (
                   <button
                     key={day.id}
                     onClick={() => setSelectedDay(day.id)}
                     className={cn(
                       "flex-1 min-w-[50px] py-1.5 rounded-lg border text-[10px] font-bold uppercase transition-all",
                       selectedDay === day.id ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-card text-muted-foreground hover:bg-muted"
                     )}
                   >
                     {day.label}
                   </button>
                 ))}
               </div>
             )}
          </div>

          <div className="flex flex-col gap-3">
             <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Description</span>
             <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add details..." className="w-full min-h-[120px] p-4 bg-muted/20 border rounded-xl outline-none focus:ring-1 focus:ring-primary text-sm leading-relaxed font-sans shadow-sm resize-none text-foreground" />
          </div>

          <div className="flex flex-col gap-4 mt-2">
            <div className="flex items-center gap-3">
               <MessageSquare size={16} className="text-muted-foreground" />
               <h4 className="text-sm font-semibold text-foreground">Linked Notes ({linkedMemos.length})</h4>
               <div className="h-px bg-border flex-1" />
            </div>
            <div className="flex flex-col gap-3">
              {linkedMemos.length === 0 ? (
                <div className="py-8 border border-dashed rounded-xl flex flex-col items-center gap-2 bg-transparent opacity-60">
                   <p className="text-sm text-muted-foreground text-center">No linked notes.</p>
                </div>
              ) : (
                linkedMemos.map((memo) => (
                  <div key={memo.id} className="p-4 rounded-xl border bg-card shadow-sm flex flex-col gap-2 group hover:border-border/80 transition-all">
                     <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-muted-foreground">{new Date(memo.created_at).toLocaleDateString()}</span>
                        <button 
                          onClick={() => {
                            onSelectMemo?.(memo.created_at.split('T')[0]);
                            onClose();
                          }}
                          className="p-1.5 hover:bg-muted text-muted-foreground hover:text-primary rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          title="View in Journal"
                        >
                          <ExternalLink size={14} />
                        </button>
                     </div>
                     <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">{memo.content.replace(`[[${card.title}]]`, '')}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t bg-muted/10 flex justify-between items-center">
           <div className="flex items-center gap-2">
              {isSaved ? (
                <span className="text-sm font-medium text-emerald-600 flex items-center gap-1.5"><Check size={16} /> Saved</span>
              ) : (
                <span className="text-sm text-muted-foreground">Unsaved changes</span>
              )}
           </div>
           <div className="flex gap-3">
              <button onClick={onClose} className="px-5 py-2.5 bg-card border rounded-xl font-medium text-sm hover:bg-muted transition-colors shadow-sm text-foreground">Discard</button>
              <button onClick={handleSave} className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:opacity-90 shadow-sm flex items-center gap-2"><Save size={16} /> Save Task</button>
           </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
