import Image from "next/image";
import Link from "next/link";
import { Facebook, Twitter, Instagram, Linkedin, Github, Globe, ChevronDown, Chrome, Play } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

export function Footer() {
    return (
        <footer className="bg-background border-t pt-16 pb-8">
            <div className="container mx-auto px-4 md:px-8">
                <div className="flex flex-col lg:flex-row gap-12 lg:gap-24 mb-16">

                    {/* Brand Column */}
                    <div className="lg:w-1/3 space-y-4">
                        <Link href="/" className="flex items-center gap-2 font-bold text-2xl">
                            <div className="relative h-8 w-auto">
                                <Image src="/cargobloom-logo-light.svg" alt="CargoBloom Logo" height={32} width={150} className="object-contain dark:hidden" />
                                <Image src="/cargobloom-logo-dark.svg" alt="CargoBloom Logo" height={32} width={150} className="object-contain hidden dark:block" />
                            </div>
                        </Link>

                        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                            Real-time market intelligence for the logistics industry. Empowering data-driven decisions with transparency and precision.
                        </p>
                    </div>

                    {/* Links Grid */}
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-8">

                        {/* Products */}
                        <div className="space-y-4">
                            <h4 className="font-bold text-base">Products</h4>
                            <ul className="space-y-3 text-sm text-muted-foreground">
                                <li><Link href="/" className="hover:text-primary transition-colors">Public Hub</Link></li>
                                <li><Link href="/products" className="hover:text-primary transition-colors">Extension</Link></li>
                                <li><Link href="/products" className="hover:text-primary transition-colors">API</Link></li>
                                <li><Link href="/watchlist" className="hover:text-primary transition-colors">Watchlist</Link></li>
                            </ul>
                        </div>

                        {/* Company */}
                        <div className="space-y-4">
                            <h4 className="font-bold text-base">Company</h4>
                            <ul className="space-y-3 text-sm text-muted-foreground">
                                <li><Link href="/products" className="hover:text-primary transition-colors">About Us</Link></li>
                                <li><Link href="/articles" className="hover:text-primary transition-colors">Articles</Link></li>
                                <li><Link href="/faq" className="hover:text-primary transition-colors">FAQ</Link></li>
                            </ul>
                        </div>

                        {/* Legal */}
                        <div className="space-y-4">
                            <h4 className="font-bold text-base">Legal</h4>
                            <ul className="space-y-3 text-sm text-muted-foreground">
                                <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                                <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                            </ul>
                        </div>

                        {/* Socials */}
                        <div className="space-y-4">
                            <h4 className="font-bold text-base">Socials</h4>
                            <ul className="space-y-3 text-sm text-muted-foreground">
                                <li><Link href="https://x.com/cargobloom" className="hover:text-primary transition-colors">X (Twitter)</Link></li>
                                <li><Link href="https://www.linkedin.com/company/cargobloom/" className="hover:text-primary transition-colors">LinkedIn</Link></li>
                            </ul>
                        </div>

                    </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center gap-8 pt-8 border-t border-border/50">
                    <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} CargoBloom. All rights reserved.</p>

                    <div className="flex gap-4">
                        <Button variant="outline" className="h-auto py-2 px-4 bg-black text-white hover:bg-black/90 hover:text-white border-0 flex gap-3 rounded-lg">
                            <Chrome className="h-6 w-6" />
                            <div className="flex flex-col items-start text-xs">
                                <span className="opacity-80 text-[10px] leading-none">Download on the</span>
                                <span className="font-bold text-sm leading-tight">Chrome Store</span>
                            </div>
                        </Button>

                    </div>
                </div>
            </div>
        </footer>
    );
}
