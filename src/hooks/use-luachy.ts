import { useState, useEffect, useCallback } from 'react'
import { useToast } from '../components/ui/ToastProvider'

const API_URL = '/api'

export function useLuachy() {
  const [memos, setMemos] = useState<any[]>([])
  const [cards, setCards] = useState<any[]>([])
  const [columns, setColumns] = useState<any[]>([])
  const [stats, setStats] = useState<Record<string, number>>({})
  const [kanbanStats, setKanbanStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const safeJson = async (res: Response) => {
    try {
      if (!res.ok) return null
      return await res.json()
    } catch (e) {
      return null
    }
  }

  const fetchData = useCallback(async () => {
    try {
      const [memosRes, colsRes, cardsRes, statsRes, kanbanStatsRes] = await Promise.all([
        fetch(`${API_URL}/memos`),
        fetch(`${API_URL}/columns`),
        fetch(`${API_URL}/cards`),
        fetch(`${API_URL}/stats/memos-per-day`),
        fetch(`${API_URL}/stats/kanban`)
      ])
      
      const [memosData, colsData, cardsData, statsData, kanbanData] = await Promise.all([
        safeJson(memosRes),
        safeJson(colsRes),
        safeJson(cardsRes),
        safeJson(statsRes),
        safeJson(kanbanStatsRes)
      ])
      
      setMemos(memosData || [])
      setColumns(colsData || [])
      setCards(cardsData || [])
      setKanbanStats(kanbanData)
      
      const statsMap: Record<string, number> = {}
      if (Array.isArray(statsData)) {
        statsData.forEach((s: any) => { if (s && s.date) statsMap[s.date] = s.count })
      }
      setStats(statsMap)
    } catch (err) {
      console.error("Luachy Fetch Error:", err)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const addMemo = async (content: string, images?: string[]) => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/memos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, images })
      })
      if (res.ok) {
        toast("Note saved", "success")
        await fetchData()
      } else {
        toast("Failed to save note", "error")
      }
    } finally {
      setLoading(false)
    }
  }

  const uploadFile = async (file: File): Promise<string | null> => {
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch(`${API_URL}/upload`, { method: 'POST', body: formData })
      const data = await res.json()
      if (data.filename) {
        toast("File uploaded", "success")
        return data.filename
      }
      throw new Error("No filename")
    } catch (err) {
      toast("Upload failed", "error")
      console.error("Upload error:", err)
      return null
    }
  }

  const updateMemo = async (id: number, content: string) => {
    const res = await fetch(`${API_URL}/memos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    })
    if (res.ok) {
      toast("Note updated", "success")
      await fetchData()
    } else {
      toast("Failed to update note", "error")
    }
  }

  const deleteMemo = async (id: number) => {
    setMemos(prev => prev.filter(m => m.id !== id))
    fetch(`${API_URL}/memos/${id}`, { method: 'DELETE' }).then((res) => {
      if (res.ok) toast("Note deleted", "info")
      fetchData()
    })
  }

  const archiveMemo = async (id: number) => {
    setMemos(prev => prev.filter(m => m.id !== id))
    const res = await fetch(`${API_URL}/memos/${id}/archive`, { method: 'POST' })
    if (res.ok) {
      toast("Note archived", "success")
      await fetchData()
    }
  }

  const addCard = async (title: string, columnId: number, color?: string, actionType?: string, priority?: number, dueDate?: string, description?: string, recurrence?: string) => {
    const res = await fetch(`${API_URL}/cards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, columnId, color, actionType, priority, dueDate, description, recurrence })
    })
    if (res.ok) {
      toast("Task created", "success")
      await fetchData()
    } else {
      toast("Failed to create task", "error")
    }
  }

  const updateCard = async (id: number, data: any) => {
    const res = await fetch(`${API_URL}/cards/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (res.ok) {
      toast("Task updated", "success")
      await fetchData()
    } else {
      toast("Failed to update task", "error")
    }
  }

  const moveCard = async (cardId: number, columnId: number) => {
    const col = columns.find(c => c.id === columnId)
    const isDone = col?.name === 'Done'
    const today = new Date().toISOString().split('T')[0]

    // Optimistic update
    setCards(prev => prev.map(c => c.id === cardId ? { 
      ...c, 
      column_id: columnId,
      due_date: isDone ? today : c.due_date 
    } : c))

    const body: any = { cardId, columnId }
    if (isDone) body.due_date = today

    const res = await fetch(`${API_URL}/cards/move`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    if (res.ok) {
      if (isDone) toast("Task completed!", "success")
      await fetchData()
    }
  }

  const deleteCard = async (id: number) => {
    setCards(prev => prev.filter(c => c.id !== id))
    const res = await fetch(`${API_URL}/cards/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast("Task deleted", "info")
      await fetchData()
    }
  }

  const archiveCard = async (id: number) => {
    setCards(prev => prev.filter(c => c.id !== id))
    const res = await fetch(`${API_URL}/cards/${id}/archive`, { method: 'POST' })
    if (res.ok) {
      toast("Task archived", "success")
      await fetchData()
    }
  }

  const cleanupCards = async () => {
    try {
      const res = await fetch(`${API_URL}/cards/cleanup`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        toast(`${data.count || 0} tasks archived`, "success")
        await fetchData()
      }
    } catch (e) {
      toast("Cleanup failed", "error")
    }
  }

  const searchMemos = async (query: string) => {
    if (!query.trim()) {
      await fetchData()
      return
    }
    try {
      const res = await fetch(`${API_URL}/memos/search?q=${encodeURIComponent(query)}`)
      if (!res.ok) throw new Error("Search failed")
      const data = await res.json()
      setMemos(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Search error:", err)
      setMemos([])
    }
  }

  return { 
    memos, cards, columns, stats, kanbanStats, loading, 
    addMemo, updateMemo, deleteMemo, archiveMemo, searchMemos,
    addCard, updateCard, moveCard, deleteCard, archiveCard, cleanupCards,
    uploadFile, refresh: fetchData 
  }
}

