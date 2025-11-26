import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, Globe, TrendingUp, Lock, Download, BarChart2, ArrowRight, Zap, Shield } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Our Ecosystem",
  description: "A comprehensive suite of tools designed to empower every stakeholder in the logistics supply chain.",
};

export default function ProductsPage() {
  return (
    <div className="container mx-auto py-16 px-4 md:px-8 space-y-24">

      {/* Hero Section */}
      <section className="text-center space-y-8 max-w-5xl mx-auto relative">
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 blur-3xl rounded-full opacity-50" />
        <Badge variant="outline" className="px-4 py-1 text-sm border-primary/50 text-primary bg-primary/5 backdrop-blur-sm">
          The Future of Logistics Data
        </Badge>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
          Democratizing Logistics Data
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          From guessing rates to market precision. We are building the Bloomberg for the TSL industry.
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <Button size="lg" className="h-12 px-8 text-lg rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
            Get Started
          </Button>
          <Button size="lg" variant="outline" className="h-12 px-8 text-lg rounded-full">
            Learn More
          </Button>
        </div>
      </section>

      {/* Ecosystem Overview */}
      <section>
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold">Our Ecosystem</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            A comprehensive suite of tools designed to empower every stakeholder in the logistics supply chain.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">

          {/* Public Hub */}
          <Card className="relative overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group flex flex-col bg-card/50 backdrop-blur-sm">
            <div className="absolute top-0 right-0 p-4">
              <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-200 dark:border-blue-900">Public Access</Badge>
            </div>
            <CardHeader>
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Globe className="h-7 w-7 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-2xl">Public Data Hub</CardTitle>
              <CardDescription className="text-base">Cargobloom.io</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 flex-1 flex flex-col">
              <p className="text-muted-foreground flex-1 leading-relaxed">
                Modeled after CoinMarketCap, a free service presenting real-time route indices.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-sm">
                  <div className="h-6 w-6 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                    <Check className="h-3.5 w-3.5 text-green-600" />
                  </div>
                  <span>Average market rates</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <div className="h-6 w-6 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                    <Check className="h-3.5 w-3.5 text-green-600" />
                  </div>
                  <span>Trends and volumes</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <div className="h-6 w-6 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                    <Check className="h-3.5 w-3.5 text-green-600" />
                  </div>
                  <span>Transparency for everyone</span>
                </li>
              </ul>
              <div className="pt-4 mt-auto">
                <Button asChild className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors" variant="outline">
                  <Link href="/" className="flex items-center justify-center gap-2">
                    View Market <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Assistant */}
          <Card className="relative overflow-hidden border-primary/50 shadow-2xl shadow-primary/10 flex flex-col bg-gradient-to-b from-card to-card/50">
            <div className="absolute top-0 right-0 p-4">
              <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">For Freight Forwarders</Badge>
            </div>
            <CardHeader>
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                <Zap className="h-7 w-7 text-primary" />
              </div>
              <CardTitle className="text-2xl">Cargobloom Assistant</CardTitle>
              <CardDescription className="text-base">Chrome Extension (Utility)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 flex-1 flex flex-col">
              <p className="text-muted-foreground flex-1 leading-relaxed">
                "Waze for logistics". An assistant suggesting rates directly on freight exchanges.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-sm">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Check className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span>Live overlay on exchanges</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Check className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span>No more tab switching</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Check className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span>Data crowdsourcing</span>
                </li>
              </ul>
              <div className="pt-4 mt-auto">
                <Button className="w-full shadow-lg shadow-primary/20">
                  <Download className="mr-2 h-4 w-4" /> Download Assistant
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Enterprise */}
          <Card className="relative overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group flex flex-col bg-card/50 backdrop-blur-sm">
            <div className="absolute top-0 right-0 p-4">
              <Badge variant="destructive" className="bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-200 dark:border-red-900">B2B / Enterprise</Badge>
            </div>
            <CardHeader>
              <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Lock className="h-7 w-7 text-slate-600 dark:text-slate-400" />
              </div>
              <CardTitle className="text-2xl">Cargobloom Enterprise</CardTitle>
              <CardDescription className="text-base">Private SaaS Instance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 flex-1 flex flex-col">
              <p className="text-muted-foreground flex-1 leading-relaxed">
                Your "private Bloomberg". Analyze your own historical data against the market.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-sm">
                  <div className="h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    <BarChart2 className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                  </div>
                  <span>Internal benchmarking</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <div className="h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    <BarChart2 className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                  </div>
                  <span>Lost margin analysis</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <div className="h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    <Shield className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                  </div>
                  <span>Full data privacy</span>
                </li>
              </ul>
              <div className="pt-4 mt-auto">
                <Button asChild className="w-full group-hover:bg-slate-900 group-hover:text-white dark:group-hover:bg-slate-100 dark:group-hover:text-slate-900 transition-colors" variant="secondary">
                  <Link href="mailto:support@cargobloom.io">Contact Sales</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>
      </section>

      <Separator className="bg-border/50" />

      {/* Detailed Breakdown */}
      <div className="grid md:grid-cols-2 gap-16 items-center">
        <div className="space-y-8">
          <div className="space-y-4">
            <Badge variant="outline" className="text-primary border-primary/20">B2C Solution</Badge>
            <h3 className="text-3xl font-bold">For Freight Forwarders</h3>
            <p className="text-muted-foreground text-lg leading-relaxed">
              As a forwarder, your most valuable assets are time and information. Cargobloom Assistant is a free tool that integrates directly with your browser.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4 items-start">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-1">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-xl mb-2">Instant Valuation</h4>
                <p className="text-muted-foreground">See an offer? We suggest the price. No Excel, no calculator needed.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-1">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-xl mb-2">Information Advantage</h4>
                <p className="text-muted-foreground">Know if the market is going up or down before you make the call.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-muted to-muted/50 rounded-3xl p-8 h-[400px] flex items-center justify-center border border-border/50 shadow-inner relative overflow-hidden group">
          <div className="absolute inset-0 bg-grid-slate-200/50 dark:bg-grid-slate-800/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
          <div className="bg-background rounded-lg shadow-2xl p-6 w-3/4 h-3/4 border border-border/50 transform group-hover:scale-105 transition-transform duration-500 flex flex-col gap-4">
            <div className="h-4 w-1/3 bg-muted rounded animate-pulse" />
            <div className="h-8 w-full bg-muted/50 rounded" />
            <div className="h-8 w-full bg-muted/50 rounded" />
            <div className="h-32 w-full bg-primary/5 rounded border border-primary/10 flex items-center justify-center">
              <span className="text-primary font-medium">Extension Overlay</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-16 items-center">
        <div className="bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-950 rounded-3xl p-8 h-[400px] flex items-center justify-center border border-border/50 shadow-inner md:order-1 relative overflow-hidden group">
          <div className="absolute inset-0 bg-grid-slate-200/50 dark:bg-grid-slate-800/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
          <div className="bg-background rounded-lg shadow-2xl p-6 w-3/4 h-3/4 border border-border/50 transform group-hover:scale-105 transition-transform duration-500 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div className="h-4 w-1/4 bg-muted rounded" />
              <div className="h-4 w-4 rounded-full bg-red-500/20" />
            </div>
            <div className="flex-1 bg-muted/20 rounded border border-dashed border-border flex items-end justify-around p-4 pb-0 gap-2">
              <div className="w-full bg-primary/20 h-[40%] rounded-t" />
              <div className="w-full bg-primary/40 h-[70%] rounded-t" />
              <div className="w-full bg-primary/60 h-[50%] rounded-t" />
              <div className="w-full bg-primary h-[80%] rounded-t" />
            </div>
          </div>
        </div>
        <div className="space-y-8 md:order-2">
          <div className="space-y-4">
            <Badge variant="outline" className="text-blue-600 border-blue-200 dark:text-blue-400 dark:border-blue-900">B2B Enterprise</Badge>
            <h3 className="text-3xl font-bold">For Enterprises</h3>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Data silos are a waste of money. Cargobloom Enterprise allows large logistics and manufacturing organizations to regain control over spending.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4 items-start">
              <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-1">
                <BarChart2 className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-xl mb-2">Eliminate Guesswork</h4>
                <p className="text-muted-foreground">Stop basing strategies on intuition. Hard market data vs. your results.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-1">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-xl mb-2">Margin Optimization</h4>
                <p className="text-muted-foreground">Identify routes where you systematically overpay relative to the market.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
