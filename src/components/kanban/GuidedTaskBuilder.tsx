import { useState, useEffect, useRef } from 'react'
import { 
  X, ArrowRight, Sparkles, Calendar, AlignLeft,
  ChevronRight, ChevronLeft
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '../ui/ToastProvider'
import { ACTIONS, COLOR_MAP_WIZARD, PRIORITY_MAP } from '@/lib/constants'

const PRIORITIES = [
  { id: 1, label: 'Urgent', color: 'bg-red-50 text-red-600 border-red-100', icon: PRIORITY_MAP[1].icon },
  { id: 2, label: 'High', color: 'bg-orange-50 text-orange-600 border-orange-100', icon: PRIORITY_MAP[2].icon },
  { id: 3, label: 'Medium', color: 'bg-blue-50 text-blue-600 border-blue-100', icon: PRIORITY_MAP[3].icon },
  { id: 4, label: 'Low', color: 'bg-muted text-muted-foreground border-border', icon: PRIORITY_MAP[4].icon },
]

interface GuidedTaskBuilderProps {
  isOpen: boolean
  onClose: () => void
  onCreateTask: (title: string, color: string, actionType: string, priority: number, dueDate?: string, description?: string, recurrence?: string) => void
  initialTarget?: string
}

export function GuidedTaskBuilder({ isOpen, onClose, onCreateTask, initialTarget = '' }: GuidedTaskBuilderProps) {
  const [step, setStep] = useState(1)
  const [selectedAction, setSelectedAction] = useState<any>(null)
  const [target, setTarget] = useState(initialTarget)
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState(4)
  const [dueDate, setDueDate] = useState('')
  const [recurrence, setRecurrence] = useState<'daily' | 'weekly' | ''>('')
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay())
  const { toast } = useToast()
  const notifiedRef = useRef(false)

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
    if (isOpen) {
      setTarget(initialTarget)
      if (initialTarget && !notifiedRef.current) {
        toast(`Promoting "${initialTarget}" to task`, "info")
        notifiedRef.current = true
      }
    } else {
      notifiedRef.current = false
    }
  }, [isOpen, initialTarget, toast])

  if (!isOpen) return null

  const handleActionSelect = (action: any) => {
    setSelectedAction(action)
    setStep(2)
  }

  const handleFinish = () => {
    if (!target.trim() || !selectedAction) return
    
    // For weekly, we use a reference date that matches the selected day if no date is picked
    let finalDueDate = dueDate || undefined
    if (recurrence === 'weekly' && !dueDate) {
      const d = new Date()
      const currentDay = d.getDay()
      const diff = selectedDay - currentDay
      d.setDate(d.getDate() + diff)
      finalDueDate = d.toISOString().split('T')[0]
    }

    onCreateTask(
      `${selectedAction.label} : ${target.trim()}`, 
      selectedAction.color, 
      selectedAction.id, 
      priority, 
      finalDueDate,
      description.trim() || undefined,
      recurrence || undefined
    )
    handleClose()
  }

  const handleClose = () => {
    setStep(1)
    setSelectedAction(null)
    setTarget('')
    setDescription('')
    setPriority(4)
    setDueDate('')
    setRecurrence('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={handleClose} />
      
      <div className="relative bg-card border shadow-xl rounded-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b flex justify-between items-center bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary text-primary-foreground rounded-xl shadow-sm">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-lg font-serif font-medium tracking-tight">New Task</h3>
              <p className="text-xs font-medium text-muted-foreground">Step {step} of 3</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-muted rounded-xl text-muted-foreground transition-colors"><X size={20} /></button>
        </div>

        <div className="p-8 min-h-[450px] flex flex-col bg-card">
          {step === 1 && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-200">
              <h4 className="text-xl font-serif font-medium text-center text-foreground">Select an action</h4>
              <div className="grid grid-cols-4 gap-4 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
                {ACTIONS.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleActionSelect(action)}
                    className="flex flex-col items-center gap-3 p-4 rounded-2xl border bg-card hover:border-border hover:shadow-sm transition-all group"
                  >
                    <div className={cn("p-3 rounded-xl transition-transform border", COLOR_MAP_WIZARD[action.color])}>
                      <action.icon size={24} />
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && selectedAction && (
            <div className="flex flex-col gap-8 animate-in slide-in-from-right-4 duration-200">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg border", COLOR_MAP_WIZARD[selectedAction.color])}><selectedAction.icon size={16} /></div>
                <span className="text-sm font-semibold text-foreground">{selectedAction.label}...</span>
              </div>
              
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Target</label>
                  <input 
                    autoFocus
                    placeholder="What or Where?"
                    className="w-full p-4 rounded-xl border bg-muted/20 text-base font-medium outline-none focus:ring-1 focus:ring-primary transition-all shadow-sm"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && setStep(3)}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <AlignLeft size={14}/> Description (Optional)
                  </label>
                  <textarea 
                    placeholder="Add context, details or sub-tasks..."
                    className="w-full h-32 p-4 rounded-xl border bg-muted/20 outline-none focus:ring-1 focus:ring-primary transition-all resize-none text-sm font-sans leading-relaxed shadow-sm"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-auto pt-4">
                <button onClick={() => setStep(3)} disabled={!target.trim()} className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm">
                  Next Step <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-8 animate-in slide-in-from-right-4 duration-200 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
              <div className="flex flex-col gap-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Priority</h4>
                <div className="grid grid-cols-4 gap-3">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPriority(p.id)}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                        priority === p.id ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm" : "bg-card hover:bg-muted"
                      )}
                    >
                      <div className={cn("p-2 rounded-lg border", priority === p.id ? p.color : "bg-background text-muted-foreground border-transparent")}>
                        <p.icon size={16} />
                      </div>
                      <span className="text-xs font-semibold">{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Repeat</h4>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: '', label: 'One-time' },
                    { id: 'daily', label: 'Daily' },
                    { id: 'weekly', label: 'Weekly' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setRecurrence(r.id as any)}
                      className={cn(
                        "py-2 rounded-lg border text-xs font-medium transition-all",
                        recurrence === r.id ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-card text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {recurrence === 'weekly' && (
                <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Day</h4>
                  <div className="flex gap-1.5 flex-wrap">
                    {DAYS.map((day) => (
                      <button
                        key={day.id}
                        onClick={() => setSelectedDay(day.id)}
                        className={cn(
                          "flex-1 min-w-[50px] py-2 rounded-lg border text-[10px] font-bold uppercase transition-all",
                          selectedDay === day.id ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-card text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {recurrence === '' && (
                <div className="flex flex-col gap-4 animate-in fade-in duration-200">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Due Date (Optional)</h4>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input 
                      type="date"
                      className="w-full p-4 pl-12 rounded-xl border bg-muted/20 outline-none focus:ring-1 focus:ring-primary transition-all text-sm font-medium shadow-sm"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="mt-auto pt-6 flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 py-3.5 rounded-xl border font-semibold text-sm hover:bg-muted transition-colors flex items-center justify-center gap-2">
                  <ChevronLeft size={16}/> Back
                </button>
                <button onClick={handleFinish} className="flex-[2] py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition-all shadow-sm flex items-center justify-center gap-2">
                  Create Task <Sparkles size={16} />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
