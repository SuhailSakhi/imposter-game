import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SocketProvider } from "@/contexts/SocketContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#016FB9",
};

export const metadata: Metadata = {
  title: "Imposter Game - Wie is de imposter?",
  description: "Een spannend party game voor 3-12 spelers. Ontdek wie de imposter is!",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/images/imposter.png", sizes: "any" },
    ],
    apple: [
      { url: "/images/imposter.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Imposter Game",
  },
  openGraph: {
    title: "Imposter Game - Wie is de imposter?",
    description: "Een spannend party game voor 3-12 spelers. Ontdek wie de imposter is!",
    images: ["/images/imposter.png"],
  },
  twitter: {
    card: "summary",
    title: "Imposter Game",
    description: "Een spannend party game voor 3-12 spelers. Ontdek wie de imposter is!",
    images: ["/images/imposter.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SocketProvider>
          {children}
        </SocketProvider>
      </body>
    </html>
  );
}
