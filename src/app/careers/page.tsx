// ════════════════════════════════════════════════════════════
//  src/app/careers/page.tsx
//  公开招聘页面 — SEO 优化
//  关键词: manpower supply Penang, jawatan kosong, foreign worker recruitment
// ════════════════════════════════════════════════════════════
import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import { CareersClient } from "@/components/careers/CareersClient";
import type { OpenPosition } from "@/types";

// ── 服务端 SEO Metadata ──────────────────────────────────
export const metadata: Metadata = {
  title: "Jawatan Kosong | Open Positions | Neo Giant Manpower Supply Penang",
  description:
    "Browse open positions at Neo Giant (M) Sdn Bhd — Penang's leading manpower supply and foreign worker recruitment agency. Full-time, manufacturing, engineering, logistics and admin roles in Penang, KL, and across Malaysia.",
  keywords: [
    "jawatan kosong penang",
    "manpower supply Penang",
    "foreign worker recruitment Malaysia",
    "local worker recruitment Penang",
    "jobs in Penang manufacturing",
    "kerja kosong penang",
    "production operator penang",
    "manpower outsourcing Malaysia",
  ],
  openGraph: {
    title: "Open Positions | Neo Giant Manpower Supply Penang",
    description: "Find manufacturing, engineering, and admin jobs in Penang, Malaysia.",
    url: "https://www.neogiant.com.my/careers",
    type: "website",
  },
  alternates: {
    canonical: "https://www.neogiant.com.my/careers",
    languages: { "en-MY": "https://www.neogiant.com.my/careers" },
  },
};

// ── 服务端数据获取（Next.js ISR — 每 5 分钟重新验证）────
async function getPositions(): Promise<OpenPosition[]> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase
      .from("open_positions")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[careers page] Supabase error:", error.message);
      return [];
    }

    return data as OpenPosition[];
  } catch (err) {
    console.error("[careers page] Fetch error:", err);
    return [];
  }
}

// ── 服务器端渲染 Page 组件 ────────────────────────────────
export default async function CareersPage() {
  const positions = await getPositions();

  return (
    <>
      {/* 结构化数据 — JobPosting Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Neo Giant Open Positions",
            description: "Current job openings at Neo Giant (M) Sdn Bhd — manpower supply Penang",
            url: "https://www.neogiant.com.my/careers",
            itemListElement: positions.map((pos, i) => ({
              "@type": "ListItem",
              position: i + 1,
              item: {
                "@type": "JobPosting",
                title: pos.title,
                description: pos.description,
                identifier: { "@type": "PropertyValue", name: "Neo Giant", value: pos.id },
                datePosted: pos.created_at,
                validThrough: new Date(
                  new Date(pos.created_at).setMonth(
                    new Date(pos.created_at).getMonth() + 3
                  )
                ).toISOString(),
                employmentType: pos.job_type.toUpperCase().replace("-", "_"),
                hiringOrganization: {
                  "@type": "Organization",
                  name: "Neo Giant (M) Sdn Bhd",
                  sameAs: "https://www.neogiant.com.my",
                },
                jobLocation: {
                  "@type": "Place",
                  address: {
                    "@type": "PostalAddress",
                    addressLocality: pos.location,
                    addressCountry: "MY",
                  },
                },
                ...(pos.salary_range && {
                  baseSalary: {
                    "@type": "MonetaryAmount",
                    currency: "MYR",
                    value: { "@type": "QuantitativeValue", description: pos.salary_range },
                  },
                }),
              },
            })),
          }),
        }}
      />

      {/* SEO H1 — 包含主关键词 */}
      <div className="sr-only">
        <h1>
          Manpower Supply Penang | Jawatan Kosong | Neo Giant (M) Sdn Bhd
          — Local & Foreign Worker Recruitment, Manpower Outsourcing Malaysia
        </h1>
      </div>

      {/* 客户端交互组件（过滤、弹窗、申请表单） */}
      <CareersClient initialPositions={positions} />
    </>
  );
}

// ISR: 每 300 秒重新验证（职位数据可能频繁更新）
export const revalidate = 300;
