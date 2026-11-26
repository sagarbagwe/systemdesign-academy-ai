import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SystemDesign Academy AI",
  description: "Learn architecture, practice system design interviews, and track your progress.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
