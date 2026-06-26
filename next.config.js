/** @type {import('next').NextConfig} */
const nextConfig = {
  // 静态导出模式 — 部署到 Netlify 时启用
  // output: 'export',

  // 若使用 Netlify 的 SSR/Edge 功能则注释掉 output: 'export'
  // 并保持下方配置
  experimental: {
    // 启用 React Server Components（Next.js 14 默认）
  },

  // 图片域名白名单
  images: {
    domains: ["www.neogiant.com.my"],
    unoptimized: false,
  },

  // 安全 HTTP 响应头
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options",        value: "DENY" },
          { key: "X-Content-Type-Options",  value: "nosniff" },
          { key: "Referrer-Policy",         value: "strict-origin-when-cross-origin" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://form.jotform.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "frame-src https://form.jotform.com",
              "img-src 'self' data: blob:",
              "connect-src 'self' https://*.supabase.co",
            ].join("; "),
          },
        ],
      },
      // /admin 路由禁止爬虫索引
      {
        source: "/admin(.*)",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
        ],
      },
    ];
  },

  // 路由重写 — 将 /careers/[id] 的 canonical 指向正确路径
  async rewrites() {
    return [];
  },
};

module.exports = nextConfig;
