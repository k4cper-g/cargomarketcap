import { Separator } from "@/components/ui/separator";

export const metadata = {
    title: "FAQ",
    description: "Frequently Asked Questions about CargoBloom's freight market intelligence platform.",
};

export default function FAQPage() {
    return (
        <div className="container mx-auto py-16 px-4 md:px-8 max-w-4xl">
            <div className="space-y-6">
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">Frequently Asked Questions</h1>
                <p className="text-muted-foreground">Common questions about our data, methodology, and platform.</p>
            </div>

            <Separator className="my-8" />

            <div className="space-y-12">

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold">What is CargoBloom?</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        CargoBloom is a market intelligence platform designed for the logistics industry. We aggregate and analyze real-time freight data to provide transparency on rates, routes, and market trends. Our goal is to empower carriers, freight forwarders, and logistics professionals to make data-driven decisions rather than relying on guesswork.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold">How does the CargoBloom Extension work?</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        The CargoBloom Extension is a browser add-on that integrates seamlessly with popular freight exchange platforms. As you browse for loads, it analyzes the offers on your screen in real-time and overlays instant market insights—such as average rates, price history, and route volatility—directly into your workflow. This allows you to benchmark offers instantly without leaving the exchange.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold">How are the freight rates calculated?</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        We aggregate data from thousands of real-time freight offers across major European logistics platforms.
                        Our algorithms filter out outliers and calculate weighted averages based on route, vehicle type, and historical trends.
                        Please refer to our Methodology section for detailed information.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold">What is "Market Volume" and how is it calculated?</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        Market Volume represents the total estimated value of freight offers on a specific route or region over a given period.
                        It is calculated by multiplying the average <strong>Rate per km</strong> by the <strong>Total Distance</strong> of all active offers.
                    </p>
                    <div className="bg-muted/50 p-4 rounded-lg font-mono text-sm">
                        Market Volume = Avg Rate x Total Distance of Offers
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold">What is the difference between "Public Hub" and "Enterprise"?</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        <strong>Public Hub</strong> is our free, community-driven platform that provides general market indices and trends.
                        It's accessible to everyone and offers a high-level view of the market.
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                        <strong>Enterprise</strong> is our premium solution for logistics companies, offering granular data, API access,
                        custom reporting, and predictive analytics.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold">Why are some offers excluded from the calculations?</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        To ensure data accuracy, we exclude offers that fall significantly outside standard market deviations (outliers),
                        as well as duplicate listings and offers with incomplete data (e.g., missing price or distance).
                        This prevents "fake" or erroneous data from skewing the market averages.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold">How do I book a load?</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        CargoBloom is a market intelligence platform, not a freight exchange. We provide the data and insights to help you negotiate better rates,
                        but we do not facilitate the actual booking of loads. You should use your preferred freight exchange platform or contact carriers directly.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold">In what time zone is the data reported?</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        All data is collected, recorded, and reported in <strong>UTC</strong> time unless otherwise specified.
                        Daily changes are calculated based on a rolling 24-hour period.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold">Do you offer an API for your data?</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        Yes! We offer a comprehensive API for developers and enterprise customers. Whether you're building your own logistics application or integrating market data into your TMS, our API provides programmatic access to real-time rates, historical data, and market indices. Contact <a href="mailto:support@cargobloom.io" className="text-primary hover:underline">support@cargobloom.io</a> for documentation and access keys.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold">Am I allowed to use your charts and data?</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        You may use our content for academic, journalistic, or internal business use, provided that you cite <strong>CargoBloom.io</strong> as the source.
                        For commercial redistribution or integration into customer-facing products, you must obtain a license.
                    </p>
                </section>

            </div>
        </div>
    );
}
