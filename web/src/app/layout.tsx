import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Neon-Pulse · Pixel Clicker AI Platform",
  description: "AI-native clicker platform: agents, hybrid RAG, computer vision, signed scores and live leaderboards.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=JetBrains+Mono:wght@400;500&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
