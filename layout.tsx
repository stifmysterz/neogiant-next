import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.neogiant.com.my"),
  title: {
    default:
      "Neo Giant (M) Sdn Bhd | Manpower Supply Penang | Recruitment Malaysia",
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
    "hostel management",
    "CLQ management",
    "manpower outsourcing",
    "jawatan kosong Penang",
  ],
  openGraph: {
    type: "website",
    locale: "en_MY",
    url: "https://www.neogiant.com.my",
    siteName: "Neo Giant (M) Sdn Bhd",
    images: [{ url: "/og-image.svg", width: 1200, height: 630 }],
  },
  icons: { icon: "/favicon.svg" },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-MY">
      <head>
        {/* Fonts loaded via CSS — not next/font to avoid build-time network fetch */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Sora:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-white text-gray-700">
        {children}
      </body>
    </html>
  );
}
