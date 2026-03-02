const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  const apiKey = (process.env.PEXELS_API_KEY || process.env.REACT_APP_PEXELS_API_KEY || "").trim();
  app.use(
    "/api/pexels",
    createProxyMiddleware({
      target: "https://api.pexels.com",
      changeOrigin: true,
      pathRewrite: { "^/api/pexels": "/videos/search" },
      onProxyReq: (proxyReq) => {
        if (apiKey) proxyReq.setHeader("Authorization", apiKey);
      },
      logLevel: "silent",
    })
  );
};
