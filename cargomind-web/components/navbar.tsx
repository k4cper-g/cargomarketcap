"use client"

import Link from "next/link"
import { Search, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ModeToggle } from "@/components/mode-toggle"
import Image from "next/image"
import { SearchModal } from "@/components/search-modal"

export function Navbar() {
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 md:px-8 max-w-[1600px] mx-auto">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl mr-4">
            <div className="relative w-8 h-8">
               <Image src="/cargomarketcap.png" alt="CargoMarketCap Logo" fill className="object-contain" />
            </div>
            <span>CargoMarketCap</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
              Marketplaces
            </Link>
            <Link href="#" className="hover:text-foreground transition-colors">
              Articles
            </Link>
            <Link href="#" className="hover:text-foreground transition-colors">
              Products
            </Link>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground mr-4">
            <div className="flex items-center gap-1 hover:text-foreground cursor-pointer">
              <span>Watchlist</span>
            </div>
          </div>

          <div className="hidden md:flex items-center relative">
            <SearchModal />
          </div>

          <div className="flex items-center gap-2">
            <Button variant="default" size="sm" className="hidden sm:flex font-semibold">
              Log In
            </Button>
            <Button variant="ghost" size="icon" className="sm:hidden">
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
            <ModeToggle />
          </div>
        </div>
      </div>
    </nav>
  )
}

