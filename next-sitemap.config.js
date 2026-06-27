/** @type {import('next-sitemap').IConfig} */
const config = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://www.neogiant.com.my",
  outDir: "./public",
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/admin/", "/api/"] },
    ],
  },
  exclude: ["/admin", "/admin/*", "/api/*"],
  changefreq: "weekly",
  priority: 0.7,
  additionalPaths: async (config) => {
    const routes = [
      { loc: "/", changefreq: "weekly", priority: 1.0, lastmod: new Date().toISOString() },
      { loc: "/careers", changefreq: "daily", priority: 0.9, lastmod: new Date().toISOString() },
    ];

    try {
      const { createClient } = require("@supabase/supabase-js");
      const url = process.env.SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!url || !key) return routes;

      const supabase = createClient(url, key);
      const { data: jobs } = await supabase
        .from("open_positions")
        .select("id, updated_at")
        .eq("is_active", true);

      const jobRoutes = (jobs || []).map((j) => ({
        loc: `/careers/${j.id}`,
        changefreq: "weekly",
        priority: 0.8,
        lastmod: j.updated_at ? new Date(j.updated_at).toISOString() : new Date().toISOString(),
      }));

      return [...routes, ...jobRoutes];
    } catch {
      return routes;
    }
  },
};

module.exports = config;
