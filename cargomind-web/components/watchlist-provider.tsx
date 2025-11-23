'use client'

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
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

    const supabase = useMemo(() => createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ), [])

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
        } else if (error) {
            console.error('Error fetching watchlist:', JSON.stringify(error, null, 2))
        }
        setIsLoading(false)
    }

    const isInWatchlist = useCallback((origin: string, dest: string) => {
        const inList = watchlist.some(
            item => item.origin_country === origin && item.dest_country === dest
        )
        // console.log(`Checking watchlist for ${origin}-${dest}: ${inList}`, watchlist)
        return inList
    }, [watchlist])

    const toggleWatchlist = useCallback(async (origin: string, dest: string) => {
        // If not logged in, open auth dialog
        if (!user) {
            console.log('User not logged in, opening auth dialog')
            openAuthDialog()
            return
        }

        console.log('Toggling watchlist item:', origin, dest)
        const existing = watchlist.find(
            item => item.origin_country === origin && item.dest_country === dest
        )

        if (existing) {
            // Optimistic removal
            setWatchlist(prev => prev.filter(item => item.id !== existing.id))

            // Remove from watchlist in background
            supabase
                .from('watchlist')
                .delete()
                .eq('id', existing.id)
                .then(({ error }) => {
                    if (error) {
                        // Revert on error
                        console.error('Error removing from watchlist:', error)
                        setWatchlist(prev => [...prev, existing])
                    }
                })
        } else {
            // Optimistic add with temp ID
            const tempId = `temp-${Date.now()}`
            const optimisticItem: WatchlistItem = {
                id: tempId,
                origin_country: origin,
                dest_country: dest,
            }
            setWatchlist(prev => [...prev, optimisticItem])

            // Add to watchlist in background
            const payload = {
                user_id: user.id,
                origin_country: origin,
                dest_country: dest,
            }

            supabase
                .from('watchlist')
                .insert(payload)
                .select('id, origin_country, dest_country')
                .single()
                .then(({ data, error }) => {
                    if (error) {
                        // Revert on error
                        console.error('Error adding to watchlist:', error)
                        setWatchlist(prev => prev.filter(item => item.id !== tempId))
                    } else if (data) {
                        // Replace temp item with real one
                        setWatchlist(prev => prev.map(item =>
                            item.id === tempId ? data : item
                        ))
                    }
                })
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
