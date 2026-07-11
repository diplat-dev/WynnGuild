import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WynnCompare — Wynncraft Guild Comparison",
  description: "Compare the progression, roster, activity, and rankings of any two Wynncraft guilds.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
