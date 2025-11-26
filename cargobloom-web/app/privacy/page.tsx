import { Separator } from "@/components/ui/separator";

export const metadata = {
    title: "Privacy Policy",
    description: "Privacy Policy for CargoBloom web application and browser extension.",
};

export default function PrivacyPage() {
    return (
        <div className="container mx-auto py-16 px-4 md:px-8 max-w-4xl">
            <div className="space-y-6">
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">Privacy Policy</h1>
                <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>

            <Separator className="my-8" />

            <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
                <section>
                    <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
                    <p>
                        CargoBloom ("we", "our", or "us") respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, and share information when you use our website and browser extension (collectively, the "Service").
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4">2. Information We Collect</h2>

                    <h3 className="text-xl font-semibold mt-6 mb-2">2.1. Market Data (Extension)</h3>
                    <p>
                        When you use the CargoBloom Extension on supported third-party freight exchange platforms, we automatically collect specific market data visible on your screen. This includes:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 mt-2">
                        <li>Route details (Origin and Destination locations).</li>
                        <li>Freight details (Vehicle body type, weight, dimensions).</li>
                        <li>Price information (Offered rates, currency).</li>
                        <li>Timestamps of the offers.</li>
                    </ul>
                    <p className="mt-2 text-muted-foreground italic">
                        <strong>Important:</strong> We do NOT collect personal data of the parties involved in the transaction (such as driver names, phone numbers, or specific company names unless they are part of the public offer text). The data is anonymized and aggregated to calculate market averages.
                    </p>

                    <h3 className="text-xl font-semibold mt-6 mb-2">2.2. Account Information</h3>
                    <p>
                        If you create an account with us, we collect your email address and authentication credentials (via Google Auth or email/password).
                    </p>

                    <h3 className="text-xl font-semibold mt-6 mb-2">2.3. Usage Data</h3>
                    <p>
                        We collect information on how you access and use the Service, such as your browser type, device type, and pages visited.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4">3. How We Use Your Information</h2>
                    <p>
                        We use the collected information for the following purposes:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 mt-2">
                        <li><strong>To Provide the Service:</strong> Aggregating market data to display price indices, trends, and heatmaps.</li>
                        <li><strong>To Improve the Service:</strong> Analyzing usage patterns to enhance user experience and features.</li>
                        <li><strong>To Communicate:</strong> Sending you updates, security alerts, and administrative messages.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4">4. Data Sharing and Disclosure</h2>
                    <p>
                        We do not sell your personal data. We may share information in the following circumstances:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 mt-2">
                        <li><strong>Aggregated Data:</strong> We share aggregated, non-personally identifiable market data publicly on our platform and with our enterprise customers.</li>
                        <li><strong>Service Providers:</strong> We may employ third-party companies (e.g., hosting providers, analytics services) to facilitate our Service. These third parties have access to your data only to perform these tasks on our behalf.</li>
                        <li><strong>Legal Requirements:</strong> We may disclose your data if required to do so by law or in response to valid requests by public authorities.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4">5. Data Security</h2>
                    <p>
                        We value your trust in providing us your information and use commercially acceptable means to protect it. However, no method of transmission over the internet or method of electronic storage is 100% secure and reliable, and we cannot guarantee its absolute security.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4">6. Your Data Rights</h2>
                    <p>
                        Depending on your location, you may have rights regarding your personal data, including the right to access, correct, or delete your personal information. You can manage your account settings within the application or contact us to exercise these rights.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4">7. Contact Us</h2>
                    <p>
                        If you have any questions or suggestions about our Privacy Policy, do not hesitate to contact us at <a href="mailto:support@cargobloom.io" className="text-primary hover:underline">support@cargobloom.io</a>.
                    </p>
                </section>
            </div>
        </div>
    );
}
