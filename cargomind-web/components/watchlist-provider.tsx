'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/components/auth-provider'

type WatchlistItem = {
    id: string
    origin_country: string
    dest_country: string
}

type WatchlistContextType = {
    watchlist: WatchlistItem[]
    isLoading: boolean
    isInWatchlist: (origin: string, dest: string) => boolean
    toggleWatchlist: (origin: string, dest: string) => Promise<void>
}

const WatchlistContext = createContext<WatchlistContextType | undefined>(undefined)

export function WatchlistProvider({ children }: { children: React.ReactNode }) {
    const { user, openAuthDialog } = useAuth()
    const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
    const [isLoading, setIsLoading] = useState(false)

    // Fetch watchlist when user changes
    useEffect(() => {
        if (user) {
            fetchWatchlist()
        } else {
            setWatchlist([])
        }
    }, [user])

    const fetchWatchlist = async () => {
        if (!user) return

        setIsLoading(true)
        const { data, error } = await supabase
            .from('watchlist')
            .select('id, origin_country, dest_country')
            .eq('user_id', user.id)

        if (!error && data) {
            setWatchlist(data)
        }
        setIsLoading(false)
    }

    const isInWatchlist = useCallback((origin: string, dest: string) => {
        return watchlist.some(
            item => item.origin_country === origin && item.dest_country === dest
        )
    }, [watchlist])

    const toggleWatchlist = useCallback(async (origin: string, dest: string) => {
        // If not logged in, open auth dialog
        if (!user) {
            openAuthDialog()
            return
        }

        const existing = watchlist.find(
            item => item.origin_country === origin && item.dest_country === dest
        )

        if (existing) {
            // Remove from watchlist
            const { error } = await supabase
                .from('watchlist')
                .delete()
                .eq('id', existing.id)

            if (!error) {
                setWatchlist(prev => prev.filter(item => item.id !== existing.id))
            }
        } else {
            // Add to watchlist
            const { data, error } = await supabase
                .from('watchlist')
                .insert({
                    user_id: user.id,
                    origin_country: origin,
                    dest_country: dest,
                })
                .select('id, origin_country, dest_country')
                .single()

            if (!error && data) {
                setWatchlist(prev => [...prev, data])
            }
        }
    }, [user, watchlist, openAuthDialog])

    return (
        <WatchlistContext.Provider value={{ watchlist, isLoading, isInWatchlist, toggleWatchlist }}>
            {children}
        </WatchlistContext.Provider>
    )
}

export const useWatchlist = () => {
    const context = useContext(WatchlistContext)
    if (context === undefined) {
        throw new Error('useWatchlist must be used within a WatchlistProvider')
    }
    return context
}
