import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, Globe, TrendingUp, Lock, Download, BarChart2 } from "lucide-react";
import Link from "next/link";

export default function ProductsPage() {
  return (
    <div className="container mx-auto py-10 px-4 md:px-8 space-y-16">
      
      {/* Hero Section */}
      <section className="text-center space-y-6 max-w-4xl mx-auto">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
          Demokratyzacja danych logistycznych
        </h1>
        <p className="text-xl text-muted-foreground">
          Od zgadywania stawek do rynkowej precyzji. Budujemy Bloomberga dla branży TSL.
        </p>
      </section>

      <Separator />

      {/* Ecosystem Overview */}
      <section>
        <h2 className="text-3xl font-bold text-center mb-12">Nasz Ekosystem</h2>
        <div className="grid md:grid-cols-3 gap-8">
          
          {/* Public Hub */}
          <Card className="relative overflow-hidden border-primary/20 flex flex-col">
             <div className="absolute top-0 right-0 p-2">
                <Badge variant="secondary">Dostępny Publicznie</Badge>
             </div>
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center mb-4">
                <Globe className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle>Publiczny Hub Danych</CardTitle>
              <CardDescription>Cargobloom.io</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 flex flex-col">
              <p className="text-sm text-muted-foreground flex-1">
                Wzorowany na CoinMarketCap, darmowy serwis prezentujący indeksy tras w czasie rzeczywistym.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" /> Średnie stawki rynkowe
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" /> Trendy i wolumeny
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" /> Przejrzystość dla każdego
                </li>
              </ul>
              <div className="pt-4 mt-auto">
                 <Button asChild className="w-full" variant="outline">
                    <Link href="/">Zobacz Rynek</Link>
                 </Button>
              </div>
            </CardContent>
          </Card>

          {/* Assistant */}
          <Card className="relative overflow-hidden border-primary/50 shadow-lg flex flex-col">
            <div className="absolute top-0 right-0 p-2">
                <Badge>Dla Spedytora</Badge>
             </div>
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle>Cargobloom Assistant</CardTitle>
              <CardDescription>Wtyczka Chrome (Utility)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 flex flex-col">
              <p className="text-sm text-muted-foreground flex-1">
                "Waze dla logistyki". Asystent podpowiadający stawki bezpośrednio na giełdach transportowych.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" /> Live overlay na giełdach
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" /> Koniec z przełączaniem okien
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" /> Crowdsourcing danych
                </li>
              </ul>
               <div className="pt-4 mt-auto">
                 <Button className="w-full">
                    <Download className="mr-2 h-4 w-4" /> Pobierz Asystenta
                 </Button>
              </div>
            </CardContent>
          </Card>

          {/* Enterprise */}
          <Card className="relative overflow-hidden border-primary/20 bg-muted/50 flex flex-col">
            <div className="absolute top-0 right-0 p-2">
                <Badge variant="destructive">B2B / Enterprise</Badge>
             </div>
            <CardHeader>
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center mb-4">
                <Lock className="h-6 w-6 text-slate-600 dark:text-slate-400" />
              </div>
              <CardTitle>Cargobloom Enterprise</CardTitle>
              <CardDescription>Prywatna instancja SaaS</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 flex flex-col">
              <p className="text-sm text-muted-foreground flex-1">
                Twój "prywatny Bloomberg". Analizuj własne dane historyczne na tle rynku.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-primary" /> Benchmarking wewnętrzny
                </li>
                <li className="flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-primary" /> Analiza utraconych marż
                </li>
                <li className="flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-primary" /> Pełna prywatność danych
                </li>
              </ul>
               <div className="pt-4 mt-auto">
                 <Button asChild className="w-full" variant="secondary">
                    <Link href="mailto:sales@cargobloom.io">Kontakt dla Firm</Link>
                 </Button>
              </div>
            </CardContent>
          </Card>

        </div>
      </section>

      {/* Detailed Breakdown */}
      <div className="grid md:grid-cols-2 gap-16 items-center">
        <div className="space-y-6">
            <h3 className="text-2xl font-bold">Dla Spedytorów (B2C)</h3>
            <p className="text-muted-foreground">
                Jako spedytor, Twoim najcenniejszym zasobem jest czas i informacja. Cargobloom Assistant to darmowe narzędzie, które integruje się z Twoją przeglądarką.
            </p>
            <ul className="space-y-4">
                <li className="flex gap-4">
                    <div className="h-8 w-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">1</div>
                    <div>
                        <h4 className="font-semibold">Natychmiastowa Wycena</h4>
                        <p className="text-sm text-muted-foreground">Widzisz ofertę? My podpowiadamy cenę. Bez Excela, bez kalkulatora.</p>
                    </div>
                </li>
                <li className="flex gap-4">
                    <div className="h-8 w-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">2</div>
                    <div>
                        <h4 className="font-semibold">Przewaga Informacyjna</h4>
                        <p className="text-sm text-muted-foreground">Wiesz, czy rynek rośnie czy spada, zanim wykonasz telefon.</p>
                    </div>
                </li>
            </ul>
        </div>
        <div className="bg-muted rounded-xl p-8 h-[300px] flex items-center justify-center border border-dashed">
            <span className="text-muted-foreground italic">Wizualizacja działania wtyczki</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-16 items-center">
         <div className="bg-muted rounded-xl p-8 h-[300px] flex items-center justify-center border border-dashed md:order-1">
            <span className="text-muted-foreground italic">Dashboard Enterprise</span>
        </div>
        <div className="space-y-6 md:order-2">
            <h3 className="text-2xl font-bold">Dla Firm (B2B Enterprise)</h3>
            <p className="text-muted-foreground">
                Silosy danych to strata pieniędzy. Cargobloom Enterprise pozwala dużym organizacjom logistycznym i produkcyjnym odzyskać kontrolę nad wydatkami.
            </p>
             <ul className="space-y-4">
                <li className="flex gap-4">
                    <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">1</div>
                    <div>
                        <h4 className="font-semibold">Eliminacja "Zgadywania"</h4>
                        <p className="text-sm text-muted-foreground">Koniec z opieraniem strategii na intuicji. Twarde dane o rynku vs Twoje wyniki.</p>
                    </div>
                </li>
                <li className="flex gap-4">
                    <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">2</div>
                    <div>
                        <h4 className="font-semibold">Optymalizacja Marż</h4>
                        <p className="text-sm text-muted-foreground">Zidentyfikuj trasy, na których przepłacasz systematycznie względem rynku.</p>
                    </div>
                </li>
            </ul>
        </div>
      </div>

    </div>
  );
}
