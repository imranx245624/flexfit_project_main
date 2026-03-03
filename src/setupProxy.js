const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  const apiKey = (process.env.PEXELS_API_KEY || process.env.REACT_APP_PEXELS_API_KEY || "").trim();
  app.use(
    "/api/pexels",
    createProxyMiddleware({
      target: "https://api.pexels.com",
      changeOrigin: true,
      pathRewrite: (path, req) => {
        try {
          const url = new URL(req.url, "http://localhost");
          const id = url.searchParams.get("id");
          if (id) return `/videos/videos/${encodeURIComponent(id)}`;
        } catch (e) {}
        return "/videos/search";
      },
      onProxyReq: (proxyReq) => {
        if (apiKey) proxyReq.setHeader("Authorization", apiKey);
      },
      logLevel: "silent",
    })
  );
};
