// ════════════════════════════════════════════════════════════
//  next-sitemap.config.js
//  自动化 SEO Sitemap 生成器
//  在构建时 (postbuild) 从 Supabase 拉取已发布职位,
//  生成包含每个职位页面的 sitemap.xml 和 robots.txt
// ════════════════════════════════════════════════════════════

const { createClient } = require("@supabase/supabase-js");

/** @type {import('next-sitemap').IConfig} */
const config = {
  // ── 站点根 URL（生产域名）──────────────────────────
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://www.neogiant.com.my",

  // ── 输出目录 ──────────────────────────────────────
  outDir: "./public",

  // ── 自动生成 robots.txt ───────────────────────────
  generateRobotsTxt: true,

  // ── robots.txt 规则 ───────────────────────────────
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/api/"],
      },
    ],
    additionalSitemaps: [
      // 若将来有独立的图片 sitemap 可在此追加
      // "https://www.neogiant.com.my/server-sitemap.xml",
    ],
  },

  // ── 排除不需要索引的路由 ──────────────────────────
  exclude: [
    "/admin",
    "/admin/*",
    "/api/*",
    "/server-sitemap.xml",
  ],

  // ── 静态页面默认更新频率和优先级 ─────────────────
  changefreq: "weekly",
  priority: 0.7,

  // ── 额外的静态路由 ────────────────────────────────
  additionalPaths: async (config) => {
    const staticRoutes = [
      // 首页 — 最高优先级，包含所有关键词
      {
        loc: "/",
        changefreq: "weekly",
        priority: 1.0,
        lastmod: new Date().toISOString(),
        // 多语言 alternate 标签（英语 + 马来语关键词覆盖）
        alternateRefs: [
          { href: "https://www.neogiant.com.my/", hreflang: "en-MY" },
          { href: "https://www.neogiant.com.my/", hreflang: "ms-MY" },
        ],
      },
      // Careers 汇总页
      {
        loc: "/careers",
        changefreq: "daily",   // 职位变动频繁
        priority: 0.9,
        lastmod: new Date().toISOString(),
      },
    ];

    // ── 动态拉取已发布职位，为每个职位生成独立 URL ──
    try {
      // 仅在构建环境中运行（需要服务端 Supabase Key）
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseServiceKey) {
        console.warn(
          "[next-sitemap] ⚠️  Supabase env vars not set — skipping dynamic job routes."
        );
        return staticRoutes;
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data: jobs, error } = await supabase
        .from("open_positions")
        .select("id, title, location, updated_at")
        .eq("is_active", true)
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("[next-sitemap] Supabase fetch error:", error.message);
        return staticRoutes;
      }

      // 为每个已发布职位生成 SEO 友好的 URL 条目
      const jobRoutes = (jobs || []).map((job) => ({
        loc: `/careers/${job.id}`,
        changefreq: "weekly",
        priority: 0.8,
        lastmod: job.updated_at
          ? new Date(job.updated_at).toISOString()
          : new Date().toISOString(),
      }));

      console.log(
        `[next-sitemap] ✅ Generated ${jobRoutes.length} job routes for sitemap.`
      );

      return [...staticRoutes, ...jobRoutes];
    } catch (err) {
      console.error("[next-sitemap] Unexpected error:", err);
      return staticRoutes;
    }
  },

  // ── 自定义 sitemap 转换（追加 canonical + 关键词元数据）─
  transform: async (config, path) => {
    // 首页关键词 canonical
    if (path === "/") {
      return {
        loc: path,
        changefreq: "weekly",
        priority: 1.0,
        lastmod: new Date().toISOString(),
      };
    }

    // 职位详情页
    if (path.startsWith("/careers/") && path.length > "/careers/".length) {
      return {
        loc: path,
        changefreq: "weekly",
        priority: 0.8,
        lastmod: new Date().toISOString(),
      };
    }

    // Careers 汇总页（"jawatan kosong" / "manpower supply Penang" 关键词落地页）
    if (path === "/careers") {
      return {
        loc: path,
        changefreq: "daily",
        priority: 0.9,
        lastmod: new Date().toISOString(),
      };
    }

    // 默认处理
    return {
      loc: path,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: new Date().toISOString(),
    };
  },
};

module.exports = config;
