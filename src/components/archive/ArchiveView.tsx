import { useState, useEffect } from 'react'
import { Archive, RefreshCcw, StickyNote, LayoutDashboard, Search, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '../ui/ToastProvider'
import { Button } from '../ui/button'

interface ArchiveViewProps {
  API_URL: string
  onRefresh: () => void
  onBack: () => void
}

export function ArchiveView({ API_URL, onRefresh, onBack }: ArchiveViewProps) {
  const [archivedMemos, setArchivedMemos] = useState<any[]>([])
  const [archivedCards, setArchivedCards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const { toast } = useToast()

  const fetchArchives = async () => {
    setLoading(true)
    try {
      const [mRes, cRes] = await Promise.all([
        fetch(`${API_URL}/archives/memos`),
        fetch(`${API_URL}/archives/cards`)
      ])
      setArchivedMemos(await mRes.json())
      setArchivedCards(await cRes.json())
    } catch (e) {
      console.error("Archive fetch failed", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchArchives() }, [])

  const unarchiveMemo = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/memos/${id}/unarchive`, { method: 'POST' })
      if (res.ok) {
        toast("Note restored", "success")
        fetchArchives()
        onRefresh()
      }
    } catch (e) { toast("Restore failed", "error") }
  }

  const unarchiveCard = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/cards/${id}/unarchive`, { method: 'POST' })
      if (res.ok) {
        toast("Task restored", "success")
        fetchArchives()
        onRefresh()
      }
    } catch (e) { toast("Restore failed", "error") }
  }

  const filteredMemos = archivedMemos.filter(m => m.content.toLowerCase().includes(search.toLowerCase()))
  const filteredCards = archivedCards.filter(c => c.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <div className="px-8 py-10 border-b flex justify-between items-center bg-card shrink-0">
        <div className="flex items-center gap-6">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-xl">
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h2 className="text-2xl font-serif font-medium tracking-tight text-foreground">Archive</h2>
            <p className="text-sm text-muted-foreground mt-1">Browse and restore old notes and completed tasks.</p>
          </div>
        </div>
        
        <div className="relative group/search w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input 
            placeholder="Search archives..." 
            className="w-full pl-11 pr-4 py-2.5 bg-muted/50 border rounded-xl text-sm outline-none focus:ring-1 focus:ring-border transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-muted/20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
          
          {/* Archived Memos */}
          <div className="flex flex-col gap-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
               <StickyNote size={16}/> Notes
            </h3>
            <div className="flex flex-col gap-4">
              {filteredMemos.length === 0 && <p className="text-sm text-muted-foreground py-12 border-2 border-dashed border-border rounded-2xl text-center">Empty archive</p>}
              {filteredMemos.map(memo => (
                <div key={memo.id} className="p-5 rounded-2xl border bg-card group relative hover:border-black/20 transition-all shadow-sm hover:shadow-md">
                   <button 
                     onClick={() => unarchiveMemo(memo.id)}
                     className="absolute top-4 right-4 p-2 bg-muted text-muted-foreground rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:text-primary-foreground"
                     title="Restore"
                   >
                     <RefreshCcw size={14} />
                   </button>
                   <p className="text-sm leading-relaxed text-foreground pr-8">{memo.content}</p>
                   <span className="text-xs font-medium text-muted-foreground mt-4 block">{new Date(memo.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Archived Cards */}
          <div className="flex flex-col gap-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
               <LayoutDashboard size={16}/> Tasks
            </h3>
            <div className="flex flex-col gap-4">
              {filteredCards.length === 0 && <p className="text-sm text-muted-foreground py-12 border-2 border-dashed border-border rounded-2xl text-center">Empty archive</p>}
              {filteredCards.map(card => (
                <div key={card.id} className="p-5 rounded-2xl border bg-card group relative hover:border-black/20 transition-all shadow-sm hover:shadow-md">
                   <button 
                     onClick={() => unarchiveCard(card.id)}
                     className="absolute top-4 right-4 p-2 bg-muted text-muted-foreground rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:text-primary-foreground"
                     title="Restore"
                   >
                     <RefreshCcw size={14} />
                   </button>
                   <h4 className="text-base font-semibold text-foreground pr-8">{card.title}</h4>
                   {card.description && <p className="text-sm leading-relaxed text-muted-foreground mt-2 line-clamp-2">{card.description}</p>}
                   <span className="text-xs font-medium text-muted-foreground mt-4 block">Archived: {new Date(card.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
