"use client"

import { useMemo } from 'react'
import { Sparkles, Calendar, CheckCircle2, Circle, Activity, ChevronRight, Zap, StickyNote } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MemoCard } from '../memos/MemoCard'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

interface DailyFocusProps {
  memos: any[]
  cards: any[]
  columns: any[]
  stats?: Record<string, number>
  onUpdateMemo: (id: number, content: string) => void
  onDeleteMemo: (id: number) => void
  onToggleTask: (cardId: number, columnId: number) => void
  onBacklinkClick: (title: string) => void
  onViewStats?: () => void
}

export function DailyFocus({ memos, cards, columns, stats = {}, onUpdateMemo, onDeleteMemo, onToggleTask, onBacklinkClick, onViewStats }: DailyFocusProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().split('T')[0]

  const doneColumn = useMemo(() => columns.find(c => c.name === 'Done'), [columns])
  const todoColumn = useMemo(() => columns.find(c => c.name === 'To Do'), [columns])

  const todayMemos = useMemo(() => {
    return memos.filter(m => {
      if (!m.created_at || m.archived) return false
      const d = new Date(m.created_at)
      d.setHours(0, 0, 0, 0)
      return d.toISOString().split('T')[0] === todayStr
    })
  }, [memos, todayStr])

  const todayCards = useMemo(() => {
    const now = new Date()
    const currentDay = now.getDay()
    
    return cards.filter(c => {
      if (c.archived) return false
      
      if (c.recurrence === 'daily') return true
      
      if (c.recurrence === 'weekly') {
        const dateToCompare = c.due_date || c.created_at
        if (!dateToCompare) return false
        // Compare only the day of the week
        return new Date(dateToCompare).getDay() === currentDay
      }

      // One-time tasks
      if (!c.due_date) return false
      const d = new Date(c.due_date)
      d.setHours(0, 0, 0, 0)
      return d.toISOString().split('T')[0] === todayStr
    })
  }, [cards, todayStr])

  const finishedCards = useMemo(() => {
    if (!doneColumn) return []
    return todayCards.filter(c => c.column_id === doneColumn.id)
  }, [todayCards, doneColumn])

  const progress = todayCards.length > 0 ? (finishedCards.length / todayCards.length) * 100 : 0

  const weekDays = useMemo(() => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      days.push({ key, label: d.toLocaleDateString(undefined, { weekday: 'narrow' }), count: stats[key] || 0 })
    }
    return days
  }, [stats])

  return (
    <div className="flex-1 overflow-y-auto bg-background p-12 custom-scrollbar">
      <div className="max-w-4xl mx-auto space-y-16 animate-in fade-in duration-1000 slide-in-from-bottom-4">
        {/* Header */}
        <header className="flex justify-between items-end">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary font-serif italic text-lg tracking-tight">
              <Sparkles size={18} />
              Daily Focus
            </div>
            <h1 className="text-6xl font-serif font-medium tracking-tighter text-foreground italic">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
            </h1>
          </div>
          
          {/* Momentum Strip */}
          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-3">
              <button 
                onClick={onViewStats}
                className="text-[10px] font-bold uppercase tracking-widest text-primary/60 hover:text-primary flex items-center gap-1 transition-colors group/stats"
              >
                Full Statistics <ChevronRight size={10} className="group-hover/stats:translate-x-0.5 transition-transform" />
              </button>
              <div className="h-2 w-px bg-border/50" />
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                <Activity size={12} /> Momentum
              </div>
            </div>
            <div className="flex gap-1.5">
              {weekDays.map(day => (
                <div key={day.key} className="flex flex-col items-center gap-1.5">
                  <div 
                    className={cn(
                      "size-3.5 rounded-[3px] transition-all border",
                      day.count > 0 ? "bg-primary border-primary shadow-sm" : "bg-muted border-border/50",
                      day.key === todayStr && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                    )}
                    title={`${day.count} nodes on ${day.key}`}
                  />
                  <span className="text-[8px] font-bold text-muted-foreground uppercase">{day.label}</span>
                </div>
              ))}
            </div>
          </div>
        </header>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Progress Card */}
          <Card className="col-span-full border-border/60 shadow-sm transition-all hover:shadow-md group overflow-hidden bg-card">
            <CardHeader className="p-10 pb-2 flex flex-row items-end justify-between">
              <div className="space-y-1">
                <CardDescription className="text-[10px] font-bold uppercase tracking-[0.2em]">Execution Rate</CardDescription>
                <CardTitle className="text-3xl font-serif font-medium italic">{finishedCards.length} of {todayCards.length} tasks completed</CardTitle>
              </div>
              <div className="text-right">
                <span className="text-6xl font-serif italic text-primary group-hover:scale-110 transition-transform inline-block origin-right">{Math.round(progress)}%</span>
              </div>
            </CardHeader>
            <CardContent className="p-10 pt-6">
              <Progress value={progress} className="h-1.5 bg-muted/50" />
            </CardContent>
          </Card>

          {/* Today's Tasks */}
          <div className="md:col-span-2 space-y-8">
            <div className="flex items-center gap-3 px-2">
              <Zap size={16} className="text-muted-foreground/60" />
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Today's Tasks</h3>
            </div>
            
            <div className="space-y-3">
              {todayCards.length === 0 ? (
                <Card className="border-dashed border-2 bg-muted/5">
                  <CardContent className="p-12 flex flex-col items-center justify-center text-muted-foreground/30">
                    <p className="text-sm font-medium italic font-serif">No tasks scheduled.</p>
                  </CardContent>
                </Card>
              ) : (
                todayCards.map(card => {
                  const isDone = doneColumn && card.column_id === doneColumn.id
                  return (
                    <Card key={card.id} className="border-border/50 hover:border-primary/20 transition-all shadow-sm group">
                      <CardContent className="p-6 flex items-center justify-between">
                        <div className="flex items-center gap-5">
                          <button
                            onClick={() => {
                              if (isDone && todoColumn) onToggleTask(card.id, todoColumn.id)
                              else if (!isDone && doneColumn) onToggleTask(card.id, doneColumn.id)
                            }}
                            className={cn(
                              "size-10 rounded-xl border transition-all flex items-center justify-center hover:scale-105 active:scale-95 shadow-sm",
                              isDone ? "bg-primary text-background border-primary" : "bg-muted/50 text-muted-foreground/40 border-border hover:border-primary/20"
                            )}
                          >
                            {isDone ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                          </button>
                          <div className="flex flex-col gap-1">
                            <h4 className={cn("font-medium text-base transition-colors font-sans", isDone && "line-through text-muted-foreground/50")}>
                              {typeof card.title === 'string' && card.title.includes(' : ') ? (
                                <>
                                  <span className="font-serif italic text-primary/70">{card.title.split(' : ')[0]}</span>
                                  <span className="text-muted-foreground/30 mx-1.5">/</span>
                                  {card.title.split(' : ')[1]}
                                </>
                              ) : (card.title || 'Untitled Task')}
                            </h4>
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="text-[9px] uppercase tracking-[0.15em] py-0 px-2 h-4 border-border/50 text-muted-foreground/60 font-bold bg-muted/20 rounded-md">
                                {card.action_type || 'General'}
                              </Badge>
                              {card.recurrence && (
                                <Badge variant="secondary" className="text-[9px] uppercase tracking-[0.15em] py-0 px-2 h-4 bg-primary/5 text-primary/40 font-bold border-transparent rounded-md">
                                  {card.recurrence}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          </div>

          {/* Recent Memos */}
          <div className="space-y-8">
            <div className="flex items-center gap-3 px-2">
              <StickyNote size={16} className="text-muted-foreground/60" />
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Captured Today</h3>
            </div>

            <div className="space-y-4">
              {todayMemos.length === 0 ? (
                <Card className="border-dashed border-2 bg-muted/5">
                  <CardContent className="p-12 flex flex-col items-center justify-center text-muted-foreground/30">
                    <p className="text-sm font-medium text-center italic font-serif">Nothing yet.</p>
                  </CardContent>
                </Card>
              ) : (
                todayMemos.map(memo => (
                  <div key={memo.id} className="opacity-80 hover:opacity-100 transition-opacity">
                    <MemoCard 
                      memo={memo} 
                      cards={cards}
                      onUpdate={onUpdateMemo} 
                      onDelete={onDeleteMemo} 
                      onBacklinkClick={onBacklinkClick}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
