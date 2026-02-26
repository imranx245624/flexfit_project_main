const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  const apiKey = process.env.REACT_APP_PEXELS_API_KEY;
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
