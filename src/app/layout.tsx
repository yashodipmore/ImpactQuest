import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import Navbar from "@/components/layout/Navbar";

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700', '800'],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "ImpactQuest - Turn Your Neighborhood Into Your Quest Zone",
  description: "A gamified Progressive Web App that transforms local social problems into bite-sized quests for teens. Complete micro-challenges, earn XP, level up, and make real impact in your community!",
  keywords: ["volunteer", "teens", "gamification", "social impact", "community", "quests", "environment", "PWA"],
  authors: [{ name: "ImpactQuest Team" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ImpactQuest",
  },
  openGraph: {
    title: "ImpactQuest - Gamified Social Impact",
    description: "Complete quests, earn XP, make real impact in your community!",
    type: "website",
    locale: "en_US",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#7C3AED",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/icon-512.svg" />
      </head>
      <body
        className={`${poppins.variable} font-sans antialiased bg-[#F8F5FF] min-h-screen`}
      >
        <Navbar />
        <main className="pt-16 pb-20 md:pb-0">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
