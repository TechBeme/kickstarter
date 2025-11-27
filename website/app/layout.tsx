import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/navigation";
import { NavigationProgress } from "@/components/navigation-progress";
import { Suspense } from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kickstarter Creator Database - Find & Partner with Kickstarter Creators",
  description: "Discover and connect with verified Kickstarter creators and projects. Access comprehensive creator databases, track campaign metrics, filter by social media presence, and manage partnership outreach. Perfect for businesses seeking collaboration opportunities with innovative creators.",
  keywords: ["Kickstarter creators", "creator partnerships", "crowdfunding campaigns", "project database", "creator outreach", "campaign analytics", "social media influencers", "Kickstarter database"],
  authors: [{ name: "Kickstarter Creator Database" }],
  openGraph: {
    title: "Kickstarter Creator Database - Find Creators for Partnerships",
    description: "Find successful Kickstarter creators for partnerships. Search by category, funding goals, social media, and more. Manage outreach and track campaign performance.",
    type: "website",
  },
  icons: {
    icon: 'https://a.kickstarter.com/favicon.ico',
    apple: 'https://a.kickstarter.com/assets/touch-icon-192x192-710ace6840055401ec231c1d86ce7312c56bb510fad8b775229b0ce73d0054c5.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
