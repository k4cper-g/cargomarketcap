import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth-provider";
import { Navbar } from "@/components/navbar";
import { WatchlistProvider } from "@/components/watchlist-provider";
import { Footer } from "@/components/footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Cargo Prices, Freight Market Intelligence & Analytics",
    template: "%s | CargoBloom",
  },
  description:
    "The Bloomberg for logistics. Real-time freight rates, market trends, and analytics for the transport industry. Democratizing logistics data.",
  applicationName: "CargoBloom",
  authors: [{ name: "CargoBloom Team", url: "https://cargobloom.io" }],
  generator: "Next.js",
  keywords: [
    "Freight",
    "Logistics",
    "Transport",
    "Cargo",
    "Rates",
    "Analytics",
    "Market Intelligence",
    "Freight Tech",
    "Supply Chain",
  ],
  referrer: "origin-when-cross-origin",
  creator: "CargoBloom",
  publisher: "CargoBloom",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://cargobloom.io"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Cargo Prices, Freight Market Intelligence & Analytics",
    description:
      "The Bloomberg for logistics. Real-time freight rates, market trends, and analytics for the transport industry.",
    url: "https://cargobloom.io",
    siteName: "CargoBloom",
    images: [
      {
        url: "/cargobloom-dashboard.png",
        width: 1200,
        height: 630,
        alt: "CargoBloom Dashboard",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cargo Prices, Freight Market Intelligence & Analytics",
    description:
      "The Bloomberg for logistics. Real-time freight rates, market trends, and analytics for the transport industry.",
    creator: "@cargobloom",
    images: ["/cargobloom-dashboard.png"],
  },
  icons: {
    icon: "/cargobloom.ico",
    shortcut: "/cargobloom.ico",
    apple: "/cargobloom-icon.svg",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <WatchlistProvider>
              <div className="flex flex-col min-h-screen">
                <Navbar />
                <main className="flex-grow">
                  {children}
                </main>
                <Footer />
              </div>
            </WatchlistProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
