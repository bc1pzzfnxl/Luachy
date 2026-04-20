import { 
  ShoppingBag, Banknote, PenTool, Trash2, Phone, Users, Code, Truck, 
  AlertCircle, Clock, GraduationCap, BookOpen, Coins
} from 'lucide-react'

export const ACTIONS = [
  { id: 'buy', label: 'Buy', icon: ShoppingBag, color: 'emerald' },
  { id: 'sell', label: 'Sell', icon: Banknote, color: 'blue' },
  { id: 'write', label: 'Write', icon: PenTool, color: 'orange' },
  { id: 'read', label: 'Read', icon: BookOpen, color: 'rose' },
  { id: 'school', label: 'School', icon: GraduationCap, color: 'cyan' },
  { id: 'clean', label: 'Clean', icon: Trash2, color: 'slate' },
  { id: 'call', label: 'Call', icon: Phone, color: 'purple' },
  { id: 'meet', label: 'Meet', icon: Users, color: 'pink' },
  { id: 'code', label: 'Code', icon: Code, color: 'indigo' },
  { id: 'ship', label: 'Ship', icon: Truck, color: 'amber' },
  { id: 'crypto', label: 'Crypto', icon: Coins, color: 'amber' },
]

export const PRIORITY_MAP: Record<number, { label: string, color: string, icon: any }> = {
  1: { label: 'Urgent', color: 'bg-red-50 text-red-600 border-red-100', icon: AlertCircle },
  2: { label: 'High', color: 'bg-orange-50 text-orange-600 border-orange-100', icon: AlertCircle },
  3: { label: 'Medium', color: 'bg-blue-50 text-blue-600 border-blue-100', icon: AlertCircle },
  4: { label: 'Low', color: 'bg-muted text-muted-foreground border-border/50', icon: Clock },
}

export const CARD_COLORS: Record<string, string> = {
  emerald: 'border-l-2 border-l-emerald-500',
  blue: 'border-l-2 border-l-blue-500',
  orange: 'border-l-2 border-l-orange-500',
  cyan: 'border-l-2 border-l-cyan-500',
  slate: 'border-l-2 border-l-slate-500',
  purple: 'border-l-2 border-l-purple-500',
  pink: 'border-l-2 border-l-pink-500',
  indigo: 'border-l-2 border-l-indigo-500',
  amber: 'border-l-2 border-l-amber-500',
}

export const COLOR_MAP_WIZARD: Record<string, string> = {
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  blue: 'bg-blue-50 text-blue-600 border-blue-100',
  orange: 'bg-orange-50 text-orange-600 border-orange-100',
  rose: 'bg-rose-50 text-rose-600 border-rose-100',
  cyan: 'bg-cyan-50 text-cyan-600 border-cyan-100',
  slate: 'bg-slate-50 text-slate-600 border-slate-200',
  purple: 'bg-purple-50 text-purple-600 border-purple-100',
  pink: 'bg-pink-50 text-pink-600 border-pink-100',
  indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  amber: 'bg-amber-50 text-amber-600 border-amber-100',
}
