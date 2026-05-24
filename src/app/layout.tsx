import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "FitCoach — Your AI Personal Trainer & Diet Coach",
    template: "%s · FitCoach",
  },
  description:
    "AI fitness coach. Upload physique photos, get a personalized workout plan, diet plan, and weekly progress tracking.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
};

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-dvh bg-background font-sans">{children}</body>
    </html>
  );
}
