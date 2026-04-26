"use client"

import { useState } from 'react'
import { Sparkles, Loader2, LogIn, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '../ui/ToastProvider'

interface LoginViewProps {
  onLoginSuccess: (user: any) => void
}

export function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      const data = await res.json()

      if (res.ok) {
        toast("Welcome back!", "success")
        onLoginSuccess(data.user)
      } else {
        toast(data.error || "Authentication failed", "error")
      }
    } catch (err) {
      toast("Connection error", "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:20px_20px]">
      <Card className="w-full max-w-md border-border/50 shadow-2xl animate-in fade-in zoom-in-95 duration-500">
        <CardHeader className="space-y-4 pb-8 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <Sparkles size={24} />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-3xl font-serif italic tracking-tight">Luachy</CardTitle>
            <CardDescription className="text-sm font-medium uppercase tracking-[0.2em] opacity-60">
              Sign in to your workspace
            </CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input 
                id="username" 
                placeholder="Enter username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required 
                className="rounded-xl bg-muted/30 border-border/50 focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="rounded-xl bg-muted/30 border-border/50 focus:ring-1 focus:ring-primary"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-6 pt-2">
            <Button 
              type="submit" 
              className="w-full h-12 rounded-xl font-bold gap-2 text-base transition-all active:scale-95" 
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <LogIn size={20} />
                  Enter Workspace
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
      
      <div className="fixed bottom-8 text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/30 pointer-events-none">
        Secure • Local First • Minimalist
      </div>
    </div>
  )
}
