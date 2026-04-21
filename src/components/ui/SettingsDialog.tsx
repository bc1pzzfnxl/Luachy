import { useRef } from 'react'
import { 
  Settings, Download, Upload
} from 'lucide-react'
import { useToast } from './ToastProvider'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

interface SettingsDialogProps {
  isOpen: boolean
  onClose: () => void
  onRunArchive: () => void
}

export function SettingsDialog({ isOpen, onClose, onRunArchive }: SettingsDialogProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = async () => {
    try {
      const res = await fetch('/api/export')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `luachy_backup_${new Date().toISOString().split('T')[0]}.json`
      a.click()
      toast("Export Successful", "success")
    } catch (e) {
      toast("Export Failed", "error")
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string)
        const res = await fetch('/api/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        if (res.ok) { toast("Data Restored", "success"); setTimeout(() => window.location.reload(), 1000); }
      } catch (e) { toast("Import Failed", "error"); }
    }
    reader.readAsText(file)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 flex flex-col overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted text-muted-foreground rounded-lg">
              <Settings size={18} />
            </div>
            <div className="text-left">
              <DialogTitle className="text-lg font-serif font-medium">Settings</DialogTitle>
              <DialogDescription className="text-xs">Manage your workspace data and performance.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="data" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 border-b bg-muted/20">
            <TabsList className="h-12 w-full justify-start bg-transparent gap-6 p-0">
              <TabsTrigger value="data" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-2 text-xs font-bold uppercase tracking-widest transition-all">Data & Safety</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="data" className="h-full m-0 focus-visible:ring-0">
              <ScrollArea className="h-full">
                <div className="p-8 max-w-lg mx-auto flex flex-col gap-10">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Backups</h4>
                      <p className="text-xs text-muted-foreground">Keep your data safe by exporting it regularly.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Button variant="outline" className="h-28 flex-col gap-3 bg-card hover:border-primary/50 transition-all group" onClick={handleExport}>
                        <div className="p-2 bg-muted rounded-full group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          <Download size={20} />
                        </div>
                        <span className="text-xs font-bold">Export JSON</span>
                      </Button>
                      <Button variant="outline" className="h-28 flex-col gap-3 bg-card hover:border-primary/50 transition-all group" onClick={() => fileInputRef.current?.click()}>
                        <div className="p-2 bg-muted rounded-full group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          <Upload size={20} />
                        </div>
                        <span className="text-xs font-bold">Import JSON</span>
                        <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImport} />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-red-600/70">Maintenance</h4>
                      <p className="text-xs text-muted-foreground">Irreversible actions to optimize your database.</p>
                    </div>
                    <div className="p-5 rounded-2xl border border-red-100 bg-red-50/30 dark:bg-red-950/10 dark:border-red-950 flex flex-col gap-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-red-600">Cold Storage Cleanup</span>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                          This will move all "Done" tasks and older journal entries into a compressed archive. Use this if the app starts to feel sluggish.
                        </p>
                      </div>
                      <Button variant="destructive" size="sm" className="w-full font-bold uppercase tracking-widest text-[10px] h-9" onClick={() => { onRunArchive(); onClose(); }}>
                        Start Cleanup
                      </Button>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
