// ════════════════════════════════════════════════════════════
//  src/app/layout.tsx
//  全局 Root Layout — Next.js 14 App Router
// ════════════════════════════════════════════════════════════
import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-sora",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.neogiant.com.my"),
  title: {
    default: "Neo Giant (M) Sdn Bhd | Manpower Supply Penang | Recruitment Malaysia",
    template: "%s | Neo Giant (M) Sdn Bhd",
  },
  description:
    "Neo Giant (M) Sdn Bhd — Penang's leading manpower supply, local & foreign worker recruitment, CLQ & hostel management, and HR outsourcing company in Malaysia.",
  keywords: [
    "manpower supply Penang",
    "manpower supply Malaysia",
    "human resources Penang",
    "local worker recruitment",
    "foreign worker recruitment Malaysia",
    "hostel management Penang",
    "CLQ management Malaysia",
    "manpower outsourcing Penang",
    "jawatan kosong Penang",
    "staffing agency Malaysia",
  ],
  authors: [{ name: "Neo Giant (M) Sdn Bhd", url: "https://www.neogiant.com.my" }],
  creator: "Neo Giant (M) Sdn Bhd",
  openGraph: {
    type: "website",
    locale: "en_MY",
    url: "https://www.neogiant.com.my",
    siteName: "Neo Giant (M) Sdn Bhd",
    title: "Neo Giant (M) Sdn Bhd | Manpower Supply Penang",
    description:
      "Trusted manpower supply, foreign worker recruitment, and HR outsourcing in Penang and Malaysia.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-MY" className={`${inter.variable} ${sora.variable}`}>
      <body className="font-body antialiased text-gray-700 bg-white">
        {children}
      </body>
    </html>
  );
}
