"use client"

import { useMemo } from 'react'
import { 
  Bar, BarChart, CartesianGrid, 
  Pie, PieChart, 
  XAxis, YAxis, Area, AreaChart,
  Label
} from 'recharts'
import { CheckCircle2, List, AlertCircle, TrendingUp, BarChart3, Zap, Trophy } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { ACTIONS, PRIORITY_MAP } from '@/lib/constants'

interface StatsViewProps {
  kanbanStats: any
}

const PRIORITY_COLORS: Record<number, string> = {
  1: 'oklch(0.577 0.245 27.325)', // Destructive/Red
  2: 'oklch(0.704 0.191 22.216)', // High/Orange
  3: 'oklch(0.556 0 0)', // Medium/Blue-grey
  4: 'oklch(0.708 0 0)', // Low/Light-grey
}

const PRIORITY_LABELS: Record<number, string> = {
  1: 'Urgent',
  2: 'High',
  3: 'Medium',
  4: 'Low',
}

const chartConfig = {
  completed: {
    label: "Completed",
    color: "var(--primary)",
  },
} satisfies ChartConfig

export function StatsView({ kanbanStats }: StatsViewProps) {
  const { total = 0, completed = 0, priorities = [], actions = [], history = [] } = kanbanStats || {}

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

  const priorityData = useMemo(() => {
    return [1, 2, 3, 4].map(p => {
      const found = priorities.find((x: any) => Number(x.priority) === p)
      return {
        priority: PRIORITY_LABELS[p].toLowerCase(),
        name: PRIORITY_LABELS[p],
        value: found ? found.c : 0,
        fill: PRIORITY_COLORS[p]
      }
    }).filter(x => x.value > 0)
  }, [priorities])

  const actionData = useMemo(() => {
    return actions.map((a: any) => ({
      category: a.action_type ? a.action_type.charAt(0).toUpperCase() + a.action_type.slice(1) : 'General',
      count: a.c,
      fill: "var(--primary)"
    })).sort((a: any, b: any) => b.count - a.count)
  }, [actions])

  const historyData = useMemo(() => {
    return history.map((h: any) => ({
      date: new Date(h.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      completed: h.count
    }))
  }, [history])

  const velocity = useMemo(() => {
    if (history.length === 0) return "0.0"
    const sum = history.reduce((acc: number, curr: any) => acc + curr.count, 0)
    return (sum / history.length).toFixed(1)
  }, [history])

  const topCategory = useMemo(() => {
    return actionData.length > 0 ? actionData[0].category : "None"
  }, [actionData])

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="px-8 py-10 border-b flex justify-between items-center bg-card shrink-0">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-primary font-serif italic text-lg tracking-tight">
            <BarChart3 size={18} />
            Statistics
          </div>
          <h2 className="text-4xl font-serif font-medium tracking-tighter text-foreground">
            Performance Overview
          </h2>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1">
            Data driven productivity insights
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-muted/20">
        <div className="max-w-6xl mx-auto flex flex-col gap-8 pb-12 animate-in fade-in duration-700 slide-in-from-bottom-2">
          
          {/* Top Row: Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            <StatCard 
              title="Execution" 
              value={`${completionRate}%`} 
              subtitle="Completion rate"
              icon={<CheckCircle2 className="text-emerald-500" size={18} />}
            />
            <StatCard 
              title="Momentum" 
              value={history.length > 0 ? history[history.length - 1].count : 0} 
              subtitle="Done today"
              icon={<Zap className="text-blue-500" size={18} />}
            />
            <StatCard 
              title="Velocity" 
              value={velocity} 
              subtitle="Avg daily done"
              icon={<TrendingUp className="text-indigo-500" size={18} />}
            />
            <StatCard 
              title="Top Type" 
              value={topCategory} 
              subtitle="Most active"
              icon={<Trophy className="text-rose-500" size={18} />}
            />
            <StatCard 
              title="Backlog" 
              value={total - completed} 
              subtitle="Pending tasks"
              icon={<List className="text-amber-500" size={18} />}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Completion History */}
            <Card className="rounded-2xl shadow-sm border-border/50 bg-card overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="grid gap-1">
                  <CardTitle className="text-lg font-serif italic">Activity History</CardTitle>
                  <CardDescription className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">Last 30 Days</CardDescription>
                </div>
                <TrendingUp size={16} className="text-muted-foreground/50" />
              </CardHeader>
              <CardContent className="pt-6">
                <ChartContainer config={chartConfig} className="h-64 w-full">
                  <AreaChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="fillCompleted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 9, fill: 'var(--muted-foreground)', fontWeight: 600 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 9, fill: 'var(--muted-foreground)', fontWeight: 600 }}
                    />
                    <ChartTooltip 
                      content={<ChartTooltipContent className="bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl" />} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="completed" 
                      stroke="var(--primary)" 
                      fill="url(#fillCompleted)" 
                      strokeWidth={2} 
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Category Breakdown */}
            <Card className="rounded-2xl shadow-sm border-border/50 bg-card overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="grid gap-1">
                  <CardTitle className="text-lg font-serif italic">Categories</CardTitle>
                  <CardDescription className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">Distribution by type</CardDescription>
                </div>
                <List size={16} className="text-muted-foreground/50" />
              </CardHeader>
              <CardContent className="pt-6">
                <ChartContainer config={chartConfig} className="h-64 w-full">
                  <BarChart data={actionData} layout="vertical" margin={{ left: 20, right: 20, top: 0, bottom: 0 }}>
                    <CartesianGrid horizontal={false} strokeDasharray="4 4" stroke="hsl(var(--border))" />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="category" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 9, fill: 'var(--muted-foreground)', fontWeight: 600 }}
                      width={80}
                    />
                    <ChartTooltip 
                      cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                      content={<ChartTooltipContent className="bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl" />} 
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20} animationDuration={1500} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Priority Distribution */}
            <Card className="rounded-2xl shadow-sm border-border/50 bg-card overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="grid gap-1">
                  <CardTitle className="text-lg font-serif italic">Priority Mix</CardTitle>
                  <CardDescription className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">Resource Allocation</CardDescription>
                </div>
                <AlertCircle size={16} className="text-muted-foreground/50" />
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center pt-6">
                <ChartContainer config={chartConfig} className="h-64 w-full max-w-[300px]">
                  <PieChart>
                    <ChartTooltip 
                      cursor={false}
                      content={<ChartTooltipContent className="bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl" hideLabel />} 
                    />
                    <Pie
                      data={priorityData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={80}
                      strokeWidth={5}
                      stroke="hsl(var(--card))"
                      paddingAngle={4}
                      animationDuration={1500}
                    >
                      <Label
                        content={({ viewBox }) => {
                          if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                            return (
                              <text
                                x={viewBox.cx}
                                y={viewBox.cy}
                                textAnchor="middle"
                                dominantBaseline="middle"
                              >
                                <tspan
                                  x={viewBox.cx}
                                  y={viewBox.cy}
                                  className="fill-foreground text-4xl font-serif italic"
                                >
                                  {total}
                                </tspan>
                                <tspan
                                  x={viewBox.cx}
                                  y={(viewBox.cy || 0) + 24}
                                  className="fill-muted-foreground text-[8px] font-bold uppercase tracking-[0.2em]"
                                >
                                  Tasks
                                </tspan>
                              </text>
                            )
                          }
                        }}
                      />
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 mt-4 w-full">
                   {priorityData.map((p, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className="size-2 rounded-full shadow-sm" style={{ backgroundColor: p.fill }} />
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold uppercase tracking-tight text-foreground/80">{p.name}</span>
                        <span className="text-[9px] font-mono text-muted-foreground">{p.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance Tip */}
            <Card className="rounded-2xl shadow-sm border-border/50 bg-primary/5 border-primary/10 flex flex-col justify-center items-center text-center p-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Trophy size={120} />
              </div>
              <div className="p-5 bg-primary/10 text-primary rounded-2xl mb-6 shadow-sm">
                <CheckCircle2 size={32} />
              </div>
              <div className="flex flex-col gap-3 relative z-10">
                <h4 className="text-xl font-serif font-medium text-foreground italic">You're doing great!</h4>
                <p className="text-[13px] text-muted-foreground max-w-xs mx-auto leading-relaxed font-medium">
                  {completionRate > 70 
                    ? "Your execution rate is excellent. Keep maintaining this pace for maximum productivity." 
                    : "Consistency is key. Try focused pomodoro sessions to tackle high-priority tasks first."}
                </p>
              </div>
            </Card>

          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, subtitle, icon }: { title: string, value: string | number, subtitle: string, icon: React.ReactElement }) {
  return (
    <Card className="rounded-2xl shadow-sm border-border/50 hover:border-primary/20 transition-all group bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground">{title}</CardTitle>
        <div className="p-2 bg-muted/50 rounded-xl transition-colors group-hover:bg-primary/10 group-hover:text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-serif font-medium tracking-tight text-foreground">{value}</div>
        <p className="text-[9px] text-muted-foreground/60 font-bold uppercase tracking-widest mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  )
}
