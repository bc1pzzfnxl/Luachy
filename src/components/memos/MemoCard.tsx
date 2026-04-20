import { useState, useRef, useEffect } from 'react'
import { Trash2, Check, X, Edit2, Maximize2, Link as LinkIcon, Circle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ACTIONS } from '@/lib/constants'

interface MemoCardProps {
  memo: any
  cards?: any[]
  onDelete: (id: number) => void
  onUpdate: (id: number, content: string) => void
  onBacklinkClick?: (title: string) => void
  isEditingExternally?: boolean
  onEditingChange?: (isEditing: boolean) => void
}

export function MemoCard({ memo, cards = [], onDelete, onUpdate, onBacklinkClick, isEditingExternally = false, onEditingChange }: MemoCardProps) {
  const [editContent, setEditContent] = useState(memo.content)
  const [fullImage, setFullImage] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!isEditingExternally) {
      setEditContent(memo.content)
    }
  }, [memo.content, isEditingExternally])

  useEffect(() => {
    if (isEditingExternally && textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
      textareaRef.current.focus()
    }
  }, [isEditingExternally, editContent])

  const handleSave = () => {
    if (editContent.trim() !== memo.content) {
      onUpdate(memo.id, editContent)
    }
    onEditingChange?.(false)
  }

  const handleCancel = () => {
    setEditContent(memo.content)
    onEditingChange?.(false)
  }

  const renderContentWithLinks = (text: string) => {
    // First, handle the prefix styling
    let styledText: React.ReactNode[] = [];
    let remainingText = text;

    const actionLabels = ACTIONS.map(a => a.label).join('|');
    const prefixRegex = new RegExp(`^(${actionLabels}) : `);
    const prefixMatch = text.match(prefixRegex);
    
    if (prefixMatch) {
      const prefix = prefixMatch[1];
      styledText.push(
        <span key="prefix" className="font-serif italic text-primary/70">{prefix}</span>,
        <span key="separator" className="text-muted-foreground/50 mx-1">:</span>
      );
      remainingText = text.substring(prefixMatch[0].length);
    }

    const parts = remainingText.split(/(\[\[.*?\]\])/g);
    const linkedParts = parts.map((part, i) => {
      if (part.startsWith('[[') && part.endsWith(']]')) {
        const title = part.substring(2, part.length - 2);
        const card = cards.find(c => c.title === title);
        const isDone = card && card.column_id === 3;

        return (
          <button
            key={`link-${i}`}
            onClick={(e) => {
              e.stopPropagation();
              onBacklinkClick?.(title);
            }}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 bg-muted/50 text-foreground border rounded-lg text-[10px] font-bold uppercase tracking-tight hover:bg-muted transition-all mx-1 shadow-sm",
              card ? "border-primary/20 bg-primary/5" : "border-dashed opacity-70"
            )}
          >
            {card ? (
              isDone ? <CheckCircle2 size={12} className="text-emerald-600" /> : <Circle size={12} className="text-primary/60" />
            ) : <LinkIcon size={12} className="text-muted-foreground/50" />}
            {title}
          </button>
        );
      }
      return part;
    });

    return [...styledText, ...linkedParts];
  };

  return (
    <>
      <div 
        className={cn(
          "p-5 rounded-2xl border bg-card group relative transition-all",
          !isEditingExternally && "hover:border-black/20 shadow-sm hover:shadow-md",
          isEditingExternally && "border-primary ring-1 ring-primary/10 shadow-lg cursor-default"
        )}
        onDoubleClick={() => !isEditingExternally && onEditingChange?.(true)}
      >
        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          {!isEditingExternally && (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); onEditingChange?.(true); }}
                className="p-2 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors"
              >
                <Edit2 size={14} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(memo.id); }}
                className="p-2 hover:bg-red-50 text-muted-foreground hover:text-red-600 rounded-lg transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>

        {isEditingExternally ? (
          <div className="flex flex-col gap-4">
            <textarea
              ref={textareaRef}
              className="w-full bg-transparent outline-none resize-none text-sm leading-relaxed text-foreground"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSave()
                if (e.key === 'Escape') handleCancel()
              }}
            />
            <div className="flex justify-end gap-2">
              <button onClick={handleCancel} className="px-3 py-1.5 hover:bg-muted text-muted-foreground font-medium text-sm rounded-lg transition-colors">Cancel</button>
              <button onClick={handleSave} className="px-4 py-1.5 bg-primary text-primary-foreground font-medium text-sm rounded-lg hover:opacity-90 transition-opacity shadow-sm">Save</button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground pr-10">
              {renderContentWithLinks(memo.content)}
            </p>
            
            {memo.images && memo.images.length > 0 && (
              <div className={cn("grid gap-3 mt-2", memo.images.length === 1 ? "grid-cols-1" : "grid-cols-2")}>
                {memo.images.map((img: string, i: number) => (
                  <div key={i} className="relative group/img rounded-xl overflow-hidden border bg-muted cursor-zoom-in aspect-video shadow-sm" onClick={(e) => { e.stopPropagation(); setFullImage(img); }}>
                    <img src={`http://localhost:3000/assets/${img}`} className="w-full h-full object-cover transition-transform group-hover/img:scale-105" />
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity pt-2">
              <span className="text-xs text-muted-foreground font-medium">
                {new Date(memo.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        )}
      </div>

      {fullImage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-8">
           <div className="absolute inset-0 bg-white/90 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setFullImage(null)} />
           <div className="relative max-w-5xl max-h-full flex flex-col items-center animate-in zoom-in-95 duration-200">
              <img src={`http://localhost:3000/assets/${fullImage}`} className="rounded-2xl shadow-xl object-contain max-h-[85vh] border" />
              <button onClick={() => setFullImage(null)} className="mt-6 p-4 bg-black/5 hover:bg-black/10 text-foreground rounded-full transition-all border backdrop-blur-md"><X size={24} /></button>
           </div>
        </div>
      )}
    </>
  )
}
