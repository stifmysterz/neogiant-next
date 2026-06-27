// src/app/page.tsx
// Home page — serves the static marketing site.
// The full HTML/CSS site from the previous deliverable is embedded
// via an iframe or replaced here. This stub redirects visitors
// to the careers section and provides the SEO landing page.

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title:
    "Neo Giant (M) Sdn Bhd | Manpower Supply Penang | Recruitment & Staffing Malaysia",
  description:
    "Penang's trusted manpower supply, foreign worker recruitment, CLQ & hostel management, and manpower outsourcing company. Serving 14 cities across Malaysia.",
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0A1628] flex flex-col items-center justify-center p-8 text-center">
      <div className="w-12 h-12 bg-[#C0272D] rounded-xl flex items-center justify-center font-display font-bold text-white text-xl mb-6">
        NG
      </div>
      <h1 className="font-display font-extrabold text-4xl text-white mb-4">
        Neo Giant (M) Sdn Bhd
      </h1>
      <p className="text-gray-400 text-lg mb-8 max-w-lg">
        Penang&apos;s leading manpower supply, foreign worker recruitment,
        and HR outsourcing partner.
      </p>
      <div className="flex gap-4 flex-wrap justify-center">
        <Link
          href="/careers"
          className="bg-[#C0272D] hover:bg-[#9B1F24] text-white font-semibold px-6 py-3 rounded-lg transition-colors"
        >
          View Open Positions →
        </Link>
        <a
          href="mailto:info@neogiant.com.my"
          className="border border-white/20 hover:border-white/50 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
        >
          Contact Us
        </a>
      </div>
      <p className="text-gray-600 text-sm mt-12">
        © {new Date().getFullYear()} Neo Giant (M) Sdn Bhd. All rights reserved.
      </p>
    </main>
  );
}
