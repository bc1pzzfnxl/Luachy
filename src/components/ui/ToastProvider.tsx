import { useState, createContext, useContext, useCallback, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Toast {
  id: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
}

interface ToastContextType {
  toast: (message: string, type?: Toast['type']) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

const TOAST_THEMES = {
  success: {
    icon: CheckCircle2,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/5',
    border: 'border-emerald-500/20'
  },
  error: {
    icon: AlertCircle,
    color: 'text-red-500',
    bg: 'bg-red-500/5',
    border: 'border-red-500/20'
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-500',
    bg: 'bg-amber-500/5',
    border: 'border-amber-500/20'
  },
  info: {
    icon: Info,
    color: 'text-blue-500',
    bg: 'bg-blue-500/5',
    border: 'border-blue-500/20'
  }
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[2000] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => {
            const theme = TOAST_THEMES[t.type]
            const Icon = theme.icon
            
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                className={cn(
                  "bg-card/80 backdrop-blur-xl border p-3.5 rounded-2xl shadow-2xl flex items-center gap-4 min-w-[280px] max-w-md pointer-events-auto group relative overflow-hidden",
                  theme.border
                )}
              >
                <div className={cn("p-2 rounded-xl", theme.bg)}>
                  <Icon size={16} className={theme.color} />
                </div>
                
                <span className="text-[13px] font-medium text-foreground/90 flex-1 leading-tight">
                  {t.message}
                </span>

                <button 
                  onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-muted rounded-lg"
                >
                  <X size={14} className="text-muted-foreground" />
                </button>

                <motion.div 
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 4, ease: "linear" }}
                  className={cn("absolute bottom-0 left-0 h-[2px] opacity-30", theme.color.replace('text-', 'bg-'))}
                />
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}

