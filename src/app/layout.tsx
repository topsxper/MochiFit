import type { Metadata } from "next";
import { Fredoka } from "next/font/google";
import "./globals.css";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "MochiFit — Healthy & Kawaii",
  description: "Your cute personal health & meal tracking companion",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${fredoka.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-soft-cream-base text-healthy-green-dark">
        {children}
      </body>
    </html>
  );
}
