import { useMemo, useState } from 'react'
import { CalendarDays, Info, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ActivityCalendarProps {
  stats: Record<string, number>
  cards?: any[]
  onDayClick?: (date: string) => void
  isSidebar?: boolean
}

export function ActivityCalendar({ stats, cards = [], onDayClick, isSidebar = false }: ActivityCalendarProps) {
  const [viewDate, setViewDate] = useState(new Date())

  const calendarData = useMemo(() => {
    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()
    
    // First day of month
    const firstDay = new Date(year, month, 1)
    // Last day of month
    const lastDay = new Date(year, month + 1, 0)
    
    // Day of week for the first day (0-6, Sunday-Saturday)
    // Adjust to Monday start if desired, but default is fine for minimalist
    const startDay = firstDay.getDay()
    
    const days = []
    
    // Padding for previous month days
    for (let i = 0; i < startDay; i++) {
      days.push(null)
    }
    
    // Actual days
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d)
      const dateStr = date.toISOString().split('T')[0]
      days.push({
        day: d,
        date: dateStr,
        count: stats[dateStr] || 0,
        isToday: dateStr === new Date().toISOString().split('T')[0],
        hasTasks: cards.some(c => c.due_date && c.due_date.split('T')[0] === dateStr && !c.archived)
      })
    }
    
    return days
  }, [viewDate, stats, cards])

  const { weeks, maxCount } = useMemo(() => {
    const today = new Date()
    const weeks: { date: string, count: number, isToday: boolean, cardsDue: number }[][] = []
    let max = 0
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - (52 * 7))
    let currentWeek: any[] = []
    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      const count = stats[dateStr] || 0
      const cardsDue = cards.filter(c => c.due_date && c.due_date.split('T')[0] === dateStr).length
      if (count > max) max = count
      currentWeek.push({ date: dateStr, count, cardsDue, isToday: dateStr === today.toISOString().split('T')[0] })
      if (d.getDay() === 0 || d.getTime() === today.getTime()) {
        weeks.push(currentWeek)
        currentWeek = []
      }
    }
    return { weeks, maxCount: max || 1 }
  }, [stats, cards])

  const getColor = (count: number) => {
    if (count === 0) return 'bg-muted border-border/50'
    const intensity = count / maxCount
    if (intensity < 0.25) return 'bg-primary/10 border-primary/5 text-foreground/70'
    if (intensity < 0.5) return 'bg-primary/30 border-primary/10 text-foreground'
    if (intensity < 0.75) return 'bg-primary/60 border-primary/20 text-primary-foreground'
    return 'bg-primary border-primary/40 text-primary-foreground shadow-sm'
  }

  const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))
  const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))

  if (isSidebar) {
    return (
      <div className="flex flex-col gap-8 p-6 h-full w-full bg-background overflow-y-auto overflow-x-hidden custom-scrollbar transition-colors">
        <div className="flex flex-col gap-6 pt-4 w-full">
          <div className="flex items-center justify-between px-1 h-8 min-w-0">
            <h3 className="text-base font-serif font-semibold text-foreground tracking-tight truncate flex-1">
              {viewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex gap-1 shrink-0 ml-2">
              <button onClick={prevMonth} className="p-1.5 hover:bg-muted rounded-md transition-colors text-muted-foreground"><ChevronLeft size={18} /></button>
              <button onClick={nextMonth} className="p-1.5 hover:bg-muted rounded-md transition-colors text-muted-foreground"><ChevronRight size={18} /></button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
              <span key={d} className="text-[10px] font-bold text-muted-foreground/40 py-1 uppercase tracking-widest">{d}</span>
            ))}
            {calendarData.map((day, i) => (
              <div key={i} className="aspect-square flex items-center justify-center">
                {day ? (
                  <button
                    onClick={() => onDayClick?.(day.date)}
                    className={cn(
                      "w-full h-full text-xs font-semibold rounded-lg border transition-all relative group flex items-center justify-center",
                      getColor(day.count),
                      day.isToday && !day.count && "border-primary text-primary bg-primary/5",
                      day.isToday && day.count && "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105 z-10"
                    )}
                  >
                    {day.day}
                    {day.hasTasks && (
                      <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full border border-background shadow-sm" />
                    )}
                    <span className={cn(
                      "absolute bottom-full mb-3 px-3 py-2 bg-foreground text-background text-[10px] font-bold rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-y-1 group-hover:translate-y-0 z-[9999] shadow-2xl border border-border/20 whitespace-nowrap",
                      (i % 7 < 2) ? "left-0 translate-x-0" : (i % 7 > 4) ? "right-0 translate-x-0" : "left-1/2 -translate-x-1/2"
                    )}>
                      {day.count} notes — {new Date(day.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                    </span>
                  </button>
                ) : (
                  <span className="w-full h-full" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-6 mt-auto border-t pt-8">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
            <Info size={12} /> Dashboard
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <span className="text-xs text-muted-foreground">Total Units</span>
              <span className="font-serif text-lg font-medium leading-none">{Object.values(stats).reduce((a, b) => a + b, 0)}</span>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-xs text-muted-foreground">Active Tasks</span>
              <span className="font-serif text-lg font-medium leading-none">{cards.filter(c => !c.archived).length}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      <div className="px-8 py-10 border-b flex justify-between items-center bg-card shrink-0">
        <div>
          <h2 className="text-2xl font-serif font-medium tracking-tight text-foreground">Calendar</h2>
          <p className="text-sm text-muted-foreground mt-1 font-medium">Daily activity and task deadlines.</p>
        </div>
      </div>

      <div className="p-8 flex-1 overflow-auto bg-muted/20">
        <div className="max-w-4xl mx-auto bg-card border rounded-2xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <CalendarDays size={18} className="text-primary" />
            <h3 className="font-semibold text-lg">Activity Heatmap</h3>
          </div>
          
          <div className="flex gap-1.5 overflow-x-auto pb-4 custom-scrollbar">
            {weeks.map((week, i) => (
              <div key={i} className="flex flex-col gap-1.5 shrink-0">
                {week.map((day, j) => (
                  <button
                    key={day.date}
                    onClick={() => onDayClick?.(day.date)}
                    className={cn(
                      "w-3.5 h-3.5 rounded-sm border transition-all hover:scale-125 hover:z-10 relative group",
                      getColor(day.count),
                      day.isToday && "ring-2 ring-primary ring-offset-2 ring-offset-card"
                    )}
                  >
                    {day.cardsDue > 0 && (
                      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-card shadow-sm" />
                    )}
                    <span className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 px-3 py-2 bg-foreground text-background text-[10px] font-bold rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-y-1 group-hover:translate-y-0 z-[9999] shadow-2xl border border-border/20 whitespace-nowrap">
                      {day.count} notes — {new Date(day.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 mt-6 text-sm text-muted-foreground justify-end">
            <span>Less</span>
            <div className="w-3 h-3 rounded-sm bg-muted border border-border/50" />
            <div className="w-3 h-3 rounded-sm bg-primary/20 border border-primary/10" />
            <div className="w-3 h-3 rounded-sm bg-primary/40 border border-primary/20" />
            <div className="w-3 h-3 rounded-sm bg-primary/60 border border-primary/30" />
            <div className="w-3 h-3 rounded-sm bg-primary border border-primary/40 shadow-sm" />
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  )
}
