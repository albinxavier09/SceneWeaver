import type { Metadata } from "next";
import { Kalam, Caveat, Comic_Neue, Fredoka } from "next/font/google";
import "./globals.css";

const kalam = Kalam({ 
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  variable: "--font-kalam"
});

const caveat = Caveat({ 
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-caveat"
});

const comicNeue = Comic_Neue({ 
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  variable: "--font-comic"
});

const fredoka = Fredoka({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-fredoka"
});

export const metadata: Metadata = {
  title: "Scenestitch - Storyboard Smarter. Faster. Together.",
  description: "A minimalistic black-and-white storyboarding app that allows users to create, connect, and manage scenes with AI assistance.",
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${kalam.variable} ${caveat.variable} ${comicNeue.variable} ${fredoka.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
