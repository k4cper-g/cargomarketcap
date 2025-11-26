import { Separator } from "@/components/ui/separator";

export const metadata = {
    title: "Terms of Service",
    description: "Terms of Service for CargoBloom web application and browser extension.",
};

export default function TermsPage() {
    return (
        <div className="container mx-auto py-16 px-4 md:px-8 max-w-4xl">
            <div className="space-y-6">
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">Terms of Service</h1>
                <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>

            <Separator className="my-8" />

            <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
                <section>
                    <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
                    <p>
                        By accessing or using the CargoBloom website ("Site") and the CargoBloom browser extension ("Extension"), collectively referred to as the "Service", you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use the Service.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4">2. Description of Service</h2>
                    <p>
                        CargoBloom provides market intelligence and analytics for the logistics industry. The Service includes:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 mt-2">
                        <li>A public web dashboard displaying aggregated freight market data.</li>
                        <li>A browser extension that assists users by providing market rate insights while browsing third-party freight exchange platforms.</li>
                        <li>Enterprise analytics tools for benchmarking and reporting.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4">3. User Obligations</h2>
                    <p>
                        You agree to use the Service only for lawful purposes and in accordance with these Terms. You specifically agree not to:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 mt-2">
                        <li>Use the Service in any way that violates any applicable national or international law or regulation.</li>
                        <li>Attempt to reverse engineer, decompile, or disassemble any part of the Service.</li>
                        <li>Use the Extension to scrape or collect data in violation of third-party terms of service (e.g., freight exchange platforms).</li>
                        <li>Share your account credentials with third parties.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4">4. Data Collection and Usage</h2>
                    <p>
                        The CargoBloom Extension collects anonymized market data (such as route offers, prices, and vehicle types) visible to you on supported platforms. By using the Extension, you contribute to the community data pool. Please refer to our <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a> for detailed information on how we collect and use data.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4">5. Intellectual Property</h2>
                    <p>
                        The Service and its original content, features, and functionality are and will remain the exclusive property of CargoBloom and its licensors. The Service is protected by copyright, trademark, and other laws.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4">6. Disclaimer of Warranties</h2>
                    <p>
                        The Service is provided on an "AS IS" and "AS AVAILABLE" basis. CargoBloom makes no representations or warranties of any kind, express or implied, regarding the accuracy, reliability, or completeness of the market data provided. Freight rates are estimates based on historical and real-time data and should not be considered as binding offers.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4">7. Limitation of Liability</h2>
                    <p>
                        In no event shall CargoBloom, its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4">8. Changes to Terms</h2>
                    <p>
                        We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4">9. Contact Us</h2>
                    <p>
                        If you have any questions about these Terms, please contact us at <a href="mailto:support@cargobloom.io" className="text-primary hover:underline">support@cargobloom.io</a>.
                    </p>
                </section>
            </div>
        </div>
    );
}
