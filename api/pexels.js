module.exports = async function handler(req, res) {
  const apiKey = process.env.PEXELS_API_KEY || process.env.REACT_APP_PEXELS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Missing PEXELS_API_KEY" });
  }

  const {
    query = "",
    orientation,
    size,
    per_page,
    page,
    min_duration,
    max_duration,
  } = req.query || {};

  if (!query) {
    return res.status(400).json({ error: "Query is required" });
  }

  const url = new URL("https://api.pexels.com/videos/search");
  url.searchParams.set("query", query);
  if (orientation) url.searchParams.set("orientation", orientation);
  if (size) url.searchParams.set("size", size);
  if (per_page) url.searchParams.set("per_page", String(per_page));
  if (page) url.searchParams.set("page", String(page));
  if (min_duration) url.searchParams.set("min_duration", String(min_duration));
  if (max_duration) url.searchParams.set("max_duration", String(max_duration));

  try {
    const upstream = await fetch(url.toString(), {
      headers: {
        Authorization: apiKey,
        Accept: "application/json",
      },
    });

    const contentType = upstream.headers.get("content-type") || "";
    const body = await upstream.text();
    if (!contentType.includes("application/json")) {
      const snippet = String(body).replace(/\s+/g, " ").trim().slice(0, 160);
      return res.status(502).json({
        error: "Pexels upstream returned non-JSON",
        status: upstream.status,
        snippet,
      });
    }

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "public, s-maxage=43200, stale-while-revalidate=86400");
    return res.status(upstream.status).send(body);
  } catch (err) {
    return res.status(500).json({ error: "Pexels proxy failed" });
  }
};
