"use client"

import { useState, useEffect } from 'react'
import { Sparkles, Loader2, LogIn, Sun, Moon } from 'lucide-react'
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
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const { toast } = useToast()

  useEffect(() => {
    if (document.documentElement.classList.contains('dark')) {
      setTheme('dark')
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

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
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F9F9F8] dark:bg-[#0C0C0C] p-6 font-sans antialiased transition-colors duration-500">
      {/* Absolute High-Contrast Theme Toggle */}
      <div className="fixed top-6 right-6 z-[100]">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          className="rounded-full border-2 border-[#111111] dark:border-[#FFFFFF] bg-white dark:bg-[#1A1A1A] text-[#111111] dark:text-[#FFFFFF] shadow-md hover:bg-[#FBFBFA] dark:hover:bg-[#222222] transition-all"
        >
          {theme === 'light' ? <Moon size={22} strokeWidth={2.5} /> : <Sun size={22} strokeWidth={2.5} />}
        </Button>
      </div>

      <Card className="w-full max-w-sm border-[#EAEAEA] dark:border-[#1F1F1F] bg-white dark:bg-[#121212] shadow-none border-none sm:border animate-in fade-in zoom-in-95 duration-1000 overflow-hidden">
        {/* Uniform vertical padding (py-12) for top and bottom of the card */}
        <CardHeader className="space-y-8 pb-6 pt-12 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl border border-[#EAEAEA] dark:border-[#1F1F1F] bg-[#FBFBFA] dark:bg-[#1A1A1A] text-[#111111] dark:text-[#EEEEEE] transition-colors shadow-sm">
            <Sparkles size={28} strokeWidth={1.2} />
          </div>
          <div className="space-y-3">
            <CardTitle className="text-5xl font-serif italic tracking-tighter text-[#111111] dark:text-[#EEEEEE]">Luachy</CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#787774] dark:text-[#999999] opacity-80">
              Identity Verification
            </CardDescription>
          </div>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-8 px-10 pb-4">
            <div className="space-y-3">
              <Label htmlFor="username" className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#787774] dark:text-[#999999] ml-1">
                Username
              </Label>
              <Input 
                id="username" 
                placeholder="Enter username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required 
                className="h-14 rounded-xl bg-[#FBFBFA] dark:bg-[#1A1A1A] border-[#EAEAEA] dark:border-[#1F1F1F] focus:border-[#111111] dark:focus:border-[#EEEEEE] focus:ring-0 transition-all placeholder:text-[#A1A1A1] dark:placeholder:text-[#555555] text-[#111111] dark:text-[#EEEEEE] px-4"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="password" className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#787774] dark:text-[#999999] ml-1">
                Password
              </Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-14 rounded-xl bg-[#FBFBFA] dark:bg-[#1A1A1A] border-[#EAEAEA] dark:border-[#1F1F1F] focus:border-[#111111] dark:focus:border-[#EEEEEE] focus:ring-0 transition-all placeholder:text-[#A1A1A1] dark:placeholder:text-[#555555] text-[#111111] dark:text-[#EEEEEE] px-4"
              />
            </div>
          </CardContent>
          
          <CardFooter className="pt-8 pb-12 px-10">
            <Button 
              type="submit" 
              className="w-full h-14 bg-[#111111] dark:bg-[#EEEEEE] text-white dark:text-[#111111] hover:bg-[#222222] dark:hover:bg-white rounded-xl font-bold text-sm tracking-wide transition-all active:scale-[0.96] flex items-center justify-center gap-3" 
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <LogIn size={20} strokeWidth={2} />
                  Enter Workspace
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
