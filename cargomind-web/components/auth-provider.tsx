'use client'

import { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Session, User, SupabaseClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { AuthDialog } from '@/components/auth-dialog'

type AuthContextType = {
    user: User | null
    session: Session | null
    isLoading: boolean
    signOut: () => Promise<void>
    openAuthDialog: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function createSupabaseClient(): SupabaseClient | null {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return null
    return createBrowserClient(url, key)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [authDialogOpen, setAuthDialogOpen] = useState(false)
    const router = useRouter()

    const supabase = useMemo(() => createSupabaseClient(), [])

    useEffect(() => {
        if (!supabase) {
            setIsLoading(false)
            return
        }

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            setSession(session)
            setUser(session?.user ?? null)
            setIsLoading(false)

            if (event === 'SIGNED_OUT') {
                router.refresh()
            }
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [router, supabase])

    const signOut = async () => {
        if (!supabase) return
        await supabase.auth.signOut()
        router.refresh()
    }

    const openAuthDialog = () => {
        setAuthDialogOpen(true)
    }

    return (
        <AuthContext.Provider value={{ user, session, isLoading, signOut, openAuthDialog }}>
            {children}
            <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
