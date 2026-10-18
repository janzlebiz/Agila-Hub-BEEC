import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AGILA Hub - The Fraternal Order of Eagles",
  description:
    "Official secure mobile and web portal for authorized AGILA Hub members and club administration.",
  manifest: "/manifest.json",
  icons: {
    icon: "/assets/AGILA Hub.png",
    apple: "/assets/AGILA Hub.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#FFFFFF",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-text-size="normal" className={`${inter.variable} ${outfit.variable}`}>
      <body className="min-h-screen liquid-mesh selection:bg-eagle-blue/20 selection:text-eagle-blue-dark dark:selection:bg-eagle-blue/40 dark:selection:text-white antialiased transition-colors duration-300">
        {children}
      </body>
    </html>
  );
}
